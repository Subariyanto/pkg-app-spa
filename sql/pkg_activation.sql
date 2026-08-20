-- ======================================================================
-- pkg_activation.sql — Sistem Aktivasi Sederhana (Supabase)
-- Project: pkg-pokjawas (https://veezuitkavznfipyyxln.supabase.co)
-- V3 (2026-08-20): HAPUS pgcrypto dependency — pure PL/pgSQL, no extension.
--
-- PRINSIP:
-- - Kode aktivasi disimpan di Supabase (server-side)
-- - 1 kode = 1 aktivasi = 1 perangkat
-- - Admin login via tabel custom (username + password hash FNV1a)
-- - Data hasil penilaian PKG tetap di localStorage (client-side)
-- - Tidak ada ECDSA, challenge, audit log, rate limiting, device enrollment
-- ======================================================================

-- ======================================================================
-- 0. FNV1a HASH FUNCTION (untuk password admin & code hash)
-- FNV1a 32-bit, output sebagai hex string (8 chars).
-- TIDAK butuh extension pgcrypto — pure PL/pgSQL.
-- ======================================================================
create or replace function public.fnv1a(input text)
returns text
language plpgsql
immutable
as $$
declare
  h bigint := 2166136261;
  b int;
  i int;
  c text;
begin
  for i in 1..length(input) loop
    c := substr(input, i, 1);
    b := ascii(c);
    h := h # b;
    h := (h * 16777619) % 4294967296;
  end loop;
  return lpad(to_hex(h), 8, '0');
end;
$$;

-- ======================================================================
-- 1. TABEL: pkg_admins
-- ======================================================================
create table if not exists public.pkg_admins (
  id            serial primary key,
  username      text not null unique,
  password_hash text not null,
  nama          text,
  created_at    timestamptz not null default now()
);

-- Insert default admin: Subariyanto / @riyant1970 (re-insert jika belum ada)
insert into public.pkg_admins (username, password_hash, nama)
select 'Subariyanto', public.fnv1a('@riyant1970'), 'Subariyanto'
where not exists (select 1 from public.pkg_admins where username = 'Subariyanto');

-- Update password hash jika admin sudah ada tapi hash-nya beda (misal dari SQL lama)
update public.pkg_admins
set password_hash = public.fnv1a('@riyant1970')
where username = 'Subariyanto' and password_hash <> public.fnv1a('@riyant1970');

-- ======================================================================
-- 2. TABEL: pkg_activation_codes
-- ======================================================================
create table if not exists public.pkg_activation_codes (
  id              uuid primary key default gen_random_uuid(),
  code_hash       text not null unique,
  code_full       text,
  code_hint       text,
  status          text not null default 'unused'
                  check (status in ('unused','activated','revoked')),
  device_id       text,
  nama_pengguna   text,
  username        text,
  madrasah        text,
  kabupaten       text,
  role            text,
  created_by      text,
  created_at      timestamptz not null default now(),
  activated_at    timestamptz,
  revoked_at      timestamptz,
  catatan         text
);

-- Add code_full column if not exists (for re-run safety)
alter table public.pkg_activation_codes add column if not exists code_full text;

create index if not exists idx_pkg_act_codes_hash   on public.pkg_activation_codes (code_hash);
create index if not exists idx_pkg_act_codes_status on public.pkg_activation_codes (status);

-- ======================================================================
-- 3. RLS — NO direct access, semua via RPC
-- ======================================================================
alter table public.pkg_admins enable row level security;
alter table public.pkg_activation_codes enable row level security;

-- ======================================================================
-- 4. HELPER: Generate activation code
-- Format: PKG-XXXX-XXXX (8 alphanumeric chars, uppercase, exclude I,O,0,1)
-- ======================================================================
create or replace function public._generate_activation_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  seg1  text := '';
  seg2  text := '';
  i     int;
begin
  for i in 1..4 loop
    seg1 := seg1 || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    seg2 := seg2 || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  return 'PKG-' || seg1 || '-' || seg2;
end;
$$;

-- ======================================================================
-- 5. RPC: admin_login(p_username, p_password)
-- ======================================================================
create or replace function public.admin_login(
  p_username text,
  p_password text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin public.pkg_admins%rowtype;
  v_hash  text;
begin
  select * into v_admin from public.pkg_admins where username = p_username limit 1;
  if not found then
    return json_build_object('ok', false, 'message', 'Username atau password salah');
  end if;

  v_hash := public.fnv1a(p_password);
  if v_hash <> v_admin.password_hash then
    return json_build_object('ok', false, 'message', 'Username atau password salah');
  end if;

  return json_build_object(
    'ok', true,
    'username', v_admin.username,
    'nama', v_admin.nama
  );
end;
$$;

-- ======================================================================
-- 6. RPC: admin_create_activation_code
-- TANPA digest() — pakai fnv1a() untuk code hash
-- ======================================================================
create or replace function public.admin_create_activation_code(
  p_nama            text default null,
  p_madrasah        text default null,
  p_kabupaten       text default null,
  p_role            text default null,
  p_catatan         text default null,
  p_admin_username  text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin   public.pkg_admins%rowtype;
  v_code    text;
  v_hash    text;
  v_hint    text;
  v_id      uuid;
  v_created timestamptz;
begin
  select * into v_admin from public.pkg_admins where username = p_admin_username limit 1;
  if not found then
    return json_build_object('ok', false, 'message', 'UNAUTHORIZED');
  end if;

  v_code := public._generate_activation_code();
  v_hash := public.fnv1a(v_code);
  v_hint := '****' || right(v_code, 4);

  <<gen_loop>> loop
    begin
      insert into public.pkg_activation_codes (code_hash, code_full, code_hint, status, nama_pengguna, madrasah, kabupaten, role, catatan, created_by, created_at)
      values (v_hash, v_code, v_hint, 'unused', p_nama, p_madrasah, p_kabupaten, p_role, p_catatan, v_admin.username, now())
      returning id, created_at into v_id, v_created;
      exit gen_loop;
    exception when unique_violation then
      v_code := public._generate_activation_code();
      v_hash := public.fnv1a(v_code);
      v_hint := '****' || right(v_code, 4);
    end;
  end loop gen_loop;

  return json_build_object(
    'ok', true,
    'code_id', v_id,
    'code', v_code,
    'code_full', v_code,
    'code_hint', v_hint,
    'status', 'unused',
    'created_at', v_created
  );
end;
$$;

-- ======================================================================
-- 7. RPC: activate_pkg_code
-- TANPA digest() — pakai fnv1a()
-- ======================================================================
create or replace function public.activate_pkg_code(
  p_code        text,
  p_device_id   text,
  p_nama        text default null,
  p_username    text default null,
  p_madrasah    text default null,
  p_kabupaten   text default null,
  p_role        text default null,
  p_device_info text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
  v_row  public.pkg_activation_codes%rowtype;
begin
  v_hash := public.fnv1a(upper(trim(p_code)));

  select * into v_row
  from public.pkg_activation_codes
  where code_hash = v_hash
  for update;

  if not found then
    return 'INVALID_CODE';
  end if;

  if v_row.status = 'revoked' then
    return 'REVOKED';
  end if;

  if v_row.status = 'activated' then
    return 'ALREADY_USED';
  end if;

  update public.pkg_activation_codes
  set
    status        = 'activated',
    device_id     = p_device_id,
    nama_pengguna = p_nama,
    username      = p_username,
    madrasah      = p_madrasah,
    kabupaten     = p_kabupaten,
    role          = p_role,
    activated_at  = now()
  where id = v_row.id;

  return 'ACTIVATED';
end;
$$;

-- ======================================================================
-- 8. RPC: admin_list_activation_codes
-- FIX: return json (bukan TABLE) untuk hindari ambiguous column
-- ======================================================================
drop function if exists public.admin_list_activation_codes(text);
create or replace function public.admin_list_activation_codes(
  p_admin_username text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin public.pkg_admins%rowtype;
  v_rows  json;
begin
  select * into v_admin from public.pkg_admins where username = p_admin_username limit 1;
  if not found then
    return json_build_object('ok', false, 'message', 'UNAUTHORIZED');
  end if;

  select coalesce(json_agg(row_to_json(t)), '[]'::json)
  into v_rows
  from (
    select
      id,
      code_full,
      code_hint,
      status,
      nama_pengguna,
      username as user_name,
      madrasah,
      kabupaten,
      role,
      device_id,
      created_by,
      created_at,
      activated_at,
      revoked_at,
      catatan
    from public.pkg_activation_codes
    order by created_at desc
  ) t;

  return json_build_object('ok', true, 'data', v_rows);
end;
$$;

-- ======================================================================
-- 9. RPC: admin_revoke_activation_code
-- ======================================================================
create or replace function public.admin_revoke_activation_code(
  p_code_id uuid,
  p_admin_username text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin public.pkg_admins%rowtype;
  v_row   public.pkg_activation_codes%rowtype;
begin
  select * into v_admin from public.pkg_admins where username = p_admin_username limit 1;
  if not found then
    return 'UNAUTHORIZED';
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
-- 10. RPC: admin_activation_stats
-- ======================================================================
create or replace function public.admin_activation_stats(
  p_admin_username text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin  public.pkg_admins%rowtype;
  v_total  int;
  v_unused int;
  v_activated int;
  v_revoked int;
begin
  select * into v_admin from public.pkg_admins where username = p_admin_username limit 1;
  if not found then
    return json_build_object('ok', false, 'message', 'UNAUTHORIZED');
  end if;

  select count(*) into v_total     from public.pkg_activation_codes;
  select count(*) into v_unused   from public.pkg_activation_codes where status = 'unused';
  select count(*) into v_activated from public.pkg_activation_codes where status = 'activated';
  select count(*) into v_revoked  from public.pkg_activation_codes where status = 'revoked';

  return json_build_object(
    'ok', true,
    'total', v_total,
    'unused', v_unused,
    'activated', v_activated,
    'revoked', v_revoked
  );
end;
$$;

-- ======================================================================
-- 11. RPC: check_code_status — cek status kode tanpa mengaktivasi
-- TANPA digest() — pakai fnv1a()
-- ======================================================================
create or replace function public.check_code_status(
  p_code text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
  v_status text;
begin
  v_hash := public.fnv1a(upper(trim(p_code)));
  select status into v_status from public.pkg_activation_codes where code_hash = v_hash limit 1;
  if v_status is null then
    return 'INVALID_CODE';
  end if;
  return v_status;
end;
$$;

-- ======================================================================
-- 12. RPC: admin_edit_activation_code
-- ======================================================================
drop function if exists public.admin_edit_activation_code(uuid, text, text, text, text, text, text);
create or replace function public.admin_edit_activation_code(
  p_code_id         uuid,
  p_admin_username  text default null,
  p_nama            text default null,
  p_madrasah        text default null,
  p_kabupaten       text default null,
  p_role            text default null,
  p_catatan         text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin public.pkg_admins%rowtype;
  v_row   public.pkg_activation_codes%rowtype;
begin
  select * into v_admin from public.pkg_admins where username = p_admin_username limit 1;
  if not found then
    return json_build_object('ok', false, 'message', 'UNAUTHORIZED');
  end if;

  select * into v_row from public.pkg_activation_codes where id = p_code_id for update;
  if not found then
    return json_build_object('ok', false, 'message', 'NOT_FOUND');
  end if;

  update public.pkg_activation_codes
  set
    nama_pengguna = coalesce(p_nama, nama_pengguna),
    madrasah      = coalesce(p_madrasah, madrasah),
    kabupaten     = coalesce(p_kabupaten, kabupaten),
    role          = coalesce(p_role, role),
    catatan       = coalesce(p_catatan, catatan)
  where id = p_code_id;

  return json_build_object('ok', true, 'message', 'UPDATED');
end;
$$;

-- ======================================================================
-- 13. RPC: admin_delete_activation_code
-- ======================================================================
drop function if exists public.admin_delete_activation_code(uuid, text);
create or replace function public.admin_delete_activation_code(
  p_code_id        uuid,
  p_admin_username text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin public.pkg_admins%rowtype;
begin
  select * into v_admin from public.pkg_admins where username = p_admin_username limit 1;
  if not found then
    return 'UNAUTHORIZED';
  end if;

  delete from public.pkg_activation_codes where id = p_code_id;
  if not found then
    return 'NOT_FOUND';
  end if;

  return 'DELETED';
end;
$$;

-- ======================================================================
-- 14. RPC: admin_delete_all_codes
-- ======================================================================
drop function if exists public.admin_delete_all_codes(text);
create or replace function public.admin_delete_all_codes(
  p_admin_username text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin public.pkg_admins%rowtype;
  v_count int;
begin
  select * into v_admin from public.pkg_admins where username = p_admin_username limit 1;
  if not found then
    return json_build_object('ok', false, 'message', 'UNAUTHORIZED');
  end if;

  select count(*) into v_count from public.pkg_activation_codes;
  delete from public.pkg_activation_codes;

  return json_build_object('ok', true, 'deleted', v_count);
end;
$$;

-- ======================================================================
-- 14. GRANT execute permissions
-- Semua RPC di-grant ke anon (admin pakai custom login, bukan Supabase Auth)
-- ======================================================================

revoke execute on function public._generate_activation_code() from public, anon;
revoke execute on function public.fnv1a(text) from public, anon;

grant execute on function public.admin_login(text, text) to anon, authenticated;
grant execute on function public.activate_pkg_code(text, text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.check_code_status(text) to anon, authenticated;
grant execute on function public.admin_create_activation_code(text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.admin_list_activation_codes(text) to anon, authenticated;
grant execute on function public.admin_revoke_activation_code(uuid, text) to anon, authenticated;
grant execute on function public.admin_activation_stats(text) to anon, authenticated;
grant execute on function public.admin_edit_activation_code(uuid, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.admin_delete_activation_code(uuid, text) to anon, authenticated;
grant execute on function public.admin_delete_all_codes(text) to anon, authenticated;
