import Link from "next/link";
import { formatVoteLabel } from "@/lib/format-votes";
import { PollChartData, PollGraphTimeframe, PollGraphVariant } from "@/lib/poll-chart-data";

type PollResultsGraphProps = {
  pollSlug: string;
  commentSort: string;
  activeVariant: PollGraphVariant;
  activeTimeframe: PollGraphTimeframe;
  data: PollChartData;
  suppressOptionBreakdown?: boolean;
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

export function PollResultsGraph({
  pollSlug,
  commentSort,
  activeVariant,
  activeTimeframe,
  data,
  suppressOptionBreakdown = false
}: PollResultsGraphProps) {
  const variant: PollGraphVariant =
    activeVariant === "donut" || activeVariant === "dot-grid" ? activeVariant : "horizontal-bars";
  const selectedTimeframe = data.timeframes.find((timeframe) => timeframe.id === activeTimeframe) ?? data.timeframes.at(-1);
  const selectedTimeframeOptions = selectedTimeframe?.options ?? data.options;
  const selectedTimeframeVotes = selectedTimeframe?.totalVotes ?? data.totalVotes;
  const showTimeSwitch = true;
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
            className={`graph-switch-btn ${variant === "horizontal-bars" ? "graph-switch-btn-active" : ""}`}
            role="tab"
            aria-selected={variant === "horizontal-bars"}
          >
            Bar Chart
          </Link>
          <Link
            href={buildGraphHref(pollSlug, commentSort, "donut", activeTimeframe)}
            scroll={false}
            className={`graph-switch-btn ${variant === "donut" ? "graph-switch-btn-active" : ""}`}
            role="tab"
            aria-selected={variant === "donut"}
          >
            Donut Chart
          </Link>
          <Link
            href={buildGraphHref(pollSlug, commentSort, "dot-grid", activeTimeframe)}
            scroll={false}
            className={`graph-switch-btn ${variant === "dot-grid" ? "graph-switch-btn-active" : ""}`}
            role="tab"
            aria-selected={variant === "dot-grid"}
          >
            Dot Chart
          </Link>
        </div>
      </div>

      <div className="results-graph-viewport">
        {variant === "donut" ? (
          <div
            className={`results-graph-donut-wrap ${suppressOptionBreakdown ? "results-graph-donut-wrap-compact" : ""} results-graph-anim-enter`}
          >
            <div
              className="results-graph-donut"
              style={donutStops ? { background: `conic-gradient(${donutStops})` } : undefined}
              aria-hidden="true"
            >
              <div className="results-graph-donut-center">
                <p>{formatVoteLabel(selectedTimeframeVotes)}</p>
              </div>
            </div>
            {!suppressOptionBreakdown ? (
              <div className="results-graph-legend">
                {selectedTimeframeOptions.map((option) => (
                  <p key={option.id} className="results-graph-legend-item">
                    <span className="results-graph-legend-dot" style={{ backgroundColor: option.color }} aria-hidden="true" />
                    <span>{option.label}</span>
                    <strong>{formatPercent(option.percent)}</strong>
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : variant === "dot-grid" ? (
          <div
            className={`results-graph-dot-wrap ${suppressOptionBreakdown ? "results-graph-dot-wrap-full" : ""} results-graph-anim-enter`}
          >
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
            {!suppressOptionBreakdown ? (
              <div className="results-graph-legend">
                {selectedTimeframeOptions.map((option) => (
                  <p key={option.id} className="results-graph-legend-item">
                    <span className="results-graph-legend-dot" style={{ backgroundColor: option.color }} aria-hidden="true" />
                    <span>{option.label}</span>
                    <strong>{formatPercent(option.percent)}</strong>
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : suppressOptionBreakdown ? (
          <div className="results-graph-bars results-graph-bars-blocks results-graph-anim-enter">
            {selectedTimeframeOptions.map((option) => (
              <div key={option.id} className="results-graph-bar-row">
                <div className="results-graph-bar-top">
                  <p>{formatPercent(option.percent)}</p>
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
        ) : (
          <div className="results-graph-bars results-graph-anim-enter">
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
      </div>
      <div className={`results-graph-time-switch-wrap ${showTimeSwitch ? "" : "results-graph-time-switch-wrap-hidden"}`}>
        {showTimeSwitch ? (
          <>
            {variant !== "donut" && !suppressOptionBreakdown ? (
              <p className="results-graph-footer-votes">{formatVoteLabel(selectedTimeframeVotes)}</p>
            ) : null}
            <div className="results-graph-time-switch" aria-label="Results timeframe">
              {data.timeframes.map((timeframe) => (
                <Link
                  key={timeframe.id}
                  href={buildGraphHref(pollSlug, commentSort, variant, timeframe.id)}
                  scroll={false}
                  className={`results-graph-time-btn ${activeTimeframe === timeframe.id ? "results-graph-time-btn-active" : ""}`}
                >
                  {timeframe.label}
                </Link>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
