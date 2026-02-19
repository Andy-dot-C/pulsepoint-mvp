import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrendBars } from "@/components/trend-bars";
import { VoteOptionForm } from "@/components/vote-option-form";
import { ReportPollForm } from "@/components/report-poll-form";
import { BookmarkToggleForm } from "@/components/bookmark-toggle-form";
import { PollComments } from "@/components/poll-comments";
import { SharePollButton } from "@/components/share-poll-button";
import { PollViewTracker } from "@/components/poll-view-tracker";
import { fetchPollBySlug } from "@/lib/data/polls";
import { fetchPollMetaBySlug } from "@/lib/data/polls";
import { fetchPollComments, resolveCommentSort } from "@/lib/data/comments";
import { buildFeedHref } from "@/lib/feed-query";
import { formatTotalVoteLabel } from "@/lib/format-votes";
import { totalVotes } from "@/lib/mock-data";
import { getPollStatus } from "@/lib/poll-status";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

type PollPageProps = {
  params: { slug: string } | Promise<{ slug: string }>;
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
};

function readValue(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params }: PollPageProps): Promise<Metadata> {
  const { slug } = await Promise.resolve(params);
  const poll = await fetchPollMetaBySlug(slug);
  if (!poll) {
    return {
      title: "Poll not found | PulsePoint",
      description: "This poll may have been removed or is unavailable."
    };
  }

  const siteUrl = getSiteUrl();
  const pollUrl = `${siteUrl}/polls/${poll.slug}`;
  const title = `${poll.title} | PulsePoint`;
  const description = poll.blurb;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pollUrl,
      siteName: "PulsePoint",
      type: "article",
      images: ["/opengraph-image"]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"]
    }
  };
}

export default async function PollPage({ params, searchParams }: PollPageProps) {
  const { slug } = await Promise.resolve(params);
  const poll = await fetchPollBySlug(slug);
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const reportStatusType = readValue(resolvedSearchParams.report);
  const reportStatusMessage = readValue(resolvedSearchParams.message);
  const bookmarkError = readValue(resolvedSearchParams.bookmarkError);
  const commentStatusType = readValue(resolvedSearchParams.commentType);
  const commentStatusMessage = readValue(resolvedSearchParams.commentMessage);
  const commentSort = resolveCommentSort(readValue(resolvedSearchParams.comments));

  if (!poll) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  const comments = await fetchPollComments(poll.id, commentSort, user?.id ?? null);

  const total = totalVotes(poll);
  const status = getPollStatus(poll.endsAt);
  const rankedOptions = [...poll.options].sort(
    (left, right) => right.votes - left.votes || left.label.localeCompare(right.label)
  );

  return (
    <main className="page-shell detail-shell">
      <PollViewTracker pollId={poll.id} />
      <Link href="/" className="back-link">
        Back to feed
      </Link>

      <article className="detail-card">
        <div className="detail-top-row">
          <Link className="poll-category" href={buildFeedHref({ category: poll.category })}>
            {poll.category}
          </Link>
          <div className="detail-top-actions">
            {status.isClosingSoon ? <span className="poll-state-badge poll-state-badge-soon">Closing soon</span> : null}
            {status.isClosed ? <span className="poll-state-badge poll-state-badge-closed">Closed</span> : null}
            <p>{formatTotalVoteLabel(total)}</p>
            <BookmarkToggleForm
              pollId={poll.id}
              isBookmarked={poll.isBookmarked}
              returnTo={`/polls/${poll.slug}?comments=${commentSort}`}
            />
            <SharePollButton
              pollId={poll.id}
              title={poll.title}
              path={`/polls/${poll.slug}`}
              embedPath={`/embed/polls/${poll.slug}`}
              source="poll_detail"
            />
          </div>
        </div>

        <h1>{poll.title}</h1>
        {bookmarkError ? <p className="auth-error">{bookmarkError}</p> : null}
        <p className="detail-description">{poll.description}</p>

        <section>
          <h2>Vote now</h2>
          <div className="option-list">
            {rankedOptions.map((option) => (
              <VoteOptionForm
                key={option.id}
                pollId={poll.id}
                optionId={option.id}
                returnTo={`/polls/${poll.slug}?comments=${commentSort}`}
                label={option.label}
                rightText={`${Math.round((option.votes / Math.max(total, 1)) * 100)}%`}
                disabled={status.isClosed}
              />
            ))}
          </div>
          {status.isClosed ? <p className="poll-blurb">This poll is closed. Voting is disabled.</p> : null}
        </section>

        <section>
          <h2>Vote activity split over time</h2>
          <TrendBars poll={poll} />
        </section>

        <section className="meta-grid">
          <div>
            <h3>Created</h3>
            <p>{new Date(poll.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <h3>Ends</h3>
            <p>{poll.endsAt ? new Date(poll.endsAt).toLocaleDateString() : "No end date"}</p>
          </div>
        </section>

        <PollComments
          pollId={poll.id}
          pollSlug={poll.slug}
          comments={comments}
          sort={commentSort}
          commentStatusType={commentStatusType}
          commentStatusMessage={commentStatusMessage}
          signedIn={Boolean(user)}
          isAdmin={profile?.role === "admin"}
        />

        <ReportPollForm
          pollId={poll.id}
          returnTo={`/polls/${poll.slug}?comments=${commentSort}`}
          statusType={reportStatusType}
          statusMessage={reportStatusMessage}
        />
      </article>
    </main>
  );
}
