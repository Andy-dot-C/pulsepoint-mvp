-- Analytics foundation for all polls and future sponsor reporting

create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.polls add column if not exists is_sponsored boolean not null default false;
alter table public.polls add column if not exists sponsor_id uuid references public.sponsors(id);
alter table public.polls add column if not exists campaign_id text;
create index if not exists polls_sponsored_idx on public.polls (is_sponsored, sponsor_id, campaign_id);

create table if not exists public.poll_events (
  id bigserial primary key,
  poll_id uuid not null references public.polls(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  event_type text not null check (
    event_type in (
      'poll_impression',
      'poll_view',
      'poll_share',
      'vote_cast',
      'comment_post',
      'comment_upvote',
      'bookmark_add',
      'bookmark_remove',
      'report_submit'
    )
  ),
  source text not null default 'web',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists poll_events_poll_idx on public.poll_events (poll_id, created_at desc);
create index if not exists poll_events_type_idx on public.poll_events (event_type, created_at desc);
create index if not exists poll_events_user_idx on public.poll_events (user_id, created_at desc);

alter table public.poll_events drop constraint if exists poll_events_event_type_check;
alter table public.poll_events add constraint poll_events_event_type_check check (
  event_type in (
    'poll_impression',
    'poll_view',
    'poll_share',
    'vote_cast',
    'comment_post',
    'comment_upvote',
    'bookmark_add',
    'bookmark_remove',
    'report_submit'
  )
);

alter table public.sponsors enable row level security;
alter table public.poll_events enable row level security;

drop policy if exists "admins read sponsors" on public.sponsors;
create policy "admins read sponsors"
on public.sponsors
for select
using (public.is_admin(auth.uid()));

drop policy if exists "admins manage sponsors" on public.sponsors;
create policy "admins manage sponsors"
on public.sponsors
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "admins read poll events" on public.poll_events;
create policy "admins read poll events"
on public.poll_events
for select
using (public.is_admin(auth.uid()));

drop policy if exists "users insert own poll events" on public.poll_events;
create policy "users insert own poll events"
on public.poll_events
for insert
with check (auth.uid() = user_id or user_id is null);
