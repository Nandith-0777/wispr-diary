-- Run once in the Supabase SQL editor. Every account owns one versioned library.
create table if not exists public.diary_libraries (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  revision bigint not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.diary_libraries enable row level security;
revoke all on public.diary_libraries from anon;
grant select, insert, update on public.diary_libraries to authenticated;

drop policy if exists "Read own diary" on public.diary_libraries;
drop policy if exists "Create own diary" on public.diary_libraries;
drop policy if exists "Update own diary" on public.diary_libraries;

create policy "Read own diary"
on public.diary_libraries for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Create own diary"
on public.diary_libraries for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Update own diary"
on public.diary_libraries for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
