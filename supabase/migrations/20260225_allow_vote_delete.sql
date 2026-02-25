-- Allow users to remove their own vote (needed for click-to-unvote UX).

drop policy if exists "users can delete own vote" on public.votes;
create policy "users can delete own vote"
on public.votes
for delete
using (auth.uid() = user_id);
