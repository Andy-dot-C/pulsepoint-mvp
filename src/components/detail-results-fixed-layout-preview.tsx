"use client";

import { useMemo, useState } from "react";

type ChartType = "bars" | "donut" | "dots" | "line";

const options = [
  { id: "yes", label: "Yes", votes: 109, percent: 72, color: "#2f6fe4" },
  { id: "no", label: "No", votes: 42, percent: 28, color: "#18a957" },
  { id: "unsure", label: "Unsure", votes: 9, percent: 6, color: "#f59e0b" }
];

function ResultsBars() {
  return (
    <div className="results-fixed-chart-bars">
      {options.map((option) => (
        <div key={option.id} className="results-fixed-bar-row">
          <p>{option.label}</p>
          <div className="results-fixed-bar-track">
            <span style={{ width: `${option.percent}%`, backgroundColor: option.color }} />
          </div>
          <strong>{option.percent}%</strong>
        </div>
      ))}
    </div>
  );
}

function ResultsDonut() {
  return (
    <svg viewBox="0 0 180 180" className="results-fixed-donut" aria-hidden="true">
      <circle cx="90" cy="90" r="58" fill="none" stroke="#e5e7eb" strokeWidth="22" />
      <circle
        cx="90"
        cy="90"
        r="58"
        fill="none"
        stroke="#2f6fe4"
        strokeWidth="22"
        strokeDasharray="262 364"
        strokeLinecap="round"
        transform="rotate(-90 90 90)"
      />
      <circle
        cx="90"
        cy="90"
        r="58"
        fill="none"
        stroke="#18a957"
        strokeWidth="22"
        strokeDasharray="102 364"
        strokeLinecap="round"
        transform="rotate(168 90 90)"
      />
      <text x="90" y="86" textAnchor="middle" className="results-fixed-donut-main">
        151
      </text>
      <text x="90" y="102" textAnchor="middle" className="results-fixed-donut-sub">
        votes
      </text>
    </svg>
  );
}

function ResultsDots() {
  return (
    <div className="results-fixed-dot-grid" aria-hidden="true">
      {Array.from({ length: 100 }).map((_, index) => {
        let color = "#e5e7eb";
        if (index < 72) color = "#2f6fe4";
        else if (index < 100) color = "#18a957";
        return <span key={index} style={{ backgroundColor: color }} />;
      })}
    </div>
  );
}

function ResultsLine() {
  return (
    <svg viewBox="0 0 420 210" className="results-fixed-line" aria-hidden="true">
      <path d="M30 24h360M30 70h360M30 116h360M30 162h360" className="results-fixed-line-grid" />
      <path d="M35 136C84 108 126 114 169 92s67 6 109-7 72 10 107-22" className="results-fixed-line-yes" />
      <path d="M35 158C81 150 128 164 173 151s66 17 110 26 71 9 103 13" className="results-fixed-line-no" />
    </svg>
  );
}

export function DetailResultsFixedLayoutPreview() {
  const [selectedOptionId, setSelectedOptionId] = useState("yes");
  const [chartType, setChartType] = useState<ChartType>("bars");
  const selected = useMemo(
    () => options.find((option) => option.id === selectedOptionId) ?? options[0],
    [selectedOptionId]
  );

  return (
    <article className="detail-card results-fixed-card">
      <p className="eyebrow">Working Direction · Fixed Vote Left + Toggleable Results Right</p>
      <div className="results-fixed-grid">
        <section className="results-fixed-left">
          <h3>Cast your vote</h3>
          <div className="results-fixed-vote-list">
            {options.map((option) => (
              <label
                key={option.id}
                className={`results-fixed-vote-item ${selectedOptionId === option.id ? "results-fixed-vote-item-active" : ""}`}
              >
                <input
                  type="radio"
                  name="fixed-vote-preview"
                  checked={selectedOptionId === option.id}
                  onChange={() => setSelectedOptionId(option.id)}
                />
                <span className="results-fixed-vote-dot" style={{ backgroundColor: option.color }} />
                <span>{option.label}</span>
                <strong>{option.percent}%</strong>
              </label>
            ))}
          </div>
          <button type="button" className="results-fixed-submit-btn">
            Submit vote
          </button>
          <p className="results-fixed-selected-note">Selected: {selected.label}</p>
        </section>

        <section className="results-fixed-right">
          <div className="results-fixed-chart-switch">
            <button
              type="button"
              className={chartType === "bars" ? "active" : ""}
              onClick={() => setChartType("bars")}
            >
              Bars
            </button>
            <button
              type="button"
              className={chartType === "donut" ? "active" : ""}
              onClick={() => setChartType("donut")}
            >
              Donut
            </button>
            <button
              type="button"
              className={chartType === "dots" ? "active" : ""}
              onClick={() => setChartType("dots")}
            >
              Dots
            </button>
            <button
              type="button"
              className={chartType === "line" ? "active" : ""}
              onClick={() => setChartType("line")}
            >
              Line
            </button>
          </div>
          <div className="results-fixed-chart-panel">
            {chartType === "bars" ? <ResultsBars /> : null}
            {chartType === "donut" ? <ResultsDonut /> : null}
            {chartType === "dots" ? <ResultsDots /> : null}
            {chartType === "line" ? <ResultsLine /> : null}
          </div>
        </section>
      </div>
    </article>
  );
}
