# LAPORAN TAHAP 4 — Monitoring, Audit Log, Rate Limiting, Export

**Tanggal:** 2026-08-20
**Repo:** `Subariyanto/pkg-app-spa`
**Commit base:** `85b21af Tahap 3: Device Identity (ECDSA P-256 + IndexedDB) & Activation Recovery`
**Status:** ✅ Implementasi selesai, siap untuk review & uji manual

---

## 1. File Baru

| File | Deskripsi |
|------|-----------|
| `sql/pkg_activation_v2_tahap4.sql` | SQL migration Tahap 4 — rate limiting, audit log expansion, export RPCs, GRANT statements (~700 baris) |
| `docs/activation-admin-guide.md` | Panduan admin: login, 3-tab UI (Dashboard/Kode/Audit), export, ganti perangkat, verifikasi device key |
| `docs/activation-security.md` | Dokumentasi keamanan: arsitektur, audit log, rate limiting, export, CSP, secret rotation |
| `docs/activation-backup.md` | Panduan backup & restore: database backup, CSV export, recovery device key |
| `docs/admin-setup.md` | Instruksi setup akun admin di Supabase Auth + tabel `pkg_admins` |
| `LAPORAN_TAHAP4.md` | Laporan ini |

## 2. File Diubah

| File | Perubahan |
|------|-----------|
| `app.js` | +735/-123 baris. Tab-based UI (Dashboard/Kode/Audit). 8 stat cards. Audit log table dengan filter/search/date/pagination. Export CSV (kode + audit). Server health indicator. Suspicious activity panel. Revoke modal dengan alasan. Empty state. Mobile responsive. |
| `supabase_sync.js` | +220 baris. RPC wrappers: `adminStatsV2`, `adminListAuditLogs`, `adminGetSuspiciousActivity`, `adminExportData`, `adminExportAuditLog`, `checkServerHealth`. Rate limit handling (429 + `RATE_LIMITED` response). `adminRevokeCode` sekarang menerima `p_reason`. |
| `sw.js` | Cache version bump ke `pkg-v4-2026-08-19-tahap4`. Network-first strategy untuk app shell. |
| `index.html` | **Baru:** CSP meta tag (`Content-Security-Policy`). `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`. Script-src `'self' https://cdn.jsdelivr.net`. Connect-src `'self' https://veezuitkavznfipyyxln.supabase.co`. |

## 3. Tabel Database Baru

| Tabel | Deskripsi |
|-------|-----------|
| `pkg_rate_limits` | Server-side rate limiting. Kolom: `id`, `session_key`, `ip_address`, `code_attempted`, `attempt_count`, `first_attempt`, `last_attempt`, `locked_until`. RLS enabled, no direct access (RPC-only). |

## 4. Tabel Database Diubah

| Tabel | Perubahan |
|-------|-----------|
| `pkg_activation_audit_logs` | Kolom baru: `activation_id`, `device_id`, `status`, `reason`, `user_agent`, `ip_address`. CHECK constraint diperluas ke 14 action types. Index pada `action`, `status`, `device_id`, `ip_address`. |

## 5. RPC Baru

| RPC | Fungsi | Akses |
|-----|--------|-------|
| `_check_rate_limit(p_session_key, p_ip_address, p_code_hash)` | Cek & catat rate limit. Return `true` jika boleh, `false` jika diblokir. | Internal only (SECURITY DEFINER, no GRANT) |
| `_clear_rate_limit(p_session_key)` | Reset rate limit setelah aktivasi berhasil. | Internal only |
| `_cleanup_old_rate_limits()` | Hapus entry rate limit >1 jam. Untuk cron/manual. | Internal only |
| `admin_list_audit_logs(p_action, p_date_from, p_date_to, p_search, p_page, p_limit)` | Audit log dengan filter/search/pagination. Return table + `total_count`. | `authenticated` |
| `admin_activation_stats_v2()` | 8 statistik: total, unused, activated, revoked, activated_today, activated_30d, device_replacements, failed_attempts. | `authenticated` |
| `admin_get_suspicious_activity(p_hours, p_limit)` | Aktivitas mencurigakan (FAILED_ACTIVATION, RATE_LIMITED, DEVICE_VERIFICATION_FAILED) dalam N jam terakhir. | `authenticated` |
| `admin_export_data(p_status, p_role)` | Export data kode aktivasi. **TIDAK** mengandung `code_hash`, `device_public_key`, token. | `authenticated` |
| `admin_export_audit_log(p_action, p_date_from, p_date_to)` | Export audit log. **TIDAK** mengandung plaintext code, password, token. | `authenticated` |

## 6. RPC Diubah

| RPC | Perubahan |
|-----|-----------|
| `activate_pkg_code(...)` | +Rate limiting via `_check_rate_limit()`. +Audit log untuk semua outcome (ACTIVATE_CODE, FAILED_ACTIVATION, RATE_LIMITED). +Clear rate limit on success. |
| `admin_revoke_activation_code(p_code_id, p_reason)` | **Signature berubah:** dari `(uuid)` → `(uuid, text)`. Menyimpan `revoked_reason`. Audit log dengan `status` + `reason`. Old 1-arg version di-drop untuk menghindari ambiguity. |

## 7. RLS (Row-Level Security)

- `pkg_rate_limits`: RLS enabled, **tidak ada policy** → hanya bisa diakses via RPC SECURITY DEFINER.
- `pkg_activation_audit_logs`: RLS sudah enabled di Tahap 2, tetap RPC-only.
- `pkg_activation_codes`: RLS sudah enabled, tetap RPC-only.
- `pkg_admins`: RLS sudah enabled, tetap RPC-only.
- `pkg_device_challenges`: RLS sudah enabled, tetap RPC-only.
- Semua RPC baru menggunakan `SECURITY DEFINER` + verifikasi `auth.uid() ∈ pkg_admins`.

## 8. Rate Limiting

- **Server-side** di tabel `pkg_rate_limits`
- **Threshold:** 5 percobaan gagal dalam 10 menit
- **Lock duration:** 10 menit dari percobaan terakhir
- **Key:** `device_id` (sebagai `session_key`)
- **No permanent blacklist:** lock hilang otomatis setelah window 10 menit
- **Reset on success:** `_clear_rate_limit()` dipanggil saat aktivasi berhasil
- **Audit log:** setiap rate limit trigger dicatat sebagai `RATE_LIMITED`
- **Cleanup:** `_cleanup_old_rate_limits()` untuk hapus entry >1 jam (jalankan via cron/manual)

## 9. Audit Logging

14 action types tercatat di `pkg_activation_audit_logs`:

| Action | Trigger |
|--------|---------|
| `CREATE_CODE` | Admin membuat kode baru |
| `ACTIVATE_CODE` | Aktivasi berhasil |
| `FAILED_ACTIVATION` | Kode invalid/revoked/already used |
| `REVOKE_CODE` | Admin menonaktifkan kode |
| `DEVICE_REPLACEMENT` | Admin ganti perangkat |
| `DEVICE_VERIFICATION_SUCCESS` | Verifikasi device key berhasil |
| `DEVICE_VERIFICATION_FAILED` | Verifikasi device key gagal |
| `RATE_LIMITED` | Rate limiter memblokir percobaan |
| `ADMIN_LOGIN` | *(Reserved — perlu trigger Supabase Auth)* |
| `ADMIN_LOGIN_FAILED` | *(Reserved — perlu trigger Supabase Auth)* |
| `ADMIN_LOGOUT` | *(Reserved — perlu trigger Supabase Auth)* |
| `EXPORT_DATA` | Admin export data kode |
| `EXPORT_AUDIT_LOG` | Admin export audit log |
| `VIEW_DETAIL` | Admin lihat detail kode |

**Yang TIDAK disimpan di audit log:**
- ❌ Plaintext code
- ❌ Password
- ❌ Token
- ❌ Private/public key

**Catatan:** `ADMIN_LOGIN` / `ADMIN_LOGIN_FAILED` / `ADMIN_LOGOUT` saat ini hanya tersedia di CHECK constraint. Untuk pengisian otomatis, perlu dibuat Supabase Auth trigger (lihat bagian "Pekerjaan Tersisa").

## 10. Export Data

### Export Data Kode (CSV)
- Fields: `code_hint`, `status`, `nama_pengguna`, `username`, `madrasah`, `kabupaten`, `role`, `device_id`, `device_info`, `created_at`, `activated_at`, `revoked_at`, `catatan`
- **Dikecualikan:** `code_hash`, `device_public_key`, `replaced_activation_id`, `replacement_for`

### Export Audit Log (CSV)
- Fields: `action`, `admin_email`, `activation_code_id`, `device_id`, `status`, `reason`, `created_at`
- **Dikecualikan:** plaintext code, password, token, private/public key

### Implementasi Client-Side
- CSV dibuat di browser via `Blob` + `URL.createObjectURL`
- Tidak ada data yang dikirim ke server selain RPC call
- `downloadCSV()` function — download langsung tanpa storage

## 11. Dashboard Monitoring

8 stat cards di tab Dashboard:
1. Total Kode
2. Belum Digunakan
3. Sudah Digunakan
4. Dinonaktifkan
5. Aktivasi Hari Ini
6. Aktivasi 30 Hari
7. Ganti Perangkat
8. Percobaan Gagal (24h)

Plus:
- **Perlu Perhatian** — aktivitas mencurigakan (FAILED_ACTIVATION, RATE_LIMITED, DEVICE_VERIFICATION_FAILED) dalam 24 jam
- **Server Health Indicator** — badge online/terganggu/offline
- **Export buttons** — quick access ke export CSV

## 12. Service Worker

- **Cache version:** `pkg-v4-2026-08-19-tahap4` (bumped dari Tahap 3)
- **Strategy:** network-first untuk app shell (index.html, app.js, supabase_sync.js, dll), cache-first untuk CDN assets
- **Cache busting:** `caches.keys()` → delete old versions di `activate` event
- **Client notification:** `postMessage({ type: 'SW_UPDATED' })` ke semua clients

## 13. Dokumentasi

| File | Isi |
|------|-----|
| `docs/activation-admin-guide.md` | Panduan operasional admin: login, 3-tab UI, buat/kode, audit log, export, ganti perangkat, verifikasi device key, rate limiting, server health, sesi admin |
| `docs/activation-security.md` | Arsitektur keamanan, prinsip, audit log, rate limiting, export data, verifikasi device key, ganti perangkat, jika secrets ter-publish, CSP |
| `docs/activation-backup.md` | Backup database, backup CSV, backup otomatis Supabase, restore, recovery device key |
| `docs/admin-setup.md` | Setup akun admin: buat di Supabase Auth, daftar di `pkg_admins`, verifikasi, test login, tambah admin lain, keamanan akun, reset password, hapus admin |

## 14. Secret yang Perlu Di-rotate

| Secret | Status | Tindakan |
|--------|--------|----------|
| `ACTIVATION_SALT` | ❌ Sudah dihapus (Tahap 1) | Tidak perlu rotasi — sudah tidak digunakan |
| `ADMIN_MASTER_CODE` | ❌ Sudah dihapus (Tahap 1) | Tidak perlu rotasi — sudah tidak digunakan |
| `TRIAL_CODE` | ❌ Sudah dihapus (Tahap 1) | Tidak perlu rotasi |
| `github_pat` | ❌ Deprecated (Tahap 1) | Hapus PAT dari localStorage jika masih ada: `localStorage.removeItem('pkg_v1_gh_pat')` |
| Supabase `service_role` key | ✅ Tidak pernah ada di frontend | Tidak perlu rotasi |
| Supabase `anon` key | ✅ Public by design (RLS-protected) | Tidak perlu rotasi |
| Admin password | ⚠️ Jika pernah ada di git history | Rotasi password admin di Supabase Auth |

**Rekomendasi:** Jalankan `git filter-branch` atau `BFG Repo-Cleaner` jika secrets pernah di-commit di git history.

## 15. SQL yang Perlu Dijalankan Manual

**PENTING:** SQL TIDAK boleh dijalankan otomatis. Jalankan manual di Supabase SQL Editor dalam urutan berikut:

### Urutan Eksekusi SQL (jika belum pernah dijalankan)

| Urutan | File | Status |
|--------|------|--------|
| 1 | `sql/pkg_activation_v2.sql` | Tahap 1 — ⚠️ Pastikan sudah dijalankan |
| 2 | `sql/pkg_activation_v2_tahap2.sql` | Tahap 2 — ⚠️ Pastikan sudah dijalankan |
| 3 | `sql/pkg_activation_v2_tahap3.sql` | Tahap 3 — ⚠️ Pastikan sudah dijalankan |
| 4 | `sql/pkg_activation_v2_tahap4.sql` | **Tahap 4 — BELUM DIJALANKAN** |

### Yang Dijalankan di Tahap 4 SQL

1. ALTER `pkg_activation_audit_logs` — expand CHECK constraint (14 actions), add 6 columns, add 4 indexes
2. CREATE TABLE `pkg_rate_limits` — rate limiting table + indexes + RLS
3. CREATE FUNCTION `_check_rate_limit()` — rate limiter logic
4. CREATE FUNCTION `_clear_rate_limit()` — reset on success
5. DROP + CREATE `activate_pkg_code()` — enhanced dengan rate limiting + audit logging
6. CREATE `admin_list_audit_logs()` — filter/search/pagination
7. CREATE `admin_activation_stats_v2()` — 8 stat cards
8. CREATE `admin_get_suspicious_activity()` — recent failed attempts
9. CREATE `admin_export_data()` — export kode (no secrets)
10. CREATE `admin_export_audit_log()` — export audit log (no secrets)
11. DROP + CREATE `admin_revoke_activation_code(uuid, text)` — enhanced dengan reason
12. GRANT execute pada 5 RPC baru ke `authenticated` role
13. REVOKE all pada `pkg_rate_limits` dari public/anon/authenticated
14. CREATE `_cleanup_old_rate_limits()` — cleanup function

## 16. Konfigurasi Supabase

### Yang Perlu Dikonfigurasi

1. **Jalankan SQL Tahap 4** di Supabase SQL Editor
2. **Setup Admin Account** (lihat `docs/admin-setup.md`):
   - Buat user di Authentication → Users
   - Daftarkan di `pkg_admins` table
3. **(Opsional) Supabase Auth Trigger** untuk auto-log `ADMIN_LOGIN`:
   ```sql
   -- Future: create trigger on auth.users login to insert ADMIN_LOGIN audit log
   ```
4. **(Opsional) Cron job** untuk `_cleanup_old_rate_limits()`:
   - Supabase Dashboard → Database → Extensions → `pg_cron`
   - Atau jalankan manual berkala

## 17. Acceptance Tests

| # | Test | Status |
|---|------|--------|
| 1 | Admin bisa login dengan email+password Supabase Auth | ✅ Implementasi (PERLU UJI MANUAL) |
| 2 | Dashboard menampilkan 8 statistik dengan benar | ✅ Implementasi (PERLU UJI MANUAL) |
| 3 | Audit Log menampilkan semua aksi dengan filter+search+date | ✅ Implementasi (PERLU UJI MANUAL) |
| 4 | Rate limiting: 5 percobaan gagal → diblokir 10 menit | ✅ Implementasi (PERLU UJI MANUAL) |
| 5 | Export Data Kode CSV — tidak mengandung code_hash | ✅ Implementasi (PERLU UJI MANUAL) |
| 6 | Export Audit Log CSV — tidak mengandung secrets | ✅ Implementasi (PERLU UJI MANUAL) |
| 7 | Suspicious activity tampil di Dashboard | ✅ Implementasi (PERLU UJI MANUAL) |
| 8 | Server health indicator berfungsi | ✅ Implementasi (PERLU UJI MANUAL) |
| 9 | Tab switching: Dashboard ↔ Kode ↔ Audit Log | ✅ Implementasi (PERLU UJI MANUAL) |
| 10 | Revoke kode dengan alasan tersimpan | ✅ Implementasi (PERLU UJI MANUAL) |
| 11 | CSP meta tag di index.html | ✅ Implementasi |
| 12 | SW cache version bumped | ✅ Implementasi |
| 13 | Tidak ada hardcoded secrets di frontend | ✅ Verified (grep clean) |
| 14 | Tidak ada `service_role` key di frontend | ✅ Verified (grep clean) |
| 15 | `codes.json` tidak digunakan lagi | ✅ Verified (file tidak ada, github_sync.js neutralized) |

## 18. Pekerjaan Tersisa

### Setelah SQL Dijalankan
1. **Test login admin** — login dengan akun admin, verifikasi dashboard muncul
2. **Test buat kode** — buat kode baru, verifikasi muncul di list
3. **Test aktivasi** — aktivasi kode di device lain, verifikasi audit log tercatat
4. **Test rate limiting** — input kode salah 5x, verifikasi diblokir 10 menit
5. **Test export** — export CSV kode + audit, verifikasi tidak ada secrets
6. **Test revoke** — nonaktifkan kode dengan alasan, verifikasi audit log

### Future Enhancements (Opsional)
1. **Supabase Auth Trigger** — auto-log `ADMIN_LOGIN` / `ADMIN_LOGIN_FAILED` ke audit table
2. **pg_cron** — schedule `_cleanup_old_rate_limits()` harian
3. **MFA untuk admin** — aktifkan di Supabase Dashboard
4. **Git history cleanup** — jika secrets pernah di-commit, jalankan BFG Repo-Cleaner

### Bug Fixes yang Diterapkan di Tahap Ini
1. **SQL: Drop old `admin_revoke_activation_code(uuid)` 1-arg** — versi Tahap 2 tidak di-drop, menyebabkan ambiguity dengan signature baru. Fixed: sekarang kedua signature di-drop.
2. **SQL: GRANT execute pada 5 RPC baru** — tanpa GRANT, `authenticated` role tidak bisa memanggil RPC. Fixed: GRANT ditambahkan.
3. **SQL: REVOKE all pada `pkg_rate_limits`** — mencegah akses langsung ke rate limit table. Fixed: REVOKE ditambahkan.
4. **index.html: CSP meta tag** — documented tapi tidak ada di HTML. Fixed: CSP meta tag ditambahkan.
5. **app.js: Revoke tanpa alasan** — modal revoke tidak punya input alasan. Fixed: dropdown alasan ditambahkan, `adminRevokeCode` menerima `p_reason`.
6. **supabase_sync.js: 429 handling** — `handleRpcError` tidak handle HTTP 429. Fixed: 429 sekarang return `rateLimited: true`.

---

## Prinsip Keamanan Final

✅ **1 kode = 1 aktivasi = 1 perangkat**
✅ **Tidak ada master code / bypass / universal code**
✅ **Server (Supabase) is source of truth**
✅ **No client-side secret** (anon key is public, RLS-protected)
✅ **RLS + RPC server-side** (SECURITY DEFINER + auth.uid() verification)
✅ **Fail-closed activation** (jika server tidak bisa dihubungi, aktivasi DITOLAK)

---

**LAPORAN INI DIBUAT OTOMATIS — SQL BELUM DIJALANKAN DI SUPABASE.**
**JALANKAN SQL MANUAL DI SUPABASE SQL EDITOR SEBELUM MENGUJI.**
