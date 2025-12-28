# Laporan Audit Alur Transaksi dan Manajemen Sumber Daya

---

## 1. Ringkasan Eksekutif

Audit ini mengidentifikasi **dua bug kritis** dalam alur logika transaksi dan persetujuan yang dapat menyebabkan **kebocoran sumber daya permanen** (armada dan sopir) dari sistem. Masalah utamanya adalah logika manajemen status sumber daya tidak sinkron dengan alur persetujuan (`approval workflow`). Sumber daya dikunci terlalu dini (saat pembuatan `DRAFT`) dan tidak dilepaskan saat transaksi ditolak (`REJECTED`). Jika tidak diperbaiki, ini akan menyebabkan kelangkaan armada dan sopir dari waktu ke waktu, yang berdampak langsung pada ketersediaan layanan dan potensi pendapatan, serta memerlukan intervensi manual pada database untuk pemulihan.

## 2. Metodologi Audit

Proses audit dilakukan melalui pendekatan analisis kode statis dan tinjauan dokumentasi untuk memetakan alur data dan logika bisnis dari hulu ke hilir. Langkah-langkah yang diambil adalah sebagai berikut:

1.  **Analisis Skema Database:** Memeriksa file `prisma/schema.prisma` untuk memahami model data inti, relasi antar tabel (Transaksi, Armada, Sopir), dan tipe data yang digunakan (`enum` untuk status).
2.  **Tinjauan Dokumentasi:** Mempelajari dokumentasi yang ada di direktori `docs/`, terutama `TRANSACTION_STATUS_AUTOMATION.md` dan `APPROVAL_WORKFLOW_IMPLEMENTATION.md`, untuk memahami alur kerja yang diharapkan oleh bisnis.
3.  **Analisis Kode Statis:** Melakukan pemeriksaan mendalam pada kode di sisi server (API), khususnya pada *endpoint* yang bertanggung jawab atas siklus hidup transaksi:
    - `POST /api/transactions` (Pembuatan)
    - `POST /api/transactions/[id]/approve` (Persetujuan)
    - `POST /api/transactions/[id]/reject` (Penolakan)
    - `DELETE /api/transactions/[id]` (Penghapusan)
4.  **Identifikasi Kesenjangan:** Membandingkan logika yang diimplementasikan dalam kode dengan alur yang didokumentasikan untuk menemukan inkonsistensi, celah logika, dan potensi bug.

## 3. Temuan Kritis dan Rekomendasi

### 3.1. Bug Kritis #1: Penguncian Sumber Daya Prematur pada Status `DRAFT`

-   **Deskripsi Masalah:** Logika saat ini mengubah status `Armada` dan `Driver` menjadi `BOOKED` atau `ON_TRIP` segera setelah transaksi baru dibuat di API. Namun, pada titik ini, transaksi tersebut masih berstatus `DRAFT` dan belum disetujui oleh manajer. Sumber daya seharusnya hanya dikunci setelah transaksi diverifikasi dan disetujui.

-   **Dampak Bisnis:** Alur ini secara signifikan mengurangi ketersediaan armada dan sopir yang sebenarnya masih bebas. Sumber daya yang terikat pada transaksi `DRAFT` (yang mungkin tidak pernah disetujui) tidak dapat dipesan untuk transaksi lain yang valid dan berpotensi menghasilkan pendapatan.

-   **Bukti Kode (`src/app/api/transactions/route.js`):**
    ```javascript
    // Determine status based on checkout date
    const isStartingTodayOrPast =
      new Date(validatedData.checkout_datetime) <= new Date();
    const armadaStatus = isStartingTodayOrPast ? "ON_TRIP" : "BOOKED";
    const driverStatus = isStartingTodayOrPast ? "ON_TRIP" : "BOOKED"; // <-- Also related to Bug #3

    // Use atomic transaction...
    const result = await prisma.$transaction(async (tx) => {
      // ... verifikasi ketersediaan ...

      // 3. Create transaction (status default: DRAFT)
      const newTransaction = await tx.transaction.create({ ... });

      // 4. Update armada status (TERLALU DINI)
      await tx.armada.update({
        where: { id: validatedData.armadaId },
        data: { status: armadaStatus },
      });

      // 5. Update driver status (TERLALU DINI)
      await tx.driver.update({
        where: { id: validatedData.driverId },
        data: { status: driverStatus },
      });

      return newTransaction;
    });
    ```

-   **Rekomendasi:** **Pindahkan** logika untuk memperbarui status `Armada` dan `Driver` dari *endpoint* pembuatan transaksi (`POST /api/transactions`) ke *endpoint* persetujuan (`POST /api/transactions/[id]/approve`). Saat membuat draf, sumber daya harus tetap `READY`.

---

### 3.2. Bug Kritis #2: Kebocoran Sumber Daya Permanen pada Status `REJECTED`

-   **Deskripsi Masalah:** Ketika seorang manajer menolak transaksi yang menunggu persetujuan (`PENDING`), *endpoint* penolakan hanya memperbarui status transaksi menjadi `REJECTED`. Logika ini **tidak melepaskan** (mereset) status `Armada` dan `Driver` yang terkait kembali ke `READY`.

-   **Dampak Bisnis:** Ini adalah **bug paling kritis** dalam alur kerja. Setiap transaksi yang ditolak akan menyebabkan satu armada dan satu sopir **terkunci secara permanen** dalam status `BOOKED`. Seiring waktu, ini akan menyebabkan "kebocoran" sumber daya dari sistem, membuatnya tidak tersedia untuk pemesanan di masa depan dan memerlukan intervensi manual pada database untuk memperbaikinya.

-   **Bukti Kode (`src/app/api/transactions/[id]/reject/route.js`):**
    ```javascript
    // Update status to REJECTED with reason
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        approval_status: "REJECTED",
        rejected_at: new Date(),
        rejected_by: user.email,
        rejection_reason: rejection_reason.trim(),
      },
      // TIDAK ADA LOGIKA UNTUK MERESET STATUS ARMADA/DRIVER
    });
    ```

-   **Rekomendasi:** **Tambahkan** logika ke dalam *handler* penolakan untuk memperbarui status `Armada` dan `Driver` yang terkait kembali ke `READY` di dalam sebuah `prisma.$transaction`. Ini memastikan bahwa sumber daya segera dilepaskan dan tersedia kembali di sistem.

---

### 3.3. Potensi Bug #3: Penggunaan Status `BOOKED` yang Tidak Ada pada Sopir

-   **Deskripsi Masalah:** Kode pembuatan transaksi mencoba menetapkan status `BOOKED` kepada sopir jika tanggal `checkout` ada di masa depan. Namun, `enum DriverStatus` yang didefinisikan dalam `prisma/schema.prisma` tidak memiliki status `BOOKED`. Opsi yang tersedia hanya `READY`, `ON_TRIP`, dan `OFF_DUTY`.

-   **Dampak Bisnis:** Ini kemungkinan besar akan menyebabkan **kesalahan runtime (runtime error)** setiap kali operator mencoba membuat transaksi untuk tanggal di masa depan, yang dapat menghentikan proses pemesanan dan menyebabkan frustrasi pengguna.

-   **Bukti Kode (`src/app/api/transactions/route.js`):**
    ```javascript
    const driverStatus = isStartingTodayOrPast ? "ON_TRIP" : "BOOKED"; // "BOOKED" tidak valid
    ```
-   **Bukti Skema (`prisma/schema.prisma`):**
    ```prisma
    enum DriverStatus {
      READY
      ON_TRIP
      OFF_DUTY
    }
    ```

-   **Rekomendasi:** Terdapat dua jalur perbaikan, tergantung pada kebutuhan bisnis:
    1.  **Jika Sopir tidak memerlukan status `BOOKED`:** Ubah logika di `transactions/route.js` agar tidak pernah mencoba menetapkan status `BOOKED`. Mungkin sopir dianggap `READY` sampai hari-H.
    2.  **Jika Sopir memerlukan status `BOOKED`:** Tambahkan `BOOKED` ke dalam `enum DriverStatus` di `prisma/schema.prisma` dan jalankan migrasi database.

---

### 3.4. Celah Logika #4: Potensi Status Tidak Akurat saat `APPROVED`

-   **Deskripsi Masalah:** Alur persetujuan saat ini tidak mempertimbangkan kemungkinan bahwa transaksi disetujui pada tanggal yang berbeda dari saat ia dibuat. Sebagai contoh, sebuah transaksi dengan `checkout_datetime` "hari ini" dibuat dan status armadanya (secara keliru) diatur ke `ON_TRIP`. Jika transaksi ini baru disetujui keesokan harinya, status armada tersebut seharusnya tetap `ON_TRIP`, tetapi jika alurnya hanya mengandalkan status saat dibuat, datanya menjadi tidak sinkron.

-   **Dampak Bisnis:** Data status operasional yang tidak akurat dapat menyebabkan kebingungan dalam penjadwalan. Manajer mungkin melihat armada sebagai `BOOKED` padahal seharusnya sudah `ON_TRIP`, yang dapat mengganggu pengambilan keputusan.

-   **Rekomendasi:** Saat mengimplementasikan logika penguncian sumber daya di *endpoint* `approve` (seperti yang direkomendasikan dalam Bug #1), pastikan logika tersebut secara dinamis memeriksa `checkout_datetime` terhadap tanggal **saat persetujuan dibuat** untuk menentukan status yang benar (`BOOKED` atau `ON_TRIP`). Ini memastikan status selalu mencerminkan keadaan yang paling akurat.

## 4. Rekomendasi Umum

Selain perbaikan spesifik yang diuraikan di atas, direkomendasikan beberapa praktik terbaik berikut untuk meningkatkan ketahanan dan keandalan sistem di masa mendatang:

1.  **Implementasikan *Integration Testing*:** Sangat disarankan untuk membuat rangkaian tes integrasi otomatis yang mensimulasikan seluruh siklus hidup transaksi. Tes ini harus mencakup skenario berikut:
    -   Pembuatan draf -> Persetujuan -> Verifikasi status sumber daya.
    -   Pembuatan draf -> Penolakan -> Verifikasi sumber daya kembali `READY`.
    -   Upaya *double booking* pada sumber daya yang sama untuk memastikan sistem menolaknya.
    -   Penghapusan/pembatalan transaksi yang disetujui -> Verifikasi sumber daya kembali `READY`.
    Rangkaian tes ini akan berfungsi sebagai jaring pengaman untuk menangkap regresi atau bug logika serupa di masa depan.

2.  **Sinkronisasi Dokumentasi dan Kode:** Terdapat kesenjangan antara dokumentasi dan implementasi aktual (misalnya, dokumentasi tidak menyebutkan penanganan status saat ditolak). Disarankan agar setiap perubahan logika bisnis pada kode selalu diiringi dengan pembaruan pada dokumen teknis yang relevan. Ini akan mempercepat proses *onboarding* dan audit di masa depan.

3.  **Gunakan *Shared Logic* untuk Manajemen Status:** Pertimbangkan untuk membuat fungsi atau *service class* terpusat yang bertanggung jawab untuk mengubah status armada dan sopir. Dengan begitu, logika yang sama dapat dipanggil dari berbagai *endpoint* (`approve`, `reject`, `delete`, `complete`) tanpa duplikasi kode, sehingga mengurangi risiko inkonsistensi.

---
