import { PollCard } from "@/components/poll-card";
import { FlashBanner } from "@/components/flash-banner";
import { FeedRail } from "@/components/feed-rail";
import { FeedFeaturedPollCard } from "@/components/feed-featured-poll-card";
import { FigmaHeroPreviewCard } from "@/components/figma-hero-preview-card";
import { FeaturedPollCarousel } from "@/components/featured-poll-carousel";
import { buildFeedHref } from "@/lib/feed-query";
import { fetchFeed } from "@/lib/data/polls";
import { CategoryKey, FeedFilterKey, FeedTabKey } from "@/lib/types";
import type { CSSProperties } from "react";

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
  const featuredChartVariants: Array<"donut" | "dot-grid" | "bars" | "line"> = ["line", "donut", "dot-grid", "bars"];
  const figmaHeroPresetStyle = {
    "--dev-topbar-x": "0px",
    "--dev-topbar-y": "0px",
    "--dev-topbar-scale": "1",
    "--dev-badge-x": "0px",
    "--dev-badge-y": "0px",
    "--dev-badge-scale": "1",
    "--dev-arrows-x": "0px",
    "--dev-arrows-y": "0px",
    "--dev-arrows-scale": "1",
    "--dev-title-x": "0px",
    "--dev-title-y": "0px",
    "--dev-title-scale": "1",
    "--dev-left-x": "0px",
    "--dev-left-y": "0px",
    "--dev-left-scale": "1",
    "--dev-option1-x": "0px",
    "--dev-option1-y": "32px",
    "--dev-option1-scale": "0.95",
    "--dev-option2-x": "0px",
    "--dev-option2-y": "29px",
    "--dev-option2-scale": "0.95",
    "--dev-chartWrap-x": "0px",
    "--dev-chartWrap-y": "0px",
    "--dev-chartWrap-scale": "0.96",
    "--dev-logo-x": "0px",
    "--dev-logo-y": "-19px",
    "--dev-logo-scale": "0.86",
    "--dev-graph-x": "0px",
    "--dev-graph-y": "12px",
    "--dev-graph-scale": "1",
    "--dev-footer-x": "0px",
    "--dev-footer-y": "0px",
    "--dev-footer-scale": "1"
  } as CSSProperties;

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
              {featuredPolls.map((poll, index) =>
                index === 0 ? (
                  <div key={poll.id} className="hero-figma-live" style={figmaHeroPresetStyle}>
                    <FigmaHeroPreviewCard poll={poll} returnTo={returnTo} showStaticCarouselControls={false} />
                  </div>
                ) : (
                  <FeedFeaturedPollCard
                    key={poll.id}
                    poll={poll}
                    returnTo={returnTo}
                    chartVariant={featuredChartVariants[index % featuredChartVariants.length]}
                  />
                )
              )}
            </FeaturedPollCarousel>
          ) : null}
          <div className="feed-cards-grid feed-cards-grid-3">
            {gridPolls.map((poll) => (
              <PollCard key={poll.id} poll={poll} returnTo={returnTo} />
            ))}
          </div>
        </div>
        <FeedRail polls={feed} />
      </section>
    </main>
  );
}
