"use client";

import { CSSProperties, useMemo, useState } from "react";

type TargetConfig = {
  id: string;
  label: string;
};

type TargetState = {
  x: number;
  y: number;
  scale: number;
};

const TARGETS: TargetConfig[] = [
  { id: "leftPane", label: "Left Pane" },
  { id: "voteHead", label: "Vote Heading" },
  { id: "voteOption1", label: "Option 1" },
  { id: "voteOption2", label: "Option 2" }
];

function buildInitialState(): Record<string, TargetState> {
  return {
    leftPane: { x: 0, y: 0, scale: 100 },
    voteHead: { x: 0, y: 0, scale: 100 },
    voteOption1: { x: 0, y: 0, scale: 100 },
    voteOption2: { x: 0, y: 0, scale: 100 }
  };
}

export function DetailVoteAlignWorkbench() {
  const [activeTargetId, setActiveTargetId] = useState<string>(TARGETS[0].id);
  const [stateByTarget, setStateByTarget] = useState<Record<string, TargetState>>(() => buildInitialState());

  const activeState = stateByTarget[activeTargetId];

  const cssVars = useMemo(() => {
    const vars: Record<string, string> = {};
    TARGETS.forEach((target) => {
      const item = stateByTarget[target.id];
      vars[`--vote-dev-${target.id}-x`] = `${item.x}px`;
      vars[`--vote-dev-${target.id}-y`] = `${item.y}px`;
      vars[`--vote-dev-${target.id}-scale`] = `${item.scale / 100}`;
    });
    return vars as CSSProperties;
  }, [stateByTarget]);

  function updateActive(patch: Partial<TargetState>) {
    setStateByTarget((current) => ({
      ...current,
      [activeTargetId]: {
        ...current[activeTargetId],
        ...patch
      }
    }));
  }

  function resetActive() {
    setStateByTarget((current) => ({
      ...current,
      [activeTargetId]: { x: 0, y: 0, scale: 100 }
    }));
  }

  function resetAll() {
    setStateByTarget(buildInitialState());
  }

  function handleCanvasClick(event: React.MouseEvent<HTMLDivElement>) {
    const targetElement = (event.target as HTMLElement).closest<HTMLElement>("[data-dev-target]");
    if (!targetElement) return;
    const targetId = targetElement.dataset.devTarget;
    if (!targetId) return;
    if (!TARGETS.some((item) => item.id === targetId)) return;
    setActiveTargetId(targetId);
  }

  async function copySettings() {
    const payload = JSON.stringify(stateByTarget, null, 2);
    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      // Clipboard might be blocked in some contexts.
    }
  }

  return (
    <div className="hero-preview-dev">
      <aside className="hero-preview-dev-panel">
        <p className="hero-preview-dev-kicker">Dev Controls</p>
        <h2>Vote Left Alignment</h2>

        <label>
          Target
          <select value={activeTargetId} onChange={(event) => setActiveTargetId(event.target.value)}>
            {TARGETS.map((target) => (
              <option key={target.id} value={target.id}>
                {target.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          X ({activeState.x}px)
          <input
            type="range"
            min={-240}
            max={240}
            step={1}
            value={activeState.x}
            onChange={(event) => updateActive({ x: Number(event.target.value) })}
          />
        </label>

        <label>
          Y ({activeState.y}px)
          <input
            type="range"
            min={-240}
            max={240}
            step={1}
            value={activeState.y}
            onChange={(event) => updateActive({ y: Number(event.target.value) })}
          />
        </label>

        <label>
          Scale ({activeState.scale}%)
          <input
            type="range"
            min={60}
            max={150}
            step={1}
            value={activeState.scale}
            onChange={(event) => updateActive({ scale: Number(event.target.value) })}
          />
        </label>

        <div className="hero-preview-dev-actions">
          <button type="button" onClick={resetActive}>
            Reset Target
          </button>
          <button type="button" onClick={resetAll}>
            Reset All
          </button>
          <button type="button" onClick={copySettings}>
            Copy Settings
          </button>
        </div>
      </aside>

      <div className="hero-preview-dev-canvas detail-vote-dev-canvas" style={cssVars} onClick={handleCanvasClick}>
        <span className="back-link" aria-hidden="true">
          Back to feed
        </span>
        <article className="detail-card detail-card-opened">
          <section className="detail-hero">
            <div className="detail-top-row">
              <span className="poll-category">Sport</span>
              <div className="detail-top-actions">
                <span className="bookmark-icon-btn" aria-hidden="true" />
                <span className="share-btn" aria-hidden="true">
                  Share
                </span>
              </div>
            </div>
            <h1>Should live VAR audio be broadcast during Premier League matches?</h1>
            <p className="detail-description">Should referees and fans hear live VAR conversations during games?</p>
          </section>

          <section className="detail-results-vote-section">
            <div className="detail-results-main detail-results-main-bars">
              <div className="detail-results-left" data-dev-target="leftPane">
                <div className="detail-vote-head" data-dev-target="voteHead">
                  <h2>Vote</h2>
                  <span className="detail-vote-head-spacer" aria-hidden="true" />
                </div>
                <div className="option-list">
                  <button type="button" className="option-btn" data-dev-target="voteOption1">
                    <span className="option-btn-fill" style={{ width: "72%", backgroundColor: "#2f6fe4" }} />
                    <span className="option-btn-content">
                      <span>Yes</span>
                      <span className="option-btn-right">
                        <strong>72%</strong>
                      </span>
                    </span>
                  </button>
                  <button type="button" className="option-btn" data-dev-target="voteOption2">
                    <span className="option-btn-fill" style={{ width: "28%", backgroundColor: "#18a957" }} />
                    <span className="option-btn-content">
                      <span>No</span>
                      <span className="option-btn-right">
                        <strong>28%</strong>
                      </span>
                    </span>
                  </button>
                </div>
              </div>

              <div className="detail-results-right">
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
                      <div className="results-graph-bar-row">
                        <div className="results-graph-bar-top">
                          <p>72%</p>
                        </div>
                        <div className="results-graph-bar-track" aria-hidden="true">
                          <span className="results-graph-bar-fill" style={{ width: "72%", backgroundColor: "#2f6fe4" }} />
                        </div>
                      </div>
                      <div className="results-graph-bar-row">
                        <div className="results-graph-bar-top">
                          <p>28%</p>
                        </div>
                        <div className="results-graph-bar-track" aria-hidden="true">
                          <span className="results-graph-bar-fill" style={{ width: "28%", backgroundColor: "#18a957" }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="results-graph-time-switch-wrap">
                    <div className="results-graph-time-switch">
                      <span className="results-graph-time-btn">24h</span>
                      <span className="results-graph-time-btn">7d</span>
                      <span className="results-graph-time-btn">30d</span>
                      <span className="results-graph-time-btn results-graph-time-btn-active">All time</span>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
