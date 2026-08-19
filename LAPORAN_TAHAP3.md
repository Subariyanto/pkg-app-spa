# LAPORAN TAHAP 3 — Device Identity Strengthening & Activation Recovery

**Tanggal:** 19 Aug 2026
**Repo:** `Subariyanto/pkg-app-spa`
**Prinsip:** 1 kode = 1 aktivasi = 1 perangkat = 1 device key

---

## A. Ringkasan

Tahap 3 memperkuat identitas perangkat dengan kriptografi kunci publik (ECDSA P-256) dan menyediakan alur pemulihan aktivasi via admin.

**Sebelum Tahap 3:** Device binding hanya via FNV hash di localStorage (mudah dipalsukan dengan copy localStorage).

**Sesudah Tahap 3:**
- Private key disimpan di IndexedDB (non-exportable)
- Public key dikirim ke server saat aktivasi
- Challenge-response untuk verifikasi kepemilikan kunci
- Device replacement via Admin (revoke old + issue new code)
- Legacy enrollment untuk user Tahap 1/2 yang belum punya device key
- Periodic server verification (7 hari) untuk deteksi revoke
- Recovery screen jika private key hilang

---

## B. File Changes

### NEW FILES

| File | Lines | Deskripsi |
|------|-------|-----------|
| `activation_device.js` | 604 | Modul Web Crypto + IndexedDB: key pair generation, sign/verify, activation state, legacy enrollment, server verification |
| `sql/pkg_activation_v2_tahap3.sql` | 639 | ALTER TABLE (6 kolom baru), NEW TABLE `pkg_device_challenges`, 5 NEW RPCs, RLS |

### MODIFIED FILES

| File | Lines | Perubahan |
|------|-------|-----------|
| `supabase_sync.js` | 567 | +`getMyActivation`, +`enrollDeviceKey`, +`checkActivationStatus`, +`adminReplaceDevice`, +`adminCreateChallenge`, +`submitChallengeResponse`. `activateCode` sekarang kirim `device_public_key` |
| `auth.js` | 921 | Integrasi `ActivationDevice` di `init()`, `isActivated()`, `performActivation()`. +Recovery screen. +Legacy enrollment. +Server verification. Reset PIN juga hapus IndexedDB |
| `app.js` | 5431 | +Device key info di detail modal. +Tombol "Ganti Perangkat". +Tombol "Verifikasi Device Key". +`showReplaceDeviceModal()`. +`showVerifyDeviceModal()` |
| `sw.js` | 101 | Cache version → `pkg-v3-2026-08-19-tahap3`. +`activation_device.js` di precache |
| `index.html` | — | +`<script src="activation_device.js" defer>` |

---

## C. SQL Migration — `sql/pkg_activation_v2_tahap3.sql`

### ALTER TABLE `pkg_activation_codes`
- `device_public_key` jsonb — public key JWK (ECDSA P-256)
- `device_key_created_at` timestamptz
- `replaced_activation_id` uuid — link ke kode pengganti
- `replacement_for` uuid — link ke kode lama yang diganti
- `revoked_reason` text

### NEW TABLE `pkg_device_challenges`
- `id` uuid PK
- `activation_id` uuid FK
- `challenge` text — random 32-byte hex
- `signature` text
- `expires_at` timestamptz (5 menit)
- `used_at` timestamptz
- RLS: admin-only SELECT, no direct INSERT/UPDATE/DELETE

### RPCs

| RPC | Akses | Fungsi |
|-----|-------|--------|
| `activate_pkg_code` (enhanced) | anon | +param `p_device_public_key` jsonb |
| `enroll_pkg_device_key` | anon | One-time legacy migration: cek activated, device_id match, no existing key |
| `admin_create_device_challenge` | admin | Generate random challenge, 5-min expiry |
| `verify_device_challenge` | anon | Mark challenge used, store signature |
| `admin_replace_device` | admin | Atomic: revoke old + create new code, audit log, replacement chain |
| `check_activation_status` | anon | User-side: returns ACTIVE/REVOKED/NOT_FOUND/DEVICE_MISMATCH |
| `get_my_activation` | anon | Get activation_id by device_id + code |
| `admin_get_code_detail` (enhanced) | admin | +device key + replacement fields |
| `admin_list_activation_codes` (enhanced) | admin | +device key + replacement fields |

---

## D. Alur Aktivasi Baru (Tahap 3)

1. User input kode aktivasi + data registrasi
2. `ActivationDevice.performActivation()`:
   - Generate device ID (`crypto.randomUUID()`)
   - Generate ECDSA P-256 key pair (non-exportable)
   - Private key → IndexedDB
   - Public key JWK → kirim ke server via RPC `activate_pkg_code`
3. Server validasi kode (hash match, status=unused, not revoked)
   - Simpan `device_public_key`, `device_id`, status → activated
4. Frontend query `get_my_activation` untuk dapat `activation_id`
5. Simpan activation state di localStorage
6. Jika gagal → **FAIL CLOSED** (tidak simpan aktivasi)

---

## E. Alur Legacy Enrollment

Untuk user yang sudah aktivasi di Tahap 1/2 (belum punya device key):

1. Saat app init, `checkDeviceKeyIntegrity()` → status OK tapi `deviceKeyEnrolled=false`
2. `tryLegacyEnrollment()`:
   - Generate new key pair
   - Call `enroll_pkg_device_key` RPC
   - RPC cek: activation_id valid, device_id match, belum ada public key
   - Jika ENROLLED → simpan flag
   - Jika ALREADY_ENROLLED → device key tidak cocok → recovery screen

---

## F. Alur Device Replacement (Admin)

1. Admin buka detail kode → klik "Ganti Perangkat"
2. Pilih alasan + catatan
3. `adminReplaceDevice` RPC:
   - Revoke kode lama (status → revoked, revoked_reason)
   - Generate kode baru (unused)
   - Link: `replaced_activation_id` (lama) ↔ `replacement_for` (baru)
   - Audit log
4. Admin berikan kode baru ke pengguna
5. Pengguna aktivasi dengan kode baru di perangkat baru

---

## G. Alur Device Challenge Verification (Admin)

1. Admin buka detail kode → klik "Verifikasi Device Key"
2. `adminCreateChallenge` RPC → generate random 32-byte hex, 5-min expiry
3. User diminta sign challenge dengan private key
4. `submitChallengeResponse` RPC → mark used, store signature
5. Admin verifikasi signature client-side menggunakan public key

---

## H. Security Checklist

- [x] Private key TIDAK PERNAH di localStorage/sessionStorage
- [x] Private key non-exportable (Web Crypto `extractable=false`)
- [x] Public key saja yang dikirim ke server
- [x] No `ACTIVATION_SALT`, `ADMIN_MASTER_CODE`, `TRIAL_CODE`
- [x] No service_role key di frontend
- [x] Fail closed pada network error
- [x] Challenge anti-replay (5-min expiry, single use)
- [x] Device replacement atomic (revoke + create dalam 1 transaksi)
- [x] RLS pada `pkg_device_challenges` (admin-only)
- [x] Audit log untuk semua aksi admin
- [x] Periodic server verification (7 hari)
- [x] Recovery screen untuk device key missing

---

## I. Migration Steps (Manual)

### Step 1: Apply SQL Tahap 1 (jika belum)
Buka Supabase SQL Editor → paste `sql/pkg_activation_v2.sql` → Run

### Step 2: Apply SQL Tahap 2 (jika belum)
Paste `sql/pkg_activation_v2_tahap2.sql` → Run

### Step 3: Apply SQL Tahap 3
Paste `sql/pkg_activation_v2_tahap3.sql` → Run

### Step 4: Verify
```sql
SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'pkg_%';
-- Expected: pkg_activation_codes, pkg_admins, pkg_activation_audit_logs, pkg_aktivasi_log, pkg_device_challenges

SELECT routine_name FROM information_schema.routines WHERE routine_schema='public' AND routine_name LIKE 'admin_%' OR routine_name IN ('activate_pkg_code','enroll_pkg_device_key','verify_device_challenge','check_activation_status','get_my_activation');
-- Expected: 10+ RPCs
```

---

## J. Acceptance Tests

1. **Aktivasi baru dengan device key:** Input kode baru → app generate ECDSA key → server simpan public key → aktivasi sukses → app bekerja offline
2. **Fail closed (network error):** Matikan internet → input kode → aktivasi DITOLAK → tidak ada data lokal tersimpan
3. **Legacy enrollment:** User Tahap 1/2 buka app → auto-generate key → enroll ke server → flag enrolled
4. **Device key missing (recovery):** Hapus IndexedDB → buka app → recovery screen tampil → hubungi Admin
5. **Device replacement (admin):** Admin buka detail → "Ganti Perangkat" → pilih alasan → kode baru muncul → kode lama revoked
6. **Challenge verification (admin):** Admin buat challenge → user sign → submit → admin verify
7. **Periodic verification (7 hari):** Set 7 hari → app cek server → jika revoked → lock app
8. **Kode sudah dipakai:** Coba aktivasi kode yang sudah activated → DITOLAK dengan pesan jelas
9. **Kode revoked:** Admin revoke → user periodic check → app lock
10. **Reset data:** Reset PIN → IndexedDB juga terhapus → app kembali ke aktivasi screen

---

## K. API Reference

### `window.ActivationDevice`
- `getDeviceId()` → string
- `generateKeyPair()` → Promise<{privateKey, publicKey, publicJwk}>
- `loadKeyPair()` → Promise<{privateKey, publicKey} | null>
- `signChallenge(text)` → Promise<base64>
- `verifySignature(text, sigB64, publicJwk)` → Promise<boolean>
- `getActivationState()` → {activated, activationId, deviceId, lastServerVerify, deviceKeyEnrolled}
- `setActivationActive(id, publicJwk)` → void
- `setActivationRevoked()` → void
- `clearActivation()` → void
- `checkDeviceKeyIntegrity()` → Promise<{status, message}>
- `needsServerVerification()` → boolean
- `performServerVerification()` → Promise<{revoked, verified, message}>
- `tryLegacyEnrollment()` → Promise<{enrolled, reason, message}>
- `performActivation(payload)` → Promise<{ok, reason, message, activationId}>

### `window.SupabaseSync` (Tahap 3 additions)
- `getMyActivation(deviceId, code)` → Promise<{ok, activationId, status, deviceKeyEnrolled}>
- `enrollDeviceKey(activationId, deviceId, publicJwk)` → Promise<{ok, status}>
- `checkActivationStatus(activationId, deviceId)` → Promise<{ok, status}>
- `adminReplaceDevice(activationId, reason, catatan)` → Promise<{ok, newCode, newCodeId, newCodeHint}>
- `adminCreateChallenge(activationId)` → Promise<{ok, challengeId, challenge, expiresAt}>
- `submitChallengeResponse(challengeId, sigB64)` → Promise<{ok, status}>
