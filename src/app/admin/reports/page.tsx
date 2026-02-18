import Link from "next/link";
import { markReportReviewedAction, resolveReportAction } from "@/app/actions/reports";
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
        reports.map((report) => {
          const poll = pollMap.get(report.poll_id);
          const reporter = reporterMap.get(report.reporter_id);

          return (
            <article key={report.id} className="detail-card" style={{ marginTop: 16 }}>
              <p className="eyebrow">{new Date(report.created_at).toLocaleString()}</p>
              <h3>{reasonLabel(report.reason)}</h3>
              <p className="poll-blurb">Status: {report.status}</p>
              <p className="poll-blurb">Reporter: {reporter?.username ?? report.reporter_id}</p>
              {poll ? (
                <p className="poll-blurb">
                  Poll: <Link href={`/polls/${poll.slug}`}>{poll.title}</Link>
                </p>
              ) : (
                <p className="poll-blurb">Poll ID: {report.poll_id}</p>
              )}
              {report.details ? <p className="detail-description">{report.details}</p> : null}

              <div className="submit-actions-row" style={{ marginTop: 10 }}>
                {poll ? (
                  <Link className="ghost-btn" href={`/admin/polls/${poll.id}`}>
                    Edit poll
                  </Link>
                ) : null}

                <form action={markReportReviewedAction}>
                  <input type="hidden" name="reportId" value={report.id} />
                  <button className="ghost-btn" type="submit" disabled={report.status !== "open"}>
                    Mark reviewed
                  </button>
                </form>

                <form action={resolveReportAction}>
                  <input type="hidden" name="reportId" value={report.id} />
                  <button className="create-btn" type="submit" disabled={report.status === "resolved"}>
                    Resolve
                  </button>
                </form>
              </div>
            </article>
          );
        })
      )}
    </main>
  );
}
