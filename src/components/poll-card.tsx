import Link from "next/link";
import { buildFeedHref } from "@/lib/feed-query";
import { Poll } from "@/lib/types";
import { totalVotes } from "@/lib/mock-data";
import { VoteOptionForm } from "@/components/vote-option-form";
import { BookmarkToggleForm } from "@/components/bookmark-toggle-form";

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
  const rankedOptions = [...poll.options].sort(
    (left, right) => right.votes - left.votes || left.label.localeCompare(right.label)
  );
  const visibleOptions = rankedOptions.slice(0, 4);
  const hiddenCount = Math.max(rankedOptions.length - visibleOptions.length, 0);

  return (
    <article className="poll-card">
      <div className="poll-top-row">
        <Link className="poll-category" href={buildFeedHref({ category: poll.category })}>
          {poll.category}
        </Link>
        {poll.isTrending ? <span className="trend-badge">Trending</span> : null}
      </div>

      <h2>
        <Link href={`/polls/${poll.slug}`}>{poll.title}</Link>
      </h2>
      <p className="poll-blurb">{poll.blurb}</p>

      <div className="option-list">
        {visibleOptions.map((option) => (
          <VoteOptionForm
            key={option.id}
            pollId={poll.id}
            optionId={option.id}
            returnTo={returnTo}
            label={option.label}
            rightText={percent(option.votes, total)}
          />
        ))}
      </div>
      {hiddenCount > 0 ? <p className="more-options">+{hiddenCount} more options</p> : null}

      <div className="poll-footer">
        <div className="poll-footer-left">
          <p>{total.toLocaleString()} votes</p>
          <BookmarkToggleForm pollId={poll.id} isBookmarked={poll.isBookmarked} returnTo={returnTo} compact />
        </div>
        <Link href={`/polls/${poll.slug}`}>View details</Link>
      </div>
    </article>
  );
}
