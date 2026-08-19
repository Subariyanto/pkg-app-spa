# Backup & Restore Sistem Aktivasi PKG

## Backup

### 1. Backup Database Supabase
Via Supabase Dashboard → Database → Backup
Atau via SQL Editor export:
```sql
-- Export tabel utama
COPY public.pkg_activation_codes TO '/tmp/pkg_activation_codes.csv' WITH CSV HEADER;
COPY public.pkg_activation_audit_logs TO '/tmp/pkg_audit_logs.csv' WITH CSV HEADER;
COPY public.pkg_admins TO '/tmp/pkg_admins.csv' WITH CSV HEADER;
COPY public.pkg_device_challenges TO '/tmp/pkg_device_challenges.csv' WITH CSV HEADER;
COPY public.pkg_rate_limits TO '/tmp/pkg_rate_limits.csv' WITH CSV HEADER;
```

### 2. Backup Export CSV dari Admin Dashboard
1. Login admin → tab **Dashboard**
2. Klik **Export Data Kode (CSV)** → simpan file
3. Klik **Export Audit Log (CSV)** → simpan file
4. Simpan kedua file di tempat aman

### 3. Backup Otomatis Supabase
Supabase Free/Pro plan sudah termasuk daily automatic backup.
Via Dashboard → Database → Backups.

## Restore

### Via Supabase SQL Editor
```sql
-- Restore dari CSV (sesuaikan path)
COPY public.pkg_activation_codes FROM '/tmp/pkg_activation_codes.csv' WITH CSV HEADER;
COPY public.pkg_activation_audit_logs FROM '/tmp/pkg_audit_logs.csv' WITH CSV HEADER;
```

### Via Supabase Dashboard
Database → Backups → pilih backup point → Restore

## Yang TIDAK Bisa Dibackup

- ❌ **Private key device**: disimpan di IndexedDB browser, tidak bisa di-export (non-exportable)
- ❌ **Plaintext code**: hanya ada saat dibuat, tidak disimpan dimanapun setelah modal ditutup
- ❌ **Password admin**: di Supabase Auth (hashed), tidak bisa di-export

## Recovery Device Key

Jika device key hilang (reset browser, clear cache):
1. Pengguna hubungi admin
2. Admin buka detail kode → **Ganti Perangkat**
3. Admin berikan kode baru ke pengguna
4. Pengguna aktivasi ulang dengan kode baru

**Tidak ada recovery tanpa admin** — ini by design untuk keamanan.
