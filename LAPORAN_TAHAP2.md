# LAPORAN TAHAP 2 — Admin Menu: Kelola Kode Aktivasi

**Tanggal:** 19 Agustus 2026
**Repo:** `Subariyanto/pkg-app-spa`
**Prinsip:** 1 kode = 1 aktivasi = 1 perangkat (Admin issues → Server validates → DB locks)

---

## Ringkasan Perubahan

| File | Status | Deskripsi |
|------|--------|-----------|
| `sql/pkg_activation_v2_tahap2.sql` | **BARU** | Audit log table + 5 enhanced/new RPCs |
| `supabase_sync.js` | **MODIFIED** | +3 RPC methods (stats, detail, enhanced list) |
| `app.js` | **MODIFIED** | `viewKelolaAktivasi()` rewrite 407→804 baris |
| `sw.js` | **MODIFIED** | Cache version bump → `pkg-v2-2026-08-19-tahap2` |
| `auth.js` | Tidak berubah | Sudah aman dari Tahap 1 |
| `github_sync.js` | Tidak berubah | Sudah netral dari Tahap 1 |

---

## A. SQL Migration (`sql/pkg_activation_v2_tahap2.sql`)

### Tabel Baru: `pkg_activation_audit_logs`
- `id` (UUID PK)
- `admin_user_id` (FK → auth.users)
- `action` (`CREATE_CODE`, `REVOKE_CODE`, `VIEW_DETAIL`)
- `activation_code_id` (UUID)
- `details` (JSONB)
- `created_at` (timestamptz)
- RLS: Admin-only SELECT, tidak ada INSERT/UPDATE/DELETE langsung (hanya via SECURITY DEFINER RPC)

### RPC: `admin_create_activation_code` (ENHANCED)
- **Tahap 1:** `(p_nama_pengguna, p_madrasah, p_kabupaten, p_catatan)`
- **Tahap 2:** `(p_nama_pengguna, p_madrasah, p_kabupaten, p_catatan, p_role)` ← +p_role
- Returns: `(code_id, code, code_hint, status, created_at)`
- Audit log: INSERT otomatis ke `pkg_activation_audit_logs`

### RPC: `admin_list_activation_codes` (ENHANCED)
- **Tahap 1:** `()` — no params, return all
- **Tahap 2:** `(p_status, p_role, p_search, p_page, p_limit)` — search, filter, pagination
- Returns: 13 columns + `total_count` (untuk pagination)
- Search: `code_hint`, `nama_pengguna`, `madrasah`, `kabupaten`, `username`
- Filter: status (`unused`/`activated`/`revoked`), role (`kamad`/`pengawas`)
- Pagination: `LIMIT p_limit OFFSET (p_page-1)*p_limit`, default 25, max 100

### RPC: `admin_activation_stats` (NEW)
- Params: `()`
- Returns: `(total, unused, activated, revoked)` — 4 angka statistik
- Admin-only via RLS check

### RPC: `admin_get_code_detail` (NEW)
- Params: `(p_code_id UUID)`
- Returns: 15 columns (full detail termasuk `device_info`)
- Admin-only via RLS check

### RPC: `admin_revoke_activation_code` (UPDATED)
- Signature tidak berubah
- **Tahap 2:** + audit log INSERT ke `pkg_activation_audit_logs`

---

## B. `supabase_sync.js` — RPC Methods

### API Surface

```javascript
window.SupabaseSync = {
  // User activation (anon)
  activateCode(payload),

  // Admin auth
  adminLogin(email, password),
  adminLogout(),
  getAdminSession(),
  isAdminLoggedIn(),
  isSessionExpired(),          // NEW — check JWT exp

  // Admin RPCs
  adminCreateCode(payload),    // ENHANCED (+ p_role)
  adminListCodes(opts),        // ENHANCED (search, filter, pagination)
  adminRevokeCode(codeId),    // UPDATED (audit log)
  adminActivationStats(),      // NEW
  adminGetCodeDetail(codeId),  // NEW

  // Utils
  parseDeviceInfo(ua),         // NEW — parse userAgent
  MSG,                         // Error message constants
};
```

### Session Expiry Detection
- `isSessionExpired()` — decode JWT, check `exp` claim, 30s buffer
- `handleRpcError()` — detect 401/403 → auto logout + return `sessionExpired: true`
- UI handler: `handleSessionExpired()` → show toast, redirect to login

### `adminListCodes()` Payload
```javascript
{
  status: 'unused' | 'activated' | 'revoked' | null,
  role:   'kamad' | 'pengawas' | null,
  search: string | null,
  page:   number (default 1),
  limit:  number (default 25, max 100),
}
```
Returns: `{ ok: true, codes: [...], total: number }`

### `adminCreateCode()` Payload
```javascript
{
  nama_pengguna: string,
  madrasah:      string | null,
  kabupaten:     string | null,
  catatan:       string | null,
  role:          string | null,
}
```
Returns: `{ ok: true, code: 'PKG-XXXX-XXXX-XXXX-XXXX', code_id, code_hint, status, created_at }`

---

## C. `app.js` — `viewKelolaAktivasi()` (804 baris)

### UI Components

1. **Login Screen** — Email + password admin (Supabase Auth)
2. **Stats Dashboard** — 4 kartu: Total, Belum Digunakan, Sudah Digunakan, Dinonaktifkan
3. **Create Code Button** → Modal form (nama, madrasah, kabupaten, role, catatan)
4. **Search Bar** — debounce 400ms, search: code_hint/nama/madrasah/kabupaten/username
5. **Filter Dropdown** — Status (unused/activated/revoked), Role (kamad/pengawas)
6. **Sort Dropdown** — Terbaru (desc), Terlama (asc)
7. **Table (Desktop)** — 10 kolom: No, Kode, Status, Nama, Madrasah, Role, Dibuat, Diaktifkan, Perangkat, Aksi
8. **Cards (Mobile)** — Responsive card layout
9. **Pagination** — Prev/Next + page numbers (max 5), page info
10. **Detail Modal** — Full info: kode, status, timestamps, pemilik, perangkat (browser/OS/tipe), catatan
11. **Code Result Modal** — Plaintext code shown once + copy button + warning
12. **Revoke Confirm Modal** — Konfirmasi dengan info kode
13. **Toast Notifications** — Success/danger/warning/info

### Security Features
- Server-side admin check via `pkg_admins` table (RLS)
- JWT session expiry detection (30s buffer)
- Auto-logout on 401/403
- Code shown once, then masked (`code_hint` = `****` + last 4)
- Device ID masked in table (first 12 chars + `...`)
- Double-click protection on create button
- `escapeHtml` pada semua user input display

### Badge System
- `unused` → `bg-warning text-dark` "Belum Digunakan"
- `activated` → `bg-success` "Sudah Digunakan"
- `revoked` → `bg-danger` "Dinonaktifkan"

---

## D. `sw.js` — Cache Version

```javascript
const CACHE_VERSION = 'pkg-v2-2026-08-19-tahap2';
```

---

## E. Setup Instructions

### Langkah 1: Run SQL Migration
1. Buka Supabase Dashboard → SQL Editor
2. Pastikan **Tahap 1** (`sql/pkg_activation_v2.sql`) sudah dijalankan
3. Paste isi `sql/pkg_activation_v2_tahap2.sql`
4. Click **Run**
5. Verify:
   ```sql
   SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'pkg_%';
   -- Harus muncul: pkg_activation_codes, pkg_admins, pkg_activation_audit_logs, pkg_aktivasi_log
   ```

### Langkah 2: Verify RPCs
```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name LIKE 'admin_%'
ORDER BY routine_name;
-- Harus muncul: admin_activation_stats, admin_create_activation_code,
-- admin_get_code_detail, admin_list_activation_codes, admin_revoke_activation_code
```

### Langkah 3: Push to GitHub Pages
```bash
cd pkg-app-spa
git add -A
git commit -m "Tahap 2: Admin Menu Kelola Kode Aktivasi (stats, search, filter, pagination, detail, audit log)"
git push
```

---

## F. Acceptance Tests (10 Tests)

### Test 1: Admin Login
1. Buka app → Login sebagai user dengan role `admin`
2. Buka menu Kelola Kode Aktivasi
3. Masukkan email + password admin Supabase
4. **Expected:** Login berhasil, panel muncul dengan stats 0

### Test 2: Create Code (Success)
1. Klik "+ Buat Kode Aktivasi"
2. Isi: Nama="Test Kamad", Madrasah="MTsN 1 Jember", Kabupaten="Jember", Role="kamad"
3. Klik "Buat Kode"
4. **Expected:** Modal hasil muncul dengan kode `PKG-XXXX-XXXX-XXXX-XXXX`
5. Klik "Salin Kode" → clipboard berisi kode
6. Tutup modal → list refresh, kode baru muncul di tabel

### Test 3: Code Masked After Close
1. Setelah Test 2, tutup modal hasil
2. Lihat di tabel → kolom Kode
3. **Expected:** Kode ditampilkan sebagai `****XXXX` (last 4), bukan kode lengkap

### Test 4: Search Codes
1. Buat 3 kode dengan nama berbeda ("Andi", "Budi", "Citra")
2. Ketik "Andi" di search bar
3. **Expected:** Hanya kode dengan nama "Andi" yang muncul
4. Clear search → semua kode muncul

### Test 5: Filter by Status
1. Pastikan ada 1 kode `unused` dan 1 kode `activated` (aktifkan salah satu)
2. Pilih filter Status="unused"
3. **Expected:** Hanya kode `unused` yang muncul
4. Ganti filter="activated" → hanya kode `activated`

### Test 6: Pagination
1. Buat >25 kode
2. **Expected:** Pagination muncul, halaman 1 menampilkan 25 kode
3. Klik halaman 2 → kode halaman 2 muncul
4. Klik Prev → kembali ke halaman 1

### Test 7: Detail Modal
1. Klik tombol Detail (ikon mata) pada salah satu kode
2. **Expected:** Modal detail muncul dengan info lengkap:
   - Kode (masked), status, timestamps
   - Nama, username, madrasah, kabupaten, role
   - Device ID, device info (browser/OS/tipe) jika sudah activated
   - Catatan admin

### Test 8: Revoke Code
1. Pilih kode dengan status `unused`
2. Klik tombol Revoke (ikon x)
3. **Expected:** Modal konfirmasi muncul
4. Klik "Nonaktifkan"
5. **Expected:** Toast sukses, status kode berubah menjadi "Dinonaktifkan"
6. Verify di DB:
   ```sql
   SELECT action, details FROM pkg_activation_audit_logs ORDER BY created_at DESC LIMIT 1;
   -- Harus muncul: action='REVOKE_CODE'
   ```

### Test 9: Session Expiry
1. Login sebagai admin
2. Tunggu sampai JWT expired (atau hapus manual session di Supabase)
3. Lakukan aksi (create/list/revoke)
4. **Expected:** Toast "Sesi Admin telah berakhir", auto-redirect ke login screen

### Test 10: Stats Dashboard
1. Buat 5 kode, aktifkan 2, revoke 1
2. Refresh panel
3. **Expected:** Stats menampilkan: Total=5, Belum Digunakan=2, Sudah Digunakan=2, Dinonaktifkan=1

---

## G. Security Checklist

- [x] Tidak ada `ACTIVATION_SALT` di frontend
- [x] Tidak ada `ADMIN_MASTER_CODE` di frontend
- [x] Tidak ada `TRIAL_CODE` di frontend
- [x] Tidak ada `generateActivationCode()` di frontend
- [x] Tidak ada `service_role` key di frontend
- [x] Tidak ada password hardcoded
- [x] Semua admin RPC cek `auth.uid()` + `pkg_admins` table
- [x] Audit log untuk semua aksi admin (create, revoke)
- [x] RLS pada `pkg_activation_audit_logs` (admin-only SELECT)
- [x] Kode ditampilkan sekali, lalu masked
- [x] Device ID masked di UI
- [x] Session expiry detection + auto-logout
- [x] Fail-closed pada network error (Tahap 1, tetap berlaku)
- [x] 1 kode = 1 aktivasi = 1 perangkat (Tahap 1, tetap berlaku)

---

## H. Audit Log Table

```sql
SELECT * FROM pkg_activation_audit_logs ORDER BY created_at DESC;
```

| id | admin_user_id | action | activation_code_id | details | created_at |
|----|---------------|--------|-------------------|---------|------------|
| ... | UUID | CREATE_CODE | UUID | `{"code_hint":"****1234","nama_pengguna":"Test",...}` | 2026-08-19 19:50:00 |
| ... | UUID | REVOKE_CODE | UUID | `{"previous_status":"unused","code_hint":"****1234"}` | 2026-08-19 19:51:00 |

---

**Dibuat oleh:** Bari (AI Assistant)
**Untuk:** Yanto (Subariyanto, S.Pd., M.Pd.I.)
**Status:** Siap deploy
