import { categories, feedTabs } from "@/lib/mock-data";
import { buildFeedHref } from "@/lib/feed-query";
import { CategoryKey, FeedTabKey } from "@/lib/types";
import { signOutAction } from "@/app/actions/auth";

type SiteHeaderProps = {
  activeTab: FeedTabKey;
  activeCategory: CategoryKey | "all";
  searchQuery: string;
  signedIn: boolean;
  username: string | null;
};

export function SiteHeader({
  activeTab,
  activeCategory,
  searchQuery,
  signedIn,
  username
}: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="brand-row">
        <div>
          <p className="eyebrow">MVP</p>
          <h1>PulsePoint</h1>
        </div>
        <div className="header-actions">
          {signedIn ? (
            <>
              <span className="signed-in-pill">{username ?? "Signed in"}</span>
              <form action={signOutAction}>
                <button className="ghost-btn" type="submit">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <a className="ghost-btn" href="/auth">
              Sign in
            </a>
          )}
          <a className="create-btn" href="/submit">
            Submit Poll
          </a>
        </div>
      </div>

      <div className="search-row">
        <form className="search-form" action="/" method="get">
          {activeTab !== "trending" ? (
            <input type="hidden" name="tab" value={activeTab} />
          ) : null}
          {activeCategory !== "all" ? (
            <input type="hidden" name="category" value={activeCategory} />
          ) : null}
          <input
            aria-label="Search polls"
            className="search-input"
            placeholder="Search polls..."
            type="search"
            name="q"
            defaultValue={searchQuery}
          />
          <button className="search-submit" type="submit">
            Search
          </button>
        </form>
      </div>

      <nav className="tab-row" aria-label="Feed tabs">
        {feedTabs.map((tab) => (
          <a
            key={tab.key}
            className={`pill ${tab.key === activeTab ? "pill-active" : ""}`}
            href={buildFeedHref({
              tab: tab.key,
              category: activeCategory,
              q: searchQuery
            })}
          >
            {tab.label}
          </a>
        ))}
      </nav>

      <nav className="category-row" aria-label="Categories">
        <a
          className={`category ${activeCategory === "all" ? "category-active" : ""}`}
          href={buildFeedHref({ tab: activeTab, category: "all", q: searchQuery })}
        >
          All
        </a>
        {categories.map((category) => (
          <a
            key={category.key}
            className={`category ${category.key === activeCategory ? "category-active" : ""}`}
            href={buildFeedHref({
              tab: activeTab,
              category: category.key,
              q: searchQuery
            })}
          >
            {category.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
