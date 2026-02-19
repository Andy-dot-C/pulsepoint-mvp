import Link from "next/link";
import { buildFeedHref } from "@/lib/feed-query";
import { formatVoteLabel } from "@/lib/format-votes";
import { Poll } from "@/lib/types";
import { totalVotes } from "@/lib/mock-data";
import { VoteOptionForm } from "@/components/vote-option-form";
import { BookmarkToggleForm } from "@/components/bookmark-toggle-form";
import { SharePollButton } from "@/components/share-poll-button";
import { PollImpressionTracker } from "@/components/poll-impression-tracker";
import { getPollStatus } from "@/lib/poll-status";
import { PollCardShell } from "@/components/poll-card-shell";

type PollCardProps = {
  poll: Poll;
  returnTo: string;
};

function percent(votes: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((votes / total) * 100)}%`;
}

export function PollCard({ poll, returnTo }: PollCardProps) {
  const total = totalVotes(poll);
  const status = getPollStatus(poll.endsAt);
  const voteRankedOptions = [...poll.options].sort(
    (left, right) => right.votes - left.votes || left.label.localeCompare(right.label)
  );
  const feedOptions = poll.options.length > 4 ? voteRankedOptions : poll.options;
  const visibleOptions = feedOptions.slice(0, 4);
  const hiddenCount = Math.max(feedOptions.length - visibleOptions.length, 0);
  const pollHref = `/polls/${poll.slug}`;

  return (
    <PollCardShell href={pollHref} ariaLabel={`Open poll: ${poll.title}`}>
      <PollImpressionTracker pollId={poll.id} />
      <div className="poll-top-row">
        <Link className="poll-category" href={buildFeedHref({ category: poll.category })}>
          {poll.category}
        </Link>
        <div className="poll-badge-row">
          {status.isClosed ? <span className="poll-state-badge poll-state-badge-closed">Closed</span> : null}
          {poll.isTrending ? <span className="trend-badge">Trending</span> : null}
        </div>
      </div>

      <h2>
        <Link href={pollHref}>{poll.title}</Link>
      </h2>

      <div className="option-list">
        {visibleOptions.map((option) => (
          <VoteOptionForm
            key={option.id}
            pollId={poll.id}
            optionId={option.id}
            returnTo={returnTo}
            label={option.label}
            rightText={percent(option.votes, total)}
            disabled={status.isClosed}
          />
        ))}
      </div>
      {hiddenCount > 0 ? (
        <p className="more-options">
          <Link href={pollHref}>+{hiddenCount} more options</Link>
        </p>
      ) : null}

      <div className="poll-footer">
        <div className="poll-footer-left">
          <p>{formatVoteLabel(total)}</p>
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
          <BookmarkToggleForm pollId={poll.id} isBookmarked={poll.isBookmarked} returnTo={returnTo} compact />
        </div>
        <div className="poll-footer-right">
          <SharePollButton
            pollId={poll.id}
            title={poll.title}
            path={`/polls/${poll.slug}`}
            embedPath={`/embed/polls/${poll.slug}`}
            source="feed_card"
            compact
          />
          <Link href={`/polls/${poll.slug}`}>View details</Link>
        </div>
      </div>
    </PollCardShell>
  );
}
