import Link from "next/link";
import { formatVoteLabel } from "@/lib/format-votes";
import { PollChartData, PollGraphTimeframe, PollGraphVariant } from "@/lib/poll-chart-data";

type PollResultsGraphProps = {
  pollSlug: string;
  commentSort: string;
  activeVariant: PollGraphVariant;
  activeTimeframe: PollGraphTimeframe;
  data: PollChartData;
};

const DOT_GRID_ROWS = 5;
const DOT_GRID_COLUMNS = 20;
const DOT_GRID_TOTAL = DOT_GRID_ROWS * DOT_GRID_COLUMNS;

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function buildGraphHref(
  pollSlug: string,
  commentSort: string,
  variant: PollGraphVariant,
  timeframe: PollGraphTimeframe
): string {
  return `/polls/${pollSlug}?comments=${commentSort}&graph=${variant}&time=${timeframe}`;
}

export function PollResultsGraph({ pollSlug, commentSort, activeVariant, activeTimeframe, data }: PollResultsGraphProps) {
  const selectedTimeframe = data.timeframes.find((timeframe) => timeframe.id === activeTimeframe) ?? data.timeframes.at(-1);
  const selectedTimeframeOptions = selectedTimeframe?.options ?? data.options;
  const selectedTimeframeVotes = selectedTimeframe?.totalVotes ?? data.totalVotes;
  const selectedLineTimeframe =
    data.lineTimeframes.find((timeframe) => timeframe.id === activeTimeframe) ?? data.lineTimeframes.at(-1);
  const selectedLinePoints = selectedLineTimeframe?.points ?? [];
  const dotGridCells = (() => {
    const weighted = selectedTimeframeOptions.map((option) => {
      const exact = Math.max(0, option.percent);
      const base = Math.floor(exact);
      return { option, exact, base, fraction: exact - base };
    });
    let remaining = Math.max(0, DOT_GRID_TOTAL - weighted.reduce((sum, item) => sum + item.base, 0));
    weighted
      .sort((left, right) => right.fraction - left.fraction)
      .forEach((item) => {
        if (remaining <= 0) return;
        item.base += 1;
        remaining -= 1;
      });

    const cells = Array.from({ length: DOT_GRID_TOTAL }, () => null as (typeof selectedTimeframeOptions)[number] | null);
    const columnMajorSlots: number[] = [];
    for (let column = 0; column < DOT_GRID_COLUMNS; column += 1) {
      for (let row = 0; row < DOT_GRID_ROWS; row += 1) {
        columnMajorSlots.push(row * DOT_GRID_COLUMNS + column);
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

  const donutStops = selectedTimeframeOptions
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

  return (
    <section className="results-graph-panel" aria-label="Poll results graph">
      <div className="results-graph-head">
        <h2>Results</h2>
        <div className="graph-switch" role="tablist" aria-label="Graph type">
          <Link
            href={buildGraphHref(pollSlug, commentSort, "horizontal-bars", activeTimeframe)}
            scroll={false}
            className={`graph-switch-btn ${activeVariant === "horizontal-bars" ? "graph-switch-btn-active" : ""}`}
            role="tab"
            aria-selected={activeVariant === "horizontal-bars"}
          >
            Bars
          </Link>
          <Link
            href={buildGraphHref(pollSlug, commentSort, "donut", activeTimeframe)}
            scroll={false}
            className={`graph-switch-btn ${activeVariant === "donut" ? "graph-switch-btn-active" : ""}`}
            role="tab"
            aria-selected={activeVariant === "donut"}
          >
            Donut
          </Link>
          <Link
            href={buildGraphHref(pollSlug, commentSort, "dot-grid", activeTimeframe)}
            scroll={false}
            className={`graph-switch-btn ${activeVariant === "dot-grid" ? "graph-switch-btn-active" : ""}`}
            role="tab"
            aria-selected={activeVariant === "dot-grid"}
          >
            Dots
          </Link>
          <Link
            href={buildGraphHref(pollSlug, commentSort, "trend-line", activeTimeframe)}
            scroll={false}
            className={`graph-switch-btn ${activeVariant === "trend-line" ? "graph-switch-btn-active" : ""}`}
            role="tab"
            aria-selected={activeVariant === "trend-line"}
          >
            Lines
          </Link>
          <Link
            href={buildGraphHref(pollSlug, commentSort, "trend-stack", activeTimeframe)}
            scroll={false}
            className={`graph-switch-btn ${activeVariant === "trend-stack" ? "graph-switch-btn-active" : ""}`}
            role="tab"
            aria-selected={activeVariant === "trend-stack"}
          >
            Activity
          </Link>
        </div>
      </div>

      {activeVariant === "donut" ? (
        <div className="results-graph-donut-wrap">
          <div
            className="results-graph-donut"
            style={donutStops ? { background: `conic-gradient(${donutStops})` } : undefined}
            aria-hidden="true"
          >
            <div className="results-graph-donut-center">
              <p>{formatVoteLabel(selectedTimeframeVotes)}</p>
            </div>
          </div>
          <div className="results-graph-legend">
            {selectedTimeframeOptions.map((option) => (
              <p key={option.id} className="results-graph-legend-item">
                <span className="results-graph-legend-dot" style={{ backgroundColor: option.color }} aria-hidden="true" />
                <span>{option.label}</span>
                <strong>{formatPercent(option.percent)}</strong>
              </p>
            ))}
          </div>
        </div>
      ) : activeVariant === "dot-grid" ? (
        <div className="results-graph-dot-wrap">
          <div className="results-graph-dot-grid" aria-label="100-dot percentage grid">
            {dotGridCells.map((option, index) =>
              option ? (
                <span
                  key={`${option.id}-${index}`}
                  className="results-graph-dot"
                  style={{ backgroundColor: option.color }}
                  title={`${option.label}`}
                  aria-hidden="true"
                />
              ) : (
                <span key={`empty-${index}`} className="results-graph-dot results-graph-dot-empty" aria-hidden="true" />
              )
            )}
          </div>
          <div className="results-graph-legend">
            {selectedTimeframeOptions.map((option) => (
              <p key={option.id} className="results-graph-legend-item">
                <span className="results-graph-legend-dot" style={{ backgroundColor: option.color }} aria-hidden="true" />
                <span>{option.label}</span>
                <strong>{formatPercent(option.percent)}</strong>
              </p>
            ))}
          </div>
        </div>
      ) : activeVariant === "trend-line" ? (
        <div className="results-graph-line-wrap">
          <svg
            className="results-graph-line-chart"
            viewBox="0 0 640 240"
            role="img"
            aria-label="Vote share trend over time"
            preserveAspectRatio="none"
          >
            {[0, 25, 50, 75, 100].map((value) => {
              const y = 220 - (value / 100) * 180;
              return (
                <g key={`grid-${value}`}>
                  <line x1="28" y1={y} x2="612" y2={y} className="results-graph-line-grid" />
                  <text x="0" y={y + 4} className="results-graph-line-axis-label">
                    {value}%
                  </text>
                </g>
              );
            })}
            {data.options.map((option) => {
              const points = selectedLinePoints.map((point, index) => {
                const x = 28 + (index / Math.max(selectedLinePoints.length - 1, 1)) * 584;
                const percent = point.segments.find((segment) => segment.id === option.id)?.percent ?? 0;
                const y = 220 - (Math.max(0, Math.min(100, percent)) / 100) * 180;
                return { x, y, label: point.label, percent };
              });
              if (points.length === 0) return null;
              const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
              return (
                <g key={option.id}>
                  <polyline
                    points={polylinePoints}
                    fill="none"
                    stroke={option.color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}
            {selectedLinePoints
              .map((point, index) => ({ point, index }))
              .filter(({ index }) => {
                const total = selectedLinePoints.length;
                if (total <= 6) return true;
                const step = Math.ceil(total / 6);
                return index === 0 || index === total - 1 || index % step === 0;
              })
              .map(({ point, index }) => {
                const x = 28 + (index / Math.max(selectedLinePoints.length - 1, 1)) * 584;
                return (
                  <text key={`x-${point.label}-${index}`} x={x} y="236" textAnchor="middle" className="results-graph-line-axis-label">
                    {point.label}
                  </text>
                );
              })}
          </svg>
          <div className="results-graph-trend-legend">
            {data.options.map((option) => (
              <p key={option.id} className="results-graph-trend-legend-item">
                <span className="results-graph-legend-dot" style={{ backgroundColor: option.color }} aria-hidden="true" />
                <span>{option.label}</span>
              </p>
            ))}
          </div>
        </div>
      ) : activeVariant === "trend-stack" ? (
        <div className="results-graph-trend">
          {data.trend.map((point) => (
            <div key={point.label} className="results-graph-trend-row">
              <div className="results-graph-trend-head">
                <p>{point.label}</p>
                <p>{formatVoteLabel(point.totalVotes)}</p>
              </div>
              <div className="results-graph-trend-track" aria-hidden="true">
                {point.segments.map((segment) => (
                  <span
                    key={segment.id}
                    className="results-graph-trend-segment"
                    style={{ width: `${Math.max(segment.percent, 2)}%`, backgroundColor: segment.color }}
                    title={`${segment.label}: ${formatPercent(segment.percent)}`}
                  />
                ))}
              </div>
            </div>
          ))}
          <div className="results-graph-trend-legend">
            {data.options.map((option) => (
              <p key={option.id} className="results-graph-trend-legend-item">
                <span className="results-graph-legend-dot" style={{ backgroundColor: option.color }} aria-hidden="true" />
                <span>{option.label}</span>
              </p>
            ))}
          </div>
        </div>
      ) : (
        <div className="results-graph-bars">
          {selectedTimeframeOptions.map((option) => (
            <div key={option.id} className="results-graph-bar-row">
              <div className="results-graph-bar-top">
                <p>{option.label}</p>
                <p>
                  <strong>{formatPercent(option.percent)}</strong> · {option.votes.toLocaleString()} votes
                </p>
              </div>
              <div className="results-graph-bar-track" aria-hidden="true">
                <span
                  className="results-graph-bar-fill"
                  style={{
                    width: `${Math.max(option.percent, 2)}%`,
                    backgroundColor: option.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {activeVariant === "donut" || activeVariant === "horizontal-bars" || activeVariant === "dot-grid" || activeVariant === "trend-line" ? (
        <div className="results-graph-time-switch" aria-label="Results timeframe">
          {data.timeframes.map((timeframe) => (
            <Link
              key={timeframe.id}
              href={buildGraphHref(pollSlug, commentSort, activeVariant, timeframe.id)}
              scroll={false}
              className={`results-graph-time-btn ${activeTimeframe === timeframe.id ? "results-graph-time-btn-active" : ""}`}
            >
              {timeframe.label}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
