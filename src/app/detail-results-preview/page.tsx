import { DetailResultsFixedLayoutPreview } from "@/components/detail-results-fixed-layout-preview";

const sampleOptions = [
  { label: "Yes", votes: 109, percent: 72, color: "#2f6fe4" },
  { label: "No", votes: 42, percent: 28, color: "#18a957" },
  { label: "Unsure", votes: 9, percent: 6, color: "#f59e0b" }
];

function DonutSwatch() {
  return (
    <svg viewBox="0 0 120 120" className="results-lab-donut" aria-hidden="true">
      <circle cx="60" cy="60" r="41" fill="none" stroke="#e5e7eb" strokeWidth="14" />
      <circle
        cx="60"
        cy="60"
        r="41"
        fill="none"
        stroke="#2f6fe4"
        strokeWidth="14"
        strokeDasharray="185 257"
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
      />
      <circle
        cx="60"
        cy="60"
        r="41"
        fill="none"
        stroke="#18a957"
        strokeWidth="14"
        strokeDasharray="72 257"
        strokeLinecap="round"
        transform="rotate(169 60 60)"
      />
      <text x="60" y="57" textAnchor="middle" className="results-lab-donut-main">
        151
      </text>
      <text x="60" y="72" textAnchor="middle" className="results-lab-donut-sub">
        votes
      </text>
    </svg>
  );
}

function LineSwatch() {
  return (
    <svg viewBox="0 0 380 190" className="results-lab-line" aria-hidden="true">
      <path d="M25 22h330M25 62h330M25 102h330M25 142h330" className="results-lab-line-grid" />
      <path d="M30 122C72 80 122 94 160 74s64 12 102-7 62 4 90-16" className="results-lab-line-yes" />
      <path d="M30 140C74 130 114 148 156 135s61 18 103 29 66 3 90 9" className="results-lab-line-no" />
    </svg>
  );
}

function BarsSwatch() {
  return (
    <div className="results-lab-bars">
      {sampleOptions.map((option) => (
        <div key={option.label} className="results-lab-bar-row">
          <p>{option.label}</p>
          <p>{option.percent}%</p>
          <div className="results-lab-bar-track">
            <span style={{ width: `${option.percent}%`, backgroundColor: option.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DotSwatch() {
  return (
    <div className="results-lab-dot-wrap" aria-hidden="true">
      {Array.from({ length: 100 }).map((_, index) => {
        let color = "#e5e7eb";
        if (index < 72) color = "#2f6fe4";
        else if (index < 100) color = "#18a957";
        return <span key={index} style={{ backgroundColor: color }} />;
      })}
    </div>
  );
}

function OptionRows() {
  return (
    <div className="results-lab-options">
      {sampleOptions.map((option) => (
        <button key={option.label} type="button" className="results-lab-option">
          <div>
            <p>{option.label}</p>
            <small>{option.votes} votes</small>
          </div>
          <strong style={{ color: option.color }}>{option.percent}%</strong>
          <span className="results-lab-option-line">
            <span style={{ width: `${option.percent}%`, backgroundColor: option.color }} />
          </span>
        </button>
      ))}
    </div>
  );
}

function VoteListSwatch() {
  return (
    <div className="results-lab-vote-list">
      {sampleOptions.map((option, index) => (
        <label key={option.label} className={`results-lab-vote-item ${index === 0 ? "results-lab-vote-item-active" : ""}`}>
          <input type="radio" name="vote-swatch" defaultChecked={index === 0} />
          <span className="results-lab-vote-dot" style={{ backgroundColor: option.color }} />
          <span>{option.label}</span>
          <strong>{option.percent}%</strong>
        </label>
      ))}
      <button type="button" className="results-lab-submit-btn">Submit vote</button>
    </div>
  );
}

export default function DetailResultsPreviewPage() {
  return (
    <main className="page-shell results-lab-shell">
      <article className="detail-card">
        <h1>Detail Results Section Concepts</h1>
        <p className="poll-blurb">
          Six different directions for the main vote/results area only. Same poll data, different visual treatment.
        </p>
      </article>

      <DetailResultsFixedLayoutPreview />

      <section className="results-lab-grid">
        <article className="detail-card results-lab-card">
          <p className="eyebrow">Option 1 · Split Classic</p>
          <div className="results-lab-layout results-lab-layout-split">
            <OptionRows />
            <BarsSwatch />
          </div>
        </article>

        <article className="detail-card results-lab-card">
          <p className="eyebrow">Option 2 · Donut + Leaderboard</p>
          <div className="results-lab-layout results-lab-layout-donut">
            <DonutSwatch />
            <OptionRows />
          </div>
        </article>

        <article className="detail-card results-lab-card">
          <p className="eyebrow">Option 3 · Dense Analytics</p>
          <div className="results-lab-layout results-lab-layout-analytics">
            <div className="results-lab-mini-pills">
              <span>24h +4%</span>
              <span>7d +11%</span>
              <span>30d +18%</span>
            </div>
            <LineSwatch />
            <BarsSwatch />
          </div>
        </article>

        <article className="detail-card results-lab-card">
          <p className="eyebrow">Option 4 · Dot Matrix</p>
          <div className="results-lab-layout results-lab-layout-dot">
            <DotSwatch />
            <OptionRows />
          </div>
        </article>

        <article className="detail-card results-lab-card">
          <p className="eyebrow">Option 5 · Minimal Scoreboard</p>
          <div className="results-lab-layout results-lab-layout-minimal">
            <OptionRows />
          </div>
        </article>

        <article className="detail-card results-lab-card">
          <p className="eyebrow">Option 6 · Time-Series First</p>
          <div className="results-lab-layout results-lab-layout-timeseries">
            <LineSwatch />
            <div className="results-lab-legend-inline">
              {sampleOptions.map((option) => (
                <span key={option.label}>
                  <i style={{ backgroundColor: option.color }} />
                  {option.label} {option.percent}%
                </span>
              ))}
            </div>
          </div>
        </article>

        <article className="detail-card results-lab-card">
          <p className="eyebrow">Option 7 · Spec Tabs + Cast Vote</p>
          <div className="results-lab-layout results-lab-layout-spec-vote">
            <div className="results-lab-tab-row">
              <button type="button" className="active">Bar Chart</button>
              <button type="button">Pie Chart</button>
            </div>
            <BarsSwatch />
            <VoteListSwatch />
          </div>
        </article>

        <article className="detail-card results-lab-card">
          <p className="eyebrow">Option 8 · Result-First Stack</p>
          <div className="results-lab-layout results-lab-layout-result-first">
            <div className="results-lab-summary-strip">
              <span>Total votes: 151</span>
              <span>Active · 2 days left</span>
            </div>
            <BarsSwatch />
            <OptionRows />
          </div>
        </article>

        <article className="detail-card results-lab-card">
          <p className="eyebrow">Option 9 · Dual Chart Compare</p>
          <div className="results-lab-layout results-lab-layout-dual-chart">
            <DonutSwatch />
            <LineSwatch />
          </div>
          <div className="results-lab-legend-inline" style={{ marginTop: 10 }}>
            {sampleOptions.map((option) => (
              <span key={option.label}>
                <i style={{ backgroundColor: option.color }} />
                {option.label}
              </span>
            ))}
          </div>
        </article>

        <article className="detail-card results-lab-card">
          <p className="eyebrow">Option 10 · Left Vote / Right Result</p>
          <div className="results-lab-layout results-lab-layout-vote-split">
            <VoteListSwatch />
            <BarsSwatch />
          </div>
        </article>

        <article className="detail-card results-lab-card">
          <p className="eyebrow">Option 11 · Compact Panel</p>
          <div className="results-lab-layout results-lab-layout-compact">
            <div className="results-lab-mini-pills">
              <span>Live</span>
              <span>151 votes</span>
            </div>
            <OptionRows />
            <div className="results-lab-time-pills">
              <button type="button">24h</button>
              <button type="button">7d</button>
              <button type="button">30d</button>
              <button type="button" className="active">All time</button>
            </div>
          </div>
        </article>

        <article className="detail-card results-lab-card">
          <p className="eyebrow">Option 12 · Dot + Vote Hybrid</p>
          <div className="results-lab-layout results-lab-layout-dot-vote">
            <DotSwatch />
            <VoteListSwatch />
          </div>
        </article>
      </section>
    </main>
  );
}
