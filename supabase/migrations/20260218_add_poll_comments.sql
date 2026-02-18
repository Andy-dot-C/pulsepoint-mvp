-- Comments + top comments (upvotes) migration

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

alter table public.poll_comments enable row level security;
alter table public.poll_comment_votes enable row level security;

drop policy if exists "poll comments readable for readable polls" on public.poll_comments;
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

drop policy if exists "users insert own comments" on public.poll_comments;
create policy "users insert own comments"
on public.poll_comments
for insert
with check (auth.uid() = user_id);

drop policy if exists "admins delete comments" on public.poll_comments;
create policy "admins delete comments"
on public.poll_comments
for delete
using (public.is_admin(auth.uid()));

drop policy if exists "comment votes readable for readable polls" on public.poll_comment_votes;
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

drop policy if exists "users insert own comment votes" on public.poll_comment_votes;
create policy "users insert own comment votes"
on public.poll_comment_votes
for insert
with check (auth.uid() = user_id);

drop policy if exists "users delete own comment votes" on public.poll_comment_votes;
create policy "users delete own comment votes"
on public.poll_comment_votes
for delete
using (auth.uid() = user_id);
