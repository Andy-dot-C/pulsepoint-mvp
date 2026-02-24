import Link from "next/link";
import { buildFeedHref } from "@/lib/feed-query";
import { formatVoteLabel } from "@/lib/format-votes";
import { Poll } from "@/lib/types";
import { totalVotes } from "@/lib/mock-data";
import { VoteOptionForm } from "@/components/vote-option-form";
import { TrendBars } from "@/components/trend-bars";
import { SharePollButton } from "@/components/share-poll-button";
import { BookmarkToggleForm } from "@/components/bookmark-toggle-form";
import { PollCardShell } from "@/components/poll-card-shell";

type FeedFeaturedPollCardProps = {
  poll: Poll;
  returnTo: string;
};

function percent(votes: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((votes / total) * 100)}%`;
}

function formatCompactCount(value: number): string {
  const rounded = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  if (rounded >= 1_000_000) {
    const millions = rounded / 1_000_000;
    return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}m`;
  }
  if (rounded >= 1_000) {
    const thousands = rounded / 1_000;
    return `${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}k`;
  }
  return `${rounded}`;
}

export function FeedFeaturedPollCard({ poll, returnTo }: FeedFeaturedPollCardProps) {
  const total = totalVotes(poll);
  const pollHref = `/polls/${poll.slug}`;
  const ranked = [...poll.options].sort((left, right) => right.votes - left.votes || left.label.localeCompare(right.label));
  const featuredOptions = ranked.slice(0, 3);

  return (
    <PollCardShell href={pollHref} ariaLabel={`Open featured poll: ${poll.title}`} className="featured-poll-card">
      <h2 className="featured-poll-title">
        <Link href={pollHref}>{poll.title}</Link>
      </h2>
      <div className="poll-top-row">
        <Link className="poll-category" href={buildFeedHref({ filter: poll.category })}>
          {poll.category}
        </Link>
      </div>

      <div className="featured-poll-main">
        <div className="featured-poll-left">
          <div className="option-list">
            {featuredOptions.map((option) => (
              <VoteOptionForm
                key={option.id}
                pollId={poll.id}
                optionId={option.id}
                returnTo={returnTo}
                label={option.label}
                rightText={percent(option.votes, total)}
                percent={(option.votes / Math.max(total, 1)) * 100}
              />
            ))}
          </div>
          <p className="featured-poll-meta">{formatVoteLabel(total)}</p>
        </div>

        <div className="featured-poll-chart">
          <TrendBars poll={poll} />
        </div>
      </div>

      <div className="poll-footer">
        <div className="poll-footer-left">
          <p className="poll-meta-pill">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M16 19a4 4 0 0 0-8 0M19 19a4 4 0 0 0-2.1-3.5M5 19A4 4 0 0 1 7.1 15.5M16 8a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM8 8a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {formatCompactCount(total)}
          </p>
          <Link className="poll-comment-pill" href={`/polls/${poll.slug}#comments`} title="View comments">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M5 6.5h14a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3v-3H5A1.5 1.5 0 0 1 3.5 16V8A1.5 1.5 0 0 1 5 6.5Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
            {poll.commentCount}
          </Link>
        </div>
        <div className="poll-footer-right">
          <BookmarkToggleForm pollId={poll.id} isBookmarked={poll.isBookmarked} source="feed_featured" compact />
          <SharePollButton
            pollId={poll.id}
            title={poll.title}
            path={`/polls/${poll.slug}`}
            embedPath={`/embed/polls/${poll.slug}`}
            source="feed_featured"
            compact
          />
        </div>
      </div>
    </PollCardShell>
  );
}
