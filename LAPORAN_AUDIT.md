# Laporan Audit Menyeluruh — Sistem Aktivasi Supabase

**Tanggal:** 2026-08-20  
**Repo:** Subariyanto/pkg-app-spa  
**Commit:** audit menyeluruh

## Ringkasan

Audit dilakukan karena dua masalah:
1. Admin tidak bisa login dari browser lain
2. Kode aktivasi gagal dibuat (tombol "Terbitkan" tidak berfungsi)

---

## Bug Ditemukan

### Bug 1: SQL `digest()` type mismatch (KRITIS)
**Dampak:** `admin_create_activation_code`, `activate_pkg_code`, `check_code_status` — semua gagal.  
**Penyebab:** `pgcrypto.digest()` butuh explicit type cast. `digest(v_code, 'sha256')` → error `function digest(text, unknown) does not exist`.  
**Fix:** Ubah ke `digest(v_code::text, 'sha256'::text)` di semua 3 RPC.

### Bug 2: SQL `admin_list_activation_codes` ambiguous column (KRITIS)
**Dampak:** Daftar kode tidak tampil di panel admin.  
**Penyebab:** Kolom `username` di RETURN query konflik dengan parameter/variabel PL/pgSQL.  
**Fix:** Tambahkan alias `c.` untuk semua kolom di RETURN query.

### Bug 3: `Authorization: Bearer` + anon key baru (SUDAH DIPERBAIKI SEBELUMNYA)
**Dampak:** Semua RPC gagal dengan `Expected 3 parts in JWT; got 1`.  
**Penyebab:** Anon key format baru `sb_publishable_...` bukan JWT. Header `Bearer` tidak valid.  
**Fix:** Gunakan `Authorization: <key>` langsung (tanpa Bearer). Sudah diperbaiki di commit sebelumnya.

### Bug 4: `callRpc` tidak handle response non-JSON
**Dampak:** RPC yang return text (`activate_pkg_code`, `check_code_status`, `admin_revoke_activation_code`) mungkin gagal diparse.  
**Fix:** Cek `content-type` header. Kalau JSON → parse, kalau text → return as-is.

### Bug 5: CSP meta tag memblokir koneksi (SUDAH DIPERBAIKI SEBELUMNYA)
**Dampak:** Browser blokir fetch ke Supabase.  
**Fix:** CSP meta tag dihapus total.

### Bug 6: Menu Kode Aktivasi tidak tampil di browser baru (SUDAH DIPERBAIKI SEBELUMNYA)
**Dampak:** Admin tidak bisa akses panel dari browser lain.  
**Fix:** Menu selalu tampil + bypass aktivasi untuk `#/kelola-aktivasi`.

### Bug 7: Grant execute hanya ke `authenticated` (SUDAH DIPERBAIKI SEBELUMNYA)
**Dampak:** RPC admin gagal karena admin pakai custom login (bukan Supabase Auth), tidak punya JWT `authenticated`.  
**Fix:** Grant ke `anon` juga.

---

## Perbaikan yang Dilakukan

### File: `sql/pkg_activation.sql`
- Fix `digest(v_code, 'sha256')` → `digest(v_code::text, 'sha256'::text)` di 3 RPC
- Fix ambiguous column di `admin_list_activation_codes` — semua kolom pakai alias `c.`
- Pastikan semua grant execute ke `anon, authenticated`

### File: `supabase_sync.js`
- `callRpc()` — handle response non-JSON (text) via content-type check
- `activateCode()` — handle string return dengan benar
- `adminListCodes()` — handle empty/null response dengan lebih robust

### File: `sw.js`
- Cache version bump: `pkg-v6` → `pkg-v7-2026-08-20-audit`

---

## Hasil Test RPC via curl (SEBELUM fix)

| RPC | Hasil | Status |
|-----|-------|--------|
| `admin_login` | `{"ok":true,"username":"Subariyanto","nama":"Subariyanto"}` | ✅ Works |
| `admin_create_activation_code` | `function digest(text, unknown) does not exist` | ❌ BUG |
| `admin_list_activation_codes` | `column reference "username" is ambiguous` | ❌ BUG |
| `admin_activation_stats` | `{"ok":true,"total":0,"unused":0,"activated":0,"revoked":0}` | ✅ Works |
| `check_code_status` | `function digest(text, unknown) does not exist` | ❌ BUG |

---

## Verifikasi Syntax

```
app.js OK
auth.js OK
supabase_sync.js OK
sw.js OK
```

---

## Yang Perlu Dilakukan Yanto

### 1. Jalankan ulang SQL yang sudah diperbaiki
Buka SQL Editor: <https://supabase.com/dashboard/project/veezuitkavznfipyyxln/sql/new>

Copy semua isi file `sql/pkg_activation.sql` → paste → Run.

SQL ini idempotent (safe untuk run ulang — `create or replace function`, `create table if not exists`).

### 2. Test di browser
1. Hard refresh: Ctrl+Shift+R (atau incognito)
2. Buka: <https://subariyanto.github.io/pkg-app-spa/#/kelola-aktivasi>
3. Login admin: `Subariyanto` / `@riyant1970`
4. Klik "Buat Kode" → harus muncul kode baru
5. Daftar kode harus tampil di tabel
6. Stats harus tampil di kartu atas

### 3. Verifikasi RPC via SQL Editor
```sql
-- Test create code
SELECT * FROM public.admin_create_activation_code('Test','MTs Test','Jember','pengawas','test','Subariyanto');

-- Test list codes
SELECT * FROM public.admin_list_activation_codes('Subariyanto');

-- Test stats
SELECT * FROM public.admin_activation_stats('Subariyanto');
```
