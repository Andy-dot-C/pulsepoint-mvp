# PulsePoint Admin Runbook

Last updated: 2026-02-19

## Purpose
Use this after every deploy to confirm production auth, admin access, and critical flows are working.

## Environments
- Production site: `https://pulsepoint-mvp-deploy.vercel.app`
- Local site: `http://localhost:3000` (or `:3001` if 3000 is busy)
- Supabase: project dashboard + SQL editor
- Vercel: Deployments + Environment Variables

## Required Env Vars (Vercel + local)
- `NEXT_PUBLIC_SUPABASE_URL`: your `https://<project-ref>.supabase.co` URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase publishable/anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (server-only)

## Post-Deploy Smoke Test (5-10 minutes)
Run this on production after every `main` deploy.

1. Deployment sanity
- Confirm latest `main` deployment is `Ready` in Vercel.
- Open the production URL and hard refresh once.

2. Auth flow
- Click `Sign in` and complete magic-link login.
- Confirm you return to the app signed in.
- If link expires, request a fresh one and retry immediately.

3. Core feed actions
- Open a poll by clicking card whitespace.
- Vote on an option.
- Bookmark toggle should update instantly.
- Open share menu, click outside, confirm it closes without opening poll.

4. Poll detail actions
- Open a poll detail page.
- Post a comment.
- Switch comment sort (`Top comments` / `Newest`) and confirm no jump-to-top bug.

5. Submission + moderation
- Submit one non-sensitive poll (should publish or route correctly).
- Submit one sensitive poll (should route to moderation queue).
- In admin submissions, test approve/edit/reject flow.

6. Reports workflow
- Submit a report from a poll detail page.
- In admin reports, confirm:
- `Open` list shows report.
- Poll review page shows grouped open/closed reports.
- Action (`No action needed` / `Resolved`) moves it to completed.

7. Admin analytics
- Open `/admin/analytics`.
- Confirm key metrics load (votes, views, shares, comments, bookmarks).

## Common Fixes

### 1) User cannot access admin pages
Check current role:

```sql
select p.username, p.role, u.email
from public.profiles p
join auth.users u on u.id = p.id
where u.email = 'YOUR_EMAIL_HERE';
```

Promote to admin:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id
  from auth.users
  where email = 'YOUR_EMAIL_HERE'
);
```

### 2) SQL says policy already exists
If you re-run setup SQL and get `policy ... already exists`, use idempotent SQL:

```sql
drop policy if exists "users insert own vote events" on public.vote_events;

create policy "users insert own vote events"
on public.vote_events
for insert
with check (auth.uid() = user_id);
```

### 3) Vercel deploy works but app behaves like old version
- Verify Vercel project is connected to the correct GitHub repo.
- Confirm latest deployment source commit matches `main`.
- If repo was changed, redeploy after reconnecting and recheck env vars.

### 4) Auth callback fails or signs in but session not kept
- In Supabase Auth URL settings, keep correct redirect URLs:
- `http://localhost:3000/auth/callback`
- `http://localhost:3001/auth/callback` (if used)
- `http://127.0.0.1:3000/auth/callback`
- `http://127.0.0.1:3001/auth/callback` (if used)
- `https://pulsepoint-mvp-deploy.vercel.app/auth/callback`
- Ensure `Site URL` matches the environment you are actively testing:
  - local test: `http://localhost:3001` (or `:3000`)
  - production: `https://pulsepoint-mvp-deploy.vercel.app`
- Important: if Supabase does not accept the provided `redirect_to`, it falls back to `Site URL`.
- In Vercel, verify all 3 env vars are present with correct values (URL vs anon key vs service key).

### 5) Bookmark/report/comment actions feel broken in production only
- Recheck Vercel env vars and redeploy.
- Confirm user is signed in and session is valid.
- Check Vercel function logs for API/server action errors.

## Rollback
If a production deploy breaks a critical flow:
1. Use Vercel `Instant Rollback` to the last healthy deployment.
2. Capture root cause in a short note (what failed, why, fix).
3. Apply fix on `main`, redeploy, then re-run smoke test.

## Release Note Template
Use this per deploy:

```md
Date:
Commit:
Deployment URL:
Smoke test owner:

Pass:
- Auth
- Feed actions
- Poll detail actions
- Submission/moderation
- Reports
- Analytics

Issues:
- (if any)
```
