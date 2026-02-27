"use client";

import { useState } from "react";
import { formatVoteLabel } from "@/lib/format-votes";
import { PollChartData, PollGraphTimeframe } from "@/lib/poll-chart-data";

type FeaturedPollGraphProps = {
  data: PollChartData;
  variant: "donut" | "dot-grid" | "bars" | "line";
};

export function FeaturedPollGraph({ data, variant }: FeaturedPollGraphProps) {
  const [timeframe, setTimeframe] = useState<PollGraphTimeframe>("all");
  const selectedTimeframe = data.timeframes.find((item) => item.id === timeframe) ?? data.timeframes.at(-1);
  const selectedOptions = selectedTimeframe?.options ?? data.options;
  const selectedVotes = selectedTimeframe?.totalVotes ?? data.totalVotes;
  const selectedLineTimeframe = data.lineTimeframes.find((item) => item.id === timeframe) ?? data.lineTimeframes.at(-1);
  const selectedLinePoints = selectedLineTimeframe?.points ?? [];

  const donutStops = selectedOptions
    .reduce(
      (acc, option) => {
        const next = acc.current + option.percent;
        acc.parts.push(`${option.color} ${acc.current.toFixed(2)}% ${next.toFixed(2)}%`);
        acc.current = next;
        return acc;
      },
      { current: 0, parts: [] as string[] }
    )
    .parts.join(", ");

  const dotCells = (() => {
    const weighted = selectedOptions.map((option) => {
      const exact = Math.max(0, option.percent);
      const base = Math.floor(exact);
      return { option, base, fraction: exact - base };
    });
    let remaining = Math.max(0, 100 - weighted.reduce((sum, item) => sum + item.base, 0));
    weighted
      .sort((left, right) => right.fraction - left.fraction)
      .forEach((item) => {
        if (remaining <= 0) return;
        item.base += 1;
        remaining -= 1;
      });

    const cells = Array.from({ length: 100 }, () => null as (typeof selectedOptions)[number] | null);
    const columnMajorSlots: number[] = [];
    for (let column = 0; column < 20; column += 1) {
      for (let row = 0; row < 5; row += 1) {
        columnMajorSlots.push(row * 20 + column);
      }
    }
    let cursor = 0;
    weighted.forEach((item) => {
      for (let count = 0; count < item.base && cursor < columnMajorSlots.length; count += 1) {
        cells[columnMajorSlots[cursor]] = item.option;
        cursor += 1;
      }
    });
    return cells;
  })();

  return (
    <div className={`featured-poll-chart featured-poll-chart-${variant}`}>
      {variant === "line" ? (
        <>
          <svg className="featured-mini-line" viewBox="0 0 280 170" role="img" aria-label="Trend line chart" preserveAspectRatio="none">
            {[0, 25, 50, 75, 100].map((value) => {
              const y = 156 - (value / 100) * 130;
              return <line key={value} x1="14" y1={y} x2="266" y2={y} className="featured-mini-line-grid" />;
            })}
            {data.options.map((option) => {
              const points = selectedLinePoints.map((point, index) => {
                const x = 14 + (index / Math.max(selectedLinePoints.length - 1, 1)) * 252;
                const percent = point.segments.find((segment) => segment.id === option.id)?.percent ?? 0;
                const y = 156 - (Math.max(0, Math.min(100, percent)) / 100) * 130;
                return `${x},${y}`;
              });
              return (
                <polyline
                  key={option.id}
                  points={points.join(" ")}
                  fill="none"
                  stroke={option.color}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}
            {selectedLinePoints
              .map((point, index) => ({ point, index }))
              .filter(({ index }) => {
                const total = selectedLinePoints.length;
                if (total <= 5) return true;
                const step = Math.ceil(total / 5);
                return index === 0 || index === total - 1 || index % step === 0;
              })
              .map(({ point, index }) => {
                const x = 14 + (index / Math.max(selectedLinePoints.length - 1, 1)) * 252;
                return (
                  <text key={`${point.label}-${index}`} x={x} y="168" textAnchor="middle" className="featured-mini-line-axis">
                    {point.label}
                  </text>
                );
              })}
          </svg>
        </>
      ) : variant === "dot-grid" ? (
        <>
          <div className="featured-mini-dot-grid" aria-label="100-dot percentage grid">
            {dotCells.map((option, index) =>
              option ? (
                <span key={`${option.id}-${index}`} className="featured-mini-dot" style={{ backgroundColor: option.color }} />
              ) : (
                <span key={`empty-${index}`} className="featured-mini-dot featured-mini-dot-empty" />
              )
            )}
          </div>
        </>
      ) : variant === "bars" ? (
        <div className="featured-mini-bars" aria-label="Horizontal bar chart">
          {selectedOptions.slice(0, 4).map((option) => (
            <div key={option.id} className="featured-mini-bar-row">
              <span className="featured-mini-bar-track">
                <span className="featured-mini-bar-fill" style={{ width: `${Math.max(option.percent, 2)}%`, backgroundColor: option.color }} />
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="featured-mini-donut" style={donutStops ? { background: `conic-gradient(${donutStops})` } : undefined}>
          <div className="featured-mini-donut-center">
            <p>{formatVoteLabel(selectedVotes)}</p>
          </div>
        </div>
      )}

      <div className="featured-mini-timeframes" aria-label="Chart timeframe">
        {data.timeframes.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`featured-mini-timeframe-btn ${timeframe === item.id ? "featured-mini-timeframe-btn-active" : ""}`}
            onClick={() => setTimeframe(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
