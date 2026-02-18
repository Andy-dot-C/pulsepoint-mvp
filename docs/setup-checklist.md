# Setup Checklist (Supabase + Vercel)

## 1) Accounts
- Create Supabase account and project.
- Create Vercel account and connect GitHub repo.
- Buy/connect domain (optional for first deploy, recommended before public launch).

## 2) Supabase
- In SQL editor, run `/Users/andycahill/Documents/New project/supabase/schema.sql`.
- In Auth providers, enable:
  - Email (magic link)
  - Google OAuth
- Configure Google OAuth callback URL from Supabase instructions.
- Create first admin user, then set role to `admin` in `public.profiles`.

## 3) App env vars
- Add `.env.local` with:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server use only)
- Never expose service role key to client components.

## 4) Local run
- Install deps: `npm install`
- Start dev: `npm run dev`
- Verify routes:
  - `/`
  - `/polls/[slug]`
  - `/legal/terms`
  - `/legal/privacy`
  - `/legal/guidelines`

## 5) Deploy
- Push repo to GitHub.
- Import project in Vercel.
- Add env vars in Vercel project settings.
- Deploy and verify auth redirects and API routes.

## 6) Pre-launch QA
- Test vote change before and after poll close.
- Test duplicate poll submission handling in moderation queue.
- Test report flow.
- Confirm legal page links are visible in footer/nav.
