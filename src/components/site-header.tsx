"use client";

import { useEffect, useRef, useState } from "react";
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
  role: "user" | "admin" | null;
};

type SuggestionPoll = {
  id: string;
  slug: string;
  title: string;
  category: string;
  votes30d: number;
  optionsPreview: string[];
  exactMatch: boolean;
};

const MIN_SUGGESTIONS = 5;

function scoreCategoryMatch(query: string, label: string): number {
  const q = query.trim().toLowerCase();
  const value = label.toLowerCase();
  if (!q) return 0;
  if (value === q) return 100;
  if (value.startsWith(q)) return 80;
  if (value.includes(q)) return 50;
  return 0;
}

export function SiteHeader({
  activeTab,
  activeCategory,
  searchQuery,
  signedIn,
  username,
  role
}: SiteHeaderProps) {
  const avatarText = (username ?? "U").slice(0, 2).toUpperCase();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const [searchValue, setSearchValue] = useState(searchQuery);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pollSuggestions, setPollSuggestions] = useState<SuggestionPoll[]>([]);
  const [categoriesOpen, setCategoriesOpen] = useState(categories);

  useEffect(() => {
    setSearchValue(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(target)) {
        setSearchOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    const normalized = searchValue.trim().toLowerCase();
    const rankedCategories = categories
      .map((item) => ({ ...item, score: scoreCategoryMatch(normalized, item.label) }))
      .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label));
    const matched = rankedCategories.filter((item) => item.score > 0);
    const fallback = rankedCategories.filter((item) => item.score === 0);
    setCategoriesOpen([...matched, ...fallback].slice(0, MIN_SUGGESTIONS).map(({ score, ...rest }) => rest));
  }, [searchValue]);

  useEffect(() => {
    const query = searchValue.trim();
    if (!query) {
      setPollSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/search/suggestions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ q: query }),
          signal: controller.signal
        });
        const payload = (await response.json()) as { polls?: SuggestionPoll[] };
        if (!response.ok || !Array.isArray(payload.polls)) {
          setPollSuggestions([]);
          return;
        }
        setPollSuggestions(payload.polls.slice(0, Math.max(6, MIN_SUGGESTIONS)));
      } catch {
        setPollSuggestions([]);
      }
    }, 200);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [searchValue]);

  const showSearchDropdown = searchOpen && searchValue.trim().length > 0;
  const hasExactPollMatch = pollSuggestions.some((item) => item.exactMatch);

  return (
    <header className="site-header">
      <div className="brand-row">
        <div>
          <p className="eyebrow">MVP</p>
          <h1>PulsePoint</h1>
        </div>
        <div className="header-actions">
          {signedIn ? (
            <div className="user-menu" ref={menuRef}>
              <button
                className="avatar-btn"
                type="button"
                title="Account menu"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((current) => !current)}
              >
                {avatarText}
              </button>
              {menuOpen ? (
                <div className="user-menu-pop" role="menu">
                  <p className="eyebrow">Signed in as</p>
                  <p className="user-menu-name">{username ?? "User"}</p>
                  <a className="user-menu-link" href="/saved" onClick={() => setMenuOpen(false)}>
                    Saved polls
                  </a>
                  <a className="user-menu-link" href="/my-polls" onClick={() => setMenuOpen(false)}>
                    My polls
                  </a>
                  {role === "admin" ? (
                    <>
                      <a className="user-menu-link" href="/admin/analytics" onClick={() => setMenuOpen(false)}>
                        Admin analytics
                      </a>
                      <a className="user-menu-link" href="/admin/submissions" onClick={() => setMenuOpen(false)}>
                        Admin submissions
                      </a>
                      <a className="user-menu-link" href="/admin/reports" onClick={() => setMenuOpen(false)}>
                        Admin reports
                      </a>
                    </>
                  ) : null}
                  <form action={signOutAction}>
                    <button className="ghost-btn user-menu-signout" type="submit">
                      Sign out
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
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
        <div className="search-shell" ref={searchRef}>
          <form className="search-form" action="/" method="get" onSubmit={() => setSearchOpen(false)}>
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
              value={searchValue}
              onChange={(event) => {
                setSearchValue(event.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
            />
            <button className="search-submit" type="submit">
              Search
            </button>
          </form>

          {showSearchDropdown ? (
            <section className="search-suggest-panel">
              {!hasExactPollMatch ? (
                <p className="poll-blurb">No exact poll match. Showing related/trending polls.</p>
              ) : null}
              <div className="search-suggest-list">
                {pollSuggestions.map((item) => (
                  <a
                    key={item.id}
                    className="search-suggest-item"
                    href={`/polls/${item.slug}`}
                    onClick={() => setSearchOpen(false)}
                  >
                    <span>{item.title}</span>
                    <small>
                      {item.category} • {item.votes30d.toLocaleString()} votes
                    </small>
                    {item.optionsPreview.length > 0 ? (
                      <small>Options: {item.optionsPreview.join(", ")}</small>
                    ) : null}
                  </a>
                ))}
              </div>

              <div className="search-suggest-categories">
                <p className="eyebrow">Categories</p>
                <div className="category-row">
                  {categoriesOpen.map((item) => (
                    <a
                      key={item.key}
                      className={`category ${activeCategory === item.key ? "category-active" : ""}`}
                      href={buildFeedHref({ tab: activeTab, category: item.key })}
                      onClick={() => setSearchOpen(false)}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            </section>
          ) : null}
        </div>
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
