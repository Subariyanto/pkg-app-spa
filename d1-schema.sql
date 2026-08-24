-- ============================================================
-- D1 Schema — PKG App SPA Backend (Cloudflare Workers + D1)
-- Jalankan di: Cloudflare Dashboard > D1 > query console
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

-- 3. Insert admin default
--    Password: @riyant1970
--    SHA-256: 1fe822ee3c970bb86b48d7519a9bc25eef1d31fa5267a6cf41892d818eb1ef40
INSERT INTO pkg_admins (username, password_hash, nama, role)
VALUES (
  'admin',
  '1fe822ee3c970bb86b48d7519a9bc25eef1d31fa5267a6cf41892d818eb1ef40',
  'Subariyanto',
  'admin'
)
ON CONFLICT(username) DO UPDATE SET
  password_hash = excluded.password_hash,
  nama = excluded.nama;

-- 4. Cek hasil
SELECT * FROM pkg_admins;
