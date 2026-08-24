-- ============================================================
-- SQL untuk Supabase SQL Editor
-- Setup akun admin untuk PKG App SPA
-- Jalankan SEMUA query di bawah ini di Supabase SQL Editor
-- ============================================================

-- 1. Buat tabel pkg_admins (kalau belum ada)
CREATE TABLE IF NOT EXISTS pkg_admins (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- SHA-256 hash
  nama TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Buat tabel pkg_activation_codes (kalau belum ada)
CREATE TABLE IF NOT EXISTS pkg_activation_codes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  nama TEXT,
  madrasah TEXT,
  kabupaten TEXT,
  role TEXT,
  catatan TEXT,
  device_id TEXT,
  activated BOOLEAN DEFAULT FALSE,
  activated_at TIMESTAMPTZ,
  revoked BOOLEAN DEFAULT FALSE,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE pkg_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE pkg_activation_codes ENABLE ROW LEVEL SECURITY;

-- 4. Policy: allow anon to call RPC (via service_role bypass RLS)
-- RPC functions run with SECURITY DEFINER, jadi RLS tidak masalah

-- 5. Buat RPC function: admin_login
--    Cek username + password_hash (SHA-256) di tabel pkg_admins
CREATE OR REPLACE FUNCTION admin_login(p_username TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin RECORD;
  v_hash TEXT;
BEGIN
  -- Hash password input dengan SHA-256
  v_hash := encode(digest(p_password, 'sha256'), 'hex');
  
  SELECT * INTO v_admin FROM pkg_admins WHERE username = p_username LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'message', 'Username tidak ditemukan');
  END IF;
  
  IF v_admin.password_hash != v_hash THEN
    RETURN json_build_object('ok', false, 'message', 'Password salah');
  END IF;
  
  RETURN json_build_object(
    'ok', true,
    'username', v_admin.username,
    'nama', v_admin.nama,
    'role', v_admin.role
  );
END;
$$;

-- 6. Insert akun admin default
--    Password: @riyant1970
--    SHA-256 hash: 1fe822ee3c970bb86b48d7519a9bc25eef1d31fa5267a6cf41892d818eb1ef40
INSERT INTO pkg_admins (username, password_hash, nama, role)
VALUES (
  'admin',
  '1fe822ee3c970bb86b48d7519a9bc25eef1d31fa5267a6cf41892d818eb1ef40',
  'Subariyanto',
  'admin'
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  nama = EXCLUDED.nama,
  role = EXCLUDED.role;

-- 7. Buat RPC function: admin_create_activation_code
CREATE OR REPLACE FUNCTION admin_create_activation_code(
  p_nama TEXT, p_madrasah TEXT, p_kabupaten TEXT,
  p_role TEXT, p_catatan TEXT, p_admin_username TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code TEXT;
  v_id BIGINT;
BEGIN
  -- Generate random code
  v_code := substr(encode(gen_random_bytes(12), 'hex'), 1, 16);
  
  INSERT INTO pkg_activation_codes (code, nama, madrasah, kabupaten, role, catatan, created_by)
  VALUES (v_code, p_nama, p_madrasah, p_kabupaten, p_role, p_catatan, p_admin_username)
  RETURNING id INTO v_id;
  
  RETURN json_build_object('ok', true, 'code', v_code, 'id', v_id);
END;
$$;

-- 8. Buat RPC function: admin_list_activation_codes
CREATE OR REPLACE FUNCTION admin_list_activation_codes(p_admin_username TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN json_build_object(
    'ok', true,
    'data', COALESCE(
      (SELECT json_agg(row_to_json(t)) FROM (
        SELECT id, code, nama, madrasah, kabupaten, role, catatan,
               device_id, activated, activated_at, revoked, created_by, created_at
        FROM pkg_activation_codes
        ORDER BY created_at DESC
      ) t),
      '[]'::json
    )
  );
END;
$$;

-- 9. Buat RPC function: admin_revoke_activation_code
CREATE OR REPLACE FUNCTION admin_revoke_activation_code(p_code_id BIGINT, p_admin_username TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE pkg_activation_codes SET revoked = true WHERE id = p_code_id;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'message', 'Kode tidak ditemukan');
  END IF;
  RETURN json_build_object('ok', true);
END;
$$;

-- 10. Buat RPC function: admin_edit_activation_code
CREATE OR REPLACE FUNCTION admin_edit_activation_code(
  p_code_id BIGINT, p_admin_username TEXT,
  p_nama TEXT, p_madrasah TEXT, p_kabupaten TEXT,
  p_role TEXT, p_catatan TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE pkg_activation_codes
  SET nama = p_nama, madrasah = p_madrasah, kabupaten = p_kabupaten,
      role = p_role, catatan = p_catatan
  WHERE id = p_code_id;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'message', 'Kode tidak ditemukan');
  END IF;
  RETURN json_build_object('ok', true);
END;
$$;

-- 11. Buat RPC function: admin_delete_activation_code
CREATE OR REPLACE FUNCTION admin_delete_activation_code(p_code_id BIGINT, p_admin_username TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM pkg_activation_codes WHERE id = p_code_id;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'message', 'Kode tidak ditemukan');
  END IF;
  RETURN json_build_object('ok', true);
END;
$$;

-- 12. Buat RPC function: admin_delete_all_codes
CREATE OR REPLACE FUNCTION admin_delete_all_codes(p_admin_username TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM pkg_activation_codes WHERE activated = false AND revoked = false;
  RETURN json_build_object('ok', true);
END;
$$;

-- 13. Buat RPC function: admin_stats
CREATE OR REPLACE FUNCTION admin_stats(p_admin_username TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN json_build_object(
    'ok', true,
    'total', (SELECT COUNT(*) FROM pkg_activation_codes),
    'unused', (SELECT COUNT(*) FROM pkg_activation_codes WHERE activated = false AND revoked = false),
    'activated', (SELECT COUNT(*) FROM pkg_activation_codes WHERE activated = true),
    'revoked', (SELECT COUNT(*) FROM pkg_activation_codes WHERE revoked = true)
  );
END;
$$;

-- 14. Buat RPC function: activate_code (untuk aktivasi kode oleh pengguna)
CREATE OR REPLACE FUNCTION activate_code(p_code TEXT, p_device_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code RECORD;
BEGIN
  SELECT * INTO v_code FROM pkg_activation_codes WHERE code = p_code LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'message', 'Kode aktivasi tidak ditemukan');
  END IF;
  
  IF v_code.revoked THEN
    RETURN json_build_object('ok', false, 'message', 'Kode aktivasi telah dicabut (revoke) oleh Admin');
  END IF;
  
  IF v_code.activated THEN
    IF v_code.device_id = p_device_id THEN
      RETURN json_build_object('ok', true, 'nama', v_code.nama, 'madrasah', v_code.madrasah, 'kabupaten', v_code.kabupaten, 'role', v_code.role);
    ELSE
      RETURN json_build_object('ok', false, 'message', 'Kode sudah dipakai di perangkat lain');
    END IF;
  END IF;
  
  UPDATE pkg_activation_codes
  SET activated = true, activated_at = NOW(), device_id = p_device_id
  WHERE id = v_code.id;
  
  RETURN json_build_object(
    'ok', true,
    'nama', v_code.nama,
    'madrasah', v_code.madrasah,
    'kabupaten', v_code.kabupaten,
    'role', v_code.role
  );
END;
$$;

-- ============================================================
-- SELESAI
-- Cek hasilnya:
SELECT * FROM pkg_admins;
-- ============================================================
