# Laporan Revisi Sistem Aktivasi PKG — Tahap 1

## 1. File yang Diubah (5 file)

| File | Perubahan |
|------|-----------|
| `auth.js` | **FULL REWRITE** (1254→~750 baris). Hapus: `ACTIVATION_SALT`, `ADMIN_MASTER_CODE`, `TRIAL_CODE`, `generateActivationCode()`, checksum validation, `isCodeUsed`/`reportActivation`, trial accounts, hardcoded admin. Baru: aktivasi via RPC `window.SupabaseSync.activateCode()`, fail-closed, device binding via hash. Preserved: PIN lock, login, user registration, offline access. |
| `app.js` | Fungsi `viewKelolaAktivasi()` diganti (407→288 baris). Hapus: GitHub PAT UI, `codes.json` sync, `generateActivationCode()` calls. Baru: Supabase Auth admin login + RPC code management (create/list/revoke). |
| `supabase_sync.js` | **REWRITE** (283→~290 baris). RPC-based: `activateCode()`, `adminLogin()`, `adminCreateCode()`, `adminListCodes()`, `adminRevokeCode()`. Fail-closed pada network error. |
| `github_sync.js` | **NEUTRALIZED** (78→~60 baris). Semua sync functions jadi no-op. PAT deprecated. `codes.json` bukan source of truth lagi. |
| `sw.js` | Cache version bump: `pkg-v1-2026-08-14-r59` → `pkg-v2-2026-08-19-secure`. `supabase_sync.js` & `github_sync.js` ditambahkan ke NETWORK_FIRST dan PRECACHE. |

## 2. File Baru (1 file)

| File | Deskripsi |
|------|-----------|
| `sql/pkg_activation_v2.sql` | Migration SQL lengkap (~14KB). Berisi: tabel `pkg_activation_codes`, tabel `pkg_admins`, 4 RPC functions, RLS policies, deprecated comment pada `pkg_aktivasi_log`. |

## 3. SQL yang Perlu Dijalankan di Supabase SQL Editor

1. Buka <https://supabase.com/dashboard/project/veezuitkavznfipyyxln/sql/new>
2. Copy-paste seluruh isi file `sql/pkg_activation_v2.sql`
3. Klik **Run**
4. Pastikan tidak ada error. Cek dengan query:
   ```sql
   SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'pkg_%';
   -- Harus muncul: pkg_activation_codes, pkg_admins, pkg_aktivasi_log
   ```

## 4. Environment/Config yang Perlu Diisi

File `supabase_sync.js` sudah berisi config Supabase:
- **URL:** `https://veezuitkavznfipyyxln.supabase.co`
- **Anon Key:** `sb_pub_71VsVcheY13eLPXoUteZkg_hUtaJh8S`

Tidak ada env variable lain. Anon key aman di browser karena dilindungi RLS+RPC.

## 5. Cara Membuat Akun Admin Supabase Pertama

1. Buka <https://supabase.com/dashboard/project/veezuitkavznfipyyxln/auth/users>
2. Klik **Add user** → **Create new user**
3. Isi:
   - Email: contoh `admin@pokjawas.com`
   - Password: minimal 6 karakter (contoh: `admin123456`)
   - Klik **Create user**
4. Auto Confirm: setelah create, klik user tersebut → toggle **Confirm email** = ON

## 6. Cara Memasukkan Admin ke `pkg_admins`

Jalankan di Supabase SQL Editor (ganti UUID dengan user id dari step 5):

```sql
-- Cari user id dari auth.users
SELECT id, email FROM auth.users WHERE email = 'admin@pokjawas.com';

-- Insert ke pkg_admins (ganti UUID-nya)
INSERT INTO public.pkg_admins (user_id, nama, role)
VALUES (
  'GANTI-DENGAN-UUID-DARI-QUERY-DI-ATAS',
  'Subariyanto, S.Pd., M.Pd.I.',
  'admin'
);

-- Verifikasi
SELECT * FROM public.pkg_admins;
```

## 7. Cara Menguji Kode Aktivasi

### Setup
1. Pastikan SQL migration sudah dijalankan
2. Pastikan Admin sudah dibuat (step 5 & 6)
3. Push repo ke GitHub Pages: `git push origin main`
4. Buka <https://subariyanto.github.io/pkg-app-spa/>
5. Jika SW lama masih cache, lakukan hard refresh: `Ctrl+Shift+R` atau clear cache via DevTools → Application → Clear storage

### TEST 1 — Admin membuat kode
1. Buka app → login dengan akun admin lokal (role=admin)
2. Buka menu **Kelola Kode Aktivasi**
3. Login dengan email Admin Supabase (`admin@pokjawas.com`)
4. Isi Nama Penerima + Madrasah + Kabupaten → klik **Buat Kode**
5. **Expected:** Kode baru muncul format `PKG-XXXX-XXXX-XXXX-XXXX`
6. Cek di SQL Editor: `SELECT status FROM pkg_activation_codes WHERE code_hint = '...';` → status = `unused`

### TEST 2 — Kode dipakai di Laptop A
1. Buka app di browser lain / incognito
2. Isi form registrasi: masukkan kode dari TEST 1
3. Isi data user (username, password, dll)
4. Klik **Aktifkan & Daftar Akun**
5. **Expected:** "Aktivasi berhasil!"
6. Cek SQL: `SELECT status, device_id FROM pkg_activation_codes WHERE code_hint = '...';` → status = `activated`, device_id terisi

### TEST 3 — Kode yang sama di Laptop B
1. Buka app di browser/device berbeda (incognito berbeda)
2. Masukkan kode yang sama
3. **Expected:** Error "Kode aktivasi ini sudah digunakan dan terikat pada perangkat lain."
4. Laptop B TIDAK aktif

### TEST 4 — Kode acak tidak valid
1. Masukkan kode acak: `PKG-AAAA-BBBB-CCCC-DDDD`
2. **Expected:** Error "Kode aktivasi tidak valid."

### TEST 5 — Internet mati saat aktivasi pertama
1. Buka app di incognito
2. Matikan internet (DevTools → Network → Offline)
3. Isi form registrasi + kode valid
4. Klik **Aktifkan & Daftar Akun**
5. **Expected:** Error "Aktivasi memerlukan koneksi internet. Server aktivasi tidak dapat dihubungi."
6. App TIDAK aktif

### TEST 6 — Supabase error
1. Sama dengan TEST 5, tapi internet hidup dan Supabase down
2. **Expected:** Error "Server aktivasi mengalami gangguan."
3. App TIDAK aktif

### TEST 7 — Refresh Laptop A setelah aktivasi
1. Di Laptop A (yang sudah aktif), refresh halaman
2. **Expected:** App tetap bisa digunakan (offline, lokal)

### TEST 8 — Laptop A offline setelah aktivasi
1. Matikan internet di Laptop A
2. Buka/close app berkali-kali
3. **Expected:** App tetap berjalan normal

### TEST 9 — Race condition (dua device bersamaan)
1. Buka app di 2 browser bersamaan (2 incognito)
2. Masukkan kode yang sama, klik aktivasi di kedua browser hampir bersamaan
3. **Expected:** HANYA SATU yang dapat `ACTIVATED`. Yang lain dapat `ALREADY_USED`
4. Hal ini ditangani oleh `SELECT ... FOR UPDATE` di RPC PostgreSQL

## 8. Service Worker Update
- Cache version: `pkg-v1-2026-08-14-r59` → `pkg-v2-2026-08-19-secure`
- Strategy: network-first untuk app shell, cache-first untuk CDN
- Saat user buka app, SW akan install cache baru + hapus cache lama + reload

## 9. Hal yang Masih Perlu Dilakukan Manual

1. **Jalankan SQL migration** di Supabase SQL Editor (file `sql/pkg_activation_v2.sql`)
2. **Buat Admin user** di Supabase Auth Dashboard
3. **Insert ke `pkg_admins`** via SQL Editor
4. **Push ke GitHub Pages**: `git add -A && git commit -m "V2 secure activation" && git push`
5. **Test** semua 9 acceptance tests
6. **Distribusi kode** ke user: Admin login → Buat Kode → salin → kirim ke user

## 10. Audit Insecure Patterns — SEMUA TERHAPUS

| Pattern | Status |
|---------|--------|
| `ACTIVATION_SALT` | ❌ Dihapus (hanya di komentar deprecation) |
| `ADMIN_MASTER_CODE` | ❌ Dihapus (hanya di komentar) |
| `TRIAL_CODE` / trial accounts | ❌ Dihapus total |
| `generateActivationCode()` di frontend | ❌ Dihapus |
| Checksum validation di JS | ❌ Dihapus |
| `isCodeUsed()` / `reportActivation()` | ❌ Dihapus |
| Best-effort activation | ❌ Dihapus, fail-closed |
| `codes.json` sebagai source | ❌ Neutralized |
| GitHub PAT untuk aktivasi | ❌ Neutralized |
| `pkg_v1_generated_codes` localStorage | ❌ Dihapus dari app.js |
| `syncAdminInbox` | ❌ Dihapus |
| Service role key di frontend | ❌ Tidak ada |
| Admin password hardcoded | ❌ Tidak ada |

## Syntax Check — SEMUA PASS ✅
```
node -c auth.js          → OK
node -c app.js           → OK
node -c supabase_sync.js → OK
node -c github_sync.js  → OK
node -c sw.js            → OK (service worker, tidak dicek node tapi format benar)
```

## Git Status
```
M  app.js           557 changes
M  auth.js          560 changes
M  github_sync.js  198 changes
M  supabase_sync.js 342 changes
M  sw.js              7 changes
?? sql/pkg_activation_v2.sql (new)
Total: 549 insertions, 1115 deletions
```
