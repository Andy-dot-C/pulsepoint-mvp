import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type AdminAnalyticsPageProps = {
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
};

type PollEventRow = {
  poll_id: string;
  event_type: string;
  created_at: string;
};

type PollRow = {
  id: string;
  title: string;
  slug: string;
  category_key: string;
  is_sponsored: boolean;
};

function readValue(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function toWindowDays(value: string | undefined): 7 | 30 {
  return value === "30d" ? 30 : 7;
}

function toScope(value: string | undefined): "all" | "sponsored" | "organic" {
  if (value === "sponsored" || value === "organic") return value;
  return "all";
}

function sinceIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

type PollRollup = {
  pollId: string;
  views: number;
  impressions: number;
  votes: number;
  comments: number;
  shares: number;
  saves: number;
  reports: number;
  engagement: number;
};

export default async function AdminAnalyticsPage({ searchParams }: AdminAnalyticsPageProps) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="page-shell submit-shell">
        <article className="detail-card">
          <h1>Admin access required</h1>
          <p className="poll-blurb">Sign in with an admin account to view analytics.</p>
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
  const days = toWindowDays(readValue(resolved.range));
  const scope = toScope(readValue(resolved.scope));
  const floor = sinceIso(days);

  const { data: eventRowsData, error: eventError } = await supabase
    .from("poll_events")
    .select("poll_id,event_type,created_at")
    .gte("created_at", floor)
    .order("created_at", { ascending: false })
    .limit(50000);

  if (eventError) {
    return (
      <main className="page-shell submit-shell">
        <Link href="/" className="back-link">
          Back to feed
        </Link>
        <article className="detail-card">
          <h1>Analytics</h1>
          <p className="auth-error">{eventError.message}</p>
        </article>
      </main>
    );
  }

  const eventRows = (eventRowsData ?? []) as PollEventRow[];
  const pollIds = [...new Set(eventRows.map((item) => item.poll_id))];
  const { data: pollRowsData } =
    pollIds.length > 0
      ? await supabase.from("polls").select("id,title,slug,category_key,is_sponsored").in("id", pollIds)
      : { data: [] as PollRow[] };
  const pollRows = (pollRowsData ?? []) as PollRow[];
  const pollMap = new Map(pollRows.map((item) => [item.id, item]));

  const filteredEvents = eventRows.filter((event) => {
    const poll = pollMap.get(event.poll_id);
    if (!poll) return false;
    if (scope === "sponsored") return Boolean(poll.is_sponsored);
    if (scope === "organic") return !poll.is_sponsored;
    return true;
  });

  const totals = {
    impressions: 0,
    views: 0,
    votes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    reports: 0
  };
  const pollRollups = new Map<string, PollRollup>();
  const categoryEngagement = new Map<string, number>();

  function ensureRollup(pollId: string): PollRollup {
    const existing = pollRollups.get(pollId);
    if (existing) return existing;
    const created: PollRollup = {
      pollId,
      views: 0,
      impressions: 0,
      votes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      reports: 0,
      engagement: 0
    };
    pollRollups.set(pollId, created);
    return created;
  }

  for (const event of filteredEvents) {
    const rollup = ensureRollup(event.poll_id);
    const poll = pollMap.get(event.poll_id);
    const category = poll?.category_key ?? "unknown";

    if (event.event_type === "poll_impression") {
      totals.impressions += 1;
      rollup.impressions += 1;
      continue;
    }
    if (event.event_type === "poll_view") {
      totals.views += 1;
      rollup.views += 1;
      rollup.engagement += 1;
      categoryEngagement.set(category, (categoryEngagement.get(category) ?? 0) + 1);
      continue;
    }
    if (event.event_type === "vote_cast") {
      totals.votes += 1;
      rollup.votes += 1;
      rollup.engagement += 3;
      categoryEngagement.set(category, (categoryEngagement.get(category) ?? 0) + 3);
      continue;
    }
    if (event.event_type === "comment_post") {
      totals.comments += 1;
      rollup.comments += 1;
      rollup.engagement += 2;
      categoryEngagement.set(category, (categoryEngagement.get(category) ?? 0) + 2);
      continue;
    }
    if (event.event_type === "poll_share") {
      totals.shares += 1;
      rollup.shares += 1;
      rollup.engagement += 2;
      categoryEngagement.set(category, (categoryEngagement.get(category) ?? 0) + 2);
      continue;
    }
    if (event.event_type === "bookmark_add") {
      totals.saves += 1;
      rollup.saves += 1;
      rollup.engagement += 1;
      categoryEngagement.set(category, (categoryEngagement.get(category) ?? 0) + 1);
      continue;
    }
    if (event.event_type === "report_submit") {
      totals.reports += 1;
      rollup.reports += 1;
      continue;
    }
  }

  const activePolls = pollRollups.size;
  const viewRate = totals.impressions === 0 ? 0 : (totals.views / totals.impressions) * 100;
  const voteRate = totals.views === 0 ? 0 : (totals.votes / totals.views) * 100;
  const shareRate = totals.views === 0 ? 0 : (totals.shares / totals.views) * 100;

  const topPolls = Array.from(pollRollups.values())
    .sort((left, right) => right.engagement - left.engagement || right.votes - left.votes)
    .slice(0, 10);
  const topCategories = Array.from(categoryEngagement.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6);

  const selectedRange = days === 30 ? "30d" : "7d";
  const selectedScope = scope;

  function href(next: { range?: "7d" | "30d"; scope?: "all" | "sponsored" | "organic" }): string {
    const params = new URLSearchParams();
    params.set("range", next.range ?? selectedRange);
    params.set("scope", next.scope ?? selectedScope);
    return `/admin/analytics?${params.toString()}`;
  }

  return (
    <main className="page-shell submit-shell">
      <Link href="/" className="back-link">
        Back to feed
      </Link>

      <article className="detail-card">
        <h1>Analytics</h1>
        <p className="poll-blurb">Platform activity over the last {days} days.</p>
        <div className="analytics-filter-row">
          <div className="analytics-chip-group">
            <Link className={`pill ${selectedRange === "7d" ? "pill-active" : ""}`} href={href({ range: "7d" })}>
              7d
            </Link>
            <Link className={`pill ${selectedRange === "30d" ? "pill-active" : ""}`} href={href({ range: "30d" })}>
              30d
            </Link>
          </div>
          <div className="analytics-chip-group">
            <Link className={`pill ${selectedScope === "all" ? "pill-active" : ""}`} href={href({ scope: "all" })}>
              All polls
            </Link>
            <Link
              className={`pill ${selectedScope === "organic" ? "pill-active" : ""}`}
              href={href({ scope: "organic" })}
            >
              Organic
            </Link>
            <Link
              className={`pill ${selectedScope === "sponsored" ? "pill-active" : ""}`}
              href={href({ scope: "sponsored" })}
            >
              Sponsored
            </Link>
          </div>
        </div>
      </article>

      <section className="analytics-grid">
        <article className="detail-card">
          <h3>Impressions</h3>
          <p className="analytics-value">{totals.impressions.toLocaleString()}</p>
        </article>
        <article className="detail-card">
          <h3>Poll views</h3>
          <p className="analytics-value">{totals.views.toLocaleString()}</p>
        </article>
        <article className="detail-card">
          <h3>Votes cast</h3>
          <p className="analytics-value">{totals.votes.toLocaleString()}</p>
        </article>
        <article className="detail-card">
          <h3>Comments posted</h3>
          <p className="analytics-value">{totals.comments.toLocaleString()}</p>
        </article>
        <article className="detail-card">
          <h3>Shares</h3>
          <p className="analytics-value">{totals.shares.toLocaleString()}</p>
        </article>
        <article className="detail-card">
          <h3>Saves</h3>
          <p className="analytics-value">{totals.saves.toLocaleString()}</p>
        </article>
      </section>

      <section className="analytics-grid">
        <article className="detail-card">
          <h3>Active polls</h3>
          <p className="analytics-value">{activePolls.toLocaleString()}</p>
        </article>
        <article className="detail-card">
          <h3>View rate</h3>
          <p className="analytics-value">{viewRate.toFixed(1)}%</p>
        </article>
        <article className="detail-card">
          <h3>Vote / view</h3>
          <p className="analytics-value">{voteRate.toFixed(1)}%</p>
        </article>
        <article className="detail-card">
          <h3>Share / view</h3>
          <p className="analytics-value">{shareRate.toFixed(1)}%</p>
        </article>
      </section>

      <section className="analytics-split">
        <article className="detail-card">
          <h2>Top polls</h2>
          {topPolls.length === 0 ? (
            <p className="poll-blurb">No data in this window.</p>
          ) : (
            <div className="analytics-list">
              {topPolls.map((item) => {
                const poll = pollMap.get(item.pollId);
                return (
                  <div key={item.pollId} className="analytics-list-row">
                    <div>
                      <p className="analytics-row-title">
                        {poll ? <Link href={`/polls/${poll.slug}`}>{poll.title}</Link> : item.pollId}
                      </p>
                      <p className="poll-blurb">
                        Votes {item.votes.toLocaleString()} • Comments {item.comments.toLocaleString()} • Shares{" "}
                        {item.shares.toLocaleString()}
                      </p>
                    </div>
                    <p className="analytics-row-score">{item.engagement}</p>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <article className="detail-card">
          <h2>Top categories</h2>
          {topCategories.length === 0 ? (
            <p className="poll-blurb">No data in this window.</p>
          ) : (
            <div className="analytics-list">
              {topCategories.map(([category, score]) => (
                <div key={category} className="analytics-list-row">
                  <p className="analytics-row-title" style={{ textTransform: "capitalize" }}>
                    {category}
                  </p>
                  <p className="analytics-row-score">{score}</p>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
