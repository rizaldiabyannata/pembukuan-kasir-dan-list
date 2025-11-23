# Kasus Uji E2E - Pembukuan Kasir & List

## Informasi Dokumen

**Versi**: 1.0  
**Terakhir Diperbarui**: 19 November 2025  
**Tujuan**: Kasus uji end-to-end komprehensif yang mencakup semua fitur dan kondisi edge case

## Persiapan Lingkungan Pengujian

### Prasyarat

- Database PostgreSQL berjalan
- Penyimpanan MinIO terkonfigurasi
- Akun pengguna uji dibuat (role ADMIN dan OPERATOR)
- Data sampel telah di-seed
- Aplikasi berjalan di localhost:3000

### Kebutuhan Data Uji

- Minimal 2 kendaraan (status berbeda)
- Minimal 2 sopir (status berbeda)
- Minimal 3 paket layanan (tipe berbeda)
- Minimal 1 anggota staff
- Akun email uji untuk reset password

---

## 1. Autentikasi & Otorisasi

### TC-AUTH-001: Login Admin Berhasil

**Prioritas**: Kritis  
**Role**: N/A  
**Prakondisi**: Kredensial admin valid tersedia

**Langkah-langkah**:

1. Navigasi ke halaman login (/)
2. Masukkan email admin yang valid
3. Masukkan password admin yang valid
4. Klik tombol "Masuk"

**Hasil yang Diharapkan**:

- Redirect ke /dashboard
- Cookie sesi dibuat
- Menu pengguna menampilkan nama dan role admin
- Semua item menu terlihat (Dashboard, Transaksi, Armada, Sopir, Paket, Pengeluaran, Laporan, Staff, Users, Audit)

**Data Uji**:

- Email: admin@rental.com
- Password: password123

---

### TC-AUTH-002: Login Operator Berhasil

**Prioritas**: Kritis  
**Role**: N/A  
**Prakondisi**: Kredensial operator valid tersedia

**Langkah-langkah**:

1. Navigasi ke halaman login (/)
2. Masukkan email operator yang valid
3. Masukkan password operator yang valid
4. Klik tombol "Masuk"

**Hasil yang Diharapkan**:

- Redirect ke /dashboard
- Cookie sesi dibuat
- Menu pengguna menampilkan nama dan role operator
- Item menu terbatas terlihat (Dashboard, Transaksi, Armada, Sopir, Paket, Pengeluaran, Staff)
- Menu Laporan, Users, dan Audit TIDAK terlihat

**Data Uji**:

- Email: operator@rental.com
- Password: password123

---

### TC-AUTH-003: Login dengan Kredensial Tidak Valid

**Prioritas**: Tinggi  
**Role**: N/A

**Langkah-langkah**:

1. Navigasi ke halaman login
2. Masukkan email atau password yang salah
3. Klik tombol "Masuk"

**Hasil yang Diharapkan**:

- Pesan error ditampilkan: "Email atau password salah"
- Pengguna tetap di halaman login
- Tidak ada sesi yang dibuat

---

### TC-AUTH-004: Login dengan Field Kosong

**Prioritas**: Sedang  
**Role**: N/A

**Langkah-langkah**:

1. Navigasi ke halaman login
2. Biarkan field email dan password kosong
3. Klik tombol "Masuk"

**Hasil yang Diharapkan**:

- Error validasi ditampilkan
- Pengiriman form dicegah
- Tidak ada panggilan API

---

### TC-AUTH-005: Logout Berhasil

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Login sebagai pengguna mana saja
2. Klik menu pengguna di sidebar
3. Klik tombol "Keluar"

**Hasil yang Diharapkan**:

- Sesi dihancurkan
- Redirect ke halaman login (/)
- Tidak dapat mengakses route yang dilindungi tanpa login ulang

---

### TC-AUTH-006: Permintaan Reset Password

**Prioritas**: Tinggi  
**Role**: N/A

**Langkah-langkah**:

1. Navigasi ke /reset-password
2. Masukkan alamat email terdaftar
3. Klik tombol submit

**Hasil yang Diharapkan**:

- Pesan sukses ditampilkan
- Email dikirim dengan token reset
- Token valid untuk waktu terbatas

---

### TC-AUTH-007: Penyelesaian Reset Password

**Prioritas**: Tinggi  
**Role**: N/A  
**Prakondisi**: Token reset valid diterima

**Langkah-langkah**:

1. Klik link reset dari email
2. Navigasi ke /reset-password/new
3. Masukkan password baru (min 8 karakter)
4. Konfirmasi password baru
5. Submit form

**Hasil yang Diharapkan**:

- Password berhasil diperbarui
- Redirect ke halaman login
- Dapat login dengan password baru
- Password lama tidak berfungsi lagi

---

### TC-AUTH-008: Akses Tidak Sah - Operator ke Route Admin

**Prioritas**: Kritis  
**Role**: OPERATOR

**Langkah-langkah**:

1. Login sebagai operator
2. Coba akses /laporan langsung via URL
3. Coba akses /users langsung via URL
4. Coba akses /audit langsung via URL

**Hasil yang Diharapkan**:

- Akses ditolak (403 atau redirect)
- Pesan error ditampilkan
- Log audit dibuat untuk percobaan tidak sah

---

### TC-AUTH-009: Kadaluarsa Sesi

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Login berhasil
2. Tunggu timeout sesi
3. Coba lakukan aksi apapun

**Hasil yang Diharapkan**:

- Redirect ke halaman login
- Pesan sesi kadaluarsa
- Harus autentikasi ulang

---

## 2. Dashboard

### TC-DASH-001: Muat Dashboard Admin

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Login sebagai admin
2. Navigasi ke /dashboard

**Hasil yang Diharapkan**:

- Semua kartu statistik ditampilkan:
  - Total Pendapatan
  - Total Pengeluaran
  - Laba Bersih
  - Transaksi Aktif
- Grafik transaksi terlihat
- Grafik status armada terlihat
- Grafik performa sopir terlihat
- Widget paket teratas terlihat
- Semua data dimuat tanpa error

---

### TC-DASH-002: Muat Dashboard Operator

**Prioritas**: Tinggi  
**Role**: OPERATOR

**Langkah-langkah**:

1. Login sebagai operator
2. Navigasi ke /dashboard

**Hasil yang Diharapkan**:

- Kartu statistik ditampilkan (tanpa detail finansial)
- Grafik transaksi terlihat
- Grafik status armada terlihat
- Tidak ada data finansial sensitif yang terekspos

---

### TC-DASH-003: Filter Periode Dashboard

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke dashboard
2. Pilih periode berbeda (7 hari, 30 hari, 90 hari, 1 tahun)
3. Amati pembaruan data

**Hasil yang Diharapkan**:

- Grafik dan statistik diperbarui berdasarkan periode yang dipilih
- Data difilter dengan benar
- Tidak ada error loading

---

## 3. Manajemen Transaksi

### TC-TRANS-001: Buat Transaksi Baru - Paket Sewa Mobil

**Prioritas**: Kritis  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke /transaksi
2. Klik tombol "Tambah Transaksi"
3. Isi detail pelanggan:
   - Nama Pelanggan: "John Doe"
   - No. Telepon: "081234567890"
4. Pilih tipe paket: "Sewa Mobil"
5. Pilih paket layanan dari dropdown
6. Pilih kendaraan (status READY)
7. Pilih sopir (status AVAILABLE)
8. Set tanggal checkout (tanggal masa depan)
9. Set tanggal checkin (setelah checkout)
10. Masukkan tujuan: "Bandung"
11. Klik tombol "Simpan"

**Hasil yang Diharapkan**:

- Transaksi dibuat dengan status DRAFT
- Transaksi muncul di tabel
- Status kendaraan tidak berubah (masih READY)
- Status sopir tidak berubah (masih AVAILABLE)
- Notifikasi toast sukses
- Form direset

---

### TC-TRANS-002: Buat Transaksi - Paket Wisata dengan Hotel

**Prioritas**: Kritis  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Klik "Tambah Transaksi"
2. Isi detail pelanggan
3. Pilih tipe paket: "Paket Wisata"
4. Pilih paket wisata
5. Masukkan jumlah penumpang: 4
6. Pilih tier hotel: "Bintang 3"
7. Pilih kendaraan dan sopir
8. Set tanggal
9. Masukkan tujuan
10. Submit form

**Hasil yang Diharapkan**:

- Transaksi dibuat
- Harga dihitung berdasarkan: harga dasar + (penumpang × harga tier hotel)
- Semua detail tersimpan dengan benar

---

### TC-TRANS-003: Buat Transaksi - Paket Full Day

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Klik "Tambah Transaksi"
2. Isi detail pelanggan
3. Pilih tipe paket: "Full Day"
4. Pilih paket full day
5. Masukkan durasi dalam hari: 3
6. Pilih kendaraan dan sopir
7. Set tanggal
8. Submit form

**Hasil yang Diharapkan**:

- Transaksi dibuat
- Harga dihitung: harga dasar × durasi
- Durasi tersimpan dengan benar

---

### TC-TRANS-004: Buat Transaksi - Harga Custom

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Klik "Tambah Transaksi"
2. Isi detail pelanggan
3. Pilih tipe paket: "Custom"
4. Masukkan harga custom: 5000000
5. Pilih kendaraan dan sopir
6. Set tanggal
7. Masukkan tujuan
8. Submit form

**Hasil yang Diharapkan**:

- Transaksi dibuat dengan harga custom
- Tidak ada perhitungan harga otomatis
- Harga custom tersimpan sesuai input

---

### TC-TRANS-005: Submit Transaksi untuk Persetujuan

**Prioritas**: Kritis  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Buat transaksi (status DRAFT)
2. Klik aksi "Submit" pada transaksi
3. Konfirmasi pengiriman

**Hasil yang Diharapkan**:

- Status berubah dari DRAFT ke PENDING
- Status kendaraan berubah ke BOOKED
- Status sopir berubah ke BOOKED
- Tidak dapat edit detail transaksi
- Log audit dibuat

---

### TC-TRANS-006: Setujui Transaksi

**Prioritas**: Kritis  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke transaksi dengan status PENDING
2. Klik aksi "Approve"
3. Konfirmasi persetujuan

**Hasil yang Diharapkan**:

- Status berubah ke APPROVED
- Status kendaraan berubah ke ON_TRIP
- Status sopir berubah ke ON_TRIP
- Timestamp persetujuan tercatat
- Log audit dibuat

---

### TC-TRANS-007: Tolak Transaksi

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke transaksi dengan status PENDING
2. Klik aksi "Reject"
3. Masukkan alasan penolakan
4. Konfirmasi penolakan

**Hasil yang Diharapkan**:

- Status kembali ke DRAFT
- Status kendaraan kembali ke READY
- Status sopir kembali ke AVAILABLE
- Alasan penolakan tersimpan
- Log audit dibuat

---

### TC-TRANS-008: Selesaikan Transaksi

**Prioritas**: Kritis  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke transaksi dengan status APPROVED
2. Klik aksi "Complete"
3. Masukkan waktu checkin aktual
4. Masukkan penggunaan BBM aktual (liter)
5. Masukkan jam overtime (jika ada)
6. Konfirmasi penyelesaian

**Hasil yang Diharapkan**:

- Status berubah ke COMPLETED
- Status kendaraan kembali ke READY
- Status sopir kembali ke AVAILABLE
- Waktu aktual tercatat
- Biaya overtime dihitung jika berlaku
- Harga final diperbarui
- Profit dihitung
- Log audit dibuat

---

### TC-TRANS-009: Selesaikan Transaksi dengan Overtime

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR  
**Prakondisi**: Transaksi disetujui, checkin aktual > checkin rencana

**Langkah-langkah**:

1. Klik "Complete" pada transaksi yang disetujui
2. Masukkan waktu checkin aktual (terlambat 2 jam)
3. Masukkan penggunaan BBM
4. Sistem menghitung overtime: 2 jam
5. Konfirmasi penyelesaian

**Hasil yang Diharapkan**:

- Jam overtime: 2
- Biaya overtime ditambahkan ke harga final
- Biaya overtime = 2 × tarif overtime paket
- Harga final = harga dasar + biaya overtime
- Profit dihitung ulang

---

### TC-TRANS-010: Edit Transaksi Draft

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke transaksi dengan status DRAFT
2. Klik aksi "Edit"
3. Ubah nama pelanggan
4. Ganti kendaraan
5. Perbarui tujuan
6. Simpan perubahan

**Hasil yang Diharapkan**:

- Perubahan tersimpan dengan sukses
- Transaksi tetap dalam status DRAFT
- Data yang diperbarui ditampilkan
- Log audit dibuat

---

### TC-TRANS-011: Minta Edit untuk Transaksi yang Disetujui

**Prioritas**: Tinggi  
**Role**: OPERATOR

**Langkah-langkah**:

1. Navigasi ke transaksi yang disetujui
2. Klik aksi "Request Edit"
3. Masukkan alasan permintaan edit
4. Submit permintaan

**Hasil yang Diharapkan**:

- Permintaan edit dibuat dengan status PENDING
- Transaksi asli tidak berubah
- Admin diberitahu (jika sistem notifikasi ada)
- Log audit dibuat

---

### TC-TRANS-012: Setujui Permintaan Edit

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke transaksi dengan permintaan edit pending
2. Review detail permintaan edit
3. Klik aksi "Approve Edit"
4. Konfirmasi persetujuan

**Hasil yang Diharapkan**:

- Transaksi dibuka untuk editing
- Status permintaan edit: APPROVED
- Operator sekarang dapat edit transaksi
- Log audit dibuat

---

### TC-TRANS-013: Tolak Permintaan Edit

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke transaksi dengan permintaan edit pending
2. Klik aksi "Reject Edit"
3. Masukkan alasan penolakan
4. Konfirmasi penolakan

**Hasil yang Diharapkan**:

- Status permintaan edit: REJECTED
- Transaksi tetap terkunci
- Alasan penolakan tersimpan
- Log audit dibuat

---

### TC-TRANS-014: Hapus Transaksi Draft

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke transaksi dengan status DRAFT
2. Klik aksi "Delete"
3. Konfirmasi penghapusan

**Hasil yang Diharapkan**:

- Transaksi dihapus dari database
- Dihapus dari daftar transaksi
- Log audit dibuat

---

### TC-TRANS-015: Tidak Dapat Hapus Transaksi Non-Draft

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke transaksi dengan status PENDING/APPROVED/COMPLETED
2. Coba hapus

**Hasil yang Diharapkan**:

- Aksi hapus tidak tersedia atau dinonaktifkan
- Pesan error jika dicoba via API
- Transaksi tetap di database

---

### TC-TRANS-016: Filter Transaksi berdasarkan Status

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke /transaksi
2. Pilih filter status: "PENDING"
3. Terapkan filter

**Hasil yang Diharapkan**:

- Hanya transaksi PENDING yang ditampilkan
- Jumlah sesuai hasil filter
- Status lain tersembunyi

---

### TC-TRANS-017: Filter Transaksi berdasarkan Rentang Tanggal

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke /transaksi
2. Pilih tanggal mulai: 2025-01-01
3. Pilih tanggal akhir: 2025-01-31
4. Terapkan filter

**Hasil yang Diharapkan**:

- Hanya transaksi dalam rentang tanggal yang ditampilkan
- Tanggal difilter berdasarkan checkout_datetime
- Hasil akurat

---

### TC-TRANS-018: Cari Transaksi berdasarkan Nama Pelanggan

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke /transaksi
2. Masukkan nama pelanggan di pencarian: "John"
3. Tekan Enter atau klik cari

**Hasil yang Diharapkan**:

- Transaksi dengan nama pelanggan yang cocok ditampilkan
- Pencarian parsial didukung
- Pencarian tidak case-sensitive

---

### TC-TRANS-019: Lihat Detail Transaksi

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke /transaksi
2. Klik pada baris transaksi atau tombol "Detail"

**Hasil yang Diharapkan**:

- Modal/halaman terbuka dengan detail transaksi lengkap:
  - Informasi pelanggan
  - Detail paket
  - Informasi kendaraan dan sopir
  - Tanggal dan waktu
  - Rincian harga
  - Riwayat status
  - Informasi persetujuan

---

### TC-TRANS-020: Cetak Kwitansi Transaksi

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke transaksi yang selesai
2. Klik tombol "Cetak"
3. Navigasi ke /transaksi/cetak/[id]

**Hasil yang Diharapkan**:

- Halaman ramah cetak terbuka
- Semua detail transaksi ditampilkan
- Informasi perusahaan disertakan
- Diformat untuk kertas A4
- Dialog cetak browser dapat dipicu

---

### TC-TRANS-021: Paginasi pada Daftar Transaksi

**Prioritas**: Rendah  
**Role**: ADMIN/OPERATOR  
**Prakondisi**: Lebih dari 10 transaksi ada

**Langkah-langkah**:

1. Navigasi ke /transaksi
2. Amati kontrol paginasi
3. Klik halaman "Next"
4. Klik halaman "Previous"

**Hasil yang Diharapkan**:

- 10 transaksi per halaman (default)
- Kontrol paginasi berfungsi
- Nomor halaman akurat
- Data dimuat dengan benar saat ganti halaman

---

### TC-TRANS-022: Validasi - Field Wajib Kosong

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Klik "Tambah Transaksi"
2. Biarkan field wajib kosong
3. Coba submit

**Hasil yang Diharapkan**:

- Error validasi ditampilkan untuk setiap field wajib
- Pengiriman form dicegah
- Pesan error dalam bahasa Indonesia
- Tidak ada panggilan API

---

### TC-TRANS-023: Validasi - Nomor Telepon Tidak Valid

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Klik "Tambah Transaksi"
2. Masukkan nomor telepon tidak valid (misal: "123")
3. Coba submit

**Hasil yang Diharapkan**:

- Error validasi: "Nomor telepon tidak valid"
- Pengiriman form dicegah

---

### TC-TRANS-024: Validasi - Checkin Sebelum Checkout

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Klik "Tambah Transaksi"
2. Set waktu checkout: 2025-12-01 10:00
3. Set waktu checkin: 2025-11-30 10:00 (sebelum checkout)
4. Coba submit

**Hasil yang Diharapkan**:

- Error validasi: "Checkin harus setelah checkout"
- Pengiriman form dicegah

---

### TC-TRANS-025: Validasi - Kendaraan Sudah Dibooking

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR  
**Prakondisi**: Kendaraan sudah ditugaskan ke transaksi yang overlap

**Langkah-langkah**:

1. Buat transaksi dengan Kendaraan A, tanggal 1-5 Des
2. Coba buat transaksi lain dengan Kendaraan A, tanggal 3-7 Des
3. Submit form

**Hasil yang Diharapkan**:

- Error validasi: "Kendaraan sudah dibooking untuk tanggal tersebut"
- Pengiriman form dicegah
- Deteksi konflik berfungsi

---

### TC-TRANS-026: Validasi - Sopir Sudah Dibooking

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR  
**Prakondisi**: Sopir sudah ditugaskan ke transaksi yang overlap

**Langkah-langkah**:

1. Buat transaksi dengan Sopir A, tanggal 1-5 Des
2. Coba buat transaksi lain dengan Sopir A, tanggal 3-7 Des
3. Submit form

**Hasil yang Diharapkan**:

- Error validasi: "Sopir sudah dibooking untuk tanggal tersebut"
- Pengiriman form dicegah

---

## 4. Manajemen Armada

### TC-FLEET-001: Lihat Daftar Armada

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke /armada

**Hasil yang Diharapkan**:

- Semua kendaraan ditampilkan dalam layout kartu/grid
- Setiap kartu menampilkan:
  - Nama kendaraan
  - Plat nomor
  - Tipe
  - Kapasitas
  - Badge status (READY/BOOKED/ON_TRIP/MAINTENANCE)
- Warna status benar (hijau/kuning/biru/merah)

---

### TC-FLEET-002: Tambah Kendaraan Baru

**Prioritas**: Kritis  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke /armada
2. Klik tombol "Tambah Armada"
3. Isi detail:
   - Nama: "Toyota Avanza 2023"
   - Plat Nomor: "B 1234 XYZ"
   - Jenis: "MPV"
   - Kapasitas: 7
   - Status: "READY"
4. Klik "Simpan"

**Hasil yang Diharapkan**:

- Kendaraan berhasil dibuat
- Muncul di daftar armada
- Notifikasi toast sukses
- Form direset
- Log audit dibuat

---

### TC-FLEET-003: Edit Detail Kendaraan

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke /armada
2. Klik "Edit" pada kendaraan mana saja
3. Ubah nama kendaraan
4. Ubah kapasitas
5. Simpan perubahan

**Hasil yang Diharapkan**:

- Perubahan tersimpan dengan sukses
- Data yang diperbarui ditampilkan
- Log audit dibuat

---

### TC-FLEET-004: Hapus Kendaraan

**Prioritas**: Sedang  
**Role**: ADMIN  
**Prakondisi**: Kendaraan tidak ditugaskan ke transaksi aktif

**Langkah-langkah**:

1. Navigasi ke /armada
2. Klik "Delete" pada kendaraan
3. Konfirmasi penghapusan

**Hasil yang Diharapkan**:

- Kendaraan dihapus dari database
- Dihapus dari daftar armada
- Log audit dibuat

---

### TC-FLEET-005: Tidak Dapat Hapus Kendaraan dengan Transaksi Aktif

**Prioritas**: Tinggi  
**Role**: ADMIN  
**Prakondisi**: Kendaraan ditugaskan ke transaksi PENDING/APPROVED

**Langkah-langkah**:

1. Navigasi ke /armada
2. Coba hapus kendaraan dengan transaksi aktif
3. Konfirmasi penghapusan

**Hasil yang Diharapkan**:

- Pesan error: "Tidak dapat menghapus kendaraan yang sedang digunakan"
- Kendaraan tetap di database
- Penghapusan dicegah

---

### TC-FLEET-006: Ubah Status Kendaraan ke Maintenance

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke /armada
2. Klik "Edit" pada kendaraan dengan status READY
3. Ubah status ke "MAINTENANCE"
4. Simpan perubahan

**Hasil yang Diharapkan**:

- Status diperbarui ke MAINTENANCE
- Kendaraan tidak tersedia untuk booking baru
- Badge status menampilkan warna merah
- Log audit dibuat

---

### TC-FLEET-007: Filter Armada berdasarkan Status

**Prioritas**: Rendah  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke /armada
2. Pilih filter status: "READY"
3. Terapkan filter

**Hasil yang Diharapkan**:

- Hanya kendaraan READY yang ditampilkan
- Status lain tersembunyi
- Jumlah akurat

---

### TC-FLEET-008: Filter Armada berdasarkan Tipe

**Prioritas**: Rendah  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke /armada
2. Pilih filter tipe: "MPV"
3. Terapkan filter

**Hasil yang Diharapkan**:

- Hanya kendaraan MPV yang ditampilkan
- Tipe lain tersembunyi

---

### TC-FLEET-009: Cari Armada berdasarkan Nama atau Plat

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke /armada
2. Masukkan kata pencarian: "Avanza"
3. Tekan Enter

**Hasil yang Diharapkan**:

- Kendaraan yang cocok dengan nama atau plat ditampilkan
- Pencarian parsial didukung
- Tidak case-sensitive

---

### TC-FLEET-010: Validasi - Plat Nomor Duplikat

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Tambah Armada"
2. Masukkan plat nomor yang sudah ada
3. Isi field lain
4. Submit form

**Hasil yang Diharapkan**:

- Error validasi: "Plat nomor sudah terdaftar"
- Pengiriman form dicegah

---

### TC-FLEET-011: Validasi - Kapasitas Tidak Valid

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Tambah Armada"
2. Masukkan kapasitas: 0 atau angka negatif
3. Coba submit

**Hasil yang Diharapkan**:

- Error validasi: "Kapasitas harus lebih dari 0"
- Pengiriman form dicegah

---

## 5. Manajemen Sopir

### TC-DRIVER-001: Lihat Daftar Sopir

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke /sopir

**Hasil yang Diharapkan**:

- Semua sopir ditampilkan dalam layout kartu
- Setiap kartu menampilkan:
  - Nama sopir
  - Nomor telepon
  - Nomor SIM
  - Badge status (AVAILABLE/BOOKED/ON_TRIP/OFF_DUTY)
- Warna status benar

---

### TC-DRIVER-002: Tambah Sopir Baru

**Prioritas**: Kritis  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke /sopir
2. Klik tombol "Tambah Sopir"
3. Isi detail:
   - Nama: "Ahmad Suryadi"
   - No. Telepon: "081234567890"
   - No. SIM: "1234567890123456"
   - Status: "AVAILABLE"
4. Klik "Simpan"

**Hasil yang Diharapkan**:

- Sopir berhasil dibuat
- Muncul di daftar sopir
- Notifikasi toast sukses
- Log audit dibuat

---

### TC-DRIVER-003: Edit Detail Sopir

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke /sopir
2. Klik "Edit" pada sopir mana saja
3. Ubah nomor telepon
4. Simpan perubahan

**Hasil yang Diharapkan**:

- Perubahan tersimpan dengan sukses
- Data yang diperbarui ditampilkan
- Log audit dibuat

---

### TC-DRIVER-004: Hapus Sopir

**Prioritas**: Sedang  
**Role**: ADMIN  
**Prakondisi**: Sopir tidak ditugaskan ke transaksi aktif

**Langkah-langkah**:

1. Navigasi ke /sopir
2. Klik "Delete" pada sopir
3. Konfirmasi penghapusan

**Hasil yang Diharapkan**:

- Sopir dihapus dari database
- Dihapus dari daftar sopir
- Log audit dibuat

---

### TC-DRIVER-005: Tidak Dapat Hapus Sopir dengan Transaksi Aktif

**Prioritas**: Tinggi  
**Role**: ADMIN  
**Prakondisi**: Sopir ditugaskan ke transaksi PENDING/APPROVED

**Langkah-langkah**:

1. Navigasi ke /sopir
2. Coba hapus sopir dengan transaksi aktif
3. Konfirmasi penghapusan

**Hasil yang Diharapkan**:

- Pesan error: "Tidak dapat menghapus sopir yang sedang bertugas"
- Sopir tetap di database
- Penghapusan dicegah

---

### TC-DRIVER-006: Ubah Status Sopir ke Off Duty

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke /sopir
2. Klik "Edit" pada sopir dengan status AVAILABLE
3. Ubah status ke "OFF_DUTY"
4. Simpan perubahan

**Hasil yang Diharapkan**:

- Status diperbarui ke OFF_DUTY
- Sopir tidak tersedia untuk booking baru
- Badge status diperbarui
- Log audit dibuat

---

### TC-DRIVER-007: Filter Sopir berdasarkan Status

**Prioritas**: Rendah  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke /sopir
2. Pilih filter status: "AVAILABLE"
3. Terapkan filter

**Hasil yang Diharapkan**:

- Hanya sopir AVAILABLE yang ditampilkan
- Status lain tersembunyi

---

### TC-DRIVER-008: Cari Sopir berdasarkan Nama

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke /sopir
2. Masukkan kata pencarian: "Ahmad"
3. Tekan Enter

**Hasil yang Diharapkan**:

- Sopir yang cocok dengan nama ditampilkan
- Pencarian parsial didukung
- Tidak case-sensitive

---

### TC-DRIVER-009: Validasi - Nomor SIM Duplikat

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Tambah Sopir"
2. Masukkan nomor SIM yang sudah ada
3. Isi field lain
4. Submit form

**Hasil yang Diharapkan**:

- Error validasi: "Nomor SIM sudah terdaftar"
- Pengiriman form dicegah

---

### TC-DRIVER-010: Validasi - Nomor Telepon Tidak Valid

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Tambah Sopir"
2. Masukkan nomor telepon tidak valid
3. Coba submit

**Hasil yang Diharapkan**:

- Error validasi ditampilkan
- Pengiriman form dicegah

---

## 6. Manajemen Paket Layanan

### TC-PKG-001: Lihat Daftar Paket

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke /paket

**Hasil yang Diharapkan**:

- Semua paket ditampilkan dalam layout list/kartu
- Setiap paket menampilkan:
  - Nama paket
  - Tipe (Sewa Mobil/Paket Wisata/Full Day/Custom)
  - Harga dasar
  - Durasi (jika berlaku)
  - Daftar hotel (jika paket wisata)

---

### TC-PKG-002: Tambah Paket Sewa Mobil

**Prioritas**: Kritis  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke /paket
2. Klik tombol "Tambah Paket"
3. Isi detail:
   - Nama Paket: "Sewa Mobil Harian"
   - Jenis: "Sewa Mobil"
   - Harga: 500000
   - Durasi: 1 (hari)
   - Tarif Overtime: 50000 (per jam)
4. Klik "Simpan"

**Hasil yang Diharapkan**:

- Paket berhasil dibuat
- Muncul di daftar paket
- Notifikasi toast sukses
- Log audit dibuat

---

### TC-PKG-003: Tambah Paket Wisata dengan Hotel

**Prioritas**: Kritis  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Tambah Paket"
2. Isi detail:
   - Nama Paket: "Paket Wisata Bandung"
   - Jenis: "Paket Wisata"
   - Harga: 2000000 (harga dasar)
3. Tambah tier hotel:
   - Bintang 2: 200000
   - Bintang 3: 350000
   - Bintang 4: 500000
   - Bintang 5: 750000
4. Klik "Simpan"

**Hasil yang Diharapkan**:

- Paket dibuat dengan harga hotel
- Tier hotel tersimpan dengan benar
- Paket muncul di daftar
- Log audit dibuat

---

### TC-PKG-004: Tambah Paket Full Day

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Tambah Paket"
2. Isi detail:
   - Nama Paket: "Full Day Trip"
   - Jenis: "Full Day"
   - Harga: 800000 (per hari)
   - Durasi: 1
3. Klik "Simpan"

**Hasil yang Diharapkan**:

- Paket berhasil dibuat
- Harga berbasis durasi terkonfigurasi
- Paket muncul di daftar

---

### TC-PKG-005: Edit Detail Paket

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke /paket
2. Klik "Edit" pada paket mana saja
3. Ubah nama paket
4. Ubah harga dasar
5. Simpan perubahan

**Hasil yang Diharapkan**:

- Perubahan tersimpan dengan sukses
- Data yang diperbarui ditampilkan
- Log audit dibuat

---

### TC-PKG-006: Edit Hotel Paket Wisata

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Edit" pada paket wisata
2. Ubah harga tier hotel
3. Tambah tier hotel baru
4. Hapus tier hotel yang ada
5. Simpan perubahan

**Hasil yang Diharapkan**:

- Harga hotel diperbarui
- Tier baru ditambahkan
- Tier yang dihapus terhapus
- Perubahan tercermin di transaksi

---

### TC-PKG-007: Hapus Paket

**Prioritas**: Sedang  
**Role**: ADMIN  
**Prakondisi**: Paket tidak digunakan di transaksi mana pun

**Langkah-langkah**:

1. Navigasi ke /paket
2. Klik "Delete" pada paket
3. Konfirmasi penghapusan

**Hasil yang Diharapkan**:

- Paket dihapus dari database
- Dihapus dari daftar paket
- Log audit dibuat

---

### TC-PKG-008: Tidak Dapat Hapus Paket yang Digunakan di Transaksi

**Prioritas**: Tinggi  
**Role**: ADMIN  
**Prakondisi**: Paket digunakan di transaksi yang ada

**Langkah-langkah**:

1. Navigasi ke /paket
2. Coba hapus paket yang digunakan di transaksi
3. Konfirmasi penghapusan

**Hasil yang Diharapkan**:

- Pesan error: "Tidak dapat menghapus paket yang sudah digunakan"
- Paket tetap di database
- Penghapusan dicegah

---

### TC-PKG-009: Lihat Detail Paket

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke /paket
2. Klik pada paket untuk melihat detail

**Hasil yang Diharapkan**:

- Modal/halaman terbuka dengan detail paket lengkap
- Semua informasi harga ditampilkan
- Tier hotel ditampilkan (jika berlaku)
- Statistik penggunaan (jika tersedia)

---

### TC-PKG-010: Filter Paket berdasarkan Tipe

**Prioritas**: Rendah  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke /paket
2. Pilih filter tipe: "Paket Wisata"
3. Terapkan filter

**Hasil yang Diharapkan**:

- Hanya paket wisata yang ditampilkan
- Tipe lain tersembunyi

---

### TC-PKG-011: Cari Paket berdasarkan Nama

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke /paket
2. Masukkan kata pencarian: "Bandung"
3. Tekan Enter

**Hasil yang Diharapkan**:

- Paket yang cocok dengan nama ditampilkan
- Pencarian parsial didukung
- Tidak case-sensitive

---

### TC-PKG-012: Validasi - Field Wajib Kosong

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Tambah Paket"
2. Biarkan field wajib kosong
3. Coba submit

**Hasil yang Diharapkan**:

- Error validasi ditampilkan
- Pengiriman form dicegah

---

### TC-PKG-013: Validasi - Harga Tidak Valid

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Tambah Paket"
2. Masukkan harga negatif
3. Coba submit

**Hasil yang Diharapkan**:

- Error validasi: "Harga harus lebih dari 0"
- Pengiriman form dicegah

---

### TC-PKG-014: Validasi - Paket Wisata Tanpa Hotel

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Tambah Paket"
2. Pilih tipe: "Paket Wisata"
3. Jangan tambahkan tier hotel
4. Coba submit

**Hasil yang Diharapkan**:

- Error validasi: "Paket wisata harus memiliki minimal 1 tier hotel"
- Pengiriman form dicegah

---

## 7. Manajemen Pengeluaran

### TC-EXP-001: Lihat Daftar Pengeluaran

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke /pengeluaran

**Hasil yang Diharapkan**:

- Semua pengeluaran ditampilkan dalam tabel
- Setiap baris menampilkan:
  - Tanggal
  - Kategori
  - Deskripsi
  - Jumlah
  - Status (jika ada workflow persetujuan)
  - Indikator lampiran

---

### TC-EXP-002: Tambah Pengeluaran Baru

**Prioritas**: Kritis  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke /pengeluaran
2. Klik tombol "Tambah Pengeluaran"
3. Isi detail:
   - Tanggal: 2025-11-15
   - Kategori: "BBM"
   - Deskripsi: "Isi bensin Avanza"
   - Jumlah: 500000
4. Klik "Simpan"

**Hasil yang Diharapkan**:

- Pengeluaran berhasil dibuat
- Muncul di daftar pengeluaran
- Notifikasi toast sukses
- Log audit dibuat

---

### TC-EXP-003: Tambah Pengeluaran dengan Lampiran File

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Klik "Tambah Pengeluaran"
2. Isi detail pengeluaran
3. Klik tombol "Upload File"
4. Pilih file gambar (PNG/JPG)
5. Tunggu upload selesai
6. Submit form

**Hasil yang Diharapkan**:

- File terupload ke penyimpanan MinIO
- Referensi file tersimpan di database
- Pengeluaran dibuat dengan lampiran
- File dapat diakses via link download

---

### TC-EXP-004: Tambah Pengeluaran dengan Beberapa Lampiran

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Klik "Tambah Pengeluaran"
2. Isi detail pengeluaran
3. Upload beberapa file (2-3 file)
4. Submit form

**Hasil yang Diharapkan**:

- Semua file berhasil diupload
- Semua referensi file tersimpan
- Pengeluaran dibuat dengan beberapa lampiran

---

### TC-EXP-005: Edit Pengeluaran

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke /pengeluaran
2. Klik "Edit" pada pengeluaran mana saja
3. Ubah deskripsi
4. Ubah jumlah
5. Simpan perubahan

**Hasil yang Diharapkan**:

- Perubahan tersimpan dengan sukses
- Data yang diperbarui ditampilkan
- Log audit dibuat

---

### TC-EXP-006: Minta Edit untuk Pengeluaran yang Disetujui

**Prioritas**: Tinggi  
**Role**: OPERATOR

**Langkah-langkah**:

1. Navigasi ke pengeluaran yang disetujui
2. Klik aksi "Request Edit"
3. Masukkan alasan permintaan edit
4. Submit permintaan

**Hasil yang Diharapkan**:

- Permintaan edit dibuat dengan status PENDING
- Pengeluaran asli tidak berubah
- Admin diberitahu
- Log audit dibuat

---

### TC-EXP-007: Setujui Permintaan Edit

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke pengeluaran dengan permintaan edit pending
2. Review detail permintaan edit
3. Klik aksi "Approve Edit"
4. Konfirmasi persetujuan

**Hasil yang Diharapkan**:

- Pengeluaran dibuka untuk editing
- Status permintaan edit: APPROVED
- Operator sekarang dapat edit pengeluaran
- Log audit dibuat

---

### TC-EXP-008: Minta Hapus untuk Pengeluaran

**Prioritas**: Sedang  
**Role**: OPERATOR

**Langkah-langkah**:

1. Navigasi ke pengeluaran
2. Klik aksi "Request Delete"
3. Masukkan alasan penghapusan
4. Submit permintaan

**Hasil yang Diharapkan**:

- Permintaan hapus dibuat
- Pengeluaran ditandai untuk review penghapusan
- Admin diberitahu
- Log audit dibuat

---

### TC-EXP-009: Setujui Permintaan Hapus

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke pengeluaran dengan permintaan hapus pending
2. Review permintaan hapus
3. Klik aksi "Approve Delete"
4. Konfirmasi persetujuan

**Hasil yang Diharapkan**:

- Pengeluaran dihapus dari database
- File terkait dihapus dari penyimpanan
- Log audit dibuat

---

### TC-EXP-010: Hapus Pengeluaran

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke /pengeluaran
2. Klik "Delete" pada pengeluaran
3. Konfirmasi penghapusan

**Hasil yang Diharapkan**:

- Pengeluaran dihapus dari database
- File terkait dihapus dari MinIO
- Dihapus dari daftar pengeluaran
- Log audit dibuat

---

### TC-EXP-011: Lihat Detail Pengeluaran dengan Lampiran

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke /pengeluaran
2. Klik pada pengeluaran dengan lampiran
3. Lihat modal detail pengeluaran

**Hasil yang Diharapkan**:

- Semua detail pengeluaran ditampilkan
- Lampiran terdaftar dengan nama file
- Preview tersedia untuk gambar
- Link download berfungsi

---

### TC-EXP-012: Download Lampiran Pengeluaran

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Buka detail pengeluaran dengan lampiran
2. Klik link download pada lampiran
3. File terdownload

**Hasil yang Diharapkan**:

- File berhasil didownload
- Nama file benar
- File terbuka dengan benar
- Tidak ada korupsi

---

### TC-EXP-013: Hapus Lampiran Pengeluaran

**Prioritas**: Rendah  
**Role**: ADMIN

**Langkah-langkah**:

1. Buka detail pengeluaran dengan lampiran
2. Klik "Delete" pada lampiran
3. Konfirmasi penghapusan

**Hasil yang Diharapkan**:

- File dihapus dari penyimpanan MinIO
- Referensi file dihapus dari database
- Lampiran tidak lagi terlihat
- Log audit dibuat

---

### TC-EXP-014: Filter Pengeluaran berdasarkan Kategori

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke /pengeluaran
2. Pilih filter kategori: "BBM"
3. Terapkan filter

**Hasil yang Diharapkan**:

- Hanya pengeluaran BBM yang ditampilkan
- Kategori lain tersembunyi
- Total jumlah dihitung ulang untuk hasil filter

---

### TC-EXP-015: Filter Pengeluaran berdasarkan Rentang Tanggal

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke /pengeluaran
2. Pilih tanggal mulai: 2025-01-01
3. Pilih tanggal akhir: 2025-01-31
4. Terapkan filter

**Hasil yang Diharapkan**:

- Hanya pengeluaran dalam rentang tanggal yang ditampilkan
- Total jumlah dihitung ulang
- Hasil akurat

---

### TC-EXP-016: Cari Pengeluaran berdasarkan Deskripsi

**Prioritas**: Rendah  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke /pengeluaran
2. Masukkan kata pencarian: "bensin"
3. Tekan Enter

**Hasil yang Diharapkan**:

- Pengeluaran yang cocok dengan deskripsi ditampilkan
- Pencarian parsial didukung
- Tidak case-sensitive

---

### TC-EXP-017: Validasi - Field Wajib Kosong

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Klik "Tambah Pengeluaran"
2. Biarkan field wajib kosong
3. Coba submit

**Hasil yang Diharapkan**:

- Error validasi ditampilkan
- Pengiriman form dicegah

---

### TC-EXP-018: Validasi - Jumlah Tidak Valid

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Klik "Tambah Pengeluaran"
2. Masukkan jumlah negatif atau nol
3. Coba submit

**Hasil yang Diharapkan**:

- Error validasi: "Jumlah harus lebih dari 0"
- Pengiriman form dicegah

---

### TC-EXP-019: Validasi - Tipe File Tidak Valid

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Klik "Tambah Pengeluaran"
2. Coba upload tipe file yang tidak didukung (misal: .exe)
3. Coba submit

**Hasil yang Diharapkan**:

- Error validasi: "Tipe file tidak didukung"
- Upload dicegah
- Hanya gambar/PDF yang diizinkan

---

### TC-EXP-020: Validasi - Batas Ukuran File

**Prioritas**: Sedang  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Klik "Tambah Pengeluaran"
2. Coba upload file lebih besar dari batas (misal: 10MB)
3. Coba submit

**Hasil yang Diharapkan**:

- Error validasi: "Ukuran file terlalu besar"
- Upload dicegah
- Batas ukuran diterapkan

---

## 8. Laporan

### TC-RPT-001: Lihat Laporan Pemasukan

**Prioritas**: Kritis  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke /laporan
2. Pilih tab "Pemasukan"
3. Pilih rentang tanggal: 30 hari terakhir
4. Lihat laporan

**Hasil yang Diharapkan**:

- Laporan pemasukan ditampilkan dengan:
  - Total pemasukan
  - Pemasukan per tipe paket
  - Pemasukan per kendaraan
  - Jumlah transaksi
  - Nilai rata-rata transaksi
- Data akurat berdasarkan transaksi selesai

---

### TC-RPT-002: Lihat Laporan Pengeluaran

**Prioritas**: Kritis  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke /laporan
2. Pilih tab "Pengeluaran"
3. Pilih rentang tanggal: 30 hari terakhir
4. Lihat laporan

**Hasil yang Diharapkan**:

- Laporan pengeluaran ditampilkan dengan:
  - Total pengeluaran
  - Pengeluaran per kategori
  - Grafik tren pengeluaran
  - Kategori pengeluaran teratas
- Data akurat berdasarkan catatan pengeluaran

---

### TC-RPT-003: Lihat Laporan Laba/Rugi

**Prioritas**: Kritis  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke /laporan
2. Pilih tab "Laba Rugi"
3. Pilih rentang tanggal: 30 hari terakhir
4. Lihat laporan

**Hasil yang Diharapkan**:

- Laporan L/R ditampilkan dengan:
  - Total pemasukan
  - Total pengeluaran
  - Laba/rugi bersih
  - Persentase margin laba
  - Perbandingan dengan periode sebelumnya
- Perhitungan akurat

---

### TC-RPT-004: Lihat Laporan Kinerja

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke /laporan
2. Pilih tab "Kinerja"
3. Pilih rentang tanggal: 30 hari terakhir
4. Lihat laporan

**Hasil yang Diharapkan**:

- Laporan kinerja ditampilkan dengan:
  - Metrik performa sopir
  - Tingkat utilisasi kendaraan
  - Popularitas paket
  - Tingkat penyelesaian
- Data akurat

---

### TC-RPT-005: Lihat Laporan Analisis BBM

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke /laporan
2. Pilih tab "Analisis BBM"
3. Pilih rentang tanggal: 30 hari terakhir
4. Lihat laporan

**Hasil yang Diharapkan**:

- Laporan BBM ditampilkan dengan:
  - Total konsumsi BBM
  - Biaya BBM
  - Efisiensi BBM per kendaraan
  - Tren pengeluaran BBM
- Data dari transaksi selesai

---

### TC-RPT-006: Lihat Laporan Ringkasan Transaksi

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke /laporan
2. Pilih tab "Transaksi"
3. Pilih rentang tanggal: 30 hari terakhir
4. Lihat laporan

**Hasil yang Diharapkan**:

- Ringkasan transaksi ditampilkan dengan:
  - Total transaksi per status
  - Grafik tren transaksi
  - Durasi rata-rata transaksi
  - Statistik overtime
- Data akurat

---

### TC-RPT-007: Lihat Laporan Rekap

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke /laporan
2. Pilih tab "Rekap"
3. Pilih rentang tanggal: 30 hari terakhir
4. Lihat laporan

**Hasil yang Diharapkan**:

- Rekap komprehensif ditampilkan dengan:
  - Semua metrik kunci
  - Pemasukan vs pengeluaran
  - Statistik armada dan sopir
  - Indikator kesehatan bisnis keseluruhan

---

### TC-RPT-008: Export Laporan Pemasukan ke Excel

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke laporan pemasukan
2. Pilih rentang tanggal
3. Klik tombol "Export Excel"
4. File terdownload

**Hasil yang Diharapkan**:

- File Excel berhasil didownload
- File berisi semua data laporan
- Format terjaga
- File terbuka di Excel/LibreOffice

---

### TC-RPT-009: Filter Laporan berdasarkan Rentang Tanggal

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke tab laporan mana saja
2. Pilih rentang tanggal custom
3. Terapkan filter

**Hasil yang Diharapkan**:

- Data laporan diperbarui berdasarkan rentang tanggal
- Semua metrik dihitung ulang
- Grafik diperbarui sesuai
- Tidak ada error

---

### TC-RPT-010: Filter Laporan berdasarkan Kendaraan

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke laporan kinerja
2. Pilih kendaraan spesifik dari filter
3. Terapkan filter

**Hasil yang Diharapkan**:

- Laporan menampilkan data hanya untuk kendaraan yang dipilih
- Metrik spesifik untuk kendaraan tersebut
- Kendaraan lain dikecualikan

---

### TC-RPT-011: Filter Laporan berdasarkan Sopir

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke laporan kinerja
2. Pilih sopir spesifik dari filter
3. Terapkan filter

**Hasil yang Diharapkan**:

- Laporan menampilkan data hanya untuk sopir yang dipilih
- Metrik spesifik sopir ditampilkan
- Sopir lain dikecualikan

---

### TC-RPT-012: Operator Tidak Dapat Mengakses Laporan

**Prioritas**: Kritis  
**Role**: OPERATOR

**Langkah-langkah**:

1. Login sebagai operator
2. Coba akses /laporan via URL

**Hasil yang Diharapkan**:

- Akses ditolak (403 atau redirect)
- Pesan error ditampilkan
- Menu Laporan tidak terlihat di sidebar
- Log audit dibuat untuk percobaan tidak sah

---

### TC-RPT-013: Akurasi Data Laporan - Pemasukan

**Prioritas**: Kritis  
**Role**: ADMIN  
**Prakondisi**: Transaksi selesai yang diketahui ada

**Langkah-langkah**:

1. Catat jumlah transaksi selesai
2. Navigasi ke laporan pemasukan
3. Pilih rentang tanggal yang mencakup transaksi tersebut
4. Verifikasi total pemasukan

**Hasil yang Diharapkan**:

- Total pemasukan sesuai jumlah harga transaksi selesai
- Tidak ada transaksi draft/pending yang disertakan
- Perhitungan akurat

---

### TC-RPT-014: Akurasi Data Laporan - Pengeluaran

**Prioritas**: Kritis  
**Role**: ADMIN  
**Prakondisi**: Pengeluaran yang diketahui ada

**Langkah-langkah**:

1. Catat jumlah pengeluaran per kategori
2. Navigasi ke laporan pengeluaran
3. Pilih rentang tanggal yang mencakup pengeluaran tersebut
4. Verifikasi total

**Hasil yang Diharapkan**:

- Total pengeluaran sesuai jumlah catatan pengeluaran
- Rincian kategori akurat
- Tidak ada entri yang hilang atau duplikat

---

### TC-RPT-015: Akurasi Data Laporan - Laba

**Prioritas**: Kritis  
**Role**: ADMIN  
**Prakondisi**: Pemasukan dan pengeluaran yang diketahui ada

**Langkah-langkah**:

1. Hitung laba yang diharapkan: Pemasukan - Pengeluaran
2. Navigasi ke laporan L/R
3. Verifikasi laba bersih

**Hasil yang Diharapkan**:

- Laba bersih = Total Pemasukan - Total Pengeluaran
- Perhitungan akurat
- Persentase margin laba benar

---

## 9. Manajemen Staff

### TC-STAFF-001: Lihat Daftar Staff

**Prioritas**: Tinggi  
**Role**: ADMIN/OPERATOR

**Langkah-langkah**:

1. Navigasi ke /staff

**Hasil yang Diharapkan**:

- Semua anggota staff ditampilkan dalam layout kartu/tabel
- Setiap entri menampilkan:
  - Nama staff
  - Posisi
  - Nomor telepon
  - Gaji
  - Status (Aktif/Tidak Aktif)

---

### TC-STAFF-002: Tambah Anggota Staff Baru

**Prioritas**: Kritis  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke /staff
2. Klik tombol "Tambah Staff"
3. Isi detail:
   - Nama: "Budi Santoso"
   - Posisi: "Mekanik"
   - No. Telepon: "081234567890"
   - Gaji: 4000000
   - Status: "Active"
4. Klik "Simpan"

**Hasil yang Diharapkan**:

- Anggota staff berhasil dibuat
- Muncul di daftar staff
- Notifikasi toast sukses
- Log audit dibuat

---

### TC-STAFF-003: Edit Detail Staff

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke /staff
2. Klik "Edit" pada anggota staff mana saja
3. Ubah gaji
4. Ubah posisi
5. Simpan perubahan

**Hasil yang Diharapkan**:

- Perubahan tersimpan dengan sukses
- Data yang diperbarui ditampilkan
- Log audit dibuat

---

### TC-STAFF-004: Hapus Anggota Staff

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke /staff
2. Klik "Delete" pada anggota staff
3. Konfirmasi penghapusan

**Hasil yang Diharapkan**:

- Anggota staff dihapus dari database
- Dihapus dari daftar staff
- Log audit dibuat

---

### TC-STAFF-005: Ubah Status Staff ke Tidak Aktif

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke /staff
2. Klik "Edit" pada anggota staff aktif
3. Ubah status ke "Inactive"
4. Simpan perubahan

**Hasil yang Diharapkan**:

- Status diperbarui ke Inactive
- Anggota staff masih terlihat di daftar
- Badge status diperbarui
- Log audit dibuat

---

## 10. Manajemen Pengguna

### TC-USER-001: Lihat Daftar Pengguna

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke /users

**Hasil yang Diharapkan**:

- Semua pengguna ditampilkan dalam tabel
- Setiap baris menampilkan:
  - Username
  - Email
  - Role (ADMIN/OPERATOR)
  - Status (Aktif/Tidak Aktif)
  - Tanggal dibuat

---

### TC-USER-002: Tambah Pengguna Admin Baru

**Prioritas**: Kritis  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke /users
2. Klik tombol "Tambah User"
3. Isi detail:
   - Username: "admin2"
   - Email: "admin2@example.com"
   - Password: "password123"
   - Konfirmasi Password: "password123"
   - Role: "ADMIN"
4. Klik "Simpan"

**Hasil yang Diharapkan**:

- Pengguna berhasil dibuat
- Password di-hash di database
- Muncul di daftar pengguna
- Notifikasi toast sukses
- Log audit dibuat

---

### TC-USER-003: Tambah Pengguna Operator Baru

**Prioritas**: Kritis  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Tambah User"
2. Isi detail dengan Role: "OPERATOR"
3. Submit form

**Hasil yang Diharapkan**:

- Pengguna operator dibuat
- Izin terbatas diterapkan
- Pengguna dapat login
- Tidak dapat mengakses route khusus admin

---

### TC-USER-004: Edit Detail Pengguna

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke /users
2. Klik "Edit" pada pengguna mana saja
3. Ubah email
4. Ubah role
5. Simpan perubahan

**Hasil yang Diharapkan**:

- Perubahan tersimpan dengan sukses
- Data yang diperbarui ditampilkan
- Izin role diperbarui segera
- Log audit dibuat

---

### TC-USER-005: Ubah Password Pengguna

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Edit" pada pengguna
2. Masukkan password baru
3. Konfirmasi password baru
4. Simpan perubahan

**Hasil yang Diharapkan**:

- Password berhasil diperbarui
- Password baru di-hash
- Pengguna dapat login dengan password baru
- Password lama tidak berfungsi lagi
- Log audit dibuat

---

### TC-USER-006: Nonaktifkan Pengguna

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke /users
2. Klik "Deactivate" pada pengguna aktif
3. Konfirmasi aksi

**Hasil yang Diharapkan**:

- Status pengguna berubah ke Inactive
- Pengguna tidak dapat login
- Sesi yang ada dibatalkan
- Log audit dibuat

---

### TC-USER-007: Aktifkan Kembali Pengguna

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke /users
2. Klik "Activate" pada pengguna tidak aktif
3. Konfirmasi aksi

**Hasil yang Diharapkan**:

- Status pengguna berubah ke Active
- Pengguna dapat login lagi
- Log audit dibuat

---

### TC-USER-008: Hapus Pengguna

**Prioritas**: Sedang  
**Role**: ADMIN  
**Prakondisi**: Pengguna tidak terkait dengan catatan kritis

**Langkah-langkah**:

1. Navigasi ke /users
2. Klik "Delete" pada pengguna
3. Konfirmasi penghapusan

**Hasil yang Diharapkan**:

- Pengguna dihapus dari database
- Dihapus dari daftar pengguna
- Log audit dibuat

---

### TC-USER-009: Tidak Dapat Hapus Akun Sendiri

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Navigasi ke /users
2. Coba hapus pengguna yang sedang login
3. Coba konfirmasi

**Hasil yang Diharapkan**:

- Aksi hapus dinonaktifkan atau error ditampilkan
- Pesan error: "Tidak dapat menghapus akun sendiri"
- Pengguna tetap di database

---

### TC-USER-010: Operator Tidak Dapat Mengakses Manajemen Pengguna

**Prioritas**: Kritis  
**Role**: OPERATOR

**Langkah-langkah**:

1. Login sebagai operator
2. Coba akses /users via URL

**Hasil yang Diharapkan**:

- Akses ditolak (403 atau redirect)
- Pesan error ditampilkan
- Menu Users tidak terlihat di sidebar
- Log audit dibuat

---

### TC-USER-011: Validasi - Email Duplikat

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Tambah User"
2. Masukkan email yang sudah ada
3. Isi field lain
4. Submit form

**Hasil yang Diharapkan**:

- Error validasi: "Email sudah terdaftar"
- Pengiriman form dicegah

---

### TC-USER-012: Validasi - Username Duplikat

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Tambah User"
2. Masukkan username yang sudah ada
3. Isi field lain
4. Submit form

**Hasil yang Diharapkan**:

- Error validasi: "Username sudah digunakan"
- Pengiriman form dicegah

---

### TC-USER-013: Validasi - Password Lemah

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Tambah User"
2. Masukkan password kurang dari 8 karakter
3. Coba submit

**Hasil yang Diharapkan**:

- Error validasi: "Password minimal 8 karakter"
- Pengiriman form dicegah

---

### TC-USER-014: Validasi - Password Tidak Cocok

**Prioritas**: Tinggi  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Tambah User"
2. Masukkan password: "password123"
3. Masukkan konfirmasi password: "password456"
4. Coba submit

**Hasil yang Diharapkan**:

- Error validasi: "Password tidak cocok"
- Pengiriman form dicegah

---

### TC-USER-015: Validasi - Format Email Tidak Valid

**Prioritas**: Sedang  
**Role**: ADMIN

**Langkah-langkah**:

1. Klik "Tambah User"
2. Masukkan email tidak valid: "bukanemail"
3. Coba submit

**Hasil yang Diharapkan**:

- Error validasi: "Format email tidak valid"
- Pengiriman form dicegah

---

## Ringkasan Cakupan Pengujian

| Modul       | Kasus Uji | Kritis | Tinggi | Sedang | Rendah |
| ----------- | --------- | ------ | ------ | ------ | ------ |
| Autentikasi | 9         | 3      | 4      | 2      | 0      |
| Dashboard   | 3         | 0      | 2      | 1      | 0      |
| Transaksi   | 26        | 8      | 12     | 5      | 1      |
| Armada      | 11        | 1      | 4      | 4      | 2      |
| Sopir       | 10        | 1      | 3      | 4      | 2      |
| Paket       | 14        | 3      | 4      | 5      | 2      |
| Pengeluaran | 20        | 2      | 7      | 9      | 2      |
| Laporan     | 15        | 5      | 5      | 4      | 1      |
| Staff       | 5         | 1      | 1      | 2      | 1      |
| Pengguna    | 15        | 5      | 5      | 3      | 2      |
| **TOTAL**   | **128**   | **29** | **47** | **39** | **13** |

---

## Panduan Eksekusi Pengujian

### Prioritas Pengujian

- **Kritis**: Harus lulus sebelum rilis
- **Tinggi**: Sebaiknya lulus sebelum rilis
- **Sedang**: Penting tapi dapat ditunda
- **Rendah**: Bagus untuk dimiliki

### Manajemen Data Uji

- Gunakan database uji khusus
- Reset data antara sesi pengujian
- Pertahankan set data uji yang konsisten
- Dokumentasikan kebutuhan data uji

### Pelaporan Cacat

Ketika pengujian gagal, laporkan:

1. ID kasus uji
2. Langkah untuk mereproduksi
3. Hasil yang diharapkan vs aktual
4. Screenshot/video
5. Detail browser/lingkungan
6. Error konsol (jika ada)

---

## Catatan

- Semua kasus uji mengasumsikan UI berbahasa Indonesia
- Jumlah mata uang dalam Rupiah Indonesia (Rp)
- Format tanggal: DD/MM/YYYY atau sesuai konfigurasi
- Nomor telepon: Format Indonesia (08xx-xxxx-xxxx)
- Kasus uji mencakup jalur bahagia, kasus edge, dan skenario error
- Kasus uji keamanan harus dilakukan di lingkungan terisolasi
- Benchmark performa dapat bervariasi berdasarkan hardware/jaringan

---

**Akhir Dokumen Kasus Uji**
