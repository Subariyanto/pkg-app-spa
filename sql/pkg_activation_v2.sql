-- ======================================================================
-- pkg_activation_v2.sql — Activation Security Overhaul (v2)
-- Project: pkg-pokjawas (https://veezuitkavznfipyyxln.supabase.co)
--
-- PRINSIP: 1 kode aktivasi = 1 kali aktivasi = 1 perangkat.
-- Server (PostgreSQL + Supabase) adalah source of truth untuk aktivasi pertama.
-- Kode hanya dibuat oleh Admin via RPC, disimpan sebagai SHA-256 hash.
-- Tidak ada akses langsung anon ke tabel.
-- ======================================================================

-- ======================================================================
-- 0. DEPRECATED: Tabel lama pkg_aktivasi_log
-- ======================================================================
comment on table if exists public.pkg_aktivasi_log is
  'DEPRECATED sejak pkg_activation_v2. Tabel lama relay aktivasi client-side. Tidak digunakan lagi sebagai sumber utama aktivasi. Lihat pkg_activation_codes.';

-- ======================================================================
-- 1. TABEL UTAMA: pkg_activation_codes
-- ======================================================================
create table if not exists public.pkg_activation_codes (
  id              uuid        primary key default gen_random_uuid(),
  code_hash       text        not null unique,
  code_hint       text,
  status          text        not null default 'unused'
                              check (status in ('unused','activated','revoked')),
  device_id       text,
  nama_pengguna   text,
  username        text,
  madrasah        text,
  kabupaten       text,
  role            text,
  created_by      uuid,
  created_at      timestamptz not null default now(),
  activated_at    timestamptz,
  revoked_at      timestamptz,
  device_info     text,
  catatan         text
);

create index if not exists idx_pkg_act_codes_hash   on public.pkg_activation_codes (code_hash);
create index if not exists idx_pkg_act_codes_status  on public.pkg_activation_codes (status);
create index if not exists idx_pkg_act_codes_device  on public.pkg_activation_codes (device_id);

-- ======================================================================
-- 2. TABEL ADMIN: pkg_admins
-- ======================================================================
create table if not exists public.pkg_admins (
  user_id     uuid        primary key references auth.users(id) on delete cascade,
  nama        text,
  role        text        not null default 'admin'
                            check (role in ('admin')),
  created_at  timestamptz not null default now()
);

-- ======================================================================
-- 3. RLS — NO direct anon access to pkg_activation_codes
-- ======================================================================
alter table public.pkg_activation_codes enable row level security;

-- Hapus policy lama jika ada
drop policy if exists "pkg_act_codes_anon_all" on public.pkg_activation_codes;
-- TIDAK ADA policy untuk anon. Semua akses melalui RPC.

-- Admin (authenticated yang ada di pkg_admins) boleh SELECT
drop policy if exists "pkg_act_codes_admin_select" on public.pkg_activation_codes;
create policy "pkg_act_codes_admin_select"
  on public.pkg_activation_codes for select
  to authenticated
  using (exists (select 1 from public.pkg_admins where user_id = auth.uid()));

-- Admin boleh UPDATE (untuk revoke via RPC, meskipun RPC sudah handle)
drop policy if exists "pkg_act_codes_admin_update" on public.pkg_activation_codes;
create policy "pkg_act_codes_admin_update"
  on public.pkg_activation_codes for update
  to authenticated
  using (exists (select 1 from public.pkg_admins where user_id = auth.uid()))
  with check (exists (select 1 from public.pkg_admins where user_id = auth.uid()));

-- ======================================================================
-- 4. RLS untuk pkg_admins — admin bisa lihat daftar admin
-- ======================================================================
alter table public.pkg_admins enable row level security;

drop policy if exists "pkg_admins_self_select" on public.pkg_admins;
create policy "pkg_admins_self_select"
  on public.pkg_admins for select
  to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.pkg_admins a2 where a2.user_id = auth.uid()));

-- ======================================================================
-- 5. HELPER FUNCTION: crypto-secure activation code generator
-- Format: PKG-XXXX-XXXX-XXXX-XXXX (16 alphanumeric chars, uppercase)
-- ======================================================================
create or replace function public._generate_activation_code()
returns text
language plpgsql
as $$
declare
  chars    text   := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- no I,O,0,1 (ambiguous)
  segments text[] := array['','','',''];
  seg      int;
  i        int;
  c        char(1);
  code     text;
begin
  for seg in 1..4 loop
    for i in 1..4 loop
      -- gen_random_uuid() provides cryptographically secure randomness
      c := substr(chars, 1 + (ascii(substr(md5(gen_random_uuid()::text || seg::text || i::text), 1, 1)) % length(chars)), 1);
      segments[seg] := segments[seg] || c;
    end loop;
  end loop;
  code := 'PKG-' || segments[1] || '-' || segments[2] || '-' || segments[3] || '-' || segments[4];
  return code;
end;
$$;

-- ======================================================================
-- 6. RPC: admin_create_activation_code
-- Hanya admin (terdaftar di pkg_admins) yang bisa membuat kode.
-- Kode plaintext hanya dikembalikan SATU kali saat dibuat.
-- Database menyimpan SHA-256 hash + hint (4 huruf terakhir).
-- ======================================================================
create or replace function public.admin_create_activation_code(
  p_nama_pengguna text default null,
  p_madrasah      text default null,
  p_kabupaten     text default null,
  p_catatan       text default null
)
returns table (
  code_id    uuid,
  code       text,
  code_hint  text,
  status     text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_uid   uuid := auth.uid();
  v_is_admin    boolean;
  v_code        text;
  v_code_hash   text;
  v_code_hint   text;
  v_id          uuid;
  v_created_at  timestamptz;
begin
  -- 1. Verifikasi pemanggil adalah admin
  select exists(select 1 from public.pkg_admins where user_id = v_admin_uid) into v_is_admin;
  if not v_is_admin then
    raise exception 'UNAUTHORIZED: pemanggil bukan admin terdaftar' using errcode = '42501';
  end if;

  -- 2. Generate unique code (collision-safe, retry on dup)
  v_code := public._generate_activation_code();
  v_code_hash := encode(digest(v_code, 'sha256'), 'hex');
  v_code_hint := '****' || right(v_code, 4);

  -- Loop jika collision (sangat jarang)
  <<gen_loop>> loop
    begin
      insert into public.pkg_activation_codes (code_hash, code_hint, status, nama_pengguna, madrasah, kabupaten, catatan, created_by, created_at)
      values (v_code_hash, v_code_hint, 'unused', p_nama_pengguna, p_madrasah, p_kabupaten, p_catatan, v_admin_uid, now())
      returning id, created_at into v_id, v_created_at;
      exit gen_loop;
    exception when unique_violation then
      v_code := public._generate_activation_code();
      v_code_hash := encode(digest(v_code, 'sha256'), 'hex');
      v_code_hint := '****' || right(v_code, 4);
    end;
  end loop gen_loop;

  return query select v_id, v_code, v_code_hint, 'unused'::text, v_created_at;
end;
$$;

-- ======================================================================
-- 7. RPC: activate_pkg_code — ATOMIC activation
-- Returns: ACTIVATED | ALREADY_USED | REVOKED | INVALID_CODE
-- ======================================================================
create or replace function public.activate_pkg_code(
  p_code          text,
  p_device_id     text,
  p_nama_pengguna text default null,
  p_username      text default null,
  p_madrasah      text default null,
  p_kabupaten     text default null,
  p_role          text default null,
  p_device_info   text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code_hash   text;
  v_row         public.pkg_activation_codes%rowtype;
  v_result      text;
begin
  -- 1. Hash kode yang dikirim user
  v_code_hash := encode(digest(upper(trim(p_code)), 'sha256'), 'hex');

  -- 2. Lock row untuk mencegah race condition (FOR UPDATE)
  --    Cari by code_hash, lock if found
  select * into v_row
  from public.pkg_activation_codes
  where code_hash = v_code_hash
  for update;  -- UPDATE lock prevents concurrent activation

  -- 3. Kondisi A: kode tidak ditemukan
  if not found then
    return 'INVALID_CODE';
  end if;

  -- 4. Kondisi B: kode berstatus revoked
  if v_row.status = 'revoked' then
    return 'REVOKED';
  end if;

  -- 5. Kondisi C: kode sudah activated
  if v_row.status = 'activated' then
    return 'ALREADY_USED';
  end if;

  -- 6. Kondisi D: kode unused → activate atomically
  if v_row.status = 'unused' then
    update public.pkg_activation_codes
    set
      status         = 'activated',
      device_id      = p_device_id,
      nama_pengguna  = p_nama_pengguna,
      username       = p_username,
      madrasah       = p_madrasah,
      kabupaten      = p_kabupaten,
      role           = p_role,
      device_info    = p_device_info,
      activated_at   = now()
    where id = v_row.id;

    return 'ACTIVATED';
  end if;

  -- Fallback (shouldn't reach here)
  return 'INVALID_CODE';
end;
$$;

-- ======================================================================
-- 8. RPC: admin_list_activation_codes — daftar semua kode (admin only)
-- ======================================================================
create or replace function public.admin_list_activation_codes()
returns table (
  id             uuid,
  code_hint      text,
  status         text,
  nama_pengguna  text,
  madrasah       text,
  kabupaten      text,
  role           text,
  device_id      text,
  username       text,
  created_at     timestamptz,
  activated_at   timestamptz,
  revoked_at     timestamptz,
  catatan        text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_uid uuid := auth.uid();
  v_is_admin  boolean;
begin
  select exists(select 1 from public.pkg_admins where user_id = v_admin_uid) into v_is_admin;
  if not v_is_admin then
    raise exception 'UNAUTHORIZED: pemanggil bukan admin terdaftar' using errcode = '42501';
  end if;

  return query
  select
    c.id, c.code_hint, c.status, c.nama_pengguna, c.madrasah, c.kabupaten,
    c.role, c.device_id, c.username, c.created_at, c.activated_at, c.revoked_at, c.catatan
  from public.pkg_activation_codes c
  order by c.created_at desc;
end;
$$;

-- ======================================================================
-- 9. RPC: admin_revoke_activation_code — revoke by code_id (admin only)
-- ======================================================================
create or replace function public.admin_revoke_activation_code(p_code_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_uid uuid := auth.uid();
  v_is_admin  boolean;
  v_row       public.pkg_activation_codes%rowtype;
begin
  select exists(select 1 from public.pkg_admins where user_id = v_admin_uid) into v_is_admin;
  if not v_is_admin then
    raise exception 'UNAUTHORIZED: pemanggil bukan admin terdaftar' using errcode = '42501';
  end if;

  select * into v_row from public.pkg_activation_codes where id = p_code_id for update;
  if not found then
    return 'NOT_FOUND';
  end if;

  if v_row.status = 'revoked' then
    return 'ALREADY_REVOKED';
  end if;

  update public.pkg_activation_codes
  set status = 'revoked', revoked_at = now()
  where id = p_code_id;

  return 'REVOKED';
end;
$$;

-- ======================================================================
-- 10. REVOKE EXECUTE on helper function dari anon
-- ======================================================================
revoke execute on function public._generate_activation_code() from public, anon;
revoke execute on function public.admin_create_activation_code(text, text, text, text) from public, anon;
revoke execute on function public.activate_pkg_code(text, text, text, text, text, text, text, text) from public, anon;
revoke execute on function public.admin_list_activation_codes() from public, anon;
revoke execute on function public.admin_revoke_activation_code(uuid) from public, anon;

-- Grant execute on public RPCs
-- activate_pkg_code: boleh dipanggil anon (user activation) — SECURITY DEFINER handles auth
grant execute on function public.activate_pkg_code(text, text, text, text, text, text, text, text) to anon, authenticated;

-- admin_create_activation_code, admin_list_activation_codes, admin_revoke_activation_code: authenticated only
grant execute on function public.admin_create_activation_code(text, text, text, text) to authenticated;
grant execute on function public.admin_list_activation_codes() to authenticated;
grant execute on function public.admin_revoke_activation_code(uuid) to authenticated;

-- ======================================================================
-- INSTRUKSI SETUP:
-- 1. Jalankan seluruh SQL ini di Supabase SQL Editor
-- 2. Buat akun Admin di Supabase Auth (Authentication > Users > Add user)
-- 3. Dapatkan user_id admin, lalu INSERT ke pkg_admins:
--    INSERT INTO public.pkg_admins (user_id, nama) VALUES ('<uuid-admin>', 'Subariyanto');
-- 4. Admin login via Supabase Auth (email/password) di aplikasi
-- ======================================================================
