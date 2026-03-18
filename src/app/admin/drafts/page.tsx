import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  PIPELINE_DRAFT_STATUSES,
  type PipelineDraftStatus,
  isPipelineReviewApiConfigured,
  listPipelineDrafts,
} from "@/lib/pipeline-review-api";
import { approvePipelineDraftAction, rejectPipelineDraftAction } from "@/app/actions/pipeline-drafts";

type AdminDraftsPageProps = {
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
};

function readValue(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function parseStatus(value: string | undefined): PipelineDraftStatus | "all" {
  if (!value || value === "all") return "all";
  return PIPELINE_DRAFT_STATUSES.includes(value as PipelineDraftStatus) ? (value as PipelineDraftStatus) : "all";
}

function formatStatus(status: PipelineDraftStatus): string {
  if (status === "draft") return "Draft";
  if (status === "reviewed") return "Reviewed";
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Published";
}

function shortText(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  return value;
}

function formatPercent(value: number | null | undefined): string | null {
  if (value == null || Number.isNaN(value)) return null;
  return `${Math.round(value * 100)}%`;
}

function formatTimestamp(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminDraftsPage({ searchParams }: AdminDraftsPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="page-shell submit-shell">
        <article className="detail-card">
          <h1>Admin access required</h1>
          <p className="poll-blurb">Sign in with an admin account to review drafts.</p>
        </article>
      </main>
    );
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") {
    return (
      <main className="page-shell submit-shell">
        <article className="detail-card">
          <h1>Admin access required</h1>
          <p className="poll-blurb">Your account is signed in but does not have admin permissions.</p>
        </article>
      </main>
    );
  }

  const resolved = searchParams ? await searchParams : {};
  const statusType = readValue(resolved.type);
  const statusMessage = readValue(resolved.message);
  const selectedStatus = parseStatus(readValue(resolved.status));

  const apiConfigured = isPipelineReviewApiConfigured();
  const draftResult = apiConfigured
    ? await listPipelineDrafts({ status: selectedStatus, limit: 80, offset: 0 })
    : {
        ok: false,
        count: null,
        items: [],
        error: "PIPELINE_REVIEW_API_URL and PIPELINE_REVIEW_API_TOKEN must be configured.",
      };

  return (
    <main className="page-shell submit-shell">
      <Link href="/" className="back-link">
        Back to feed
      </Link>

      <article className="detail-card">
        <h1>Poll Draft Review</h1>
        <p className="poll-blurb">Review pipeline-generated poll drafts before publication.</p>
        <div className="analytics-chip-group" style={{ marginTop: 12 }}>
          <Link className={`pill ${selectedStatus === "all" ? "pill-active" : ""}`} href="/admin/drafts?status=all">
            All
          </Link>
          {PIPELINE_DRAFT_STATUSES.map((status) => (
            <Link
              key={status}
              className={`pill ${selectedStatus === status ? "pill-active" : ""}`}
              href={`/admin/drafts?status=${status}`}
            >
              {formatStatus(status)}
            </Link>
          ))}
        </div>
        {statusMessage ? (
          <p className={statusType === "error" ? "auth-error" : "auth-success"} style={{ marginTop: 10 }}>
            {statusMessage}
          </p>
        ) : null}
      </article>

      {!apiConfigured ? (
        <article className="detail-card" style={{ marginTop: 16 }}>
          <p className="auth-error">
            Set `PIPELINE_REVIEW_API_URL` and `PIPELINE_REVIEW_API_TOKEN` to enable draft review.
          </p>
        </article>
      ) : null}

      {apiConfigured && !draftResult.ok ? (
        <article className="detail-card" style={{ marginTop: 16 }}>
          <p className="auth-error">{draftResult.error ?? "Could not load drafts."}</p>
        </article>
      ) : null}

      {apiConfigured && draftResult.ok && draftResult.items.length === 0 ? (
        <article className="detail-card" style={{ marginTop: 16 }}>
          <p>No drafts found for this filter.</p>
        </article>
      ) : null}

      {apiConfigured && draftResult.ok
        ? draftResult.items.map((draft) => {
            const storySummary = shortText(draft.story_candidates?.summary, "No story summary available.");
            const statusHref = selectedStatus === "all" ? "/admin/drafts" : `/admin/drafts?status=${selectedStatus}`;
            const canModerate = draft.status !== "published";
            const scorecard = draft.latest_scorecard;
            const sourceEvidence = draft.source_evidence;
            return (
              <article key={draft.id} className="detail-card" style={{ marginTop: 16 }}>
                <p className="eyebrow">
                  {formatStatus(draft.status)} {draft.confidence != null ? `• Confidence ${(draft.confidence * 100).toFixed(0)}%` : ""}
                </p>
                <h2 style={{ marginTop: 4 }}>{draft.question}</h2>
                <ul style={{ marginTop: 10, paddingLeft: 20 }}>
                  {draft.options.map((option, index) => (
                    <li key={`${draft.id}-${index}`} style={{ marginBottom: 4 }}>
                      {option}
                    </li>
                  ))}
                </ul>
                <p className="poll-blurb" style={{ marginTop: 10 }}>
                  {storySummary}
                </p>

                {scorecard ? (
                  <div className="analytics-chip-group" style={{ marginTop: 12 }}>
                    {formatPercent(scorecard.trend_strength) ? <span className="pill">Trend {formatPercent(scorecard.trend_strength)}</span> : null}
                    {formatPercent(scorecard.clickability) ? <span className="pill">Click {formatPercent(scorecard.clickability)}</span> : null}
                    {formatPercent(scorecard.freshness) ? <span className="pill">Fresh {formatPercent(scorecard.freshness)}</span> : null}
                    {formatPercent(scorecard.source_confidence) ? <span className="pill">Source {formatPercent(scorecard.source_confidence)}</span> : null}
                    {formatPercent(scorecard.opinion_fit) ? <span className="pill">Opinion {formatPercent(scorecard.opinion_fit)}</span> : null}
                  </div>
                ) : null}

                {scorecard?.why_now ? (
                  <p className="poll-blurb" style={{ marginTop: 10 }}>
                    <strong>Why now:</strong> {scorecard.why_now}
                  </p>
                ) : null}

                {sourceEvidence ? (
                  <>
                    <div className="analytics-chip-group" style={{ marginTop: 10 }}>
                      {sourceEvidence.source_count != null ? <span className="pill">{sourceEvidence.source_count} sources</span> : null}
                      {sourceEvidence.latest_source_at ? (
                        <span className="pill">Latest {formatTimestamp(sourceEvidence.latest_source_at) ?? "Unknown"}</span>
                      ) : null}
                      {sourceEvidence.source_types.map((sourceType) => (
                        <span key={`${draft.id}-${sourceType}`} className="pill">
                          {sourceType}
                        </span>
                      ))}
                    </div>
                    {sourceEvidence.domains.length > 0 ? (
                      <p className="poll-blurb" style={{ marginTop: 10 }}>
                        <strong>Domains:</strong> {sourceEvidence.domains.slice(0, 6).join(", ")}
                      </p>
                    ) : null}
                    {sourceEvidence.sources.length > 0 ? (
                      <div style={{ marginTop: 10 }}>
                        {sourceEvidence.sources.slice(0, 4).map((source, index) => (
                          <p key={`${draft.id}-source-${index}`} className="poll-blurb" style={{ marginTop: index === 0 ? 0 : 6 }}>
                            {source.url ? (
                              <a href={source.url} target="_blank" rel="noreferrer">
                                {source.title}
                              </a>
                            ) : (
                              source.title
                            )}{" "}
                            {source.domain ? `(${source.domain})` : ""}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : null}

                {canModerate ? (
                  <div className="submit-actions-row" style={{ marginTop: 12 }}>
                    <form action={approvePipelineDraftAction}>
                      <input type="hidden" name="draftId" value={draft.id} />
                      <input type="hidden" name="returnTo" value={statusHref} />
                      <button type="submit" className="ghost-btn">
                        Approve
                      </button>
                    </form>
                    <form action={rejectPipelineDraftAction}>
                      <input type="hidden" name="draftId" value={draft.id} />
                      <input type="hidden" name="returnTo" value={statusHref} />
                      <button type="submit" className="ghost-btn">
                        Reject
                      </button>
                    </form>
                  </div>
                ) : (
                  <p className="poll-blurb" style={{ marginTop: 12 }}>
                    Published drafts are read-only from this page.
                  </p>
                )}
              </article>
            );
          })
        : null}
    </main>
  );
}
