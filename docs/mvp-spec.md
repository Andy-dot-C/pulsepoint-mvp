# PulsePoint MVP Spec

Date: February 17, 2026

## Product Goal
Launch a serious-but-accessible opinion polling platform focused on UK politics traction, with broader categories for repeat engagement.

## Scope Locked For MVP
- Web app only.
- Text polls only.
- Auth: Email magic link + Google.
- Anonymous public participation model with account-backed integrity.
- Username-first onboarding (auto-generated Reddit-style handle, editable).
- Feed tabs: Trending, New, Most Voted.
- Top-level categories only: Politics, Sport, Entertainment, Culture, Hot Takes.
- Poll detail page with:
  - Expanded poll blurb/description.
  - Vote percentages and totals.
  - Vote split over timeframes.
- Voting rules:
  - Single-choice (2-10 options).
  - Vote can be changed until poll close time.
  - Optional poll end date.
  - Results shown immediately.
- Creation flow:
  - Initial pre-seeded polls by admin.
  - Signed-in users submit polls.
  - Risk routing: lower-risk polls auto-publish, sensitive/flagged polls go to moderation queue.
  - Admin approve as-is, approve with edits, reject, or merge duplicates.
  - AI assist drafts neutral poll wording, blurb, and description before submit.
- MVP legal pages: Terms, Privacy, Community Guidelines.

## Decision Log (February 17, 2026)
- Working name remains `PulsePoint`.
- Default poll duration: 30 days.
- Admins can reopen closed polls.
- Trending ranking uses vote velocity (not absolute total).
- No UK-category weighting in trending algorithm at launch.
- Search scope: keyword only.
- Vote UI displays only current vote selection.
- Optional demographics collection starts in Phase 2.
- Category label on each poll is a clickable shortcut to that category feed.
- Poll submission supports 2-10 unique options.
- Admin moderation includes approve with edits to neutralize wording without forcing creator resubmission.
- AI assist is available to help creators produce neutral wording and concise descriptions.
- Submission flow supports risk routing: low-risk submissions auto-publish, sensitive/flagged submissions go to moderation.
- Admin moderation supports approve as-is, approve with edits, reject, and merge duplicate.
- AI assist can draft neutral poll wording, blurb, and description before submission.
- Report flow uses fixed reason list + optional detail text.
- Report reasons: duplicate, factual_error, misleading, abuse_or_hate, off_topic, other.
- Report visibility is admins-only.

## Explicitly Deferred (Phase 2+)
- Comments/discussion threads.
- Image/video polls.
- Local geolocation feeds.
- Sponsored polls section.
- Subcategories.
- Embeddable widget.
- Public demographic slicing.

## UX Principles
- Fast-card voting on feed.
- Deeper context on detail page.
- Moderation-first quality control.
- Low-friction onboarding for anonymous voting identity.

## Abuse/Safety Baseline
- Rate limiting on submit and vote actions.
- Report button for published polls.
- Manual moderation panel.

Why report button is still useful even with moderation:
- Users can flag factual errors, duplicate live polls, low-quality phrasing, or policy violations that slip through review.
- It also creates an audit trail for future sponsor/data trust.
