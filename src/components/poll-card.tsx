import Link from "next/link";
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

function pollIconImageUrl(seed: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/96/96`;
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
      <div className="poll-title-row">
        <span className="poll-icon-badge" aria-hidden="true">
          <img src={pollIconImageUrl(poll.id)} alt="" loading="lazy" decoding="async" />
        </span>
        <h2>
          <Link href={pollHref}>{poll.title}</Link>
        </h2>
      </div>

      <div className="poll-top-row poll-top-row-right">
        <div className="poll-badge-row">
          {status.isClosed ? <span className="poll-state-badge poll-state-badge-closed">Closed</span> : null}
          {poll.isTrending ? <span className="trend-badge">Trending</span> : null}
        </div>
      </div>

      <div className="option-list">
        {visibleOptions.map((option) => (
          <VoteOptionForm
            key={option.id}
            pollId={poll.id}
            optionId={option.id}
            returnTo={returnTo}
            label={option.label}
            rightText={percent(option.votes, total)}
            percent={(option.votes / Math.max(total, 1)) * 100}
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
          <p className="poll-meta-pill">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M16 19a4 4 0 0 0-8 0M19 19a4 4 0 0 0-2.1-3.5M5 19A4 4 0 0 1 7.1 15.5M16 8a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM8 8a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
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
          <BookmarkToggleForm pollId={poll.id} isBookmarked={poll.isBookmarked} source="feed_card" compact />
          <SharePollButton
            pollId={poll.id}
            title={poll.title}
            path={`/polls/${poll.slug}`}
            embedPath={`/embed/polls/${poll.slug}`}
            source="feed_card"
            compact
          />
        </div>
      </div>
    </PollCardShell>
  );
}
