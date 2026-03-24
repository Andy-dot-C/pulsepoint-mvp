import Link from "next/link";
import { totalVotes } from "@/lib/mock-data";
import { Poll } from "@/lib/types";

type FeedRailProps = {
  polls: Poll[];
};

function topShare(poll: Poll): number {
  const total = totalVotes(poll);
  if (total === 0) return 0;
  const lead = Math.max(...poll.options.map((option) => option.votes), 0);
  return Math.round((lead / total) * 100);
}

function topOptionLabel(poll: Poll): string {
  if (poll.options.length === 0) return "No options";
  const ranked = [...poll.options].sort(
    (left, right) => right.votes - left.votes || left.label.localeCompare(right.label)
  );
  return ranked[0]?.label ?? "No options";
}

function breakingList(polls: Poll[]): Poll[] {
  return [...polls]
    .sort(
      (left, right) =>
        (right.trend.find((item) => item.label === "24h")?.totalVotes ?? 0) -
          (left.trend.find((item) => item.label === "24h")?.totalVotes ?? 0) ||
        Date.parse(right.createdAt) - Date.parse(left.createdAt)
    )
    .slice(0, 5);
}

function topMoversList(polls: Poll[]): Poll[] {
  return [...polls]
    .sort(
      (left, right) =>
        Math.abs((right.trend.find((item) => item.label === "24h")?.totalVotes ?? 0) - (right.trend.find((item) => item.label === "7d")?.totalVotes ?? 0)) -
          Math.abs((left.trend.find((item) => item.label === "24h")?.totalVotes ?? 0) - (left.trend.find((item) => item.label === "7d")?.totalVotes ?? 0)) ||
        (right.trend.find((item) => item.label === "24h")?.totalVotes ?? 0) -
          (left.trend.find((item) => item.label === "24h")?.totalVotes ?? 0)
    )
    .slice(0, 5);
}

function mostVotedList(polls: Poll[]): Poll[] {
  return [...polls].sort((left, right) => totalVotes(right) - totalVotes(left)).slice(0, 5);
}

function dedupeById(primary: Poll[]): Poll[] {
  const seen = new Set<string>();
  const result: Poll[] = [];
  for (const poll of primary) {
    if (seen.has(poll.id)) continue;
    seen.add(poll.id);
    result.push(poll);
  }
  return result;
}

function fillToFive(input: Poll[], fallback: Poll[]): Poll[] {
  const seen = new Set(input.map((poll) => poll.id));
  const result = [...input];
  for (const poll of fallback) {
    if (result.length >= 5) break;
    if (seen.has(poll.id)) continue;
    seen.add(poll.id);
    result.push(poll);
  }
  return result.slice(0, 5);
}

function trendingList(polls: Poll[]): Poll[] {
  const trending = polls.filter((poll) => poll.isTrending);
  if (trending.length >= 5) return trending.slice(0, 5);
  const byVelocity = [...polls].sort(
    (left, right) =>
      (right.trend.find((item) => item.label === "24h")?.totalVotes ?? 0) -
      (left.trend.find((item) => item.label === "24h")?.totalVotes ?? 0)
  );
  return byVelocity.slice(0, 5);
}

export function FeedRail({ polls }: FeedRailProps) {
  const fallbackTrending = trendingList(polls);
  const breaking = fillToFive(dedupeById(breakingList(polls)), fallbackTrending);
  const topMovers = fillToFive(dedupeById(topMoversList(polls)), fallbackTrending);
  const mostVoted = fillToFive(dedupeById(mostVotedList(polls)), fallbackTrending);

  return (
    <aside className="side-column">
      <article className="feed-rail-panel">
        <section className="feed-rail-section">
          <div className="side-card-head">
            <h3>Breaking</h3>
          </div>
          <ol className="rail-list">
            {breaking.map((poll) => (
              <li key={poll.id} className="rail-item">
                <Link href={`/polls/${poll.slug}`} className="rail-link">
                  <span className="rail-title">{poll.title}</span>
                  <span className="rail-answer-row">
                    <span className="rail-answer">{topOptionLabel(poll)}</span>
                    <span className="rail-score">{topShare(poll)}%</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="feed-rail-section">
          <div className="side-card-head">
            <h3>Top movers</h3>
          </div>
          <ol className="rail-list">
            {topMovers.map((poll) => (
              <li key={poll.id} className="rail-item">
                <Link href={`/polls/${poll.slug}`} className="rail-link">
                  <span className="rail-title">{poll.title}</span>
                  <span className="rail-answer-row">
                    <span className="rail-answer">{topOptionLabel(poll)}</span>
                    <span className="rail-score">{topShare(poll)}%</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="feed-rail-section">
          <div className="side-card-head">
            <h3>Most voted</h3>
          </div>
          <ol className="rail-list">
            {mostVoted.map((poll) => (
              <li key={poll.id} className="rail-item">
                <Link href={`/polls/${poll.slug}`} className="rail-link">
                  <span className="rail-title">{poll.title}</span>
                  <span className="rail-answer-row">
                    <span className="rail-answer">{topOptionLabel(poll)}</span>
                    <span className="rail-score">{topShare(poll)}%</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </article>
    </aside>
  );
}
