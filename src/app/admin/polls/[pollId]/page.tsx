import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  archivePollFromAdminAction,
  markReportReviewedAction,
  resolveReportAction,
  updatePollFromAdminAction
} from "@/app/actions/reports";
import { categories } from "@/lib/mock-data";
import { REPORT_REASONS } from "@/lib/report-reasons";
import { createClient } from "@/lib/supabase/server";

type PollEditorPageProps = {
  params: { pollId: string } | Promise<{ pollId: string }>;
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
};

type PollReportRow = {
  id: string;
  reporter_id: string;
  reason: string;
  details: string | null;
  status: "open" | "reviewed" | "resolved";
  created_at: string;
};

type ReporterRow = {
  id: string;
  username: string;
};

type CandidatePollRow = {
  id: string;
  slug: string;
  title: string;
  category_key: string;
  status: string;
  created_at: string;
};

type CandidateOptionRow = {
  poll_id: string;
  label: string;
};

function readValue(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3);
}

function jaccard(left: string[], right: string[]): number {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const union = new Set([...leftSet, ...rightSet]);
  if (union.size === 0) return 0;
  let intersection = 0;
  for (const token of leftSet) {
    if (rightSet.has(token)) intersection += 1;
  }
  return intersection / union.size;
}

function reasonLabel(value: string): string {
  return REPORT_REASONS.find((item) => item.value === value)?.label ?? value;
}

function statusLabel(status: "open" | "reviewed" | "resolved"): string {
  if (status === "open") return "Needs review";
  if (status === "reviewed") return "No action needed";
  return "Resolved";
}

export default async function PollEditorPage({ params, searchParams }: PollEditorPageProps) {
  const { pollId } = await Promise.resolve(params);
  const resolved = searchParams ? await searchParams : {};
  const reportId = readValue(resolved.reportId);
  const returnTo = reportId ? `/admin/polls/${pollId}?reportId=${reportId}` : `/admin/polls/${pollId}`;
  const statusType = readValue(resolved.type);
  const statusMessage = readValue(resolved.message);
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?next=/admin/reports");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") {
    redirect("/");
  }

  const { data: poll } = await supabase
    .from("polls")
    .select("id,title,description,category_key,end_at,status")
    .eq("id", pollId)
    .maybeSingle();

  if (!poll) {
    notFound();
  }

  const { data: options } = await supabase
    .from("poll_options")
    .select("label,position")
    .eq("poll_id", pollId)
    .order("position", { ascending: true });

  const optionLabels = (options ?? []).map((item) => item.label);
  const { data: pollReportsData } = await supabase
    .from("poll_reports")
    .select("id,reporter_id,reason,details,status,created_at")
    .eq("poll_id", pollId)
    .order("created_at", { ascending: false })
    .limit(200);
  const pollReports: PollReportRow[] = (pollReportsData ?? []).map((row) => ({
    id: String(row.id),
    reporter_id: String(row.reporter_id),
    reason: String(row.reason),
    details: row.details ? String(row.details) : null,
    status: row.status as PollReportRow["status"],
    created_at: String(row.created_at)
  }));
  const report =
    pollReports.find((item) => item.id === reportId) ??
    pollReports.find((item) => item.status === "open") ??
    pollReports[0] ??
    null;
  const openReportCount = pollReports.filter((item) => item.status === "open").length;
  const openReports = pollReports.filter((item) => item.status === "open");
  const closedReports = pollReports.filter((item) => item.status !== "open");
  const reporterIds = [...new Set(pollReports.map((item) => item.reporter_id))];
  const { data: reporterRowsData } =
    reporterIds.length > 0
      ? await supabase.from("profiles").select("id,username").in("id", reporterIds)
      : { data: [] as ReporterRow[] };
  const reporterMap = new Map(((reporterRowsData ?? []) as ReporterRow[]).map((row) => [row.id, row.username]));
  const { data: candidatePollRowsData } = await supabase
    .from("polls")
    .select("id,slug,title,category_key,status,created_at")
    .eq("category_key", poll.category_key)
    .neq("id", pollId)
    .in("status", ["published", "closed"])
    .order("created_at", { ascending: false })
    .limit(80);
  const candidatePolls = (candidatePollRowsData ?? []) as CandidatePollRow[];
  const candidateIds = candidatePolls.map((item) => item.id);
  const { data: candidateOptionRowsData } =
    candidateIds.length > 0
      ? await supabase.from("poll_options").select("poll_id,label").in("poll_id", candidateIds)
      : { data: [] as CandidateOptionRow[] };
  const candidateOptionsByPollId = new Map<string, string[]>();
  ((candidateOptionRowsData ?? []) as CandidateOptionRow[]).forEach((item) => {
    const existing = candidateOptionsByPollId.get(item.poll_id) ?? [];
    existing.push(item.label);
    candidateOptionsByPollId.set(item.poll_id, existing);
  });
  const currentTitleTokens = tokenize(poll.title);
  const currentOptionTokens = tokenize(optionLabels.join(" "));
  const possibleDuplicates = candidatePolls
    .map((candidate) => {
      const candidateTitleTokens = tokenize(candidate.title);
      const candidateOptionTokens = tokenize((candidateOptionsByPollId.get(candidate.id) ?? []).join(" "));
      const titleScore = jaccard(currentTitleTokens, candidateTitleTokens);
      const optionScore = jaccard(currentOptionTokens, candidateOptionTokens);
      const score = titleScore * 0.75 + optionScore * 0.25;
      return { candidate, score, titleScore, optionScore };
    })
    .filter((item) => item.score >= 0.18 || item.titleScore >= 0.25)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return (
    <main className="page-shell submit-shell admin-review-shell">
      <Link href="/admin/reports" className="back-link">
        Back to reports
      </Link>

      <section className="admin-review-grid">
        <aside className="detail-card">
          <h2>Possible duplicates</h2>
          <p className="poll-blurb">Same category + similar wording/options.</p>
          {possibleDuplicates.length === 0 ? (
            <p className="poll-blurb" style={{ marginTop: 10 }}>
              No strong matches found.
            </p>
          ) : (
            <div className="admin-report-list">
              {possibleDuplicates.map((item) => (
                <article key={item.candidate.id} className="admin-report-item">
                  <div className="admin-report-head">
                    <p className="eyebrow">{new Date(item.candidate.created_at).toLocaleDateString()}</p>
                    <span className="admin-status-badge">Match {(item.score * 100).toFixed(0)}%</span>
                  </div>
                  <p className="poll-blurb">
                    <Link href={`/polls/${item.candidate.slug}`}>{item.candidate.title}</Link>
                  </p>
                  <div className="submit-actions-row" style={{ marginTop: 8 }}>
                    <Link className="ghost-btn" href={`/admin/polls/${item.candidate.id}`}>
                      Open admin
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </aside>

        <article className="detail-card">
          <h1>Edit Poll</h1>
          <p className="poll-blurb">Update wording/options or delete this post from public feed.</p>
          <p className="poll-blurb">Current status: {poll.status}</p>
          {statusMessage ? (
            <p className={statusType === "error" ? "auth-error" : "auth-success"}>{statusMessage}</p>
          ) : null}

          {report ? (
            <section style={{ marginTop: 12 }}>
              <p className="eyebrow">Reviewing report</p>
              <p className="poll-blurb">{new Date(report.created_at).toLocaleString()}</p>
              <p className="poll-blurb">Reason: {reasonLabel(report.reason)}</p>
              <p className="poll-blurb">Status: {statusLabel(report.status)}</p>
              {report.details ? <p className="detail-description">{report.details}</p> : null}
              <div className="submit-actions-row" style={{ marginTop: 10 }}>
                <form action={markReportReviewedAction}>
                  <input type="hidden" name="reportId" value={report.id} />
                  <input type="hidden" name="pollId" value={pollId} />
                  <input type="hidden" name="returnTo" value="/admin/reports" />
                  <button className="ghost-btn" type="submit" disabled={openReportCount === 0}>
                    No Action Needed
                  </button>
                </form>
                <form action={resolveReportAction}>
                  <input type="hidden" name="reportId" value={report.id} />
                  <input type="hidden" name="pollId" value={pollId} />
                  <input type="hidden" name="returnTo" value="/admin/reports" />
                  <button className="create-btn" type="submit" disabled={openReportCount === 0}>
                    Resolved
                  </button>
                </form>
              </div>
            </section>
          ) : null}

          <form action={updatePollFromAdminAction} className="submit-form">
            <input type="hidden" name="pollId" value={poll.id} />
            <input type="hidden" name="returnTo" value={returnTo} />

            <label>
              Title
              <input name="title" defaultValue={poll.title} required />
            </label>

            <label>
              Category
              <select name="category" defaultValue={poll.category_key}>
                {categories.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Description
              <textarea name="description" rows={4} defaultValue={poll.description} required />
            </label>

            <div className="submit-options">
              <p>Options (2-10)</p>
              {optionLabels.map((label, idx) => (
                <input key={`${poll.id}-option-${idx}`} name="options" defaultValue={label} required />
              ))}
            </div>

            <label>
              End date (optional)
              <input
                type="datetime-local"
                name="endAt"
                defaultValue={poll.end_at ? new Date(poll.end_at).toISOString().slice(0, 16) : ""}
              />
            </label>

            <button type="submit" className="create-btn">
              Save edits
            </button>
          </form>

          <form action={archivePollFromAdminAction} style={{ marginTop: 12 }}>
            <input type="hidden" name="pollId" value={poll.id} />
            <button type="submit" className="ghost-btn">
              Delete post (remove from feed)
            </button>
          </form>
        </article>

        <aside className="detail-card">
          <h2>Reports on this poll</h2>
          <p className="poll-blurb">
            Total: {pollReports.length} | Open: {openReportCount}
          </p>
          {pollReports.length === 0 ? (
            <p className="poll-blurb" style={{ marginTop: 12 }}>
              No reports found.
            </p>
          ) : (
            <div className="admin-report-list">
              <p className="eyebrow">Open ({openReports.length})</p>
              {openReports.length === 0 ? <p className="poll-blurb">No open reports.</p> : null}
              {openReports.map((item) => (
                <article key={item.id} className="admin-report-item admin-report-item-open">
                  <div className="admin-report-head">
                    <p className="eyebrow">{new Date(item.created_at).toLocaleString()}</p>
                    <span className="admin-status-badge admin-status-badge-open">Open</span>
                  </div>
                  <p className="poll-blurb">Reason: {reasonLabel(item.reason)}</p>
                  <p className="poll-blurb">Reporter: {reporterMap.get(item.reporter_id) ?? item.reporter_id}</p>
                  {item.details ? <p className="detail-description">{item.details}</p> : null}
                </article>
              ))}

              <p className="eyebrow" style={{ marginTop: 8 }}>
                Closed ({closedReports.length})
              </p>
              {closedReports.length === 0 ? <p className="poll-blurb">No closed reports.</p> : null}
              {closedReports.map((item) => (
                <article key={item.id} className="admin-report-item">
                  <div className="admin-report-head">
                    <p className="eyebrow">{new Date(item.created_at).toLocaleString()}</p>
                    <span className="admin-status-badge">{statusLabel(item.status)}</span>
                  </div>
                  <p className="poll-blurb">Reason: {reasonLabel(item.reason)}</p>
                  <p className="poll-blurb">Reporter: {reporterMap.get(item.reporter_id) ?? item.reporter_id}</p>
                  {item.details ? <p className="detail-description">{item.details}</p> : null}
                </article>
              ))}
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
