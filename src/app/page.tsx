import { PollCard } from "@/components/poll-card";
import { SiteHeader } from "@/components/site-header";
import { buildFeedHref } from "@/lib/feed-query";
import { fetchFeed } from "@/lib/data/polls";
import { getAuthView } from "@/lib/auth";
import { CategoryKey, FeedTabKey } from "@/lib/types";

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

export default async function Home({ searchParams }: HomePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const activeTab = resolveTab(asSingleValue(resolvedSearchParams.tab));
  const activeCategory = resolveCategory(asSingleValue(resolvedSearchParams.category));
  const searchQuery = asSingleValue(resolvedSearchParams.q)?.trim() ?? "";
  const bookmarkError = asSingleValue(resolvedSearchParams.bookmarkError);
  const returnTo = buildFeedHref({
    tab: activeTab,
    category: activeCategory,
    q: searchQuery
  });
  const feed = await fetchFeed({
    tab: activeTab,
    category: activeCategory,
    q: searchQuery
  });
  const authView = await getAuthView();

  return (
    <main className="page-shell">
      <SiteHeader
        activeTab={activeTab}
        activeCategory={activeCategory}
        searchQuery={searchQuery}
        signedIn={authView.signedIn}
        username={authView.username}
        role={authView.role}
      />
      {bookmarkError ? (
        <article className="side-card" style={{ marginTop: 12 }}>
          <p className="auth-error">{bookmarkError}</p>
        </article>
      ) : null}

      <section className="feed-grid">
        <div className="feed-column">
          {feed.map((poll) => (
            <PollCard key={poll.id} poll={poll} returnTo={returnTo} />
          ))}
        </div>

        <aside className="side-column">
          <article className="side-card">
            <h3>Launch focus</h3>
            <p>UK politics + broad-interest polls for fast traction and repeat visits.</p>
          </article>
          <article className="side-card">
            <h3>MVP principle</h3>
            <p>Fast voting on card, deeper context on detail page, moderation before publish.</p>
          </article>
        </aside>
      </section>
    </main>
  );
}
