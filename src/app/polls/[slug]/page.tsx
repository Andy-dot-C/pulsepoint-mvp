import Link from "next/link";
import { notFound } from "next/navigation";
import { TrendBars } from "@/components/trend-bars";
import { VoteOptionForm } from "@/components/vote-option-form";
import { ReportPollForm } from "@/components/report-poll-form";
import { fetchPollBySlug } from "@/lib/data/polls";
import { buildFeedHref } from "@/lib/feed-query";
import { totalVotes } from "@/lib/mock-data";

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

export default async function PollPage({ params, searchParams }: PollPageProps) {
  const { slug } = await Promise.resolve(params);
  const poll = await fetchPollBySlug(slug);
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const reportStatusType = readValue(resolvedSearchParams.report);
  const reportStatusMessage = readValue(resolvedSearchParams.message);

  if (!poll) {
    notFound();
  }

  const total = totalVotes(poll);
  const rankedOptions = [...poll.options].sort(
    (left, right) => right.votes - left.votes || left.label.localeCompare(right.label)
  );

  return (
    <main className="page-shell detail-shell">
      <Link href="/" className="back-link">
        Back to feed
      </Link>

      <article className="detail-card">
        <div className="detail-top-row">
          <Link className="poll-category" href={buildFeedHref({ category: poll.category })}>
            {poll.category}
          </Link>
          <p>{total.toLocaleString()} total votes</p>
        </div>

        <h1>{poll.title}</h1>
        <p className="poll-blurb">{poll.blurb}</p>
        <p className="detail-description">{poll.description}</p>

        <section>
          <h2>Vote now</h2>
          <div className="option-list">
            {rankedOptions.map((option) => (
              <VoteOptionForm
                key={option.id}
                pollId={poll.id}
                optionId={option.id}
                returnTo={`/polls/${poll.slug}`}
                label={option.label}
                rightText={`${Math.round((option.votes / Math.max(total, 1)) * 100)}%`}
              />
            ))}
          </div>
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

        <ReportPollForm
          pollId={poll.id}
          returnTo={`/polls/${poll.slug}`}
          statusType={reportStatusType}
          statusMessage={reportStatusMessage}
        />
      </article>
    </main>
  );
}
