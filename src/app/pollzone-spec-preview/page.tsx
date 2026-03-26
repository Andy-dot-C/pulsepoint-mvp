import { notFound } from "next/navigation";

const options = [
  { label: "Yes", percent: 72, votes: 109, color: "#3b82f6" },
  { label: "No", percent: 28, votes: 42, color: "#22c55e" }
];

const gridPolls = [
  { category: "Politics", title: "Should councils publish all spending over £500 in real time?", top: "Yes", pct: 64 },
  { category: "Sport", title: "Should VAR explanations be broadcast live to stadium crowds?", top: "Yes", pct: 72 },
  { category: "Entertainment", title: "Should streamers release episodes weekly instead of all at once?", top: "No", pct: 58 },
  { category: "Culture", title: "Should museums have one free late-night opening every week?", top: "Yes", pct: 67 },
  { category: "Hot Takes", title: "Should phones be banned in all classrooms?", top: "Yes", pct: 61 },
  { category: "Sport", title: "Should referees announce final decisions on pitch microphones?", top: "Yes", pct: 74 }
];

const comments = [
  { user: "Olivia Reed", time: "2 hours ago", body: "Live audio would reduce confusion and stop speculation after big decisions." },
  { user: "Mason Bell", time: "1 hour ago", body: "As long as there is a delay for abusive language, I think this improves trust." }
];

function FeaturedDonut() {
  return (
    <svg viewBox="0 0 240 240" className="pz-spec-donut" aria-hidden="true">
      <circle cx="120" cy="120" r="80" fill="none" stroke="#e5e5e5" strokeWidth="26" />
      <circle
        cx="120"
        cy="120"
        r="80"
        fill="none"
        stroke="#3b82f6"
        strokeWidth="26"
        strokeDasharray="362 503"
        strokeLinecap="round"
        transform="rotate(-90 120 120)"
      />
      <circle
        cx="120"
        cy="120"
        r="80"
        fill="none"
        stroke="#22c55e"
        strokeWidth="26"
        strokeDasharray="141 503"
        strokeLinecap="round"
        transform="rotate(169 120 120)"
      />
      <text x="120" y="122" textAnchor="middle" className="pz-spec-donut-main">
        1.8k
      </text>
      <text x="120" y="144" textAnchor="middle" className="pz-spec-donut-sub">
        VOTES
      </text>
    </svg>
  );
}

function BarChart() {
  return (
    <div className="pz-spec-bars">
      {[
        { label: "Yes", value: 72, color: "#3b82f6" },
        { label: "No", value: 28, color: "#22c55e" },
        { label: "Only in key moments", value: 41, color: "#eab308" }
      ].map((item) => (
        <div key={item.label} className="pz-spec-bar-row">
          <p>{item.label}</p>
          <div className="pz-spec-bar-track">
            <span style={{ width: `${item.value}%`, backgroundColor: item.color }} />
          </div>
          <strong>{item.value}%</strong>
        </div>
      ))}
    </div>
  );
}

export default function PollzoneSpecPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="page-shell pz-spec-shell">
      <section className="pz-spec-page-head">
        <h1>Pollzone Design Spec Preview</h1>
        <p>Prototype implementing your prompt as an isolated local preview.</p>
      </section>

      <section className="pz-spec-home-grid">
        <article className="pz-spec-featured">
          <div className="pz-spec-featured-top">
            <span className="pz-spec-trending-pill">Trending</span>
            <div className="pz-spec-pager">
              <button type="button">‹</button>
              <span>5 of 6</span>
              <button type="button">›</button>
            </div>
          </div>

          <div className="pz-spec-featured-body">
            <div>
              <h2>Should live VAR audio be broadcast during Premier League matches?</h2>
              <div className="pz-spec-options">
                {options.map((option) => (
                  <div key={option.label} className="pz-spec-option-row">
                    <div className="pz-spec-option-head">
                      <p>{option.label}</p>
                      <strong style={{ color: option.color }}>{option.percent}%</strong>
                    </div>
                    <div className="pz-spec-progress">
                      <span style={{ width: `${option.percent}%`, backgroundColor: option.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <FeaturedDonut />
          </div>

          <footer className="pz-spec-featured-footer">
            <div>
              <span>👥 1.8k</span>
              <span>💬 18</span>
            </div>
            <div>
              <button type="button">🔖</button>
              <button type="button">↗</button>
            </div>
          </footer>
        </article>

        <aside className="pz-spec-sidebar">
          <h3>Top Movers</h3>
          <ul>
            <li>
              <p>Should football managers have one VAR challenge per match?</p>
              <span>Yes · 69%</span>
            </li>
            <li>
              <p>Should referees explain decisions post-match?</p>
              <span>Yes · 63%</span>
            </li>
            <li>
              <p>Should offside rules be simplified for broadcasters?</p>
              <span>No · 54%</span>
            </li>
          </ul>
        </aside>
      </section>

      <section className="pz-spec-grid">
        {gridPolls.map((poll) => (
          <article key={poll.title} className="pz-spec-card">
            <span className="pz-spec-card-cat">{poll.category}</span>
            <h4>{poll.title}</h4>
            <div className="pz-spec-card-option">
              <p>{poll.top}</p>
              <strong>{poll.pct}%</strong>
            </div>
            <div className="pz-spec-progress">
              <span style={{ width: `${poll.pct}%`, backgroundColor: "#3b82f6" }} />
            </div>
          </article>
        ))}
      </section>

      <section className="pz-spec-detail">
        <header>
          <span>Back to polls</span>
          <h2>Should live VAR audio be broadcast during Premier League matches?</h2>
          <p>
            Test concept for the poll detail page with chart tabs, voting states and cleaner discussion hierarchy.
          </p>
        </header>

        <article className="pz-spec-detail-card">
          <div className="pz-spec-tabs">
            <button type="button" className="active">Bar Chart</button>
            <button type="button">Pie Chart</button>
          </div>
          <BarChart />
          <div className="pz-spec-divider" />
          <h3>Cast Your Vote</h3>
          <div className="pz-spec-vote-list">
            {["Yes", "No", "Only for major calls"].map((item) => (
              <label key={item}>
                <input type="radio" name="vote-preview" />
                <span>{item}</span>
              </label>
            ))}
          </div>
          <button type="button" className="pz-spec-cta">Submit Vote</button>
        </article>

        <article className="pz-spec-comments">
          <h3>Discussion (24)</h3>
          <textarea placeholder="Share your thoughts..." />
          <button type="button">Post comment</button>
          {comments.map((comment) => (
            <div key={comment.user} className="pz-spec-comment">
              <p className="pz-spec-comment-meta">{comment.user} · {comment.time}</p>
              <p>{comment.body}</p>
            </div>
          ))}
        </article>
      </section>
    </main>
  );
}
