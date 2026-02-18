import Link from "next/link";
import { PollCard } from "@/components/poll-card";
import { SiteHeader } from "@/components/site-header";
import { getAuthView } from "@/lib/auth";
import { fetchFeed } from "@/lib/data/polls";

export default async function SavedPollsPage() {
  const authView = await getAuthView();

  if (!authView.signedIn) {
    return (
      <main className="page-shell">
        <SiteHeader
          activeTab="trending"
          activeCategory="all"
          searchQuery=""
          signedIn={authView.signedIn}
          username={authView.username}
          role={authView.role}
        />
        <article className="detail-card" style={{ marginTop: 16 }}>
          <h1>Saved polls</h1>
          <p className="poll-blurb">Sign in to save polls and revisit them later.</p>
          <p style={{ marginTop: 12 }}>
            <Link className="ghost-btn" href="/auth?next=/saved">
              Sign in
            </Link>
          </p>
        </article>
      </main>
    );
  }

  const feed = await fetchFeed({ tab: "saved", category: "all", q: "" });

  return (
    <main className="page-shell">
      <SiteHeader
        activeTab="trending"
        activeCategory="all"
        searchQuery=""
        signedIn={authView.signedIn}
        username={authView.username}
        role={authView.role}
      />

      <article className="detail-card" style={{ marginTop: 16 }}>
        <h1>Saved polls</h1>
        <p className="poll-blurb">{feed.length} saved poll(s)</p>
      </article>

      <section className="feed-grid">
        <div className="feed-column">
          {feed.length === 0 ? (
            <article className="side-card">
              <h3>No saved polls yet</h3>
              <p>Use the bookmark icon on any poll to save it here.</p>
            </article>
          ) : (
            feed.map((poll) => <PollCard key={poll.id} poll={poll} returnTo="/saved" />)
          )}
        </div>
        <aside className="side-column">
          <article className="side-card">
            <h3>Tip</h3>
            <p>Save high-signal polls so you can revisit their vote trends over time.</p>
          </article>
        </aside>
      </section>
    </main>
  );
}
