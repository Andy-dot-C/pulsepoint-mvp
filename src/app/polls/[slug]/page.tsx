import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VoteOptionForm } from "@/components/vote-option-form";
import { ReportPollForm } from "@/components/report-poll-form";
import { BookmarkToggleForm } from "@/components/bookmark-toggle-form";
import { PollComments } from "@/components/poll-comments";
import { SharePollButton } from "@/components/share-poll-button";
import { PollViewTracker } from "@/components/poll-view-tracker";
import { PollResultsGraph } from "@/components/poll-results-graph";
import { fetchPollBySlug } from "@/lib/data/polls";
import { fetchPollMetaBySlug } from "@/lib/data/polls";
import { fetchPollComments, resolveCommentSort } from "@/lib/data/comments";
import { buildFeedHref } from "@/lib/feed-query";
import { getPollStatus } from "@/lib/poll-status";
import { getPollOptionFillColor } from "@/lib/poll-colors";
import { buildPollChartData, parsePollGraphTimeframe, parsePollGraphVariant } from "@/lib/poll-chart-data";
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

function formatDetailDate(value: string | null | undefined): string {
  if (!value) return "No end date";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
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
  const description = poll.summary;

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
  const graphVariant = parsePollGraphVariant(readValue(resolvedSearchParams.graph));
  const graphTimeframe = parsePollGraphTimeframe(readValue(resolvedSearchParams.time));

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

  const chartData = buildPollChartData(poll);
  const status = getPollStatus(poll.endsAt);
  const rankedOptions = chartData.options;
  const createdLabel = formatDetailDate(poll.createdAt);
  const endsLabel = formatDetailDate(poll.endsAt);
  const statusLabel = status.isClosed ? "Closed" : status.isClosingSoon ? "Closing soon" : "Open";
  const returnTo = `/polls/${poll.slug}?comments=${commentSort}&graph=${graphVariant}&time=${graphTimeframe}`;

  return (
    <main className="page-shell detail-shell">
      <PollViewTracker pollId={poll.id} />
      <Link href="/" className="back-link">
        Back to feed
      </Link>

      <article className="detail-card detail-card-opened">
        <section className="detail-hero">
          <div className="detail-top-row">
            <Link className="poll-category" href={buildFeedHref({ filter: poll.category })}>
              {poll.category}
            </Link>
            <div className="detail-top-actions">
              {status.isClosingSoon ? <span className="poll-state-badge poll-state-badge-soon">Closing soon</span> : null}
              {status.isClosed ? <span className="poll-state-badge poll-state-badge-closed">Closed</span> : null}
              <BookmarkToggleForm
                pollId={poll.id}
                isBookmarked={poll.isBookmarked}
                source="poll_detail"
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
          <p className="detail-description">{poll.summary}</p>
          {bookmarkError ? <p className="auth-error">{bookmarkError}</p> : null}
        </section>

        <section className="detail-results-vote-section">
          <div className="detail-results-main">
            <div className="detail-results-left">
              <div className="option-list">
                {rankedOptions.map((option, optionIndex) => (
                  <VoteOptionForm
                    key={option.id}
                    pollId={poll.id}
                    optionId={option.id}
                    returnTo={returnTo}
                    label={option.label}
                    rightText={`${Math.round(option.percent)}%`}
                    percent={option.percent}
                    fillColor={getPollOptionFillColor(poll.id, optionIndex)}
                    selected={poll.viewerVoteOptionId === option.id}
                    disabled={status.isClosed}
                  />
                ))}
              </div>
            </div>
            <div className="detail-results-right">
              <PollResultsGraph
                pollSlug={poll.slug}
                commentSort={commentSort}
                activeVariant={graphVariant}
                activeTimeframe={graphTimeframe}
                data={chartData}
                suppressOptionBreakdown
              />
            </div>
          </div>
          {status.isClosed ? <p className="poll-blurb">This poll is closed. Voting is disabled.</p> : null}
        </section>

        <PollComments
          pollId={poll.id}
          pollSlug={poll.slug}
          comments={comments}
          sort={commentSort}
          graph={graphVariant}
          timeframe={graphTimeframe}
          commentStatusType={commentStatusType}
          commentStatusMessage={commentStatusMessage}
          signedIn={Boolean(user)}
          isAdmin={profile?.role === "admin"}
        />

        <section className="meta-grid detail-meta-grid">
          <div>
            <h3>Created</h3>
            <p>{createdLabel}</p>
          </div>
          <div>
            <h3>Ends</h3>
            <p>{endsLabel}</p>
          </div>
          <div>
            <h3>Status</h3>
            <p>{statusLabel}</p>
          </div>
        </section>

        <ReportPollForm
          pollId={poll.id}
          returnTo={returnTo}
          statusType={reportStatusType}
          statusMessage={reportStatusMessage}
        />
      </article>
    </main>
  );
}
