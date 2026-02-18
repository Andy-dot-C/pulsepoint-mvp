-- PulsePoint MVP schema
-- Run in Supabase SQL editor

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  key text primary key,
  label text not null,
  created_at timestamptz not null default now()
);

insert into public.categories (key, label)
values
  ('politics', 'Politics'),
  ('sport', 'Sport'),
  ('entertainment', 'Entertainment'),
  ('culture', 'Culture'),
  ('hot-takes', 'Hot Takes')
on conflict (key) do nothing;

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  blurb text not null,
  description text not null,
  category_key text not null references public.categories(key),
  status text not null default 'published' check (status in ('draft', 'published', 'closed', 'archived')),
  source_type text not null default 'admin_seed' check (source_type in ('admin_seed', 'submission')),
  created_by uuid references public.profiles(id),
  published_by uuid references public.profiles(id),
  start_at timestamptz not null default now(),
  end_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists polls_category_idx on public.polls (category_key);
create index if not exists polls_status_idx on public.polls (status);
create index if not exists polls_start_at_idx on public.polls (start_at desc);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null,
  position smallint not null,
  created_at timestamptz not null default now(),
  unique (poll_id, position)
);

create index if not exists poll_options_poll_idx on public.poll_options (poll_id);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (poll_id, user_id)
);

create index if not exists votes_poll_idx on public.votes (poll_id);
create index if not exists votes_user_idx on public.votes (user_id);

create table if not exists public.vote_events (
  id bigserial primary key,
  poll_id uuid not null references public.polls(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  previous_option_id uuid references public.poll_options(id),
  new_option_id uuid not null references public.poll_options(id),
  changed_at timestamptz not null default now()
);

create index if not exists vote_events_poll_changed_idx on public.vote_events (poll_id, changed_at desc);

create table if not exists public.poll_submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  blurb text not null,
  description text not null,
  category_key text not null references public.categories(key),
  options jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'merged')),
  review_notes text,
  duplicate_of_submission_id uuid references public.poll_submissions(id),
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists poll_submissions_status_idx on public.poll_submissions (status, created_at desc);

create table if not exists public.poll_reports (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (
    reason in (
      'duplicate',
      'factual_error',
      'misleading',
      'abuse_or_hate',
      'off_topic',
      'other'
    )
  ),
  details text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id)
);

create index if not exists poll_reports_status_idx on public.poll_reports (status, created_at desc);

create table if not exists public.poll_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  poll_id uuid not null references public.polls(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, poll_id)
);

create index if not exists poll_bookmarks_user_idx on public.poll_bookmarks (user_id, created_at desc);
create index if not exists poll_bookmarks_poll_idx on public.poll_bookmarks (poll_id);

create table if not exists public.poll_comments (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists poll_comments_poll_idx on public.poll_comments (poll_id, created_at desc);
create index if not exists poll_comments_user_idx on public.poll_comments (user_id, created_at desc);

create table if not exists public.poll_comment_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  comment_id uuid not null references public.poll_comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)
);

create index if not exists poll_comment_votes_comment_idx on public.poll_comment_votes (comment_id);
create index if not exists poll_comment_votes_user_idx on public.poll_comment_votes (user_id, created_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'poll_reports_reason_check'
  ) then
    alter table public.poll_reports
      add constraint poll_reports_reason_check check (
        reason in (
          'duplicate',
          'factual_error',
          'misleading',
          'abuse_or_hate',
          'off_topic',
          'other'
        )
      );
  end if;
end
$$;

create or replace function public.generate_username()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := 'pulse_' || substr(md5(random()::text), 1, 8);
    exit when not exists (select 1 from public.profiles p where p.username = candidate);
  end loop;
  return candidate;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, public.generate_username())
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and p.role = 'admin'
  );
$$;

create or replace function public.validate_vote_option_match()
returns trigger
language plpgsql
as $$
declare
  option_poll_id uuid;
  poll_end_at timestamptz;
begin
  select poll_id into option_poll_id
  from public.poll_options
  where id = new.option_id;

  if option_poll_id is null then
    raise exception 'option_id does not exist';
  end if;

  if option_poll_id <> new.poll_id then
    raise exception 'vote option does not belong to poll';
  end if;

  select end_at into poll_end_at from public.polls where id = new.poll_id;

  if poll_end_at is not null and now() > poll_end_at then
    raise exception 'poll is closed';
  end if;

  return new;
end;
$$;

drop trigger if exists votes_validate_option on public.votes;
create trigger votes_validate_option
before insert or update on public.votes
for each row execute procedure public.validate_vote_option_match();

create or replace function public.log_vote_event()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.vote_events (poll_id, user_id, previous_option_id, new_option_id)
    values (new.poll_id, new.user_id, null, new.option_id);
  elsif tg_op = 'UPDATE' then
    if old.option_id is distinct from new.option_id then
      insert into public.vote_events (poll_id, user_id, previous_option_id, new_option_id)
      values (new.poll_id, new.user_id, old.option_id, new.option_id);
    end if;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists votes_log_event on public.votes;
create trigger votes_log_event
before insert or update on public.votes
for each row execute procedure public.log_vote_event();

create or replace function public.validate_comment_vote_match()
returns trigger
language plpgsql
as $$
declare
  comment_poll_id uuid;
begin
  select poll_id into comment_poll_id
  from public.poll_comments
  where id = new.comment_id;

  if comment_poll_id is null then
    raise exception 'comment_id does not exist';
  end if;

  if comment_poll_id <> new.poll_id then
    raise exception 'comment vote poll mismatch';
  end if;

  return new;
end;
$$;

drop trigger if exists comment_votes_validate_poll on public.poll_comment_votes;
create trigger comment_votes_validate_poll
before insert or update on public.poll_comment_votes
for each row execute procedure public.validate_comment_vote_match();

create or replace view public.poll_option_totals as
select
  o.poll_id,
  o.id as option_id,
  o.label,
  count(v.id)::int as votes
from public.poll_options o
left join public.votes v on v.option_id = o.id
group by o.poll_id, o.id, o.label;

alter table public.profiles enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.votes enable row level security;
alter table public.vote_events enable row level security;
alter table public.poll_submissions enable row level security;
alter table public.poll_reports enable row level security;
alter table public.poll_bookmarks enable row level security;
alter table public.poll_comments enable row level security;
alter table public.poll_comment_votes enable row level security;

-- Profiles policies
create policy "profiles readable by authenticated users"
on public.profiles
for select
using (auth.role() = 'authenticated');

create policy "users can update own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Polls policies
create policy "published polls are readable"
on public.polls
for select
using (status = 'published' or public.is_admin(auth.uid()));

create policy "admins manage polls"
on public.polls
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Poll options policies
create policy "poll options readable for readable polls"
on public.poll_options
for select
using (
  exists (
    select 1
    from public.polls p
    where p.id = poll_options.poll_id
      and (p.status = 'published' or public.is_admin(auth.uid()))
  )
);

create policy "admins manage poll options"
on public.poll_options
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Votes policies
create policy "users can read own votes"
on public.votes
for select
using (auth.uid() = user_id);

create policy "users can insert own vote"
on public.votes
for insert
with check (auth.uid() = user_id);

create policy "users can update own vote"
on public.votes
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Vote events policies
create policy "admins read vote events"
on public.vote_events
for select
using (public.is_admin(auth.uid()));

create policy "users insert own vote events"
on public.vote_events
for insert
with check (auth.uid() = user_id);

-- Poll submission policies
create policy "users submit polls"
on public.poll_submissions
for insert
with check (auth.uid() = submitted_by);

create policy "users read own submissions"
on public.poll_submissions
for select
using (auth.uid() = submitted_by or public.is_admin(auth.uid()));

create policy "admins manage submissions"
on public.poll_submissions
for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Poll report policies
create policy "users submit reports"
on public.poll_reports
for insert
with check (auth.uid() = reporter_id);

create policy "admins read reports"
on public.poll_reports
for select
using (public.is_admin(auth.uid()));

create policy "admins manage reports"
on public.poll_reports
for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Poll bookmark policies
create policy "users read own bookmarks"
on public.poll_bookmarks
for select
using (auth.uid() = user_id);

create policy "users insert own bookmarks"
on public.poll_bookmarks
for insert
with check (auth.uid() = user_id);

create policy "users delete own bookmarks"
on public.poll_bookmarks
for delete
using (auth.uid() = user_id);

-- Poll comments policies
create policy "poll comments readable for readable polls"
on public.poll_comments
for select
using (
  exists (
    select 1
    from public.polls p
    where p.id = poll_comments.poll_id
      and (p.status = 'published' or public.is_admin(auth.uid()))
  )
);

create policy "users insert own comments"
on public.poll_comments
for insert
with check (auth.uid() = user_id);

create policy "admins delete comments"
on public.poll_comments
for delete
using (public.is_admin(auth.uid()));

-- Poll comment vote policies
create policy "comment votes readable for readable polls"
on public.poll_comment_votes
for select
using (
  exists (
    select 1
    from public.polls p
    where p.id = poll_comment_votes.poll_id
      and (p.status = 'published' or public.is_admin(auth.uid()))
  )
);

create policy "users insert own comment votes"
on public.poll_comment_votes
for insert
with check (auth.uid() = user_id);

create policy "users delete own comment votes"
on public.poll_comment_votes
for delete
using (auth.uid() = user_id);
