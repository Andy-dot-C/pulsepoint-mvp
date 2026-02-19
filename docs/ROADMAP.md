# PulsePoint Roadmap

Last updated: 2026-02-19

## How We Use This File
- Keep this as the single source of truth for product + engineering priorities.
- Move items between sections as priorities change.
- Mark completed items with `[x]`.
- Keep new ideas in `Later` until we intentionally pull them forward.

## Now (Current MVP)
- [x] Email magic-link auth
- [x] Poll feed with categories, search, trending/new/most-voted tabs
- [x] Poll detail page with description and vote bars
- [x] Text poll submission flow
- [x] Admin moderation for submissions (including AI assist)
- [x] Reporting workflow (open vs completed, grouped reports, admin actions)
- [x] Comments with top/new sorting and upvotes
- [x] Bookmarking (icon toggle), saved polls page, my polls page
- [x] Share menu (copy link, native share, copy embed code)
- [x] Poll embed endpoint (`/embed/polls/[slug]`)
- [x] OG/Twitter metadata basics for share previews
- [x] Analytics event pipeline (`poll_events`) + admin analytics dashboard
- [x] Verify production auth redirects and admin access after every deploy (smoke checklist documented)
- [x] Add short admin runbook doc (common fixes, SQL snippets, rollout checklist)

## Next (Post-MVP Priority)
- [ ] Poll creation UX improvements
- [ ] Quick duration presets (`24h`, `7d`, `30d`, `No end`) plus optional custom date
- [ ] Optional poll close controls and poll status badges
- [ ] Better duplicate detection in submission flow (before publish)
- [ ] Tag/category UX polish and subcategory support
- [ ] Add richer poll media support (images first, then video)
- [ ] Improve share previews with poll-specific OG image styling
- [ ] Analytics v2 dashboard filters (category, creator, poll status)
- [ ] Add “funnel” views (impression -> view -> vote -> comment/share/save)

## Later (Monetization + Scale)
- [ ] Sponsored polls workflow (campaign setup, sponsorship labeling, reporting)
- [ ] Sponsor-facing reporting portal (read-only)
- [ ] Audience insights for sponsored and organic polls
- [ ] Anonymous demographic profiling framework (age band, location, gender) with consent model
- [ ] Interest graph / affinity modeling from poll interactions
- [ ] Public profile + reputation signals for high-quality poll creators
- [ ] Poll discussion moderation tooling (auto + manual escalation)
- [ ] Mobile app packaging strategy (PWA first, native wrapper later)

## Engineering / Technical Debt
- [ ] Add daily rollup tables/materialized views for analytics performance
- [ ] Add data retention/archival strategy for `poll_events`
- [ ] Add alerting for failed analytics inserts and auth callback errors
- [ ] Add automated tests for key server actions (vote/comment/report/bookmark)
- [ ] Add integration tests for admin workflows
- [ ] Add robust migration discipline checklist for Supabase schema changes

## Open Product Decisions
- [ ] Final policy: who can create polls instantly vs which categories require review
- [ ] Final moderation policy for politically sensitive wording
- [ ] Final sponsored poll labeling and user transparency requirements
- [ ] Final definition of “trending” score
- [ ] Final comment moderation strictness and appeals process
