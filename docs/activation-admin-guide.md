# Panduan Admin Sistem Aktivasi PKG

## Login Admin

1. Buka menu **Kelola Kode Aktivasi** di aplikasi PKG
2. Login dengan email & password Admin Supabase yang sudah terdaftar di tabel `pkg_admins`
3. Setelah login, ada 3 tab: **Dashboard**, **Kode Aktivasi**, **Audit Log**

## Tab Dashboard

Menampilkan 8 statistik:
- Total Kode
- Belum Digunakan
- Sudah Digunakan
- Dinonaktifkan
- Aktivasi Hari Ini
- Aktivasi 30 Hari
- Ganti Perangkat
- Percobaan Gagal (24h)

Serta section **Perlu Perhatian** yang menampilkan aktivitas mencurigakan (failed activation, rate limited, dll).

## Tab Kode Aktivasi

### Buat Kode Baru
1. Klik **+ Buat Kode Aktivasi**
2. Isi: Nama Pemesan, Nama Madrasah, Kabupaten, Role (Kamad/Pengawas), Catatan
3. Klik **Buat Kode**
4. Kode muncul di modal — **SALIN SEGERA**, kode tidak akan ditampilkan lagi
5. Berikan kode ke pengguna

### Cari & Filter
- Search: cari berdasarkan kode/nama/madrasah
- Filter Status: Semua / Belum Digunakan / Sudah Digunakan / Dinonaktifkan
- Filter Role: Semua / Kepala Madrasah / Tim PKG
- Sort: Terbaru / Terlama

### Detail Kode
- Klik ikon mata 👁 untuk lihat detail
- Menampilkan: kode, status, pemilik, perangkat, device key, catatan
- Jika status **activated**, tersedia tombol: Ganti Perangkat & Verifikasi Device Key

### Nonaktifkan Kode
- Klik ikon ❌ di baris kode
- Konfirmasi → kode berubah menjadi **Dinonaktifkan**
- Kode yang sudah dinonaktifkan tidak bisa digunakan lagi

## Tab Audit Log

Menampilkan semua aktivitas sistem aktivasi:
- Buat Kode (CREATE_CODE)
- Aktivasi (ACTIVATE_CODE)
- Aktivasi Gagal (FAILED_ACTIVATION)
- Nonaktifkan (REVOKE_CODE)
- Ganti Perangkat (DEVICE_REPLACEMENT)
- Verifikasi Berhasil/Gagal
- Rate Limited
- Admin Login/Logout
- Export Data

### Filter Audit Log
- Search: cari berdasarkan status/reason/device/admin
- Filter Aksi: pilih jenis aksi
- Date Range: dari-tanggal sampai tanggal
- Tombol Reset untuk clear filter

### Export
- **Export Data Kode (CSV)**: export semua data kode (tanpa code_hash)
- **Export Audit Log (CSV)**: export semua audit log

## Ganti Perangkat

Jika pengguna ganti HP / reset browser:
1. Buka detail kode yang **activated**
2. Klik **Ganti Perangkat**
3. Pilih alasan (HP hilang/rusak/ganti/reset/Lainnya)
4. Isi catatan tambahan (opsional)
5. Klik **Proses Penggantian**
6. Kode baru muncul — berikan ke pengguna
7. Kode lama otomatis dinonaktifkan

## Verifikasi Device Key

Untuk verifikasi identitas perangkat:
1. Buka detail kode yang **activated**
2. Klik **Verifikasi Device Key**
3. Klik **Buat Challenge**
4. Minta pengguna membuka aplikasi dan menyelesaikan challenge (5 menit)
5. Pengguna memberikan signature → tempel di kolom
6. Klik **Verifikasi**

## Rate Limiting

- 5 percobaan gagal dalam 10 menit → blok 10 menit
- Tidak ada blacklist permanen
- Reset otomatis setelah window 10 menit berlalu
- Rate limit per device_id + IP

## Server Health Indicator

Badge di header menampilkan status server:
- 🟢 Server Online
- 🟡 Server Terganggu
- 🔴 Server Offline
- ⚪ Cek Server...

## Sesi Admin

- Sesi otomatis expired berdasarkan JWT expiry
- Jika RPC return 401/403 → auto-logout
- Validasi admin server-side via `pkg_admins` table + `auth.uid()`
- Tidak ada hardcoded admin credentials
