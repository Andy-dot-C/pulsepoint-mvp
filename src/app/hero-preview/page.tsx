import { HeroPreviewWorkbench } from "@/components/hero-preview-workbench";
import { fetchFeed } from "@/lib/data/polls";

export default async function HeroPreviewPage() {
  const feed = await fetchFeed({
    tab: "trending",
    category: "all",
    q: ""
  });

  const poll = feed[0] ?? null;

  return (
    <main className="page-shell">
      <section className="feed-grid feed-grid-cards-3" style={{ marginTop: 22 }}>
        <div className="feed-column">
          <p style={{ marginBottom: 10, fontSize: 13, color: "#64748b", fontWeight: 700 }}>FIGMA HERO PREVIEW</p>
          {poll ? (
            <HeroPreviewWorkbench poll={poll} returnTo="/hero-preview" />
          ) : (
            <article className="side-card">
              <p>No poll available for preview.</p>
            </article>
          )}
        </div>
        <aside className="side-column hero-preview-rail-spacer" aria-hidden="true" />
      </section>
    </main>
  );
}
