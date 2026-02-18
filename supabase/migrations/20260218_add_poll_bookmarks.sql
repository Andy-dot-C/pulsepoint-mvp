-- Bookmarking feature migration

create table if not exists public.poll_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  poll_id uuid not null references public.polls(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, poll_id)
);

create index if not exists poll_bookmarks_user_idx on public.poll_bookmarks (user_id, created_at desc);
create index if not exists poll_bookmarks_poll_idx on public.poll_bookmarks (poll_id);

alter table public.poll_bookmarks enable row level security;

drop policy if exists "users read own bookmarks" on public.poll_bookmarks;
create policy "users read own bookmarks"
on public.poll_bookmarks
for select
using (auth.uid() = user_id);

drop policy if exists "users insert own bookmarks" on public.poll_bookmarks;
create policy "users insert own bookmarks"
on public.poll_bookmarks
for insert
with check (auth.uid() = user_id);

drop policy if exists "users delete own bookmarks" on public.poll_bookmarks;
create policy "users delete own bookmarks"
on public.poll_bookmarks
for delete
using (auth.uid() = user_id);
