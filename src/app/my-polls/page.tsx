import Link from "next/link";
import { PollCard } from "@/components/poll-card";
import { SiteHeader } from "@/components/site-header";
import { getAuthView } from "@/lib/auth";
import { fetchMyPolls } from "@/lib/data/polls";
import { createClient } from "@/lib/supabase/server";

export default async function MyPollsPage() {
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
          <h1>My polls</h1>
          <p className="poll-blurb">Sign in to view polls you have created.</p>
          <p style={{ marginTop: 12 }}>
            <Link className="ghost-btn" href="/auth?next=/my-polls">
              Sign in
            </Link>
          </p>
        </article>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const feed = user ? await fetchMyPolls(user.id) : [];

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
        <h1>My polls</h1>
        <p className="poll-blurb">{feed.length} poll(s) created by you</p>
      </article>

      <section className="feed-grid">
        <div className="feed-column">
          {feed.length === 0 ? (
            <article className="side-card">
              <h3>No polls created yet</h3>
              <p>Create your first poll from the Create poll button in the header.</p>
            </article>
          ) : (
            feed.map((poll) => <PollCard key={poll.id} poll={poll} returnTo="/my-polls" />)
          )}
        </div>
        <aside className="side-column">
          <article className="side-card">
            <h3>Tip</h3>
            <p>Use this page to track engagement on polls you started.</p>
          </article>
        </aside>
      </section>
    </main>
  );
}
