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

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current) return;
      const target = event.target as Node | null;
      if (!target || menuRef.current.contains(target)) return;
      setMenuOpen(false);
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
