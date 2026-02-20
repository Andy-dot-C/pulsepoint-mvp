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

function mostVotedList(polls: Poll[]): Poll[] {
  return [...polls].sort((left, right) => totalVotes(right) - totalVotes(left)).slice(0, 5);
}

function newestList(polls: Poll[]): Poll[] {
  return [...polls].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)).slice(0, 5);
}

export function FeedRail({ polls }: FeedRailProps) {
  const trending = trendingList(polls);
  const mostVoted = mostVotedList(polls);
  const newest = newestList(polls);

  return (
    <aside className="side-column">
      <article className="feed-rail-panel">
        <section className="feed-rail-section">
          <div className="side-card-head">
            <h3>Trending</h3>
          </div>
          <ol className="rail-list">
            {trending.map((poll) => (
              <li key={poll.id} className="rail-item">
                <Link href={`/polls/${poll.slug}`} className="rail-link">
                  <span className="rail-title">{poll.title}</span>
                  <span className="rail-score">{topShare(poll)}%</span>
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
            {mostVoted.map((poll) => (
              <li key={poll.id} className="rail-item">
                <Link href={`/polls/${poll.slug}`} className="rail-link">
                  <span className="rail-title">{poll.title}</span>
                  <span className="rail-score">{topShare(poll)}%</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="feed-rail-section">
          <div className="side-card-head">
            <h3>New</h3>
          </div>
          <ol className="rail-list">
            {newest.map((poll) => (
              <li key={poll.id} className="rail-item">
                <Link href={`/polls/${poll.slug}`} className="rail-link">
                  <span className="rail-title">{poll.title}</span>
                  <span className="rail-score">{topShare(poll)}%</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </article>
    </aside>
  );
}
