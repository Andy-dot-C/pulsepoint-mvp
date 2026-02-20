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
        <div className="poll-footer-left" />
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
