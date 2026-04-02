import { PollCard } from "@/components/poll-card";
import { FlashBanner } from "@/components/flash-banner";
import { FeedRail } from "@/components/feed-rail";
import { FigmaHeroPreviewCard } from "@/components/figma-hero-preview-card";
import { FeaturedPollCarousel } from "@/components/featured-poll-carousel";
import { buildFeedHref } from "@/lib/feed-query";
import { fetchFeed } from "@/lib/data/polls";
import { CategoryKey, FeedFilterKey, FeedTabKey, Poll } from "@/lib/types";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
};

function asSingleValue(input: string | string[] | undefined): string | undefined {
  if (!input) return undefined;
  return Array.isArray(input) ? input[0] : input;
}

function resolveTab(value?: string): FeedTabKey {
  if (value === "most-voted") {
    return "breaking";
  }
  if (value === "breaking" || value === "new" || value === "trending") {
    return value;
  }
  return "trending";
}

function resolveCategory(value?: string): CategoryKey | "all" {
  if (
    value === "politics" ||
    value === "sport" ||
    value === "entertainment" ||
    value === "business" ||
    value === "technology"
  ) {
    return value;
  }
  return "all";
}

function resolveFilter(value?: string): FeedFilterKey {
  if (value === "most-voted") {
    return "breaking";
  }
  if (
    value === "trending" ||
    value === "breaking" ||
    value === "new" ||
    value === "politics" ||
    value === "sport" ||
    value === "entertainment" ||
    value === "business" ||
    value === "technology"
  ) {
    return value;
  }
  return "trending";
}

function mapFilterToFeedInput(filter: FeedFilterKey): { tab: FeedTabKey; category: CategoryKey | "all" } {
  if (filter === "breaking" || filter === "new" || filter === "trending") {
    return { tab: filter, category: "all" };
  }
  if (
    filter === "politics" ||
    filter === "sport" ||
    filter === "entertainment" ||
    filter === "business" ||
    filter === "technology"
  ) {
    return { tab: "trending", category: filter };
  }
  return { tab: "trending", category: "all" };
}

function resolveSubmissionMessage(value?: string): string | null {
  if (value === "under-review") {
    return "Possible duplicate flagged. Your poll was submitted for moderation review.";
  }
  return null;
}

const INVESTOR_HOME_LAYOUT = {
  heroOrder: [
    "has-us-immigration-enforcement-gone-too-far-in-major-cities",
    "should-the-uk-restrict-social-media-access-for-under-16s",
    "are-us-tariffs-worth-it-if-they-raise-consumer-prices",
    "if-a-uk-general-election-were-held-tomorrow-which-party-would-get-your-vote",
    "should-uk-commuter-rail-be-fully-renationalised",
    "should-live-var-audio-be-broadcast-during-premier-league-matches"
  ],
  gridOrder: [
    "which-public-service-needs-the-biggest-overhaul-first-nhs-rail-local-councils-schools",
    "should-live-var-audio-be-broadcast-during-premier-league-matches",
    "what-should-happen-next-on-assisted-dying-in-the-uk-legalise-now-trial-it-delay-it-or-reject-it",
    "should-the-uk-rejoin-the-eu-single-market",
    "should-trent-alexander-arnold-be-in-the-england-world-cup-squad",
    "what-should-happen-to-congressional-stock-trading-full-ban-blind-trusts-only-tighter-disclosure-or-no-change",
    "should-the-fia-revise-batteryharvesting-rules-following-the-bearman-incident",
    "should-remote-work-remain-the-default-for-office-based-jobs",
    "would-you-vote-for-a-party-that-promised-rail-renationalisation",
    "who-will-win-the-next-champions-league-real-madrid-manchester-city-bayern-munich-arsenal-or-another-side",
    "are-you-in-favour-of-replacing-council-tax-with-a-land-value-tax",
    "are-you-happy-with-formula-1-sprint-weekends-being-part-of-the-calendar",
    "which-voting-age-option-feels-most-reasonable-for-the-uk-16-17-18-or-21",
    "what-is-the-bigger-ai-risk-right-now-misinformation-job-losses-bias-cyber-misuse-or-concentration-of-power",
    "would-you-back-a-uk-sovereign-ai-investment-fund",
    "which-economic-issue-worries-you-most-right-now-inflation-housing-costs-jobs-taxes-or-public-debt",
    "which-issue-matters-most-to-your-vote-right-now-immigration-cost-of-living-nhs-housing-or-crime",
    "which-sport-is-doing-the-best-job-using-technology-in-officiating-right-now-football-tennis-cricket-rugby-or-formula-1",
    "are-you-happy-with-the-current-level-of-immigration-in-your-country",
    "do-you-think-ai-generated-content-should-be-clearly-watermarked"
  ]
} as const;

function uniquePolls(polls: Poll[]): Poll[] {
  const seen = new Set<string>();
  const result: Poll[] = [];
  for (const poll of polls) {
    if (seen.has(poll.id)) continue;
    seen.add(poll.id);
    result.push(poll);
  }
  return result;
}

function orderPollsBySlugs(polls: Poll[], orderedSlugs: readonly string[]): Poll[] {
  const unique = uniquePolls(polls);
  const ordered: Poll[] = [];
  const usedIds = new Set<string>();

  for (const slug of orderedSlugs) {
    const found = unique.find((poll) => !usedIds.has(poll.id) && poll.slug === slug);
    if (!found) continue;
    ordered.push(found);
    usedIds.add(found.id);
  }

  const fallback = unique
    .filter((poll) => !usedIds.has(poll.id))
    .sort((left, right) => left.title.localeCompare(right.title, undefined, { sensitivity: "base" }));

  return [...ordered, ...fallback];
}

export default async function Home({ searchParams }: HomePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const activeFilter = resolveFilter(asSingleValue(resolvedSearchParams.filter));
  const legacyTab = resolveTab(asSingleValue(resolvedSearchParams.tab));
  const legacyCategory = resolveCategory(asSingleValue(resolvedSearchParams.category));
  const feedInput =
    activeFilter === "trending" && (asSingleValue(resolvedSearchParams.tab) || asSingleValue(resolvedSearchParams.category))
      ? { tab: legacyTab, category: legacyCategory }
      : mapFilterToFeedInput(activeFilter);
  const normalizedFilter = activeFilter === "all" ? "trending" : activeFilter;
  const searchQuery = asSingleValue(resolvedSearchParams.q)?.trim() ?? "";
  const isTrendingHome =
    feedInput.tab === "trending" && feedInput.category === "all" && normalizedFilter === "trending" && searchQuery.length === 0;
  const bookmarkError = asSingleValue(resolvedSearchParams.bookmarkError);
  const submissionMessage = resolveSubmissionMessage(asSingleValue(resolvedSearchParams.submission));
  const returnTo = buildFeedHref({
    filter: normalizedFilter,
    q: searchQuery
  });
  const feed = await fetchFeed({
    tab: feedInput.tab,
    category: feedInput.category,
    q: searchQuery
  });
  const politicsFeaturedFeed = await fetchFeed({
    tab: "trending",
    category: "politics",
    q: ""
  });
  const investorFeed = await fetchFeed({
    tab: "trending",
    category: "all",
    q: ""
  });
  const featuredSource = politicsFeaturedFeed.length > 0 ? politicsFeaturedFeed : feed;
  const combinedHomePool = uniquePolls([...feed, ...featuredSource, ...investorFeed]);
  const featuredPolls = isTrendingHome
    ? orderPollsBySlugs(combinedHomePool, INVESTOR_HOME_LAYOUT.heroOrder).slice(0, 6)
    : [];
  const featuredIds = new Set(featuredPolls.map((poll) => poll.id));
  const displayGridPolls = isTrendingHome
    ? orderPollsBySlugs(combinedHomePool, INVESTOR_HOME_LAYOUT.gridOrder)
    : uniquePolls(feed);
  const sectionTitles = ["Trending Now", "Top Movers", "New"] as const;
  const cardsPerSection = 6; // 3 across x 2 down
  const maxSections = 3;
  const sectionData = Array.from({ length: Math.min(maxSections, Math.ceil(displayGridPolls.length / cardsPerSection)) }, (_, index) => ({
    title: sectionTitles[index % sectionTitles.length],
    polls: displayGridPolls.slice(index * cardsPerSection, index * cardsPerSection + cardsPerSection)
  })).filter((section) => section.polls.length > 0);

  return (
    <main className="page-shell">
      {bookmarkError ? (
        <article className="side-card" style={{ marginTop: 12 }}>
          <p className="auth-error">{bookmarkError}</p>
        </article>
      ) : null}
      {submissionMessage ? <FlashBanner message={submissionMessage} /> : null}

      <section className="feed-grid feed-grid-cards-3">
        <div className="feed-column">
          {isTrendingHome && featuredPolls.length > 0 ? (
            <FeaturedPollCarousel>
              {featuredPolls.map((poll, index) => {
                return index === 0 ? (
                  <FigmaHeroPreviewCard
                    key={poll.id}
                    poll={poll}
                    returnTo={returnTo}
                    showStaticCarouselControls={false}
                    maxOptions={3}
                    className="figma-hero-native-card figma-hero-live-fixed"
                    chartOffsetX={-34}
                    chartOffsetY={-50}
                  />
                ) : index === 1 ? (
                  <FigmaHeroPreviewCard
                    key={`${poll.id}-donut-preview`}
                    poll={poll}
                    returnTo={returnTo}
                    showStaticCarouselControls={false}
                    maxOptions={3}
                    chartVariant="donut"
                    className="figma-hero-native-card figma-hero-live-fixed"
                    chartOffsetX={-34}
                    chartOffsetY={-50}
                  />
                ) : index === 2 ? (
                  <FigmaHeroPreviewCard
                    key={`${poll.id}-dot-grid-preview`}
                    poll={poll}
                    returnTo={returnTo}
                    showStaticCarouselControls={false}
                    maxOptions={3}
                    chartVariant="dot-grid"
                    className="figma-hero-native-card figma-hero-live-fixed"
                    chartOffsetX={-34}
                    chartOffsetY={-50}
                  />
                ) : index === 3 ? (
                  <FigmaHeroPreviewCard
                    key={`${poll.id}-three-option-preview`}
                    poll={poll}
                    returnTo={returnTo}
                    showStaticCarouselControls={false}
                    maxOptions={3}
                    className="figma-hero-native-card figma-hero-live-fixed figma-hero-tight-title"
                    chartOffsetX={-34}
                    chartOffsetY={-50}
                  />
                ) : index === 4 ? (
                  <FigmaHeroPreviewCard
                    key={`${poll.id}-donut-three-option-preview`}
                    poll={poll}
                    returnTo={returnTo}
                    showStaticCarouselControls={false}
                    maxOptions={3}
                    chartVariant="donut"
                    className="figma-hero-native-card figma-hero-live-fixed"
                    chartOffsetX={-34}
                    chartOffsetY={-50}
                  />
                ) : index === 5 ? (
                  <FigmaHeroPreviewCard
                    key={`${poll.id}-dot-grid-three-option-preview`}
                    poll={poll}
                    returnTo={returnTo}
                    showStaticCarouselControls={false}
                    maxOptions={3}
                    chartVariant="dot-grid"
                    className="figma-hero-native-card figma-hero-live-fixed"
                    chartOffsetX={-34}
                    chartOffsetY={-50}
                  />
                ) : (
                  <FigmaHeroPreviewCard
                    key={poll.id}
                    poll={poll}
                    returnTo={returnTo}
                    showStaticCarouselControls={false}
                    maxOptions={3}
                    className="figma-hero-native-card figma-hero-live-fixed"
                    chartOffsetX={-34}
                    chartOffsetY={-50}
                  />
                );
              })}
            </FeaturedPollCarousel>
          ) : null}

          {isTrendingHome ? (
            <div className="home-sections-preview">
              <div className="feed-cards-grid feed-cards-grid-3">
                {displayGridPolls.map((poll, index) => (
                  <PollCard key={`${poll.id}-home-${index}`} poll={poll} returnTo={returnTo} />
                ))}
              </div>
            </div>
          ) : (
            <div className="home-sections-preview">
              {sectionData.map((section, index) => (
                <section key={`${section.title}-${index}`} className="home-sections-preview-block">
                  <h2 className="home-sections-preview-title">{section.title}</h2>
                  <div className="feed-cards-grid feed-cards-grid-3">
                    {section.polls.map((poll, pollIndex) => (
                      <PollCard key={`${poll.id}-section-${index}-${pollIndex}`} poll={poll} returnTo={returnTo} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
        <FeedRail polls={feed} />
      </section>
    </main>
  );
}
