# Keamanan Sistem Aktivasi PKG

## Prinsip Keamanan

**1 kode = 1 aktivasi = 1 perangkat = 1 device key**

- Server adalah source of truth untuk aktivasi pertama
- Kode dibuat oleh Admin via Supabase RPC (bukan frontend JS)
- Kode disimpan sebagai SHA-256 hash (bukan plaintext)
- Private key device TIDAK PERNAH keluar dari browser
- Fail closed: jika server tidak bisa dihubungi saat aktivasi pertama, aktivasi DITOLAK
- Setelah aktivasi, aplikasi bekerja offline tanpa hubungi server

## Arsitektur Keamanan

### Server-Side (Supabase)
- **RLS (Row-Level Security)**: semua tabel diakses hanya via RPC SECURITY DEFINER
- **Admin auth**: Supabase Auth + tabel `pkg_admins` (FK ke `auth.users`)
- **Rate limiting**: 5 percobaan gagal / 10 menit / per device+IP
- **Audit log**: semua aksi tercatat (aktivasi sukses/gagal, create, revoke, replace, dll)
- **Row-level locking**: `SELECT FOR UPDATE` mencegah race condition

### Client-Side (Browser)
- **Web Crypto API**: ECDSA P-256 key pair, `extractable=false`
- **IndexedDB**: private key disimpan sebagai CryptoKey object (bukan serialisasi)
- **Public key**: dikirim ke server saat aktivasi, disimpan di `pkg_activation_codes.device_public_key`
- **Device ID**: `crypto.randomUUID()` sebagai installation identifier
- **Challenge-response**: admin bisa verifikasi identitas device via signature

### Yang TIDAK Ada di Frontend
- ❌ `ACTIVATION_SALT` — dihapus
- ❌ `ADMIN_MASTER_CODE` — dihapus
- ❌ `TRIAL_CODE` — dihapus
- ❌ `service_role` key — tidak pernah ada di frontend
- ❌ `github_pat` — dinonaktifkan
- ❌ Hardcoded admin password — tidak ada
- ❌ `codes.json` — bukan source of truth lagi
- ❌ Private key di localStorage/sessionStorage — tidak pernah

## Audit Log

Semua aksi berikut tercatat di `pkg_activation_audit_logs`:
- `CREATE_CODE` — admin membuat kode baru
- `ACTIVATE_CODE` — aktivasi berhasil
- `FAILED_ACTIVATION` — aktivasi gagal (kode invalid/revoked/already used)
- `REVOKE_CODE` — admin menonaktifkan kode
- `DEVICE_REPLACEMENT` — admin ganti perangkat
- `DEVICE_VERIFICATION_SUCCESS` / `DEVICE_VERIFICATION_FAILED`
- `RATE_LIMITED` — percobaan diblokir rate limiter
- `ADMIN_LOGIN` / `ADMIN_LOGOUT`
- `EXPORT_DATA` / `EXPORT_AUDIT_LOG`

### Yang TIDAK Disimpan di Audit Log
- ❌ Plaintext code
- ❌ Password
- ❌ Token
- ❌ Private key
- ❌ Public key

## Rate Limiting

- **Server-side** di tabel `pkg_rate_limits`
- **Threshold**: 5 percobaan gagal dalam 10 menit
- **Lock duration**: 10 menit dari percobaan terakhir
- **Key**: `device_id` + IP address
- **No permanent blacklist**: lock hilang otomatis
- **Reset on success**: rate limit dibersihkan saat aktivasi berhasil

## Export Data

Export CSV **TIDAK** mengandung:
- ❌ `code_hash`
- ❌ Plaintext code
- ❌ `device_public_key`
- ❌ Token
- ❌ Private key

Export hanya berisi: `code_hint`, `status`, `nama_pengguna`, `madrasah`, `role`, `device_id`, `device_info`, `created_at`, `activated_at`, `revoked_at`, `catatan`.

## Verifikasi Device Key (Challenge-Response)

1. Admin klik "Verifikasi Device Key" di detail kode
2. Server generate random challenge (anti-replay, 5 menit expiry)
3. Pengguna buka aplikasi → device private key menandatangani challenge
4. Signature dikirim ke server
5. Admin verifikasi signature client-side menggunakan public key

**Anti-replay**: challenge hanya bisa digunakan sekali, expired setelah 5 menit.

## Ganti Perangkat

1. Admin klik "Ganti Perangkat" di detail kode (harus status `activated`)
2. Pilih alasan (HP hilang/rusak/ganti/reset/Lainnya)
3. RPC `admin_replace_device` secara atomik:
   - Revoke kode lama (status → `revoked`, isi `revoked_reason`)
   - Generate kode baru
   - Tautkan via `replaced_activation_id` / `replacement_for`
4. Kode baru diberikan ke pengguna

**Tidak ada reset/re-activation**: 1 kode = 1 device permanen.

## Jika Secrets Pernah Terpublish

Jika `ACTIVATION_SALT`, `ADMIN_MASTER_CODE`, atau password pernah ada di git history:
- **Harus dirotasi** semua kode yang pernah dibuat dengan sistem lama
- Git history tidak bersih hanya dengan menghapus di commit terakhir
- Lakukan `git filter-branch` atau `BFG Repo-Cleaner` jika perlu

## CSP (Content-Security-Policy)

Meta tag CSP di `index.html` membatasi:
- `default-src 'self'` — hanya resource dari origin sendiri
- `script-src 'self'` — tidak ada inline script, tidak ada eval()
- `connect-src 'self' https://veezuitkavznfipyyxln.supabase.co` — hanya Supabase
- `style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net` — Bootstrap CDN
- `img-src 'self' data: https:` — data URI dan HTTPS images

## Setup Admin

Lihat `docs/admin-setup.md` untuk instruksi setup akun admin.
