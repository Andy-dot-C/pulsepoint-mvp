import Link from "next/link";
import { submitVoteAction } from "@/app/actions/votes";
import { SharePollButton } from "@/components/share-poll-button";
import { BookmarkToggleForm } from "@/components/bookmark-toggle-form";
import { PollCardShell } from "@/components/poll-card-shell";
import { VoteOptionForm } from "@/components/vote-option-form";
import { totalVotes } from "@/lib/mock-data";
import { getPollStatus } from "@/lib/poll-status";
import { buildPollChartData } from "@/lib/poll-chart-data";
import { Poll } from "@/lib/types";
import type { CSSProperties } from "react";

type FigmaHeroPreviewCardProps = {
  poll: Poll;
  returnTo: string;
  showStaticCarouselControls?: boolean;
  maxOptions?: number;
  className?: string;
  style?: CSSProperties;
  chartOffsetX?: number;
  chartOffsetY?: number;
};

function percent(votes: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((votes / total) * 100)}%`;
}

function formatCompactCount(value: number): string {
  const rounded = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  if (rounded >= 1_000_000) {
    const millions = rounded / 1_000_000;
    return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}m`;
  }
  if (rounded >= 1_000) {
    const thousands = rounded / 1_000;
    return `${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}k`;
  }
  return `${rounded}`;
}

export function FigmaHeroPreviewCard({
  poll,
  returnTo,
  showStaticCarouselControls = true,
  maxOptions = 2,
  className,
  style,
  chartOffsetX = 0,
  chartOffsetY = 0
}: FigmaHeroPreviewCardProps) {
  const total = totalVotes(poll);
  const ranked = [...poll.options]
    .sort((left, right) => right.votes - left.votes || left.label.localeCompare(right.label))
    .slice(0, Math.max(1, maxOptions));
  const pollHref = `/polls/${poll.slug}`;
  const status = getPollStatus(poll.endsAt);
  const chartPalette = ["#3b82f6", "#22c55e", "#f59e0b"];
  const chartOptions = ranked.slice(0, Math.max(1, Math.min(3, maxOptions)));
  const leftOption = chartOptions[0];
  const rightOption = chartOptions[1];
  const thirdOption = chartOptions[2];
  const chartData = buildPollChartData(poll);
  const optionColorMap = new Map(chartData.options.map((option) => [option.id, option.color]));
  const chartPercents = chartOptions.map((option) => Math.round((option.votes / Math.max(total, 1)) * 100));
  const leftPercent = chartPercents[0] ?? 0;
  const rightPercent = chartPercents[1] ?? 0;
  const thirdPercent = chartPercents[2] ?? 0;
  const maxPercent = Math.max(...chartPercents, 0);
  const yMax = Math.max(80, Math.ceil(maxPercent / 20) * 20);
  const yTicks = [0, 20, 40, 60, 80].filter((tick) => tick <= yMax);
  const axisBottomY = 256;
  const axisTopY = -26;
  const axisSpan = axisBottomY - axisTopY;
  const topValueY = (value: number) => axisBottomY - (Math.max(0, Math.min(value, yMax)) / Math.max(yMax, 1)) * axisSpan;
  const barLayout =
    chartOptions.length >= 3
      ? [
          { x: 115, width: 82, percent: leftPercent, option: leftOption, color: optionColorMap.get(leftOption?.id ?? "") ?? chartPalette[0] },
          { x: 282, width: 82, percent: rightPercent, option: rightOption, color: optionColorMap.get(rightOption?.id ?? "") ?? chartPalette[1] },
          { x: 449, width: 82, percent: thirdPercent, option: thirdOption, color: optionColorMap.get(thirdOption?.id ?? "") ?? chartPalette[2] }
        ]
      : [
          { x: 175, width: 100, percent: leftPercent, option: leftOption, color: optionColorMap.get(leftOption?.id ?? "") ?? chartPalette[0] },
          { x: 425, width: 100, percent: rightPercent, option: rightOption, color: optionColorMap.get(rightOption?.id ?? "") ?? chartPalette[1] }
        ];

  return (
    <PollCardShell
      href={pollHref}
      ariaLabel={`Open featured poll: ${poll.title}`}
      className={`featured-poll-card figma-hero-preview-card${ranked.length >= 3 ? " figma-hero-preview-has-3-options" : ""}${className ? ` ${className}` : ""}`}
      style={style}
    >
      <div className="figma-hero-preview-topbar" data-dev-target="topbar">
        <span className="figma-hero-preview-badge" data-dev-target="badge">
          Trending
        </span>
        {showStaticCarouselControls ? (
          <div className="figma-hero-preview-arrows" aria-hidden="true" data-dev-target="arrows">
            <span className="figma-hero-preview-arrow">&#8249;</span>
            <span className="figma-hero-preview-counter">1 of 5</span>
            <span className="figma-hero-preview-arrow">&#8250;</span>
          </div>
        ) : null}
      </div>

      <h2 className="figma-hero-preview-title" data-dev-target="title">
        <Link href={pollHref}>{poll.title}</Link>
      </h2>

      <div className="figma-hero-preview-main">
        <div className="figma-hero-preview-left" data-dev-target="left">
          {ranked.map((option, optionIndex) => {
            const optionVotes = option.votes;
            const optionPercent = (optionVotes / Math.max(total, 1)) * 100;
            const selected = poll.viewerVoteOptionId === option.id;
            const color = optionColorMap.get(option.id) ?? chartPalette[optionIndex % chartPalette.length];
            return (
              <div key={option.id} className="figma-hero-preview-option-form" data-dev-target={optionIndex === 0 ? "option1" : "option2"}>
                <VoteOptionForm
                  pollId={poll.id}
                  optionId={option.id}
                  returnTo={returnTo}
                  label={option.label}
                  rightText={percent(optionVotes, total)}
                  percent={optionPercent}
                  variant="line"
                  selected={selected}
                  disabled={status.isClosed}
                  fillColor={color}
                  accentColor={color}
                />
              </div>
            );
          })}

        </div>

        <div className="figma-hero-preview-chart" data-dev-target="chartWrap">
          <p className="figma-hero-preview-brand" data-dev-target="logo">
            Pollzone
          </p>
          <svg className="figma-hero-preview-chart-svg" viewBox="0 -36 620 336" role="img" aria-label="Hero bar chart" data-dev-target="graph">
            <g className="figma-hero-chart-content">
              {yTicks.map((tick) => {
                const y = axisBottomY - (tick / Math.max(yMax, 1)) * axisSpan;
                return (
                  <line
                    key={tick}
                    x1={58 + chartOffsetX}
                    y1={y + chartOffsetY}
                    x2={590 + chartOffsetX}
                    y2={y + chartOffsetY}
                    className="figma-hero-preview-grid-line"
                  />
                );
              })}

              {barLayout.map((bar) =>
                bar.option ? (
                  <g key={bar.option.id}>
                    <rect
                      x={bar.x + chartOffsetX}
                      y={topValueY(bar.percent) + chartOffsetY}
                      width={bar.width}
                      height={256 - topValueY(bar.percent)}
                      rx="12"
                      fill={bar.color}
                    />
                    <text
                      x={bar.x + bar.width / 2 + chartOffsetX}
                      y={topValueY(bar.percent) - 8 + chartOffsetY}
                      textAnchor="middle"
                      className="figma-hero-preview-bar-label"
                    >
                      {bar.percent}%
                    </text>
                  </g>
                ) : null
              )}

              <line
                x1={58 + chartOffsetX}
                y1={axisTopY + chartOffsetY}
                x2={58 + chartOffsetX}
                y2={axisBottomY + chartOffsetY}
                className="figma-hero-preview-axis-line"
                data-axis="y"
              />
              <line
                x1={58 + chartOffsetX}
                y1={axisBottomY + chartOffsetY}
                x2={590 + chartOffsetX}
                y2={axisBottomY + chartOffsetY}
                className="figma-hero-preview-axis-line"
              />

              {yTicks.map((tick) => {
                const y = axisBottomY - (tick / Math.max(yMax, 1)) * axisSpan;
                return (
                  <g key={`label-${tick}`}>
                    <line
                      x1={52 + chartOffsetX}
                      y1={y + chartOffsetY}
                      x2={58 + chartOffsetX}
                      y2={y + chartOffsetY}
                      className="figma-hero-preview-axis-line"
                    />
                    <text x={47 + chartOffsetX} y={y + 6 + chartOffsetY} textAnchor="end" className="figma-hero-preview-axis-text">
                      {tick}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>

      <div className="poll-footer" data-dev-target="footer">
        <div className="poll-footer-left">
          <p className="poll-meta-pill">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M16 19a4 4 0 0 0-8 0M19 19a4 4 0 0 0-2.1-3.5M5 19A4 4 0 0 1 7.1 15.5M16 8a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM8 8a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {formatCompactCount(total)}
          </p>
          <Link className="poll-comment-pill" href={`/polls/${poll.slug}#comments`} title="View comments">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M5 6.5h14a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3v-3H5A1.5 1.5 0 0 1 3.5 16V8A1.5 1.5 0 0 1 5 6.5Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
            {poll.commentCount}
          </Link>
        </div>
        <div className="poll-footer-right">
          <BookmarkToggleForm pollId={poll.id} isBookmarked={poll.isBookmarked} source="feed_featured" compact />
          <SharePollButton
            pollId={poll.id}
            title={poll.title}
            path={`/polls/${poll.slug}`}
            embedPath={`/embed/polls/${poll.slug}`}
            source="feed_featured"
            compact
          />
        </div>
      </div>
    </PollCardShell>
  );
}
