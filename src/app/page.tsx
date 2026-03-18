import { PollCard } from "@/components/poll-card";
import { FlashBanner } from "@/components/flash-banner";
import { FeedRail } from "@/components/feed-rail";
import { FigmaHeroPreviewCard } from "@/components/figma-hero-preview-card";
import { FeaturedPollCarousel } from "@/components/featured-poll-carousel";
import { buildFeedHref } from "@/lib/feed-query";
import { fetchFeed } from "@/lib/data/polls";
import { CategoryKey, FeedFilterKey, FeedTabKey } from "@/lib/types";

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
  if (value === "new" || value === "most-voted" || value === "trending") {
    return value;
  }
  return "trending";
}

function resolveCategory(value?: string): CategoryKey | "all" {
  if (
    value === "politics" ||
    value === "sport" ||
    value === "entertainment" ||
    value === "culture" ||
    value === "hot-takes"
  ) {
    return value;
  }
  return "all";
}

function resolveFilter(value?: string): FeedFilterKey {
  if (
    value === "trending" ||
    value === "new" ||
    value === "most-voted" ||
    value === "politics" ||
    value === "sport" ||
    value === "entertainment" ||
    value === "culture" ||
    value === "hot-takes"
  ) {
    return value;
  }
  return "trending";
}

function mapFilterToFeedInput(filter: FeedFilterKey): { tab: FeedTabKey; category: CategoryKey | "all" } {
  if (filter === "new" || filter === "most-voted" || filter === "trending") {
    return { tab: filter, category: "all" };
  }
  if (
    filter === "politics" ||
    filter === "sport" ||
    filter === "entertainment" ||
    filter === "culture" ||
    filter === "hot-takes"
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
  const featuredPolls = feed.slice(0, 6);
  const gridPolls = feed.slice(featuredPolls.length);
  const sectionTitles = ["Trending Now", "Top Movers", "New"] as const;
  const cardsPerSection = 6; // 3 across x 2 down
  const maxSections = 3;
  const sectionData = Array.from({ length: Math.min(maxSections, Math.ceil(gridPolls.length / cardsPerSection)) }, (_, index) => ({
    title: sectionTitles[index % sectionTitles.length],
    polls: gridPolls.slice(index * cardsPerSection, index * cardsPerSection + cardsPerSection)
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
          {featuredPolls.length > 0 ? (
            <FeaturedPollCarousel>
              {featuredPolls.map((poll, index) => {
                return index === 0 ? (
                  <FigmaHeroPreviewCard
                    key={poll.id}
                    poll={poll}
                    returnTo={returnTo}
                    showStaticCarouselControls={false}
                    maxOptions={2}
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
                    maxOptions={2}
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
                    maxOptions={2}
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
                    className="figma-hero-native-card figma-hero-live-fixed"
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
                    maxOptions={2}
                    className="figma-hero-native-card figma-hero-live-fixed"
                    chartOffsetX={-34}
                    chartOffsetY={-50}
                  />
                );
              })}
            </FeaturedPollCarousel>
          ) : null}

          <div className="home-sections-preview">
            {sectionData.map((section, index) => (
              <section key={`${section.title}-${index}`} className="home-sections-preview-block">
                <h2 className="home-sections-preview-title">{section.title}</h2>
                <div className="feed-cards-grid feed-cards-grid-3">
                  {section.polls.map((poll) => (
                    <PollCard key={poll.id} poll={poll} returnTo={returnTo} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
        <FeedRail polls={feed} />
      </section>
    </main>
  );
}
