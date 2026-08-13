-- Tabel: pkg_aktivasi_log
-- Relay aktivasi kode lintas device untuk PKG App SPA
-- Project: erhk-2026 (https://setskebswnhfokfsorfj.supabase.co)

create table if not exists public.pkg_aktivasi_log (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  nama text not null,
  username text,
  madrasah text,
  role text default 'kamad',
  device_id text,
  device_info text,
  activated_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists idx_pkg_aktivasi_log_code on public.pkg_aktivasi_log (code);
create index if not exists idx_pkg_aktivasi_log_processed on public.pkg_aktivasi_log (processed_at);

alter table public.pkg_aktivasi_log enable row level security;

-- HP user (anon): hanya boleh INSERT
drop policy if exists "pkg_anon_insert" on public.pkg_aktivasi_log;
create policy "pkg_anon_insert"
  on public.pkg_aktivasi_log for insert
  to anon
  with check (true);

-- Admin laptop (anon): SELECT untuk polling inbox
drop policy if exists "pkg_anon_read" on public.pkg_aktivasi_log;
create policy "pkg_anon_read"
  on public.pkg_aktivasi_log for select
  to anon
  using (true);

-- Admin laptop (anon): UPDATE untuk mark processed
drop policy if exists "pkg_anon_update_processed" on public.pkg_aktivasi_log;
create policy "pkg_anon_update_processed"
  on public.pkg_aktivasi_log for update
  to anon
  using (true)
  with check (true);
