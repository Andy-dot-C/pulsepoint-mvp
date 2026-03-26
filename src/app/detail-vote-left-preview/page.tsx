const sampleOptions = [
  { id: "yes", label: "Yes", votes: 109, percent: 72, color: "#2f6fe4" },
  { id: "no", label: "No", votes: 42, percent: 28, color: "#18a957" }
];

function RightResultsFixed() {
  return (
    <section className="results-graph-panel" aria-label="Poll results graph preview">
      <div className="results-graph-head">
        <h2>Results</h2>
        <div className="graph-switch">
          <span className="graph-switch-btn graph-switch-btn-active">Bar Chart</span>
          <span className="graph-switch-btn">Donut Chart</span>
          <span className="graph-switch-btn">Dot Chart</span>
        </div>
      </div>

      <div className="results-graph-viewport">
        <div className="results-graph-bars results-graph-bars-blocks results-graph-anim-enter">
          {sampleOptions.map((option) => (
            <div key={option.id} className="results-graph-bar-row">
              <div className="results-graph-bar-top">
                <p>{option.percent}%</p>
              </div>
              <div className="results-graph-bar-track" aria-hidden="true">
                <span className="results-graph-bar-fill" style={{ width: `${option.percent}%`, backgroundColor: option.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="results-graph-time-switch-wrap">
        <div className="results-graph-time-switch" aria-label="Results timeframe">
          <span className="results-graph-time-btn">24h</span>
          <span className="results-graph-time-btn">7d</span>
          <span className="results-graph-time-btn">30d</span>
          <span className="results-graph-time-btn results-graph-time-btn-active">All time</span>
        </div>
      </div>
    </section>
  );
}

function LeftVoteVariant({ variant }: { variant: number }) {
  const yes = sampleOptions[0];
  const no = sampleOptions[1];

  const choice = (option: (typeof sampleOptions)[number], active = false) => (
    <button key={option.id} type="button" className={`vote-layout-choice ${active ? "is-active" : ""}`}>
      <span className="vote-layout-choice-head">
        <span className="vote-layout-choice-label">{option.label}</span>
        <strong style={{ color: option.color }}>{option.percent}%</strong>
      </span>
      <span className="vote-layout-choice-votes">{option.votes} votes</span>
      <span className="vote-layout-choice-track" aria-hidden="true">
        <span style={{ width: `${option.percent}%`, backgroundColor: option.color }} />
      </span>
    </button>
  );

  if (variant === 1) {
    return (
      <section className="detail-results-left vote-layout vote-layout-1">
        <h2>Vote</h2>
        <div className="vote-layout-stack">
          {choice(yes, true)}
          {choice(no)}
        </div>
      </section>
    );
  }

  if (variant === 2) {
    return (
      <section className="detail-results-left vote-layout vote-layout-2">
        <h2>Vote</h2>
        <div className="vote-layout-center">
          {choice(yes, true)}
          {choice(no)}
        </div>
      </section>
    );
  }

  if (variant === 3) {
    return (
      <section className="detail-results-left vote-layout vote-layout-3">
        <h2>Vote</h2>
        <div className="vote-layout-bottom">
          {choice(yes, true)}
          {choice(no)}
        </div>
      </section>
    );
  }

  if (variant === 4) {
    return (
      <section className="detail-results-left vote-layout vote-layout-4">
        <div className="vote-layout-split-head">
          <h2>Vote</h2>
          <p>Pick one option</p>
        </div>
        <div className="vote-layout-row">
          {choice(yes, true)}
          {choice(no)}
        </div>
      </section>
    );
  }

  if (variant === 5) {
    return (
      <section className="detail-results-left vote-layout vote-layout-5">
        <h2>Vote</h2>
        <div className="vote-layout-right-stack">
          {choice(yes, true)}
          {choice(no)}
        </div>
      </section>
    );
  }

  if (variant === 6) {
    return (
      <section className="detail-results-left vote-layout vote-layout-6">
        <h2>Vote</h2>
        <div className="vote-layout-stagger">
          <div className="vote-layout-stagger-a">{choice(yes, true)}</div>
          <div className="vote-layout-stagger-b">{choice(no)}</div>
        </div>
      </section>
    );
  }

  if (variant === 7) {
    return (
      <section className="detail-results-left vote-layout vote-layout-7">
        <h2>Vote</h2>
        <div className="vote-layout-rail">
          <div className="vote-layout-rail-line" aria-hidden="true" />
          <div className="vote-layout-rail-items">
            {choice(yes, true)}
            {choice(no)}
          </div>
        </div>
      </section>
    );
  }

  if (variant === 8) {
    return (
      <section className="detail-results-left vote-layout vote-layout-8">
        <h2>Vote</h2>
        <div className="vote-layout-floating">
          {choice(yes, true)}
          {choice(no)}
        </div>
      </section>
    );
  }

  if (variant === 9) {
    return (
      <section className="detail-results-left vote-layout vote-layout-9">
        <h2>Vote</h2>
        <div className="vote-layout-dual-zone">
          <div className="vote-layout-dual-top">{choice(yes, true)}</div>
          <div className="vote-layout-dual-bottom">{choice(no)}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="detail-results-left vote-layout vote-layout-10">
      <div className="vote-layout-compact-head">
        <h2>Vote</h2>
        <p>Choose quickly</p>
      </div>
      <div className="vote-layout-bottom-dock">
        <div className="vote-layout-bottom-inner">
          {choice(yes, true)}
          {choice(no)}
        </div>
      </div>
    </section>
  );
}

export default function DetailVoteLeftPreviewPage() {
  return (
    <main className="page-shell results-lab-shell">
      <article className="detail-card">
        <h1>Vote Side Concepts · 10 Options</h1>
        <p className="poll-blurb">
          Right side is fixed to the current bar-chart layout. Only the left vote side changes.
        </p>
      </article>

      <section className="vote-left-lab-grid">
        {Array.from({ length: 10 }).map((_, index) => (
          <article key={index} className="detail-card vote-left-lab-card">
            <p className="eyebrow">Option {index + 1}</p>
            <div className="detail-results-main vote-left-lab-main">
              <LeftVoteVariant variant={index + 1} />
              <div className="detail-results-right">
                <RightResultsFixed />
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
