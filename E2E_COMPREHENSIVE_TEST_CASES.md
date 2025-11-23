# Test Case E2E Komprehensif - Pembukuan Kasir & List

## Informasi Dokumen

**Versi**: 2.0  
**Tanggal**: 23 November 2025  
**Tujuan**: Test case end-to-end yang mendalam mencakup semua flow data untuk role Admin dan Operator

---

## Daftar Isi

1. [Autentikasi & Otorisasi](#1-autentikasi--otorisasi)
2. [Dashboard](#2-dashboard)
3. [Manajemen Transaksi - Flow Lengkap](#3-manajemen-transaksi---flow-lengkap)
4. [Manajemen Armada - CRUD Lengkap](#4-manajemen-armada---crud-lengkap)
5. [Manajemen Sopir - CRUD Lengkap](#5-manajemen-sopir---crud-lengkap)
6. [Manajemen Paket Jasa - CRUD Lengkap](#6-manajemen-paket-jasa---crud-lengkap)
7. [Manajemen Pengeluaran - Flow Lengkap](#7-manajemen-pengeluaran---flow-lengkap)
8. [Laporan Keuangan - Admin Only](#8-laporan-keuangan---admin-only)
9. [Manajemen Staff](#9-manajemen-staff)
10. [Manajemen User - Admin Only](#10-manajemen-user---admin-only)
11. [Audit Log](#11-audit-log)
12. [Skenario Integrasi End-to-End](#12-skenario-integrasi-end-to-end)

---

## 1. Autentikasi & Otorisasi

### TC-AUTH-DEEP-001: Login Admin - Validasi Lengkap

**Prioritas**: Kritis  
**Role**: N/A

**Prakondisi**:

- Database terisi dengan user admin
- Aplikasi berjalan di localhost:3000

**Langkah-langkah**:

1. Buka browser dan navigasi ke http://localhost:3000
2. Verifikasi halaman login tampil dengan elemen:
   - Logo "Pembukuan Kasir & List"
   - Heading "Selamat Datang"
   - Field email
   - Field password
   - Link "Lupa password?"
   - Tombol "Login"
3. Masukkan email: admin@rental.com
4. Masukkan password: password123
5. Klik tombol "Login"
6. Tunggu redirect

**Hasil yang Diharapkan**:

- ✅ Redirect ke /dashboard dalam < 2 detik
- ✅ Cookie sesi dibuat (iron-session)
- ✅ Sidebar menampilkan semua menu admin:
  - Dashboard
  - Master Data (expandable):
    - Paket Jasa
    - Armada
    - Sopir
    - Staff
  - Laporan Keuangan (expandable):
    - Pengeluaran
    - Transaksi
    - Laporan
  - Manajemen User
  - Audit Log
- ✅ User button menampilkan: "CN Admin User admin@rental.com"
- ✅ Dashboard menampilkan data finansial lengkap
- ✅ Tidak ada error di console browser

**Data Uji**:

```json
{
  "email": "admin@rental.com",
  "password": "password123",
  "expectedRole": "ADMIN"
}
```

---

### TC-AUTH-DEEP-002: Login Operator - Validasi Lengkap

**Prioritas**: Kritis  
**Role**: N/A

**Prakondisi**:

- Database terisi dengan user operator
- Aplikasi berjalan di localhost:3000

**Langkah-langkah**:

1. Navigasi ke http://localhost:3000
2. Masukkan email: operator@rental.com
3. Masukkan password: password123
4. Klik tombol "Login"
5. Tunggu redirect

**Hasil yang Diharapkan**:

- ✅ Redirect ke /dashboard
- ✅ Sidebar menampilkan menu terbatas operator:
  - Dashboard
  - Master Data:
    - Paket Jasa
    - Armada
    - Sopir
    - Staff
  - Laporan Keuangan:
    - Pengeluaran
    - Transaksi
  - ❌ TIDAK ADA: Laporan
  - ❌ TIDAK ADA: Manajemen User
  - ❌ TIDAK ADA: Audit Log
- ✅ User button menampilkan: "CN Operator User operator@rental.com"
- ✅ Dashboard menampilkan data terbatas (tanpa detail finansial sensitif)

**Data Uji**:

```json
{
  "email": "operator@rental.com",
  "password": "password123",
  "expectedRole": "OPERATOR"
}
```

---

### TC-AUTH-DEEP-003: Login dengan Kredensial Salah - Email

**Prioritas**: Tinggi  
**Role**: N/A

**Langkah-langkah**:

1. Navigasi ke halaman login
2. Masukkan email: wrongemail@rental.com
3. Masukkan password: password123
4. Klik "Login"

**Hasil yang Diharapkan**:

- ✅ Tetap di halaman login
- ✅ Toast error muncul: "Email atau password salah"
- ✅ Field email dan password tidak di-clear
- ✅ Tidak ada sesi yang dibuat
- ✅ Tidak ada redirect

---

### TC-AUTH-DEEP-004: Login dengan Kredensial Salah - Password

**Prioritas**: Tinggi  
**Role**: N/A

**Langkah-langkah**:

1. Navigasi ke halaman login
2. Masukkan email: admin@rental.com
3. Masukkan password: wrongpassword
4. Klik "Login"

**Hasil yang Diharapkan**:

- ✅ Tetap di halaman login
- ✅ Toast error muncul: "Email atau password salah"
- ✅ Password field di-clear untuk keamanan
- ✅ Tidak ada sesi yang dibuat

---

### TC-AUTH-DEEP-005: Validasi Field Kosong

**Prioritas**: Sedang  
**Role**: N/A

**Langkah-langkah**:

1. Navigasi ke halaman login
2. Biarkan email kosong
3. Biarkan password kosong
4. Klik "Login"

**Hasil yang Diharapkan**:

- ✅ Form tidak tersubmit
- ✅ Error validasi muncul di field email: "Email wajib diisi"
- ✅ Error validasi muncul di field password: "Password wajib diisi"
- ✅ Tidak ada API call

---

### TC-AUTH-DEEP-006: Validasi Format Email

**Prioritas**: Sedang  
**Role**: N/A

**Langkah-langkah**:

1. Navigasi ke halaman login
2. Masukkan email: bukan-email-valid
3. Masukkan password: password123
4. Klik "Login"

**Hasil yang Diharapkan**:

- ✅ Form tidak tersubmit
- ✅ Error validasi: "Format email tidak valid"
- ✅ Tidak ada API call

---

### TC-AUTH-DEEP-007: Logout dari Admin

**Prioritas**: Tinggi  
**Role**: ADMIN

**Prakondisi**: Login sebagai admin

**Langkah-langkah**:

1. Klik user button di sidebar
2. Verifikasi menu dropdown muncul dengan opsi "Log out"
3. Klik "Log out"
4. Tunggu redirect

**Hasil yang Diharapkan**:

- ✅ Redirect ke halaman login (/)
- ✅ Cookie sesi dihapus
- ✅ Tidak dapat akses /dashboard tanpa login ulang
- ✅ Tidak dapat akses route protected lainnya

**Verifikasi Tambahan**:

1. Coba akses langsung ke /dashboard via URL
2. Harus redirect ke login

---

### TC-AUTH-DEEP-008: Akses Tidak Sah - Operator ke Route Admin

**Prioritas**: Kritis  
**Role**: OPERATOR

**Prakondisi**: Login sebagai operator

**Langkah-langkah**:

1. Login sebagai operator
2. Coba akses /laporan via URL bar
3. Coba akses /users via URL bar
4. Coba akses /audit via URL bar

**Hasil yang Diharapkan**:

- ✅ Setiap akses ditolak dengan redirect atau error 403
- ✅ Pesan error ditampilkan: "Anda tidak memiliki akses ke halaman ini"
- ✅ Log audit dibuat untuk setiap percobaan akses tidak sah
- ✅ Operator tetap di halaman sebelumnya atau redirect ke dashboard

---

### TC-AUTH-DEEP-009: Session Timeout

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Prakondisi**: Login berhasil

**Langkah-langkah**:

1. Login sebagai admin
2. Tunggu hingga session timeout (sesuai konfigurasi iron-session)
3. Coba lakukan aksi apapun (misal: klik menu)

**Hasil yang Diharapkan**:

- ✅ Redirect ke halaman login
- ✅ Toast message: "Sesi Anda telah berakhir, silakan login kembali"
- ✅ Harus login ulang untuk melanjutkan

---

### TC-AUTH-DEEP-010: Lupa Password - Request Reset

**Prioritas**: Tinggi  
**Role**: N/A

**Prakondisi**: Email user terdaftar di sistem

**Langkah-langkah**:

1. Di halaman login, klik link "Lupa password?"
2. Verifikasi redirect ke /reset-password
3. Masukkan email: admin@rental.com
4. Klik tombol "Kirim Link Reset"

**Hasil yang Diharapkan**:

- ✅ Toast sukses: "Link reset password telah dikirim ke email Anda"
- ✅ Email terkirim dengan token reset (cek log email atau database)
- ✅ Token valid untuk waktu terbatas (misal: 1 jam)
- ✅ Token tersimpan di database dengan hash

---

### TC-AUTH-DEEP-011: Reset Password - Proses Lengkap

**Prioritas**: Tinggi  
**Role**: N/A

**Prakondisi**: Token reset valid diterima

**Langkah-langkah**:

1. Klik link reset dari email (atau simulasi dengan token valid)
2. Navigasi ke /reset-password/new?token=VALID_TOKEN
3. Masukkan password baru: newpassword123
4. Masukkan konfirmasi password: newpassword123
5. Klik "Reset Password"

**Hasil yang Diharapkan**:

- ✅ Password berhasil diupdate di database (bcrypt hash)
- ✅ Toast sukses: "Password berhasil direset"
- ✅ Redirect ke halaman login
- ✅ Dapat login dengan password baru
- ✅ Password lama tidak berfungsi lagi
- ✅ Token reset menjadi invalid setelah digunakan

---

### TC-AUTH-DEEP-012: Reset Password - Token Invalid

**Prioritas**: Sedang  
**Role**: N/A

**Langkah-langkah**:

1. Navigasi ke /reset-password/new?token=INVALID_TOKEN
2. Coba masukkan password baru

**Hasil yang Diharapkan**:

- ✅ Error message: "Token tidak valid atau sudah kadaluarsa"
- ✅ Form disabled atau tidak dapat disubmit
- ✅ Link untuk request token baru ditampilkan

---

## 2. Dashboard

### TC-DASH-DEEP-001: Dashboard Admin - Load Lengkap

**Prioritas**: Tinggi  
**Role**: ADMIN

**Prakondisi**: Login sebagai admin

**Langkah-langkah**:

1. Navigasi ke /dashboard
2. Tunggu semua data dimuat

**Hasil yang Diharapkan**:

- ✅ **Kartu Statistik** (4 kartu):
  1. Total Pemasukan: Rp X (dengan jumlah transaksi)
  2. Laba Kotor: Rp X (dengan margin %)
  3. Total Transaksi: X (dengan jumlah armada)
  4. Total Armada: X (dengan status kategori)

- ✅ **Grafik Tren Transaksi**:
  - Menampilkan data per hari
  - Sumbu X: Tanggal
  - Sumbu Y: Jumlah transaksi
  - Tooltip saat hover
  - Trend indicator (naik/turun dengan %)

- ✅ **Grafik Status Armada**:
  - Pie chart dengan 4 kategori
  - Warna berbeda per status
  - Persentase dan jumlah unit
  - Legend dengan detail

- ✅ **Penghasilan per Armada**:
  - Bar chart atau list
  - Top performer highlighted
  - Persentase kontribusi
  - Statistik (tertinggi, rata-rata, terendah)

- ✅ **Top 5 Paket Jasa Terlaris**:
  - List dengan ranking
  - Nama paket, tipe, pendapatan
  - Jumlah transaksi
  - Persentase dari total

- ✅ **Penerima Insentif**:
  - Widget khusus
  - Data sopir dengan insentif
  - Atau pesan "Belum ada data" jika kosong

- ✅ **Performa Sopir**:
  - Chart performa
  - Dropdown untuk metrik (Jumlah Perjalanan, Pendapatan, dll)
  - Total perjalanan
  - Tingkat ketepatan waktu
  - Top performer

- ✅ **Filter Periode**:
  - Button: Hari Ini, Bulan Ini, Tahun Ini
  - Semua data update saat filter berubah

---

### TC-DASH-DEEP-002: Dashboard Operator - Data Terbatas

**Prioritas**: Tinggi  
**Role**: OPERATOR

**Prakondisi**: Login sebagai operator

**Langkah-langkah**:

1. Navigasi ke /dashboard

**Hasil yang Diharapkan**:

- ✅ Kartu statistik ditampilkan TANPA detail finansial sensitif
- ✅ Grafik transaksi terlihat (jumlah, bukan nilai)
- ✅ Grafik status armada terlihat
- ✅ TIDAK menampilkan: Laba kotor, margin, detail pendapatan
- ✅ Fokus pada operasional: jumlah transaksi, status armada, jadwal

---

### TC-DASH-DEEP-003: Filter Periode - Hari Ini

**Prioritas**: Sedang  
**Role**: ADMIN

**Prakondisi**: Login sebagai admin, ada transaksi hari ini

**Langkah-langkah**:

1. Di dashboard, klik button "Hari Ini"
2. Tunggu data refresh

**Hasil yang Diharapkan**:

- ✅ Semua grafik dan statistik update
- ✅ Hanya menampilkan data hari ini (23 Nov 2025)
- ✅ Periode ditampilkan: "23 November 2025"
- ✅ Angka berubah sesuai filter

---

### TC-DASH-DEEP-004: Filter Periode - Bulan Ini

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik button "Bulan Ini"

**Hasil yang Diharapkan**:

- ✅ Data menampilkan periode: "1 November - 23 November 2025"
- ✅ Semua metrik dihitung untuk bulan berjalan

---

### TC-DASH-DEEP-005: Filter Periode - Tahun Ini

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik button "Tahun Ini"

**Hasil yang Diharapkan**:

- ✅ Data menampilkan periode: "1 Januari - 23 November 2025"
- ✅ Semua metrik dihitung untuk tahun berjalan

---

### TC-DASH-DEEP-006: Dashboard - Performance Load Time

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Clear cache browser
2. Login dan navigasi ke dashboard
3. Ukur waktu load

**Hasil yang Diharapkan**:

- ✅ Dashboard fully loaded dalam < 3 detik
- ✅ Skeleton loading ditampilkan saat data dimuat
- ✅ Tidak ada error di console
- ✅ Semua chart render dengan benar

---

## 3. Manajemen Transaksi - Flow Lengkap

### TC-TRANS-FLOW-001: Buat Transaksi Baru - Sewa Mobil (DRAFT)

**Prioritas**: Kritis  
**Role**: ADMIN/OPERATOR

**Prakondisi**:

- Login sebagai admin atau operator
- Ada armada dengan status READY
- Ada sopir dengan status AVAILABLE
- Ada paket "Sewa Mobil"

**Langkah-langkah**:

1. Navigasi ke /transaksi
2. Klik "Input Transaksi Baru"
3. **Data Pelanggan**:
   - Nama: "Budi Santoso"
   - No. HP: "081234567890"
4. **Data Order**:
   - Pilih Paket: "Sewa Avanza 12 Jam"
   - Pilih Armada: "B 1234 ABC - Toyota Avanza"
   - Pilih Sopir: "Pak Budi Santoso"
5. **Data Waktu**:
   - Tanggal Booking: 25 Nov 2025
   - Mobil Out: 25 Nov 2025 08:00
   - Mobil In: 25 Nov 2025 20:00
6. **Data Keuangan**:
   - Tarif Sewa: Rp 500.000 (auto-fill dari paket)
   - Overtime/Jam: Rp 50.000 (auto-fill dari paket)
   - Jumlah DP: Rp 200.000
7. Verifikasi kalkulasi otomatis:
   - Lama Sewa: 12 Jam
   - Overtime: 0 Jam
   - Total Pendapatan: Rp 500.000
8. Klik "Simpan Transaksi"

**Hasil yang Diharapkan**:

- ✅ Transaksi tersimpan dengan status DRAFT
- ✅ Invoice number auto-generated (format: INV-YYYY-MM-XXX)
- ✅ Muncul di tabel transaksi
- ✅ Status Approval: "Draft"
- ✅ Status Pembayaran: "DP" (karena DP < Total)
- ✅ Sisa Tagihan: Rp 300.000
- ✅ Status armada TETAP "READY" (belum berubah karena masih draft)
- ✅ Status sopir TETAP "AVAILABLE"
- ✅ Toast sukses: "Transaksi berhasil disimpan"
- ✅ Dialog tertutup
- ✅ Log audit dibuat

**Data Uji**:

```json
{
  "customer_name": "Budi Santoso",
  "customer_phone": "081234567890",
  "package_id": "sewa-avanza-12jam",
  "vehicle_id": "B1234ABC",
  "driver_id": "driver-001",
  "booking_date": "2025-11-25",
  "checkout_datetime": "2025-11-25T08:00:00",
  "checkin_datetime": "2025-11-25T20:00:00",
  "base_price": 500000,
  "overtime_rate": 50000,
  "dp_amount": 200000
}
```

---

### TC-TRANS-FLOW-002: Submit Transaksi untuk Approval

**Prioritas**: Kritis  
**Role**: ADMIN/OPERATOR

**Prakondisi**: Transaksi dengan status DRAFT ada

**Langkah-langkah**:

1. Di tabel transaksi, cari transaksi DRAFT
2. Klik tombol "Submit" atau menu action → "Submit untuk Approval"
3. Konfirmasi dialog: "Yakin submit transaksi ini?"
4. Klik "Ya, Submit"

**Hasil yang Diharapkan**:

- ✅ Status berubah dari DRAFT → PENDING
- ✅ Status armada berubah: READY → BOOKED
- ✅ Status sopir berubah: AVAILABLE → BOOKED
- ✅ Badge status di tabel update
- ✅ Tombol "Edit" dan "Delete" disabled
- ✅ Tombol "Submit" hilang
- ✅ Muncul tombol "Approve" dan "Reject" (untuk admin)
- ✅ Toast sukses: "Transaksi berhasil disubmit"
- ✅ Log audit dibuat dengan detail perubahan status

---

### TC-TRANS-FLOW-003: Approve Transaksi (Admin Only)

**Prioritas**: Kritis  
**Role**: ADMIN

**Prakondisi**:

- Login sebagai admin
- Transaksi dengan status PENDING ada

**Langkah-langkah**:

1. Di tabel transaksi, cari transaksi PENDING
2. Klik tombol "Approve"
3. Konfirmasi dialog: "Setujui transaksi ini?"
4. Klik "Ya, Setujui"

**Hasil yang Diharapkan**:

- ✅ Status berubah: PENDING → APPROVED
- ✅ Status armada berubah: BOOKED → ON_TRIP
- ✅ Status sopir berubah: BOOKED → ON_TRIP
- ✅ Timestamp approval tercatat
- ✅ approved_by: admin user ID
- ✅ Badge status update
- ✅ Tombol "Complete" muncul
- ✅ Toast sukses: "Transaksi berhasil disetujui"
- ✅ Log audit dibuat

---

### TC-TRANS-FLOW-004: Reject Transaksi (Admin Only)

**Prioritas**: Tinggi  
**Role**: ADMIN

**Prakondisi**: Transaksi PENDING ada

**Langkah-langkah**:

1. Klik tombol "Reject" pada transaksi PENDING
2. Dialog muncul dengan field "Alasan Penolakan"
3. Masukkan alasan: "Armada sedang maintenance mendadak"
4. Klik "Ya, Tolak"

**Hasil yang Diharapkan**:

- ✅ Status kembali: PENDING → DRAFT
- ✅ Status armada kembali: BOOKED → READY
- ✅ Status sopir kembali: BOOKED → AVAILABLE
- ✅ Alasan penolakan tersimpan di database
- ✅ rejected_by: admin user ID
- ✅ rejected_at: timestamp
- ✅ Tombol "Edit" dan "Delete" aktif kembali
- ✅ Toast: "Transaksi ditolak"
- ✅ Log audit dibuat dengan alasan

---

### TC-TRANS-FLOW-005: Complete Transaksi - Tanpa Overtime

**Prioritas**: Kritis  
**Role**: ADMIN/OPERATOR

**Prakondisi**: Transaksi APPROVED ada

**Langkah-langkah**:

1. Klik tombol "Selesaikan Transaksi" pada transaksi APPROVED
2. Dialog "Selesaikan Transaksi" muncul
3. **Isi data aktual**:
   - Waktu Checkin Aktual: 25 Nov 2025 20:00 (tepat waktu)
   - Penggunaan BBM: 15 liter
   - Catatan: "Perjalanan lancar"
4. Verifikasi kalkulasi:
   - Overtime: 0 jam (karena tepat waktu)
   - Biaya Overtime: Rp 0
   - Total Tagihan: Rp 500.000 (tidak berubah)
5. Klik "Selesaikan"

**Hasil yang Diharapkan**:

- ✅ Status berubah: APPROVED → COMPLETED
- ✅ Status armada kembali: ON_TRIP → READY
- ✅ Status sopir kembali: ON_TRIP → AVAILABLE
- ✅ actual_checkin_datetime tersimpan
- ✅ fuel_usage: 15
- ✅ overtime_hours: 0
- ✅ overtime_cost: 0
- ✅ final_price: 500000
- ✅ profit dihitung (final_price - operational_costs)
- ✅ completed_at: timestamp
- ✅ completed_by: user ID
- ✅ Badge status: "Selesai"
- ✅ Tombol action berubah: hanya "Detail" dan "Cetak"
- ✅ Toast: "Transaksi berhasil diselesaikan"
- ✅ Log audit dibuat

---

### TC-TRANS-FLOW-006: Complete Transaksi - Dengan Overtime

**Prioritas**: Kritis  
**Role**: ADMIN/OPERATOR

**Prakondisi**: Transaksi APPROVED ada

**Langkah-langkah**:

1. Klik "Selesaikan Transaksi"
2. **Isi data aktual**:
   - Waktu Checkin Aktual: 25 Nov 2025 23:00 (terlambat 3 jam dari rencana 20:00)
   - Penggunaan BBM: 18 liter
   - Catatan: "Terjebak macet"
3. Verifikasi kalkulasi otomatis:
   - Overtime: 3 jam
   - Biaya Overtime: Rp 150.000 (3 × Rp 50.000)
   - Total Tagihan: Rp 650.000 (500.000 + 150.000)
4. Klik "Selesaikan"

**Hasil yang Diharapkan**:

- ✅ Status: COMPLETED
- ✅ overtime_hours: 3
- ✅ overtime_cost: 150000
- ✅ final_price: 650000
- ✅ Sisa tagihan update: Rp 450.000 (jika DP 200.000)
- ✅ Status pembayaran tetap "DP" atau "Belum Lunas"
- ✅ Armada dan sopir kembali available
- ✅ Toast: "Transaksi selesai dengan overtime 3 jam"
- ✅ Log audit mencatat overtime

---

### TC-TRANS-FLOW-007: Edit Transaksi DRAFT

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR

**Prakondisi**: Transaksi DRAFT ada

**Langkah-langkah**:

1. Klik tombol "Edit" pada transaksi DRAFT
2. Dialog edit muncul dengan data terisi
3. Ubah:
   - Nama Pelanggan: "Budi Santoso" → "Budi Santoso (Updated)"
   - Armada: Ganti ke armada lain yang READY
   - DP: Rp 200.000 → Rp 300.000
4. Klik "Simpan Perubahan"

**Hasil yang Diharapkan**:

- ✅ Data terupdate di database
- ✅ Tabel refresh dengan data baru
- ✅ Sisa tagihan recalculate
- ✅ Transaksi tetap status DRAFT
- ✅ Toast: "Transaksi berhasil diupdate"
- ✅ Log audit mencatat perubahan field

---

### TC-TRANS-FLOW-008: Request Edit untuk Transaksi APPROVED (Operator)

**Prioritas**: Tinggi  
**Role**: OPERATOR

**Prakondisi**:

- Login sebagai operator
- Transaksi APPROVED ada

**Langkah-langkah**:

1. Klik menu action pada transaksi APPROVED
2. Pilih "Request Edit"
3. Dialog muncul dengan field "Alasan Permintaan Edit"
4. Masukkan alasan: "Pelanggan minta ganti sopir"
5. Klik "Kirim Permintaan"

**Hasil yang Diharapkan**:

- ✅ Edit request dibuat dengan status PENDING
- ✅ Transaksi asli tidak berubah
- ✅ Badge "Edit Request Pending" muncul di transaksi
- ✅ Admin dapat melihat request di list atau notifikasi
- ✅ Toast: "Permintaan edit berhasil dikirim"
- ✅ Log audit dibuat

---

### TC-TRANS-FLOW-009: Approve Edit Request (Admin)

**Prioritas**: Tinggi  
**Role**: ADMIN

**Prakondisi**: Edit request PENDING ada

**Langkah-langkah**:

1. Admin melihat transaksi dengan badge "Edit Request"
2. Klik "Review Edit Request"
3. Dialog menampilkan alasan request
4. Klik "Approve Edit Request"

**Hasil yang Diharapkan**:

- ✅ Edit request status: APPROVED
- ✅ Transaksi unlock untuk editing
- ✅ Operator dapat edit transaksi
- ✅ Toast: "Permintaan edit disetujui"
- ✅ Log audit dibuat

---

### TC-TRANS-FLOW-010: Reject Edit Request (Admin)

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Review Edit Request"
2. Masukkan alasan penolakan: "Tidak dapat ganti sopir, sudah on trip"
3. Klik "Reject Edit Request"

**Hasil yang Diharapkan**:

- ✅ Edit request status: REJECTED
- ✅ Transaksi tetap locked
- ✅ Alasan penolakan tersimpan
- ✅ Operator dapat melihat alasan penolakan
- ✅ Toast: "Permintaan edit ditolak"
- ✅ Log audit dibuat

---

### TC-TRANS-FLOW-011: Delete Transaksi DRAFT

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Prakondisi**: Transaksi DRAFT ada

**Langkah-langkah**:

1. Klik tombol "Delete" pada transaksi DRAFT
2. Konfirmasi dialog: "Yakin hapus transaksi ini?"
3. Klik "Ya, Hapus"

**Hasil yang Diharapkan**:

- ✅ Transaksi dihapus dari database (soft delete atau hard delete)
- ✅ Hilang dari tabel transaksi
- ✅ Toast: "Transaksi berhasil dihapus"
- ✅ Log audit dibuat

---

### TC-TRANS-FLOW-012: Tidak Dapat Delete Transaksi Non-DRAFT

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR

**Prakondisi**: Transaksi PENDING/APPROVED/COMPLETED ada

**Langkah-langkah**:

1. Coba klik tombol "Delete" pada transaksi non-DRAFT

**Hasil yang Diharapkan**:

- ✅ Tombol "Delete" disabled atau tidak ada
- ✅ Jika dicoba via API: Error 400 "Tidak dapat menghapus transaksi yang sudah disubmit"
- ✅ Transaksi tetap di database

---

### TC-TRANS-FLOW-013: Update Status Pembayaran

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR

**Prakondisi**: Transaksi COMPLETED dengan status pembayaran "DP"

**Langkah-langkah**:

1. Di tabel transaksi, klik dropdown "Status Pembayaran"
2. Pilih "Lunas"
3. Konfirmasi perubahan

**Hasil yang Diharapkan**:

- ✅ Status pembayaran update: DP → Lunas
- ✅ Sisa tagihan: Rp 0
- ✅ payment_status di database: PAID
- ✅ paid_at: timestamp
- ✅ Badge status update
- ✅ Toast: "Status pembayaran diupdate"
- ✅ Log audit dibuat

---

### TC-TRANS-FLOW-014: Cetak Invoice/Kwitansi

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Prakondisi**: Transaksi COMPLETED ada

**Langkah-langkah**:

1. Klik tombol "Cetak Invoice"
2. Halaman cetak terbuka di tab baru

**Hasil yang Diharapkan**:

- ✅ Navigasi ke /transaksi/cetak/[id]
- ✅ Halaman print-friendly (tanpa sidebar, header minimal)
- ✅ Menampilkan:
  - Logo perusahaan
  - Informasi perusahaan
  - Invoice number
  - Tanggal transaksi
  - Data pelanggan
  - Detail paket dan armada
  - Rincian biaya (base price, overtime, total)
  - Status pembayaran
  - Tanda tangan (placeholder)
- ✅ Format A4
- ✅ Tombol print browser dapat dipicu (Ctrl+P)
- ✅ CSS print media query aktif

---

### TC-TRANS-FLOW-015: Lihat Detail Transaksi

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Klik tombol "Detail" pada transaksi mana saja

**Hasil yang Diharapkan**:

- ✅ Modal atau halaman detail terbuka
- ✅ Menampilkan semua informasi:
  - **Informasi Umum**: Invoice, tanggal booking, status
  - **Data Pelanggan**: Nama, telepon
  - **Data Paket**: Nama paket, tipe, harga
  - **Data Armada**: Plat, merk, model
  - **Data Sopir**: Nama, telepon
  - **Waktu**: Checkout planned, checkin planned, actual
  - **Keuangan**: Base price, overtime, DP, sisa, total
  - **Operasional**: BBM usage, catatan
  - **Approval**: Approved by, approved at
  - **Completion**: Completed by, completed at
  - **Riwayat Status**: Timeline perubahan status
- ✅ Tombol "Close" atau "Kembali"

---

### TC-TRANS-FLOW-016: Filter Transaksi - Status

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Di halaman transaksi, gunakan filter status
2. Pilih "PENDING"

**Hasil yang Diharapkan**:

- ✅ Hanya transaksi PENDING ditampilkan
- ✅ Counter update: "Menampilkan X dari Y transaksi"
- ✅ Pagination reset ke halaman 1

---

### TC-TRANS-FLOW-017: Filter Transaksi - Rentang Tanggal

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Klik button "Dari:"
2. Pilih tanggal: 1 Nov 2025
3. Klik button "Sampai:"
4. Pilih tanggal: 15 Nov 2025
5. Klik "Terapkan" atau auto-filter

**Hasil yang Diharapkan**:

- ✅ Hanya transaksi dengan checkout_datetime dalam range ditampilkan
- ✅ Filter indicator muncul: "1 Nov - 15 Nov 2025"
- ✅ Tombol "Clear Filter" tersedia

---

### TC-TRANS-FLOW-018: Search Transaksi

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Di search box, ketik: "Budi"
2. Tekan Enter atau tunggu debounce

**Hasil yang Diharapkan**:

- ✅ Transaksi dengan nama pelanggan mengandung "Budi" ditampilkan
- ✅ Atau transaksi dengan invoice mengandung "Budi"
- ✅ Search case-insensitive
- ✅ Partial match didukung

---

### TC-TRANS-FLOW-019: Pagination Transaksi

**Prioritas**: Rendah  
**Role**: ADMIN/OPERATOR

**Prakondisi**: Lebih dari 10 transaksi ada

**Langkah-langkah**:

1. Verifikasi pagination controls di bawah tabel
2. Klik "Halaman 2"
3. Klik "Halaman berikutnya"
4. Klik "Halaman sebelumnya"

**Hasil yang Diharapkan**:

- ✅ 10 transaksi per halaman (default)
- ✅ Navigasi pagination berfungsi
- ✅ Indicator: "Halaman X dari Y"
- ✅ Button "Previous" disabled di halaman 1
- ✅ Button "Next" disabled di halaman terakhir

---

### TC-TRANS-FLOW-020: Validasi - Kendaraan Conflict

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR

**Prakondisi**:

- Transaksi A: Armada B1234ABC, 25 Nov 08:00 - 20:00, status PENDING/APPROVED

**Langkah-langkah**:

1. Coba buat transaksi baru
2. Pilih armada yang sama: B1234ABC
3. Pilih tanggal yang overlap: 25 Nov 10:00 - 22:00
4. Coba submit

**Hasil yang Diharapkan**:

- ✅ Error validasi: "Armada B1234ABC sudah dibooking untuk tanggal 25 Nov 2025"
- ✅ Form tidak tersubmit
- ✅ Highlight field armada dengan error
- ✅ Saran armada alternatif ditampilkan (optional)

---

### TC-TRANS-FLOW-021: Validasi - Sopir Conflict

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR

**Prakondisi**: Sopir sudah assigned ke transaksi yang overlap

**Langkah-langkah**:

1. Coba buat transaksi dengan sopir yang sama
2. Tanggal overlap
3. Submit

**Hasil yang Diharapkan**:

- ✅ Error: "Sopir [Nama] sudah dibooking untuk tanggal tersebut"
- ✅ Form tidak tersubmit

---

### TC-TRANS-FLOW-022: Validasi - Checkin Sebelum Checkout

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Buat transaksi baru
2. Set Checkout: 25 Nov 2025 20:00
3. Set Checkin: 25 Nov 2025 08:00 (sebelum checkout)
4. Coba submit

**Hasil yang Diharapkan**:

- ✅ Error: "Waktu checkin harus setelah checkout"
- ✅ Form tidak tersubmit

---

## 4. Manajemen Armada - CRUD Lengkap

### TC-FLEET-CRUD-001: Lihat Daftar Armada

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke /armada

**Hasil yang Diharapkan**:

- ✅ Semua kendaraan ditampilkan dalam card layout
- ✅ Setiap card menampilkan:
  - Plat nomor (heading)
  - Status badge dengan warna:
    - Siap (Ready): Green
    - Dipesan (Booked): Yellow
    - Sedang Jalan (On Trip): Blue
    - Perawatan (Maintenance): Red
  - Merk & Model
  - Tahun
  - Tombol action: Edit, Maintenance, Delete
- ✅ Filter buttons: Semua, Tersedia, Disewa, On Trip, Maintenance
- ✅ Search box: "Cari plat, merk atau tipe..."
- ✅ Tombol "Tambah Armada"

---

### TC-FLEET-CRUD-002: Tambah Armada Baru

**Prioritas**: Kritis  
**Role**: ADMIN

**Prakondisi**: Login sebagai admin

**Langkah-langkah**:

1. Klik tombol "Tambah Armada"
2. Dialog form muncul
3. Isi data:
   - Plat Nomor: "B 9999 ZZZ"
   - Merk: "Honda"
   - Model: "Brio"
   - Tahun: 2023
   - Jenis: "Hatchback"
   - Kapasitas: 5
   - Warna: "Putih"
   - Status: "READY"
   - Catatan: "Unit baru"
4. Klik "Simpan"

**Hasil yang Diharapkan**:

- ✅ Armada tersimpan di database
- ✅ Muncul di list armada
- ✅ Card baru ditampilkan dengan data yang benar
- ✅ Status badge: "Siap" (green)
- ✅ Toast: "Armada berhasil ditambahkan"
- ✅ Dialog tertutup
- ✅ Log audit dibuat

**Data Uji**:

```json
{
  "license_plate": "B 9999 ZZZ",
  "brand": "Honda",
  "model": "Brio",
  "year": 2023,
  "type": "Hatchback",
  "capacity": 5,
  "color": "Putih",
  "status": "READY",
  "notes": "Unit baru"
}
```

---

### TC-FLEET-CRUD-003: Edit Armada

**Prioritas**: Tinggi  
**Role**: ADMIN

**Prakondisi**: Armada dengan status READY ada

**Langkah-langkah**:

1. Klik tombol "Edit" pada armada
2. Dialog edit muncul dengan data terisi
3. Ubah:
   - Model: "Brio" → "Brio RS"
   - Tahun: 2023 → 2024
   - Catatan: "Unit baru" → "Unit baru - sudah service"
4. Klik "Simpan Perubahan"

**Hasil yang Diharapkan**:

- ✅ Data terupdate di database
- ✅ Card refresh dengan data baru
- ✅ Toast: "Armada berhasil diupdate"
- ✅ Log audit mencatat perubahan field

---

### TC-FLEET-CRUD-004: Ubah Status ke Maintenance

**Prioritas**: Sedang  
**Role**: ADMIN

**Prakondisi**: Armada READY ada

**Langkah-langkah**:

1. Klik tombol "Maintenance" pada armada READY
2. Dialog konfirmasi: "Ubah status ke Maintenance?"
3. Optional: Masukkan alasan/catatan
4. Klik "Ya, Ubah"

**Hasil yang Diharapkan**:

- ✅ Status update: READY → MAINTENANCE
- ✅ Badge berubah warna ke merah
- ✅ Armada tidak muncul di dropdown saat buat transaksi
- ✅ Toast: "Status armada diubah ke Maintenance"
- ✅ Log audit dibuat

---

### TC-FLEET-CRUD-005: Ubah Status dari Maintenance ke Ready

**Prioritas**: Sedang  
**Role**: ADMIN

**Prakondisi**: Armada MAINTENANCE ada

**Langkah-langkah**:

1. Klik tombol "Aktifkan" atau "Set Ready" pada armada MAINTENANCE
2. Konfirmasi
3. Klik "Ya"

**Hasil yang Diharapkan**:

- ✅ Status update: MAINTENANCE → READY
- ✅ Badge hijau
- ✅ Armada tersedia untuk booking
- ✅ Toast: "Armada siap digunakan"
- ✅ Log audit dibuat

---

### TC-FLEET-CRUD-006: Hapus Armada (Tidak Ada Transaksi)

**Prioritas**: Sedang  
**Role**: ADMIN

**Prakondisi**: Armada tidak pernah digunakan di transaksi

**Langkah-langkah**:

1. Klik tombol "Delete" (icon trash)
2. Dialog konfirmasi: "Yakin hapus armada B 9999 ZZZ?"
3. Klik "Ya, Hapus"

**Hasil yang Diharapkan**:

- ✅ Armada dihapus dari database
- ✅ Card hilang dari list
- ✅ Toast: "Armada berhasil dihapus"
- ✅ Log audit dibuat

---

### TC-FLEET-CRUD-007: Tidak Dapat Hapus Armada dengan Transaksi Aktif

**Prioritas**: Tinggi  
**Role**: ADMIN

**Prakondisi**: Armada assigned ke transaksi PENDING/APPROVED

**Langkah-langkah**:

1. Coba klik "Delete" pada armada yang sedang digunakan

**Hasil yang Diharapkan**:

- ✅ Tombol "Delete" disabled
- ✅ Atau jika diklik: Error "Tidak dapat menghapus armada yang sedang digunakan"
- ✅ Armada tetap di database
- ✅ Tooltip: "Armada sedang digunakan di transaksi aktif"

---

### TC-FLEET-CRUD-008: Filter Armada - Status

**Prioritas**: Rendah  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Klik button filter "Tersedia(X)"

**Hasil yang Diharapkan**:

- ✅ Hanya armada dengan status READY ditampilkan
- ✅ Counter update
- ✅ Button "Tersedia" highlighted/active

---

### TC-FLEET-CRUD-009: Search Armada

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Di search box, ketik: "Avanza"

**Hasil yang Diharapkan**:

- ✅ Armada dengan plat, merk, atau model mengandung "Avanza" ditampilkan
- ✅ Search case-insensitive
- ✅ Partial match

---

### TC-FLEET-CRUD-010: Validasi - Plat Nomor Duplikat

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Coba tambah armada dengan plat yang sudah ada
2. Plat: "B 1234 ABC" (sudah ada)
3. Submit

**Hasil yang Diharapkan**:

- ✅ Error: "Plat nomor B 1234 ABC sudah terdaftar"
- ✅ Form tidak tersubmit
- ✅ Highlight field plat nomor

---

### TC-FLEET-CRUD-011: Validasi - Kapasitas Invalid

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Coba tambah armada
2. Kapasitas: 0 atau negatif
3. Submit

**Hasil yang Diharapkan**:

- ✅ Error: "Kapasitas harus lebih dari 0"
- ✅ Form tidak tersubmit

---

### TC-FLEET-CRUD-012: Validasi - Field Wajib Kosong

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Tambah Armada"
2. Biarkan field wajib kosong
3. Submit

**Hasil yang Diharapkan**:

- ✅ Error validasi untuk setiap field wajib:
  - "Plat nomor wajib diisi"
  - "Merk wajib diisi"
  - "Model wajib diisi"
  - dll
- ✅ Form tidak tersubmit

---

## 5. Manajemen Sopir - CRUD Lengkap

### TC-DRIVER-CRUD-001: Lihat Daftar Sopir

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke /sopir

**Hasil yang Diharapkan**:

- ✅ Semua sopir ditampilkan dalam card layout
- ✅ Setiap card menampilkan:
  - Nama sopir
  - Nomor telepon
  - Nomor SIM
  - Status badge:
    - Available: Green
    - Booked: Yellow
    - On Trip: Blue
    - Off Duty: Gray
  - Tombol action: Edit, Delete
- ✅ Filter buttons: Semua, Available, Booked, On Trip, Off Duty
- ✅ Search box
- ✅ Tombol "Tambah Sopir"

---

### TC-DRIVER-CRUD-002: Tambah Sopir Baru

**Prioritas**: Kritis  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Tambah Sopir"
2. Isi data:
   - Nama: "Pak Joko Widodo"
   - No. Telepon: "081298765432"
   - No. SIM: "3201234567890123"
   - Alamat: "Jl. Merdeka No. 10, Jakarta"
   - Status: "AVAILABLE"
   - Catatan: "Sopir berpengalaman 10 tahun"
3. Klik "Simpan"

**Hasil yang Diharapkan**:

- ✅ Sopir tersimpan
- ✅ Muncul di list
- ✅ Status badge: "Available" (green)
- ✅ Toast: "Sopir berhasil ditambahkan"
- ✅ Log audit dibuat

---

### TC-DRIVER-CRUD-003: Edit Sopir

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Edit" pada sopir
2. Ubah nomor telepon: "081298765432" → "081298765433"
3. Ubah catatan
4. Simpan

**Hasil yang Diharapkan**:

- ✅ Data terupdate
- ✅ Toast: "Sopir berhasil diupdate"
- ✅ Log audit dibuat

---

### TC-DRIVER-CRUD-004: Ubah Status ke Off Duty

**Prioritas**: Sedang  
**Role**: ADMIN

**Prakondisi**: Sopir AVAILABLE ada

**Langkah-langkah**:

1. Edit sopir
2. Ubah status: AVAILABLE → OFF_DUTY
3. Simpan

**Hasil yang Diharapkan**:

- ✅ Status update
- ✅ Badge gray
- ✅ Sopir tidak muncul di dropdown transaksi
- ✅ Toast: "Status sopir diubah"
- ✅ Log audit dibuat

---

### TC-DRIVER-CRUD-005: Hapus Sopir (Tidak Ada Transaksi)

**Prioritas**: Sedang  
**Role**: ADMIN

**Prakondisi**: Sopir tidak pernah assigned ke transaksi

**Langkah-langkah**:

1. Klik "Delete"
2. Konfirmasi

**Hasil yang Diharapkan**:

- ✅ Sopir dihapus
- ✅ Toast: "Sopir berhasil dihapus"
- ✅ Log audit dibuat

---

### TC-DRIVER-CRUD-006: Tidak Dapat Hapus Sopir dengan Transaksi Aktif

**Prioritas**: Tinggi  
**Role**: ADMIN

**Prakondisi**: Sopir assigned ke transaksi PENDING/APPROVED

**Langkah-langkah**:

1. Coba delete sopir yang sedang bertugas

**Hasil yang Diharapkan**:

- ✅ Tombol disabled atau error
- ✅ Error: "Tidak dapat menghapus sopir yang sedang bertugas"
- ✅ Sopir tetap di database

---

### TC-DRIVER-CRUD-007: Validasi - Nomor SIM Duplikat

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Tambah sopir dengan SIM yang sudah ada
2. Submit

**Hasil yang Diharapkan**:

- ✅ Error: "Nomor SIM sudah terdaftar"
- ✅ Form tidak tersubmit

---

### TC-DRIVER-CRUD-008: Validasi - Nomor Telepon Invalid

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Tambah sopir
2. No. Telepon: "123" (terlalu pendek)
3. Submit

**Hasil yang Diharapkan**:

- ✅ Error: "Nomor telepon tidak valid"
- ✅ Form tidak tersubmit

---

## 6. Manajemen Paket Jasa - CRUD Lengkap

### TC-PACKAGE-CRUD-001: Lihat Daftar Paket

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke /paket

**Hasil yang Diharapkan**:

- ✅ Semua paket ditampilkan
- ✅ Setiap paket menampilkan:
  - Nama paket
  - Tipe (Sewa Mobil/Paket Wisata/Full Day/Custom)
  - Harga dasar
  - Durasi (jika ada)
  - Tarif overtime (jika ada)
  - Daftar hotel (jika paket wisata)
  - Tombol action: Edit, Delete
- ✅ Filter: Semua, Sewa Mobil, Paket Wisata, Full Day, Custom
- ✅ Tombol "Tambah Paket"

---

### TC-PACKAGE-CRUD-002: Tambah Paket Sewa Mobil

**Prioritas**: Kritis  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Tambah Paket"
2. Isi:
   - Nama: "Sewa Xenia 24 Jam"
   - Jenis: "Sewa Mobil"
   - Harga: Rp 600.000
   - Durasi: 1 hari
   - Tarif Overtime: Rp 60.000/jam
   - Deskripsi: "Paket sewa Xenia 24 jam dengan sopir"
3. Simpan

**Hasil yang Diharapkan**:

- ✅ Paket tersimpan
- ✅ Muncul di list
- ✅ Toast: "Paket berhasil ditambahkan"
- ✅ Log audit dibuat

---

### TC-PACKAGE-CRUD-003: Tambah Paket Wisata dengan Hotel

**Prioritas**: Kritis  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Tambah Paket"
2. Isi:
   - Nama: "Paket Wisata Lombok 4D3N"
   - Jenis: "Paket Wisata"
   - Harga Dasar: Rp 3.000.000
   - Durasi: 4 hari 3 malam
3. Tambah tier hotel:
   - Bintang 2: Rp 250.000/orang
   - Bintang 3: Rp 400.000/orang
   - Bintang 4: Rp 600.000/orang
   - Bintang 5: Rp 900.000/orang
4. Simpan

**Hasil yang Diharapkan**:

- ✅ Paket tersimpan dengan hotel tiers
- ✅ Muncul di list dengan badge "Paket Wisata"
- ✅ Detail hotel dapat dilihat
- ✅ Toast: "Paket wisata berhasil ditambahkan"
- ✅ Log audit dibuat

---

### TC-PACKAGE-CRUD-004: Tambah Paket Full Day

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Tambah Paket"
2. Isi:
   - Nama: "Full Day Bogor"
   - Jenis: "Full Day"
   - Harga: Rp 900.000/hari
   - Durasi: 1 hari
3. Simpan

**Hasil yang Diharapkan**:

- ✅ Paket tersimpan
- ✅ Harga per hari terkonfigurasi
- ✅ Toast: "Paket berhasil ditambahkan"

---

### TC-PACKAGE-CRUD-005: Edit Paket

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Edit" pada paket
2. Ubah harga: Rp 600.000 → Rp 650.000
3. Ubah deskripsi
4. Simpan

**Hasil yang Diharapkan**:

- ✅ Data terupdate
- ✅ Toast: "Paket berhasil diupdate"
- ✅ Log audit dibuat

---

### TC-PACKAGE-CRUD-006: Edit Hotel Paket Wisata

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Edit paket wisata
2. Ubah harga hotel Bintang 3: Rp 400.000 → Rp 450.000
3. Tambah tier baru: Bintang 1: Rp 150.000
4. Hapus tier Bintang 5
5. Simpan

**Hasil yang Diharapkan**:

- ✅ Harga hotel terupdate
- ✅ Tier baru ditambahkan
- ✅ Tier dihapus
- ✅ Perubahan tercermin di transaksi baru
- ✅ Toast: "Hotel tiers berhasil diupdate"
- ✅ Log audit dibuat

---

### TC-PACKAGE-CRUD-007: Hapus Paket (Tidak Digunakan)

**Prioritas**: Sedang  
**Role**: ADMIN

**Prakondisi**: Paket tidak pernah digunakan di transaksi

**Langkah-langkah**:

1. Klik "Delete"
2. Konfirmasi

**Hasil yang Diharapkan**:

- ✅ Paket dihapus
- ✅ Toast: "Paket berhasil dihapus"
- ✅ Log audit dibuat

---

### TC-PACKAGE-CRUD-008: Tidak Dapat Hapus Paket yang Digunakan

**Prioritas**: Tinggi  
**Role**: ADMIN

**Prakondisi**: Paket digunakan di transaksi

**Langkah-langkah**:

1. Coba delete paket yang sudah digunakan

**Hasil yang Diharapkan**:

- ✅ Error: "Tidak dapat menghapus paket yang sudah digunakan di transaksi"
- ✅ Paket tetap di database

---

### TC-PACKAGE-CRUD-009: Validasi - Paket Wisata Tanpa Hotel

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Tambah paket
2. Pilih jenis: "Paket Wisata"
3. Jangan tambahkan hotel tier
4. Submit

**Hasil yang Diharapkan**:

- ✅ Error: "Paket wisata harus memiliki minimal 1 tier hotel"
- ✅ Form tidak tersubmit

---

### TC-PACKAGE-CRUD-010: Validasi - Harga Negatif

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Tambah paket
2. Harga: -100000
3. Submit

**Hasil yang Diharapkan**:

- ✅ Error: "Harga harus lebih dari 0"
- ✅ Form tidak tersubmit

---

## 7. Manajemen Pengeluaran - Flow Lengkap

### TC-EXPENSE-FLOW-001: Lihat Daftar Pengeluaran

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke /pengeluaran

**Hasil yang Diharapkan**:

- ✅ Semua pengeluaran ditampilkan dalam tabel
- ✅ Kolom: Tanggal, Kategori, Deskripsi, Jumlah, Status, Lampiran, Aksi
- ✅ Filter: Kategori (BBM, Maintenance, Gaji, Operasional, Lainnya)
- ✅ Filter: Rentang tanggal
- ✅ Search box
- ✅ Tombol "Tambah Pengeluaran"
- ✅ Total pengeluaran ditampilkan

---

### TC-EXPENSE-FLOW-002: Tambah Pengeluaran Tanpa Lampiran

**Prioritas**: Kritis  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Klik "Tambah Pengeluaran"
2. Isi:
   - Tanggal: 23 Nov 2025
   - Kategori: "BBM"
   - Deskripsi: "Isi bensin Avanza B 1234 ABC"
   - Jumlah: Rp 500.000
   - Catatan: "Full tank"
3. Klik "Simpan"

**Hasil yang Diharapkan**:

- ✅ Pengeluaran tersimpan
- ✅ Muncul di tabel
- ✅ Toast: "Pengeluaran berhasil ditambahkan"
- ✅ Log audit dibuat

**Data Uji**:

```json
{
  "date": "2025-11-23",
  "category": "BBM",
  "description": "Isi bensin Avanza B 1234 ABC",
  "amount": 500000,
  "notes": "Full tank"
}
```

---

### TC-EXPENSE-FLOW-003: Tambah Pengeluaran dengan Lampiran File

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Klik "Tambah Pengeluaran"
2. Isi data pengeluaran
3. Klik "Upload File" atau drag & drop
4. Pilih file: nota_bbm.jpg (< 5MB)
5. Tunggu upload selesai
6. Simpan

**Hasil yang Diharapkan**:

- ✅ File terupload ke MinIO storage
- ✅ Referensi file tersimpan di database
- ✅ Pengeluaran tersimpan dengan lampiran
- ✅ Icon/indicator lampiran muncul di tabel
- ✅ Toast: "Pengeluaran dengan lampiran berhasil ditambahkan"
- ✅ Log audit dibuat

---

### TC-EXPENSE-FLOW-004: Tambah Pengeluaran dengan Multiple Files

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Klik "Tambah Pengeluaran"
2. Upload 3 file:
   - nota_1.jpg
   - nota_2.jpg
   - invoice.pdf
3. Simpan

**Hasil yang Diharapkan**:

- ✅ Semua file terupload
- ✅ Semua referensi tersimpan
- ✅ Pengeluaran tersimpan dengan 3 lampiran
- ✅ Counter lampiran: "3 file"

---

### TC-EXPENSE-FLOW-005: Edit Pengeluaran

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR

**Prakondisi**: Pengeluaran ada

**Langkah-langkah**:

1. Klik "Edit" pada pengeluaran
2. Ubah:
   - Deskripsi: "Isi bensin..." → "Isi bensin full tank..."
   - Jumlah: Rp 500.000 → Rp 550.000
3. Simpan

**Hasil yang Diharapkan**:

- ✅ Data terupdate
- ✅ Toast: "Pengeluaran berhasil diupdate"
- ✅ Log audit mencatat perubahan

---

### TC-EXPENSE-FLOW-006: Request Edit Pengeluaran (Operator)

**Prioritas**: Tinggi  
**Role**: OPERATOR

**Prakondisi**:

- Login sebagai operator
- Pengeluaran yang sudah approved ada

**Langkah-langkah**:

1. Klik menu action pada pengeluaran
2. Pilih "Request Edit"
3. Masukkan alasan: "Salah input jumlah"
4. Submit

**Hasil yang Diharapkan**:

- ✅ Edit request dibuat
- ✅ Status: PENDING
- ✅ Badge "Edit Request" muncul
- ✅ Toast: "Permintaan edit berhasil dikirim"
- ✅ Log audit dibuat

---

### TC-EXPENSE-FLOW-007: Approve Edit Request (Admin)

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Review edit request
2. Klik "Approve Edit Request"

**Hasil yang Diharapkan**:

- ✅ Edit request approved
- ✅ Pengeluaran unlock untuk editing
- ✅ Toast: "Permintaan edit disetujui"
- ✅ Log audit dibuat

---

### TC-EXPENSE-FLOW-008: Request Delete Pengeluaran (Operator)

**Prioritas**: Sedang  
**Role**: OPERATOR

**Langkah-langkah**:

1. Klik "Request Delete"
2. Masukkan alasan: "Duplikat entry"
3. Submit

**Hasil yang Diharapkan**:

- ✅ Delete request dibuat
- ✅ Badge "Delete Request" muncul
- ✅ Toast: "Permintaan hapus berhasil dikirim"
- ✅ Log audit dibuat

---

### TC-EXPENSE-FLOW-009: Approve Delete Request (Admin)

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Review delete request
2. Klik "Approve Delete"
3. Konfirmasi

**Hasil yang Diharapkan**:

- ✅ Pengeluaran dihapus
- ✅ File lampiran dihapus dari MinIO
- ✅ Toast: "Pengeluaran berhasil dihapus"
- ✅ Log audit dibuat

---

### TC-EXPENSE-FLOW-010: Hapus Pengeluaran (Admin Direct)

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Delete" pada pengeluaran
2. Konfirmasi

**Hasil yang Diharapkan**:

- ✅ Pengeluaran dihapus
- ✅ File terkait dihapus dari storage
- ✅ Toast: "Pengeluaran berhasil dihapus"
- ✅ Log audit dibuat

---

### TC-EXPENSE-FLOW-011: Lihat Detail Pengeluaran dengan Lampiran

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Klik pada pengeluaran dengan lampiran
2. Modal detail terbuka

**Hasil yang Diharapkan**:

- ✅ Semua detail ditampilkan
- ✅ Lampiran terdaftar dengan nama file
- ✅ Preview gambar tersedia
- ✅ Link download untuk setiap file
- ✅ Tombol "Close"

---

### TC-EXPENSE-FLOW-012: Download Lampiran

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Buka detail pengeluaran
2. Klik link download pada lampiran

**Hasil yang Diharapkan**:

- ✅ File terdownload
- ✅ Nama file benar
- ✅ File tidak corrupt
- ✅ Dapat dibuka dengan aplikasi yang sesuai

---

### TC-EXPENSE-FLOW-013: Hapus Lampiran

**Prioritas**: Rendah  
**Role**: ADMIN

**Langkah-langkah**:

1. Buka detail pengeluaran
2. Klik "Delete" pada lampiran
3. Konfirmasi

**Hasil yang Diharapkan**:

- ✅ File dihapus dari MinIO
- ✅ Referensi dihapus dari database
- ✅ Lampiran tidak terlihat lagi
- ✅ Toast: "Lampiran berhasil dihapus"
- ✅ Log audit dibuat

---

### TC-EXPENSE-FLOW-014: Filter Pengeluaran - Kategori

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Pilih filter kategori: "BBM"

**Hasil yang Diharapkan**:

- ✅ Hanya pengeluaran BBM ditampilkan
- ✅ Total dihitung ulang untuk kategori BBM
- ✅ Counter: "Menampilkan X pengeluaran BBM"

---

### TC-EXPENSE-FLOW-015: Filter Pengeluaran - Rentang Tanggal

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Set tanggal mulai: 1 Nov 2025
2. Set tanggal akhir: 15 Nov 2025
3. Apply filter

**Hasil yang Diharapkan**:

- ✅ Hanya pengeluaran dalam range ditampilkan
- ✅ Total dihitung ulang
- ✅ Filter indicator muncul

---

### TC-EXPENSE-FLOW-016: Search Pengeluaran

**Prioritas**: Rendah  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Ketik di search: "bensin"

**Hasil yang Diharapkan**:

- ✅ Pengeluaran dengan deskripsi mengandung "bensin" ditampilkan
- ✅ Search case-insensitive
- ✅ Partial match

---

### TC-EXPENSE-FLOW-017: Validasi - Jumlah Negatif

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Tambah pengeluaran
2. Jumlah: -100000
3. Submit

**Hasil yang Diharapkan**:

- ✅ Error: "Jumlah harus lebih dari 0"
- ✅ Form tidak tersubmit

---

### TC-EXPENSE-FLOW-018: Validasi - Tipe File Invalid

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Tambah pengeluaran
2. Upload file: virus.exe
3. Submit

**Hasil yang Diharapkan**:

- ✅ Error: "Tipe file tidak didukung"
- ✅ Upload dicegah
- ✅ Hanya gambar (JPG, PNG) dan PDF diizinkan

---

### TC-EXPENSE-FLOW-019: Validasi - Ukuran File Terlalu Besar

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Tambah pengeluaran
2. Upload file > 10MB
3. Submit

**Hasil yang Diharapkan**:

- ✅ Error: "Ukuran file terlalu besar (max 10MB)"
- ✅ Upload dicegah

---

## 8. Laporan Keuangan - Admin Only

### TC-REPORT-FLOW-001: Akses Laporan sebagai Admin

**Prioritas**: Kritis  
**Role**: ADMIN

**Langkah-langkah**:

1. Login sebagai admin
2. Navigasi ke /laporan

**Hasil yang Diharapkan**:

- ✅ Halaman laporan terbuka
- ✅ Menampilkan:
  - Filter periode (bulan, tahun, custom range)
  - Quick filters: Bulan Ini, Tahun Ini
  - Tab laporan: Transaksi, Laba Rugi, Pemasukan, Pengeluaran, Rekapitulasi, Kinerja
  - Kartu statistik: Total Transaksi, Total Pemasukan, Total Pengeluaran, Laba Kotor
  - Tombol "Download Laporan (Excel)"

---

### TC-REPORT-FLOW-002: Akses Laporan sebagai Operator (Ditolak)

**Prioritas**: Kritis  
**Role**: OPERATOR

**Langkah-langkah**:

1. Login sebagai operator
2. Coba akses /laporan via URL

**Hasil yang Diharapkan**:

- ✅ Akses ditolak
- ✅ Redirect ke /dashboard atau error 403
- ✅ Pesan: "Anda tidak memiliki akses ke halaman ini"
- ✅ Menu "Laporan" tidak terlihat di sidebar operator
- ✅ Log audit dibuat untuk percobaan akses

---

### TC-REPORT-FLOW-003: Laporan Transaksi

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Di halaman laporan, klik tab "Laporan Transaksi"
2. Pilih periode: Bulan Ini

**Hasil yang Diharapkan**:

- ✅ Menampilkan:
  - Total transaksi per status (Draft, Pending, Approved, Completed)
  - Grafik tren transaksi
  - Durasi rata-rata transaksi
  - Statistik overtime
  - Tabel detail transaksi
- ✅ Data akurat sesuai periode

---

### TC-REPORT-FLOW-004: Laporan Laba Rugi

**Prioritas**: Kritis  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik tab "Laporan Laba Rugi"
2. Pilih periode: Bulan Ini

**Hasil yang Diharapkan**:

- ✅ Menampilkan:
  - Total Pemasukan (dari transaksi completed)
  - Total Pengeluaran (dari expense records)
  - Laba/Rugi Bersih (Pemasukan - Pengeluaran)
  - Persentase margin laba
  - Perbandingan dengan periode sebelumnya
  - Grafik tren laba/rugi
- ✅ Perhitungan akurat
- ✅ Format currency: Rupiah

---

### TC-REPORT-FLOW-005: Laporan Pemasukan

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik tab "Laporan Pemasukan"

**Hasil yang Diharapkan**:

- ✅ Menampilkan:
  - Total pemasukan
  - Pemasukan per tipe paket
  - Pemasukan per kendaraan
  - Jumlah transaksi
  - Nilai rata-rata transaksi
  - Grafik breakdown pemasukan
- ✅ Data dari transaksi COMPLETED saja

---

### TC-REPORT-FLOW-006: Laporan Pengeluaran

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik tab "Laporan Pengeluaran"

**Hasil yang Diharapkan**:

- ✅ Menampilkan:
  - Total pengeluaran
  - Pengeluaran per kategori (BBM, Maintenance, Gaji, dll)
  - Grafik tren pengeluaran
  - Kategori pengeluaran teratas
  - Tabel detail pengeluaran
- ✅ Data akurat dari expense records

---

### TC-REPORT-FLOW-007: Rekapitulasi

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik tab "Rekapitulasi"

**Hasil yang Diharapkan**:

- ✅ Menampilkan ringkasan komprehensif:
  - Semua metrik kunci
  - Pemasukan vs Pengeluaran (chart)
  - Statistik armada dan sopir
  - Top performers
  - Indikator kesehatan bisnis
  - Summary cards

---

### TC-REPORT-FLOW-008: Laporan Kinerja

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik tab "Laporan Kinerja"

**Hasil yang Diharapkan**:

- ✅ Menampilkan:
  - Metrik performa sopir (jumlah trip, ketepatan waktu, pendapatan)
  - Tingkat utilisasi kendaraan
  - Popularitas paket
  - Tingkat penyelesaian transaksi
  - Rating/feedback (jika ada)

---

### TC-REPORT-FLOW-009: Filter Periode - Bulan Ini

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik button "Bulan Ini"

**Hasil yang Diharapkan**:

- ✅ Semua data laporan update untuk bulan berjalan
- ✅ Periode ditampilkan: "1 November - 23 November 2025"
- ✅ Semua tab update sesuai filter

---

### TC-REPORT-FLOW-010: Filter Periode - Tahun Ini

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik button "Tahun Ini"

**Hasil yang Diharapkan**:

- ✅ Data untuk tahun 2025 (1 Jan - 23 Nov)
- ✅ Semua metrik dihitung ulang

---

### TC-REPORT-FLOW-011: Filter Periode - Custom Range

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik date range picker
2. Pilih: 1 Okt 2025 - 31 Okt 2025
3. Apply

**Hasil yang Diharapkan**:

- ✅ Data untuk Oktober 2025
- ✅ Periode ditampilkan: "1 Oktober - 31 Oktober 2025"
- ✅ Semua laporan update

---

### TC-REPORT-FLOW-012: Export Laporan ke Excel

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Di tab "Laporan Pemasukan"
2. Pilih periode: Bulan Ini
3. Klik "Download Laporan (Excel)"

**Hasil yang Diharapkan**:

- ✅ File Excel (.xlsx) terdownload
- ✅ Nama file: "Laporan_Pemasukan_2025-11-23.xlsx"
- ✅ File berisi:
  - Sheet 1: Summary
  - Sheet 2: Detail transaksi
  - Sheet 3: Breakdown per paket
  - Sheet 4: Breakdown per armada
- ✅ Format terjaga (currency, date)
- ✅ File dapat dibuka di Excel/LibreOffice
- ✅ Data akurat sesuai tampilan web

---

### TC-REPORT-FLOW-013: Export Laporan Rekap ke Excel

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Di tab "Rekapitulasi"
2. Klik "Download Laporan (Excel)"

**Hasil yang Diharapkan**:

- ✅ File: "Laporan_Rekap_2025-11-23.xlsx"
- ✅ Berisi semua data rekapitulasi
- ✅ Multiple sheets untuk berbagai aspek

---

### TC-REPORT-FLOW-014: Akurasi Data - Pemasukan

**Prioritas**: Kritis  
**Role**: ADMIN

**Prakondisi**: Transaksi completed yang diketahui ada

**Langkah-langkah**:

1. Catat manual: jumlah transaksi completed dan total harga
2. Buka laporan pemasukan
3. Bandingkan

**Hasil yang Diharapkan**:

- ✅ Total pemasukan = SUM(final_price) dari transaksi COMPLETED
- ✅ Tidak ada transaksi DRAFT/PENDING/APPROVED yang dihitung
- ✅ Perhitungan 100% akurat

---

### TC-REPORT-FLOW-015: Akurasi Data - Pengeluaran

**Prioritas**: Kritis  
**Role**: ADMIN

**Prakondisi**: Expense records yang diketahui ada

**Langkah-langkah**:

1. Catat manual: jumlah expense per kategori
2. Buka laporan pengeluaran
3. Bandingkan

**Hasil yang Diharapkan**:

- ✅ Total pengeluaran = SUM(amount) dari expense records
- ✅ Breakdown per kategori akurat
- ✅ Tidak ada entri yang hilang atau duplikat

---

### TC-REPORT-FLOW-016: Akurasi Data - Laba

**Prioritas**: Kritis  
**Role**: ADMIN

**Langkah-langkah**:

1. Hitung manual: Laba = Total Pemasukan - Total Pengeluaran
2. Buka laporan laba/rugi
3. Bandingkan

**Hasil yang Diharapkan**:

- ✅ Laba Bersih = Total Pemasukan - Total Pengeluaran
- ✅ Margin % = (Laba / Pemasukan) × 100
- ✅ Perhitungan akurat

---

## 9. Manajemen Staff

### TC-STAFF-CRUD-001: Lihat Daftar Staff

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke /staff

**Hasil yang Diharapkan**:

- ✅ Semua staff ditampilkan dalam tabel/card
- ✅ Kolom: Nama, Posisi, No. Telepon, Gaji, Status, Aksi
- ✅ Tombol "Tambah Staff"
- ✅ Filter status: Aktif, Tidak Aktif

---

### TC-STAFF-CRUD-002: Tambah Staff Baru

**Prioritas**: Kritis  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Tambah Staff"
2. Isi:
   - Nama: "Andi Wijaya"
   - Posisi: "Mekanik"
   - No. Telepon: "081234567890"
   - Gaji: Rp 4.500.000
   - Status: "Active"
   - Tanggal Bergabung: 1 Nov 2025
3. Simpan

**Hasil yang Diharapkan**:

- ✅ Staff tersimpan
- ✅ Muncul di list
- ✅ Toast: "Staff berhasil ditambahkan"
- ✅ Log audit dibuat

---

### TC-STAFF-CRUD-003: Edit Staff

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Edit" pada staff
2. Ubah gaji: Rp 4.500.000 → Rp 5.000.000
3. Ubah posisi: "Mekanik" → "Senior Mekanik"
4. Simpan

**Hasil yang Diharapkan**:

- ✅ Data terupdate
- ✅ Toast: "Staff berhasil diupdate"
- ✅ Log audit mencatat perubahan gaji dan posisi

---

### TC-STAFF-CRUD-004: Ubah Status ke Tidak Aktif

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Edit staff
2. Ubah status: Active → Inactive
3. Simpan

**Hasil yang Diharapkan**:

- ✅ Status update
- ✅ Badge status berubah
- ✅ Staff masih terlihat di list (tidak dihapus)
- ✅ Toast: "Status staff diupdate"
- ✅ Log audit dibuat

---

### TC-STAFF-CRUD-005: Hapus Staff

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Delete"
2. Konfirmasi

**Hasil yang Diharapkan**:

- ✅ Staff dihapus
- ✅ Toast: "Staff berhasil dihapus"
- ✅ Log audit dibuat

---

## 10. Manajemen User - Admin Only

### TC-USER-CRUD-001: Lihat Daftar User

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke /users

**Hasil yang Diharapkan**:

- ✅ Semua user ditampilkan dalam tabel
- ✅ Kolom: Nama, Username, Email, Role, Status, Login Terakhir, Aksi
- ✅ Tombol "Tambah User"
- ✅ Filter role: Semua, Admin, Operator
- ✅ Filter status: Aktif, Tidak Aktif

---

### TC-USER-CRUD-002: Akses User Management sebagai Operator (Ditolak)

**Prioritas**: Kritis  
**Role**: OPERATOR

**Langkah-langkah**:

1. Login sebagai operator
2. Coba akses /users via URL

**Hasil yang Diharapkan**:

- ✅ Akses ditolak
- ✅ Redirect atau error 403
- ✅ Pesan: "Anda tidak memiliki akses"
- ✅ Menu "Manajemen User" tidak terlihat di sidebar operator
- ✅ Log audit dibuat

---

### TC-USER-CRUD-003: Tambah User Admin Baru

**Prioritas**: Kritis  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Tambah User"
2. Isi:
   - Nama: "Super Admin"
   - Username: "superadmin"
   - Email: "superadmin@rental.com"
   - Password: "SecurePass123!"
   - Konfirmasi Password: "SecurePass123!"
   - Role: "ADMIN"
3. Simpan

**Hasil yang Diharapkan**:

- ✅ User tersimpan
- ✅ Password di-hash dengan bcrypt
- ✅ Muncul di list user
- ✅ Status: Aktif
- ✅ Toast: "User berhasil ditambahkan"
- ✅ Log audit dibuat
- ✅ User dapat login dengan kredensial baru

---

### TC-USER-CRUD-004: Tambah User Operator Baru

**Prioritas**: Kritis  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Tambah User"
2. Isi dengan Role: "OPERATOR"
3. Simpan

**Hasil yang Diharapkan**:

- ✅ User operator tersimpan
- ✅ Izin terbatas diterapkan
- ✅ User dapat login
- ✅ Tidak dapat akses route admin-only

---

### TC-USER-CRUD-005: Edit User - Ubah Email

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Edit" pada user
2. Ubah email: "operator@rental.com" → "operator.new@rental.com"
3. Simpan

**Hasil yang Diharapkan**:

- ✅ Email terupdate
- ✅ User dapat login dengan email baru
- ✅ Email lama tidak berfungsi
- ✅ Toast: "User berhasil diupdate"
- ✅ Log audit dibuat

---

### TC-USER-CRUD-006: Edit User - Ubah Role

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Edit user operator
2. Ubah role: OPERATOR → ADMIN
3. Simpan

**Hasil yang Diharapkan**:

- ✅ Role terupdate
- ✅ User sekarang memiliki akses admin
- ✅ Menu admin muncul saat login
- ✅ Izin berubah segera (tidak perlu re-login)
- ✅ Toast: "Role user berhasil diupdate"
- ✅ Log audit dibuat

---

### TC-USER-CRUD-007: Ubah Password User

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Edit user
2. Masukkan password baru: "NewPassword123!"
3. Konfirmasi password: "NewPassword123!"
4. Simpan

**Hasil yang Diharapkan**:

- ✅ Password terupdate (bcrypt hash)
- ✅ User dapat login dengan password baru
- ✅ Password lama tidak berfungsi
- ✅ Toast: "Password berhasil diupdate"
- ✅ Log audit dibuat

---

### TC-USER-CRUD-008: Nonaktifkan User

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Deactivate" pada user aktif
2. Konfirmasi

**Hasil yang Diharapkan**:

- ✅ Status: Active → Inactive
- ✅ User tidak dapat login
- ✅ Sesi yang ada dibatalkan (jika sedang login)
- ✅ Badge status: "Tidak Aktif"
- ✅ Toast: "User berhasil dinonaktifkan"
- ✅ Log audit dibuat

---

### TC-USER-CRUD-009: Aktifkan Kembali User

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Activate" pada user tidak aktif
2. Konfirmasi

**Hasil yang Diharapkan**:

- ✅ Status: Inactive → Active
- ✅ User dapat login lagi
- ✅ Toast: "User berhasil diaktifkan"
- ✅ Log audit dibuat

---

### TC-USER-CRUD-010: Hapus User

**Prioritas**: Sedang  
**Role**: ADMIN

**Prakondisi**: User tidak terkait dengan data kritis

**Langkah-langkah**:

1. Klik "Delete"
2. Konfirmasi

**Hasil yang Diharapkan**:

- ✅ User dihapus
- ✅ Toast: "User berhasil dihapus"
- ✅ Log audit dibuat

---

### TC-USER-CRUD-011: Tidak Dapat Hapus Akun Sendiri

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Coba hapus user yang sedang login (diri sendiri)

**Hasil yang Diharapkan**:

- ✅ Tombol "Delete" disabled atau tidak ada
- ✅ Jika dicoba: Error "Tidak dapat menghapus akun sendiri"
- ✅ User tetap di database

---

### TC-USER-CRUD-012: Validasi - Email Duplikat

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Tambah user
2. Email: "admin@rental.com" (sudah ada)
3. Submit

**Hasil yang Diharapkan**:

- ✅ Error: "Email sudah terdaftar"
- ✅ Form tidak tersubmit

---

### TC-USER-CRUD-013: Validasi - Username Duplikat

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Tambah user
2. Username: "admin" (sudah ada)
3. Submit

**Hasil yang Diharapkan**:

- ✅ Error: "Username sudah digunakan"
- ✅ Form tidak tersubmit

---

### TC-USER-CRUD-014: Validasi - Password Lemah

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Tambah user
2. Password: "123" (< 8 karakter)
3. Submit

**Hasil yang Diharapkan**:

- ✅ Error: "Password minimal 8 karakter"
- ✅ Form tidak tersubmit

---

### TC-USER-CRUD-015: Validasi - Password Tidak Cocok

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Tambah user
2. Password: "password123"
3. Konfirmasi: "password456"
4. Submit

**Hasil yang Diharapkan**:

- ✅ Error: "Password tidak cocok"
- ✅ Form tidak tersubmit

---

## 11. Audit Log

### TC-AUDIT-001: Lihat Audit Log (Admin Only)

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke /audit

**Hasil yang Diharapkan**:

- ✅ Semua log audit ditampilkan dalam tabel
- ✅ Kolom: Timestamp, User, Action, Entity Type, Entity ID, Details, IP Address
- ✅ Filter: User, Action Type, Entity Type, Date Range
- ✅ Search box
- ✅ Pagination
- ✅ Sorting by timestamp (newest first)

---

### TC-AUDIT-002: Akses Audit Log sebagai Operator (Ditolak)

**Prioritas**: Kritis  
**Role**: OPERATOR

**Langkah-langkah**:

1. Login sebagai operator
2. Coba akses /audit via URL

**Hasil yang Diharapkan**:

- ✅ Akses ditolak
- ✅ Redirect atau error 403
- ✅ Menu "Audit Log" tidak terlihat di sidebar operator
- ✅ Log audit dibuat untuk percobaan akses

---

### TC-AUDIT-003: Verifikasi Log - Create Transaction

**Prioritas**: Sedang  
**Role**: ADMIN

**Prakondisi**: Buat transaksi baru

**Langkah-langkah**:

1. Buat transaksi baru
2. Navigasi ke /audit
3. Cari log terbaru

**Hasil yang Diharapkan**:

- ✅ Log entry ada dengan:
  - Action: "CREATE"
  - Entity Type: "Transaction"
  - Entity ID: [transaction_id]
  - User: [current_user]
  - Details: JSON dengan data transaksi
  - Timestamp: waktu create

---

### TC-AUDIT-004: Verifikasi Log - Update Transaction

**Prioritas**: Sedang  
**Role**: ADMIN

**Prakondisi**: Edit transaksi

**Langkah-langkah**:

1. Edit transaksi (ubah nama pelanggan)
2. Cek audit log

**Hasil yang Diharapkan**:

- ✅ Log entry dengan:
  - Action: "UPDATE"
  - Details: JSON dengan old_value dan new_value
  - Changed fields tercatat

---

### TC-AUDIT-005: Verifikasi Log - Delete

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Hapus transaksi draft
2. Cek audit log

**Hasil yang Diharapkan**:

- ✅ Log entry dengan:
  - Action: "DELETE"
  - Details: Data yang dihapus

---

### TC-AUDIT-006: Verifikasi Log - Status Change

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Submit transaksi (DRAFT → PENDING)
2. Cek audit log

**Hasil yang Diharapkan**:

- ✅ Log entry dengan:
  - Action: "STATUS_CHANGE"
  - Details: old_status: "DRAFT", new_status: "PENDING"

---

### TC-AUDIT-007: Verifikasi Log - Unauthorized Access Attempt

**Prioritas**: Tinggi  
**Role**: OPERATOR

**Langkah-langkah**:

1. Login sebagai operator
2. Coba akses /laporan
3. Admin cek audit log

**Hasil yang Diharapkan**:

- ✅ Log entry dengan:
  - Action: "UNAUTHORIZED_ACCESS"
  - Entity Type: "Route"
  - Details: attempted_route: "/laporan"
  - User: operator
  - IP Address tercatat

---

### TC-AUDIT-008: Filter Audit Log - By User

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Di audit log, filter by user: "operator"

**Hasil yang Diharapkan**:

- ✅ Hanya log dari user operator ditampilkan
- ✅ Counter update

---

### TC-AUDIT-009: Filter Audit Log - By Action Type

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Filter by action: "CREATE"

**Hasil yang Diharapkan**:

- ✅ Hanya log CREATE ditampilkan

---

### TC-AUDIT-010: Filter Audit Log - By Date Range

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Set date range: 1 Nov - 15 Nov 2025

**Hasil yang Diharapkan**:

- ✅ Hanya log dalam range ditampilkan

---

### TC-AUDIT-011: Search Audit Log

**Prioritas**: Rendah  
**Role**: ADMIN

**Langkah-langkah**:

1. Search: "INV-2025-11-001"

**Hasil yang Diharapkan**:

- ✅ Log terkait invoice tersebut ditampilkan

---

### TC-AUDIT-012: Export Audit Log

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Export Audit Log"

**Hasil yang Diharapkan**:

- ✅ File CSV atau Excel terdownload
- ✅ Berisi semua log sesuai filter
- ✅ Format: timestamp, user, action, entity, details

---

## 12. Skenario Integrasi End-to-End

### SCENARIO-001: Complete Transaction Lifecycle - Happy Path

**Prioritas**: Kritis  
**Role**: ADMIN + OPERATOR

**Deskripsi**: Skenario lengkap dari pembuatan transaksi hingga selesai dan pembayaran lunas

**Langkah-langkah**:

**Fase 1: Operator - Buat Transaksi (DRAFT)**

1. Login sebagai operator
2. Navigasi ke /transaksi
3. Klik "Input Transaksi Baru"
4. Isi data pelanggan: "PT Maju Bersama", "081234567890"
5. Pilih paket: "Sewa Avanza 12 Jam"
6. Pilih armada: "B 1234 ABC" (status READY)
7. Pilih sopir: "Pak Budi" (status AVAILABLE)
8. Set tanggal: 26 Nov 2025, 08:00 - 20:00
9. DP: Rp 200.000
10. Simpan
11. **Verifikasi**:
    - ✅ Transaksi tersimpan dengan status DRAFT
    - ✅ Invoice auto-generated
    - ✅ Armada tetap READY
    - ✅ Sopir tetap AVAILABLE

**Fase 2: Operator - Submit untuk Approval (PENDING)** 12. Klik "Submit" pada transaksi 13. Konfirmasi 14. **Verifikasi**: - ✅ Status: DRAFT → PENDING - ✅ Armada: READY → BOOKED - ✅ Sopir: AVAILABLE → BOOKED - ✅ Tombol Edit/Delete disabled - ✅ Log audit dibuat

**Fase 3: Admin - Approve Transaksi (APPROVED)** 15. Logout operator 16. Login sebagai admin 17. Navigasi ke /transaksi 18. Cari transaksi PENDING 19. Klik "Approve" 20. Konfirmasi 21. **Verifikasi**: - ✅ Status: PENDING → APPROVED - ✅ Armada: BOOKED → ON_TRIP - ✅ Sopir: BOOKED → ON_TRIP - ✅ approved_by: admin ID - ✅ approved_at: timestamp - ✅ Log audit dibuat

**Fase 4: Operator - Complete Transaksi (COMPLETED)** 22. Logout admin, login operator 23. Klik "Selesaikan Transaksi" 24. Isi data aktual: - Checkin: 26 Nov 2025 20:00 (tepat waktu) - BBM: 15 liter - Catatan: "Perjalanan lancar" 25. Verifikasi kalkulasi: Overtime 0 jam 26. Klik "Selesaikan" 27. **Verifikasi**: - ✅ Status: APPROVED → COMPLETED - ✅ Armada: ON_TRIP → READY - ✅ Sopir: ON_TRIP → AVAILABLE - ✅ final_price: Rp 500.000 - ✅ overtime_cost: Rp 0 - ✅ completed_at: timestamp - ✅ Log audit dibuat

**Fase 5: Operator - Update Pembayaran (LUNAS)** 28. Klik dropdown "Status Pembayaran" 29. Pilih "Lunas" 30. Konfirmasi 31. **Verifikasi**: - ✅ payment_status: DP → PAID - ✅ Sisa tagihan: Rp 0 - ✅ paid_at: timestamp - ✅ Log audit dibuat

**Fase 6: Verifikasi Dashboard & Laporan** 32. Navigasi ke /dashboard 33. **Verifikasi**: - ✅ Total transaksi +1 - ✅ Total pemasukan +Rp 500.000 - ✅ Grafik update 34. Login sebagai admin 35. Navigasi ke /laporan 36. **Verifikasi**: - ✅ Transaksi muncul di laporan pemasukan - ✅ Laba kotor +Rp 500.000 - ✅ Data akurat

**Fase 7: Cetak Invoice** 37. Kembali ke /transaksi 38. Klik "Cetak Invoice" 39. **Verifikasi**: - ✅ Halaman cetak terbuka - ✅ Semua data lengkap - ✅ Format print-friendly

**Fase 8: Audit Trail** 40. Navigasi ke /audit 41. **Verifikasi log sequence**: - ✅ CREATE transaction (operator) - ✅ STATUS_CHANGE: DRAFT → PENDING (operator) - ✅ STATUS_CHANGE: PENDING → APPROVED (admin) - ✅ STATUS_CHANGE: APPROVED → COMPLETED (operator) - ✅ UPDATE payment_status (operator)

**Hasil Akhir**:

- ✅ Transaksi completed dan lunas
- ✅ Armada dan sopir kembali available
- ✅ Data tercatat di dashboard dan laporan
- ✅ Audit trail lengkap
- ✅ Invoice dapat dicetak

---

### SCENARIO-002: Transaction with Overtime

**Prioritas**: Tinggi  
**Role**: ADMIN + OPERATOR

**Deskripsi**: Transaksi dengan keterlambatan pengembalian (overtime)

**Langkah-langkah**:

1. Operator buat transaksi: Sewa Avanza, 27 Nov 08:00 - 20:00
2. Submit untuk approval
3. Admin approve
4. Operator complete dengan checkin aktual: 27 Nov 23:00 (terlambat 3 jam)
5. **Verifikasi**:
   - ✅ Overtime: 3 jam
   - ✅ Biaya overtime: Rp 150.000 (3 × Rp 50.000)
   - ✅ Final price: Rp 650.000 (500.000 + 150.000)
   - ✅ Sisa tagihan update
6. Update pembayaran ke lunas
7. Verifikasi laporan: pemasukan +Rp 650.000

---

### SCENARIO-003: Transaction Rejection Flow

**Prioritas**: Tinggi  
**Role**: ADMIN + OPERATOR

**Deskripsi**: Transaksi ditolak oleh admin

**Langkah-langkah**:

1. Operator buat transaksi
2. Submit untuk approval (PENDING)
3. **Verifikasi**: Armada BOOKED, Sopir BOOKED
4. Admin reject dengan alasan: "Armada sedang maintenance"
5. **Verifikasi**:
   - ✅ Status: PENDING → DRAFT
   - ✅ Armada: BOOKED → READY
   - ✅ Sopir: BOOKED → AVAILABLE
   - ✅ Alasan penolakan tersimpan
   - ✅ Operator dapat edit kembali
6. Operator edit: ganti armada
7. Submit ulang
8. Admin approve
9. Complete transaksi

---

### SCENARIO-004: Edit Request Workflow

**Prioritas**: Tinggi  
**Role**: ADMIN + OPERATOR

**Deskripsi**: Operator request edit untuk transaksi approved

**Langkah-langkah**:

1. Transaksi sudah APPROVED
2. Operator klik "Request Edit"
3. Alasan: "Pelanggan minta ganti sopir"
4. Submit request
5. **Verifikasi**: Badge "Edit Request Pending"
6. Admin review request
7. Admin approve edit request
8. **Verifikasi**: Transaksi unlock
9. Operator edit: ganti sopir
10. Simpan perubahan
11. **Verifikasi**:
    - ✅ Sopir lama: ON_TRIP → AVAILABLE
    - ✅ Sopir baru: AVAILABLE → ON_TRIP
    - ✅ Log audit mencatat perubahan

---

### SCENARIO-005: Paket Wisata dengan Hotel

**Prioritas**: Tinggi  
**Role**: OPERATOR

**Deskripsi**: Transaksi paket wisata dengan pemilihan hotel

**Langkah-langkah**:

1. Buat transaksi baru
2. Pilih paket: "Paket Wisata Bali 3D2N"
3. Jumlah penumpang: 4 orang
4. Pilih tier hotel: "Bintang 4" (Rp 600.000/orang)
5. **Verifikasi kalkulasi**:
   - Base price: Rp 3.000.000
   - Hotel cost: 4 × Rp 600.000 = Rp 2.400.000
   - Total: Rp 5.400.000
6. Pilih armada dan sopir
7. Set tanggal: 28 Nov - 30 Nov
8. Simpan
9. **Verifikasi**: Harga tersimpan dengan benar
10. Submit, approve, complete
11. Verifikasi laporan: pemasukan +Rp 5.400.000

---

### SCENARIO-006: Full Day Package

**Prioritas**: Sedang  
**Role**: OPERATOR

**Deskripsi**: Transaksi paket full day dengan durasi multiple hari

**Langkah-langkah**:

1. Buat transaksi
2. Pilih paket: "Full Day Trip"
3. Durasi: 3 hari
4. **Verifikasi kalkulasi**:
   - Harga per hari: Rp 800.000
   - Total: 3 × Rp 800.000 = Rp 2.400.000
5. Complete workflow
6. Verifikasi data tersimpan

---

### SCENARIO-007: Custom Price Package

**Prioritas**: Sedang  
**Role**: OPERATOR

**Deskripsi**: Transaksi dengan harga custom

**Langkah-langkah**:

1. Buat transaksi
2. Pilih paket: "Custom"
3. Input harga manual: Rp 7.500.000
4. **Verifikasi**: Tidak ada auto-calculation
5. Complete workflow
6. Verifikasi: final_price = Rp 7.500.000

---

### SCENARIO-008: Expense Management Flow

**Prioritas**: Tinggi  
**Role**: ADMIN + OPERATOR

**Deskripsi**: Flow lengkap pengeluaran dengan approval

**Langkah-langkah**:

1. Operator tambah pengeluaran: BBM Rp 500.000
2. Upload nota (foto)
3. Simpan
4. **Verifikasi**: File terupload ke MinIO
5. Admin review pengeluaran
6. Operator request edit: "Salah input jumlah"
7. Admin approve edit request
8. Operator edit: Rp 500.000 → Rp 550.000
9. Simpan
10. **Verifikasi**: Log audit mencatat perubahan
11. Admin cek laporan pengeluaran
12. **Verifikasi**: Total pengeluaran +Rp 550.000

---

### SCENARIO-009: Fleet Management Lifecycle

**Prioritas**: Sedang  
**Role**: ADMIN

**Deskripsi**: Lifecycle armada dari tambah hingga maintenance

**Langkah-langkah**:

1. Admin tambah armada baru: "B 8888 XXX"
2. Status: READY
3. **Verifikasi**: Muncul di list, tersedia untuk booking
4. Buat transaksi dengan armada ini
5. Submit transaksi
6. **Verifikasi**: Armada status BOOKED
7. Approve transaksi
8. **Verifikasi**: Armada status ON_TRIP
9. Complete transaksi
10. **Verifikasi**: Armada kembali READY
11. Admin ubah status ke MAINTENANCE
12. **Verifikasi**: Tidak muncul di dropdown transaksi
13. Admin ubah kembali ke READY
14. **Verifikasi**: Tersedia untuk booking lagi

---

### SCENARIO-010: Driver Management Lifecycle

**Prioritas**: Sedang  
**Role**: ADMIN

**Deskripsi**: Lifecycle sopir dari tambah hingga off duty

**Langkah-langkah**:

1. Admin tambah sopir baru: "Pak Joko"
2. Status: AVAILABLE
3. Assign ke transaksi
4. **Verifikasi status changes**: AVAILABLE → BOOKED → ON_TRIP → AVAILABLE
5. Admin ubah status ke OFF_DUTY
6. **Verifikasi**: Tidak muncul di dropdown transaksi
7. Admin aktifkan kembali
8. **Verifikasi**: Tersedia untuk booking

---

### SCENARIO-011: Multi-User Concurrent Access

**Prioritas**: Tinggi  
**Role**: ADMIN + OPERATOR

**Deskripsi**: Multiple users akses sistem bersamaan

**Langkah-langkah**:

1. Browser 1: Login sebagai admin
2. Browser 2: Login sebagai operator
3. Operator buat transaksi, submit
4. Admin (browser 1) approve transaksi
5. **Verifikasi**: Operator (browser 2) melihat status update real-time atau setelah refresh
6. Operator complete transaksi
7. Admin cek dashboard
8. **Verifikasi**: Data sinkron di kedua browser

---

### SCENARIO-012: Report Generation & Export

**Prioritas**: Tinggi  
**Role**: ADMIN

**Deskripsi**: Generate dan export berbagai laporan

**Langkah-langkah**:

1. Admin login
2. Navigasi ke /laporan
3. Pilih periode: Bulan Ini
4. **Tab Laporan Pemasukan**:
   - Verifikasi data
   - Export ke Excel
   - Buka file, verifikasi isi
5. **Tab Laporan Pengeluaran**:
   - Verifikasi data
   - Export ke Excel
6. **Tab Laba Rugi**:
   - Verifikasi perhitungan
   - Export ke Excel
7. **Tab Rekapitulasi**:
   - Verifikasi semua metrik
   - Export ke Excel
8. **Verifikasi semua file**:
   - ✅ Format benar
   - ✅ Data akurat
   - ✅ Dapat dibuka di Excel

---

### SCENARIO-013: Validation & Error Handling

**Prioritas**: Tinggi  
**Role**: OPERATOR

**Deskripsi**: Test berbagai validasi dan error handling

**Langkah-langkah**:

1. **Conflict Detection**:
   - Buat transaksi A: Armada X, 28 Nov 08:00-20:00
   - Submit
   - Coba buat transaksi B: Armada X, 28 Nov 10:00-22:00
   - **Verifikasi**: Error "Armada sudah dibooking"
2. **Date Validation**:
   - Coba buat transaksi dengan checkin sebelum checkout
   - **Verifikasi**: Error validasi
3. **Required Fields**:
   - Coba submit form dengan field kosong
   - **Verifikasi**: Error untuk setiap field wajib
4. **Duplicate Prevention**:
   - Coba tambah armada dengan plat yang sama
   - **Verifikasi**: Error "Plat sudah terdaftar"
5. **File Upload Validation**:
   - Coba upload file .exe
   - **Verifikasi**: Error "Tipe file tidak didukung"
   - Coba upload file > 10MB
   - **Verifikasi**: Error "Ukuran terlalu besar"

---

### SCENARIO-014: Security & Authorization

**Prioritas**: Kritis  
**Role**: ADMIN + OPERATOR

**Deskripsi**: Test keamanan dan otorisasi

**Langkah-langkah**:

1. **Operator Access Restrictions**:
   - Login sebagai operator
   - Coba akses /laporan → Ditolak
   - Coba akses /users → Ditolak
   - Coba akses /audit → Ditolak
   - **Verifikasi**: Semua akses dicatat di audit log
2. **Session Management**:
   - Login sebagai admin
   - Tunggu session timeout
   - Coba aksi apapun
   - **Verifikasi**: Redirect ke login
3. **Password Security**:
   - Admin ubah password user
   - **Verifikasi**: Password di-hash (bcrypt)
   - User login dengan password baru
   - **Verifikasi**: Berhasil
4. **CSRF Protection**:
   - Coba submit form tanpa CSRF token (jika applicable)
   - **Verifikasi**: Request ditolak

---

### SCENARIO-015: Data Integrity & Consistency

**Prioritas**: Kritis  
**Role**: ADMIN

**Deskripsi**: Verifikasi integritas dan konsistensi data

**Langkah-langkah**:

1. **Transaction Lifecycle**:
   - Buat 5 transaksi dengan berbagai status
   - Verifikasi count di dashboard
   - Verifikasi total di laporan
   - **Verifikasi**: Angka konsisten
2. **Financial Calculations**:
   - Catat manual: total pemasukan dari transaksi completed
   - Cek dashboard: Total Pemasukan
   - Cek laporan: Total Pemasukan
   - **Verifikasi**: Semua angka sama
3. **Status Synchronization**:
   - Submit transaksi
   - **Verifikasi**: Armada dan sopir status update
   - Reject transaksi
   - **Verifikasi**: Armada dan sopir status rollback
4. **Audit Trail Completeness**:
   - Lakukan berbagai aksi (create, update, delete)
   - Cek audit log
   - **Verifikasi**: Semua aksi tercatat

---

## Ringkasan Test Coverage

### Total Test Cases: 200+

| Modul              | Test Cases | Kritis | Tinggi | Sedang | Rendah |
| ------------------ | ---------- | ------ | ------ | ------ | ------ |
| Autentikasi        | 12         | 4      | 5      | 3      | 0      |
| Dashboard          | 6          | 0      | 3      | 3      | 0      |
| Transaksi          | 22         | 8      | 10     | 4      | 0      |
| Armada             | 12         | 2      | 4      | 4      | 2      |
| Sopir              | 8          | 2      | 2      | 3      | 1      |
| Paket Jasa         | 10         | 3      | 3      | 3      | 1      |
| Pengeluaran        | 19         | 3      | 7      | 8      | 1      |
| Laporan            | 16         | 5      | 6      | 5      | 0      |
| Staff              | 5          | 1      | 1      | 2      | 1      |
| User Management    | 15         | 5      | 5      | 3      | 2      |
| Audit Log          | 12         | 2      | 3      | 6      | 1      |
| Skenario Integrasi | 15         | 5      | 8      | 2      | 0      |
| **TOTAL**          | **152**    | **40** | **57** | **46** | **9**  |

---

## Prioritas Eksekusi

### Phase 1: Critical Path (Prioritas Kritis)

1. Autentikasi (login/logout)
2. Transaction lifecycle (create → submit → approve → complete)
3. Role-based access control
4. Financial calculations accuracy
5. Data integrity

### Phase 2: Core Features (Prioritas Tinggi)

1. CRUD operations (Armada, Sopir, Paket, User)
2. Edit request workflow
3. Expense management
4. Report generation
5. Audit logging

### Phase 3: Extended Features (Prioritas Sedang)

1. Filters dan search
2. Pagination
3. File upload/download
4. Export functionality
5. Status management

### Phase 4: Nice to Have (Prioritas Rendah)

1. UI/UX enhancements
2. Performance optimization
3. Additional validations

---

## Test Data Requirements

### Users

- 2 Admin users (admin, superadmin)
- 2 Operator users (operator, operator2)

### Armada

- 10 vehicles dengan berbagai status
- Mix: Avanza, Innova, Fortuner, Xenia, dll

### Sopir

- 8 drivers dengan berbagai status
- Mix: Available, Booked, On Trip, Off Duty

### Paket Jasa

- 2 Sewa Mobil packages
- 2 Paket Wisata (dengan hotel tiers)
- 2 Full Day packages
- 1 Custom package

### Transaksi

- 20+ transactions dengan berbagai status
- Mix: Draft, Pending, Approved, Completed
- Include: overtime cases, different packages

### Pengeluaran

- 15+ expense records
- Mix categories: BBM, Maintenance, Gaji, dll
- Include: dengan dan tanpa lampiran

### Staff

- 5 staff members
- Mix: Active, Inactive

---

## Test Environment Setup

### Prerequisites

1. Database PostgreSQL dengan data seed lengkap
2. MinIO storage configured
3. Email service configured (untuk reset password)
4. Development server running (localhost:3000)

### Seed Commands

```bash
npm run db:reset           # Reset database
npm run db:migrate         # Run migrations
npm run db:seed-complete   # Seed comprehensive data
```

### Browser Setup

- Chrome/Edge (latest version)
- Clear cache before testing
- Enable DevTools for debugging
- Multiple browser profiles untuk multi-user testing

---

## Reporting Template

### Test Execution Report

```
Test Case ID: TC-XXX-XXX
Test Name: [Name]
Priority: [Kritis/Tinggi/Sedang/Rendah]
Role: [ADMIN/OPERATOR]
Status: [PASS/FAIL/BLOCKED]
Execution Date: [Date]
Tester: [Name]

Steps Executed:
1. [Step 1] - [Result]
2. [Step 2] - [Result]
...

Expected Results:
- [Expected 1] - [✅ Pass / ❌ Fail]
- [Expected 2] - [✅ Pass / ❌ Fail]
...

Actual Results:
[Description]

Screenshots:
[Attach if applicable]

Defects Found:
[Bug ID if any]

Notes:
[Additional observations]
```

---

## Defect Reporting Template

```
Defect ID: BUG-XXX
Title: [Short description]
Severity: [Critical/High/Medium/Low]
Priority: [P1/P2/P3/P4]
Module: [Module name]
Found in Test Case: TC-XXX-XXX

Steps to Reproduce:
1. [Step 1]
2. [Step 2]
...

Expected Result:
[What should happen]

Actual Result:
[What actually happened]

Environment:
- Browser: [Chrome/Edge/Firefox]
- OS: [Windows/Mac/Linux]
- Version: [App version]

Screenshots/Videos:
[Attach]

Logs:
[Console errors, server logs]

Additional Info:
[Any other relevant information]
```

---

**Dokumen ini mencakup 150+ test case komprehensif yang meliputi semua flow data untuk role Admin dan Operator, termasuk happy path, error handling, validasi, security, dan skenario integrasi end-to-end.**

**Versi**: 2.0  
**Tanggal**: 23 November 2025  
**Status**: Ready for Execution
