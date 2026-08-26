-- ============================================================
-- D1 Schema — PKG App SPA Backend (Cloudflare Workers + D1)  [SECURED]
-- Jalankan di: Cloudflare Dashboard > D1 > query console
-- PENTING: Password admin TIDAK lagi ditulis di file ini.
--          Set password lewat Cloudflare Dashboard / perintah UPDATE di bawah.
-- ============================================================

-- 1. Tabel admin
CREATE TABLE IF NOT EXISTS pkg_admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nama TEXT,
  role TEXT DEFAULT 'admin',
  created_at TEXT DEFAULT (datetime('now'))
);

-- 2. Tabel kode aktivasi
CREATE TABLE IF NOT EXISTS pkg_activation_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  nama TEXT,
  madrasah TEXT,
  kabupaten TEXT,
  role TEXT,
  catatan TEXT,
  device_id TEXT,
  activated INTEGER DEFAULT 0,
  activated_at TEXT,
  revoked INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 3. Tabel rate limiting (proteksi brute-force login & aktivasi)
CREATE TABLE IF NOT EXISTS pkg_rate_limit (
  rkey TEXT PRIMARY KEY,
  cnt INTEGER DEFAULT 0,
  reset_at INTEGER NOT NULL
);

-- 4. (OPSIONAL) Ganti password admin.
--    Ganti <USERNAME> dan <SHA256_HASH_PASSWORD> dengan nilai yang kamu inginkan.
--    Daftar admin yang ada: username "admin".
--    Contoh cek hash:  echo -n "passwordbaru" | shasum -a 256
-- UPDATE pkg_admins SET password_hash = '<SHA256_HASH_PASSWORD>' WHERE username = '<USERNAME>';

-- 5. Cek hasil
SELECT * FROM pkg_admins;
