import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { REPORT_REASONS } from "@/lib/report-reasons";

type ReportRow = {
  id: string;
  poll_id: string;
  reporter_id: string;
  reason: string;
  details: string | null;
  status: "open" | "reviewed" | "resolved";
  created_at: string;
};

type PollRow = {
  id: string;
  slug: string;
  title: string;
};

type UserRow = {
  id: string;
  username: string;
};

type GroupedReport = {
  pollId: string;
  latestReport: ReportRow;
  totalCount: number;
  openCount: number;
};

type AdminReportsPageProps = {
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
};

function readValue(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function reasonLabel(value: string): string {
  return REPORT_REASONS.find((item) => item.value === value)?.label ?? value;
}

function statusLabel(status: ReportRow["status"]): string {
  if (status === "open") return "Needs review";
  if (status === "reviewed") return "No action needed";
  return "Resolved";
}

export default async function AdminReportsPage({ searchParams }: AdminReportsPageProps) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="page-shell submit-shell">
        <article className="detail-card">
          <h1>Admin access required</h1>
          <p className="poll-blurb">Sign in with an admin account to review reports.</p>
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

  const { data: reportData } = await supabase
    .from("poll_reports")
    .select("id,poll_id,reporter_id,reason,details,status,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const reports: ReportRow[] = (reportData ?? []).map((row) => ({
    id: String(row.id),
    poll_id: String(row.poll_id),
    reporter_id: String(row.reporter_id),
    reason: String(row.reason),
    details: row.details ? String(row.details) : null,
    status: row.status as ReportRow["status"],
    created_at: String(row.created_at)
  }));

  const pollIds = [...new Set(reports.map((item) => item.poll_id))];
  const reporterIds = [...new Set(reports.map((item) => item.reporter_id))];

  const [pollRowsResult, reporterRowsResult] = await Promise.all([
    pollIds.length > 0
      ? supabase.from("polls").select("id,slug,title").in("id", pollIds)
      : Promise.resolve({ data: [] as PollRow[] }),
    reporterIds.length > 0
      ? supabase.from("profiles").select("id,username").in("id", reporterIds)
      : Promise.resolve({ data: [] as UserRow[] })
  ]);

  const pollRows = (pollRowsResult.data ?? []) as PollRow[];
  const reporterRows = (reporterRowsResult.data ?? []) as UserRow[];

  const pollMap = new Map(pollRows.map((row) => [row.id, row]));
  const reporterMap = new Map(reporterRows.map((row) => [row.id, row]));

  const resolved = searchParams ? await searchParams : {};
  const statusType = readValue(resolved.type);
  const statusMessage = readValue(resolved.message);
  const groupedByPoll = new Map<string, GroupedReport>();

  for (const report of reports) {
    const current = groupedByPoll.get(report.poll_id);
    if (!current) {
      groupedByPoll.set(report.poll_id, {
        pollId: report.poll_id,
        latestReport: report,
        totalCount: 1,
        openCount: report.status === "open" ? 1 : 0
      });
      continue;
    }

    current.totalCount += 1;
    if (report.status === "open") {
      current.openCount += 1;
    }
  }

  const grouped = Array.from(groupedByPoll.values());
  const pendingReports = grouped
    .filter((item) => item.openCount > 0)
    .sort((a, b) => b.openCount - a.openCount || Date.parse(b.latestReport.created_at) - Date.parse(a.latestReport.created_at));
  const completedReports = grouped
    .filter((item) => item.openCount === 0)
    .sort((a, b) => Date.parse(b.latestReport.created_at) - Date.parse(a.latestReport.created_at));

  function renderReportCard(group: GroupedReport) {
    const report = group.latestReport;
    const poll = pollMap.get(group.pollId);
    const reporter = reporterMap.get(report.reporter_id);
    const effectiveStatus: ReportRow["status"] = group.openCount > 0 ? "open" : report.status;

    return (
      <article key={group.pollId} className="detail-card" style={{ marginTop: 16 }}>
        <p className="eyebrow">{new Date(report.created_at).toLocaleString()}</p>
        <div className="report-card-head">
          <h3>{reasonLabel(report.reason)}</h3>
          <div className="report-badge-row">
            <span className="report-count-badge">Reports {group.totalCount}</span>
            {group.openCount > 0 ? <span className="report-count-badge report-count-badge-open">Open {group.openCount}</span> : null}
          </div>
        </div>
        <p className="poll-blurb">Status: {statusLabel(effectiveStatus)}</p>
        <p className="poll-blurb">Latest reporter: {reporter?.username ?? report.reporter_id}</p>
        {poll ? (
          <p className="poll-blurb">
            Poll: <Link href={`/polls/${poll.slug}`}>{poll.title}</Link>
          </p>
        ) : (
          <p className="poll-blurb">Poll ID: {group.pollId}</p>
        )}
        {report.details ? <p className="detail-description">{report.details}</p> : null}

        <div className="submit-actions-row" style={{ marginTop: 10 }}>
          {poll ? (
            <Link className="ghost-btn" href={`/admin/polls/${poll.id}?reportId=${report.id}`}>
              Review poll
            </Link>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <main className="page-shell submit-shell">
      <Link href="/" className="back-link">
        Back to feed
      </Link>

      <article className="detail-card">
        <h1>Report Inbox</h1>
        <p className="poll-blurb">Admin-only post-publish moderation queue.</p>
        {statusMessage ? (
          <p className={statusType === "error" ? "auth-error" : "auth-success"}>{statusMessage}</p>
        ) : null}
      </article>

      {reports.length === 0 ? (
        <article className="detail-card" style={{ marginTop: 16 }}>
          <p>No reports yet.</p>
        </article>
      ) : (
        <section
          style={{
            marginTop: 16,
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            alignItems: "start"
          }}
        >
          <div>
            <article className="detail-card">
              <h2>Needs review</h2>
              <p className="poll-blurb">{pendingReports.length} poll(s)</p>
            </article>
            {pendingReports.length === 0 ? (
              <article className="detail-card" style={{ marginTop: 16 }}>
                <p>No open reports.</p>
              </article>
            ) : (
              pendingReports.map(renderReportCard)
            )}
          </div>

          <div>
            <article className="detail-card">
              <details>
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>Completed ({completedReports.length})</summary>
                {completedReports.length === 0 ? (
                  <p className="poll-blurb" style={{ marginTop: 12 }}>
                    No completed reports yet.
                  </p>
                ) : (
                  <div style={{ marginTop: 12 }}>{completedReports.map(renderReportCard)}</div>
                )}
              </details>
            </article>
          </div>
        </section>
      )}
    </main>
  );
}
