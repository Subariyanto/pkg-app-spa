-- ======================================================================
-- pkg_activation_v2_tahap2.sql — Tahap 2: Admin Menu + Enhanced Features
-- Migration: ASSUMES pkg_activation_v2.sql (Tahap 1) ALREADY APPLIED.
--
-- Tambahan:
-- 1. Tabel: pkg_activation_audit_logs
-- 2. Enhanced RPC: admin_create_activation_code (add p_role + audit log)
-- 3. Enhanced RPC: admin_list_activation_codes (search, filter, pagination, total_count)
-- 4. New RPC: admin_activation_stats
-- 5. New RPC: admin_get_code_detail
-- 6. Updated RPC: admin_revoke_activation_code (audit log)
-- 7. RLS untuk audit log table
-- ======================================================================

-- ======================================================================
-- 1. TABEL: pkg_activation_audit_logs
-- ======================================================================
create table if not exists public.pkg_activation_audit_logs (
  id                  uuid        primary key default gen_random_uuid(),
  admin_user_id       uuid        references auth.users(id) on delete set null,
  action              text        not null check (action in ('CREATE_CODE','REVOKE_CODE','VIEW_DETAIL')),
  activation_code_id  uuid,
  details             jsonb,
  created_at          timestamptz not null default now()
);

create index if not exists idx_pkg_audit_admin     on public.pkg_activation_audit_logs (admin_user_id);
create index if not exists idx_pkg_audit_code      on public.pkg_activation_audit_logs (activation_code_id);
create index if not exists idx_pkg_audit_created   on public.pkg_activation_audit_logs (created_at desc);

-- ======================================================================
-- 2. RLS untuk pkg_activation_audit_logs — Admin only SELECT, no anon
-- ======================================================================
alter table public.pkg_activation_audit_logs enable row level security;

drop policy if exists "pkg_audit_admin_select" on public.pkg_activation_audit_logs;
create policy "pkg_audit_admin_select"
  on public.pkg_activation_audit_logs for select
  to authenticated
  using (exists (select 1 from public.pkg_admins where user_id = auth.uid()));

-- Tidak ada policy INSERT/UPDATE/DELETE → RLS blocks all direct writes.
-- Hanya SECURITY DEFINER RPCs yang bisa INSERT (bypass RLS).

-- ======================================================================
-- 3. DROP functions dengan signature berubah
-- ======================================================================
drop function if exists public.admin_create_activation_code(text, text, text, text);
drop function if exists public.admin_list_activation_codes();

-- ======================================================================
-- 4. ENHANCED RPC: admin_create_activation_code (add p_role + audit log)
-- ======================================================================
create or replace function public.admin_create_activation_code(
  p_nama_pengguna text default null,
  p_madrasah      text default null,
  p_kabupaten     text default null,
  p_catatan       text default null,
  p_role          text default null
)
returns table (
  code_id     uuid,
  code        text,
  code_hint   text,
  status      text,
  created_at  timestamptz
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
  select exists(select 1 from public.pkg_admins where user_id = v_admin_uid) into v_is_admin;
  if not v_is_admin then
    raise exception 'UNAUTHORIZED: pemanggil bukan admin terdaftar' using errcode = '42501';
  end if;

  v_code := public._generate_activation_code();
  v_code_hash := encode(digest(v_code, 'sha256'), 'hex');
  v_code_hint := '****' || right(v_code, 4);

  <<gen_loop>> loop
    begin
      insert into public.pkg_activation_codes (code_hash, code_hint, status, nama_pengguna, madrasah, kabupaten, catatan, role, created_by, created_at)
      values (v_code_hash, v_code_hint, 'unused', p_nama_pengguna, p_madrasah, p_kabupaten, p_catatan, p_role, v_admin_uid, now())
      returning id, created_at into v_id, v_created_at;
      exit gen_loop;
    exception when unique_violation then
      v_code := public._generate_activation_code();
      v_code_hash := encode(digest(v_code, 'sha256'), 'hex');
      v_code_hint := '****' || right(v_code, 4);
    end;
  end loop gen_loop;

  -- Audit log
  insert into public.pkg_activation_audit_logs (admin_user_id, action, activation_code_id, details)
  values (v_admin_uid, 'CREATE_CODE', v_id, jsonb_build_object(
    'code_hint', v_code_hint,
    'nama_pengguna', p_nama_pengguna,
    'madrasah', p_madrasah,
    'kabupaten', p_kabupaten,
    'role', p_role
  ));

  return query select v_id, v_code, v_code_hint, 'unused'::text, v_created_at;
end;
$$;

-- ======================================================================
-- 5. ENHANCED RPC: admin_list_activation_codes (search, filter, pagination)
-- ======================================================================
create or replace function public.admin_list_activation_codes(
  p_status text default null,
  p_role   text default null,
  p_search text default null,
  p_page   int  default 1,
  p_limit  int  default 25
)
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
  catatan        text,
  total_count    bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_uid uuid := auth.uid();
  v_is_admin  boolean;
  v_offset   int;
begin
  select exists(select 1 from public.pkg_admins where user_id = v_admin_uid) into v_is_admin;
  if not v_is_admin then
    raise exception 'UNAUTHORIZED: pemanggil bukan admin terdaftar' using errcode = '42501';
  end if;

  -- Normalize
  p_status := nullif(p_status, '');
  p_role   := nullif(p_role, '');
  p_search := nullif(trim(p_search), '');
  if p_page < 1 then p_page := 1; end if;
  if p_limit < 1 or p_limit > 100 then p_limit := 25; end if;
  v_offset := (p_page - 1) * p_limit;

  return query
  select
    c.id, c.code_hint, c.status, c.nama_pengguna, c.madrasah, c.kabupaten,
    c.role, c.device_id, c.username, c.created_at, c.activated_at, c.revoked_at, c.catatan,
    count(*) over() as total_count
  from public.pkg_activation_codes c
  where
    (p_status is null or c.status = p_status)
    and (p_role is null or c.role = p_role)
    and (
      p_search is null
      or c.code_hint     ilike '%' || p_search || '%'
      or c.nama_pengguna ilike '%' || p_search || '%'
      or c.madrasah      ilike '%' || p_search || '%'
      or c.kabupaten     ilike '%' || p_search || '%'
      or c.username      ilike '%' || p_search || '%'
    )
  order by c.created_at desc
  limit p_limit offset v_offset;
end;
$$;

-- ======================================================================
-- 6. NEW RPC: admin_activation_stats
-- ======================================================================
create or replace function public.admin_activation_stats()
returns table (
  total     bigint,
  unused    bigint,
  activated bigint,
  revoked   bigint
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
    count(*) as total,
    count(*) filter (where status = 'unused') as unused,
    count(*) filter (where status = 'activated') as activated,
    count(*) filter (where status = 'revoked') as revoked
  from public.pkg_activation_codes;
end;
$$;

-- ======================================================================
-- 7. NEW RPC: admin_get_code_detail
-- ======================================================================
create or replace function public.admin_get_code_detail(p_code_id uuid)
returns table (
  id             uuid,
  code_hint      text,
  status         text,
  nama_pengguna  text,
  username       text,
  madrasah       text,
  kabupaten      text,
  role           text,
  device_id      text,
  device_info    text,
  catatan        text,
  created_by     uuid,
  created_at     timestamptz,
  activated_at   timestamptz,
  revoked_at     timestamptz
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
    c.id, c.code_hint, c.status, c.nama_pengguna, c.username, c.madrasah,
    c.kabupaten, c.role, c.device_id, c.device_info, c.catatan,
    c.created_by, c.created_at, c.activated_at, c.revoked_at
  from public.pkg_activation_codes c
  where c.id = p_code_id;
end;
$$;

-- ======================================================================
-- 8. UPDATED RPC: admin_revoke_activation_code (add audit log)
-- Signature sama → CREATE OR REPLACE
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

  -- Audit log
  insert into public.pkg_activation_audit_logs (admin_user_id, action, activation_code_id, details)
  values (v_admin_uid, 'REVOKE_CODE', p_code_id, jsonb_build_object(
    'previous_status', v_row.status,
    'code_hint', v_row.code_hint,
    'device_id', v_row.device_id
  ));

  return 'REVOKED';
end;
$$;

-- ======================================================================
-- 9. REVOKE & GRANT execute
-- ======================================================================

-- Revoke old signatures
revoke execute on function public.admin_create_activation_code(text, text, text, text) from public, anon, authenticated;
-- Old admin_list_activation_codes() sudah di-DROP, tidak perlu revoke

-- Grant new signatures
grant execute on function public.admin_create_activation_code(text, text, text, text, text) to authenticated;
grant execute on function public.admin_list_activation_codes(text, text, text, int, int) to authenticated;
grant execute on function public.admin_activation_stats() to authenticated;
grant execute on function public.admin_get_code_detail(uuid) to authenticated;
-- admin_revoke_activation_code: GRANT dari Tahap 1 masih berlaku (signature tidak berubah)

-- Revoke helper dari anon (sudah dilakukan di Tahap 1, ulat untuk safety)
revoke execute on function public._generate_activation_code() from public, anon;

-- ======================================================================
-- INSTRUKSI SETUP TAHAP 2:
-- 1. Jalankan file ini di Supabase SQL Editor (AFTER Tahap 1 sudah dijalankan)
-- 2. Cek: SELECT * FROM public.admin_activation_stats(); (harus return angka 0 jika belum ada kode)
-- 3. Cek: SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'pkg_%';
--    Harus muncul: pkg_activation_codes, pkg_admins, pkg_activation_audit_logs, pkg_aktivasi_log
-- ======================================================================
