import Link from "next/link";
import { submitVoteAction } from "@/app/actions/votes";
import { SharePollButton } from "@/components/share-poll-button";
import { BookmarkToggleForm } from "@/components/bookmark-toggle-form";
import { PollCardShell } from "@/components/poll-card-shell";
import { totalVotes } from "@/lib/mock-data";
import { getPollStatus } from "@/lib/poll-status";
import { Poll } from "@/lib/types";

type FigmaHeroPreviewCardProps = {
  poll: Poll;
  returnTo: string;
  showStaticCarouselControls?: boolean;
  maxOptions?: number;
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
  maxOptions = 2
}: FigmaHeroPreviewCardProps) {
  const total = totalVotes(poll);
  const ranked = [...poll.options]
    .sort((left, right) => right.votes - left.votes || left.label.localeCompare(right.label))
    .slice(0, Math.max(1, maxOptions));
  const pollHref = `/polls/${poll.slug}`;
  const status = getPollStatus(poll.endsAt);
  const chartPalette = ["#3b82f6", "#22c55e"];
  const leftOption = ranked[0];
  const rightOption = ranked[1];
  const leftPercent = leftOption ? Math.round((leftOption.votes / Math.max(total, 1)) * 100) : 0;
  const rightPercent = rightOption ? Math.round((rightOption.votes / Math.max(total, 1)) * 100) : 0;
  const maxPercent = Math.max(leftPercent, rightPercent);
  const yMax = Math.max(80, Math.ceil(maxPercent / 20) * 20);
  const yTicks = [0, 20, 40, 60, 80].filter((tick) => tick <= yMax);
  const axisBottomY = 256;
  const axisTopY = -26;
  const axisSpan = axisBottomY - axisTopY;
  const topValueY = (value: number) => axisBottomY - (Math.max(0, Math.min(value, yMax)) / Math.max(yMax, 1)) * axisSpan;

  return (
    <PollCardShell href={pollHref} ariaLabel={`Open featured poll: ${poll.title}`} className="featured-poll-card figma-hero-preview-card">
      <div className="figma-hero-preview-topbar" data-dev-target="topbar">
        <span className="figma-hero-preview-badge" data-dev-target="badge">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M2.5 11.5V9.2c0-.7.5-1.2 1.2-1.2h2.4M6.1 8l2.3-2.3c.5-.5 1.2-.5 1.7 0l1.4 1.4m0 0V4.5m0 2.6h-2.6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
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
            const color = chartPalette[optionIndex % chartPalette.length];
            return (
              <form
                key={option.id}
                action={submitVoteAction}
                className="figma-hero-preview-option-form"
                data-dev-target={optionIndex === 0 ? "option1" : "option2"}
              >
                <input type="hidden" name="pollId" value={poll.id} />
                <input type="hidden" name="optionId" value={option.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <button
                  type="submit"
                  className={`figma-hero-preview-option${selected ? " figma-hero-preview-option-selected" : ""}`}
                  disabled={status.isClosed}
                >
                  <span className="figma-hero-preview-option-head">
                    <span className="figma-hero-preview-option-copy">
                      <span className="figma-hero-preview-option-label">{option.label}</span>
                      <span className="figma-hero-preview-option-votes">{formatCompactCount(optionVotes)} votes</span>
                    </span>
                    <span className="figma-hero-preview-option-percent-wrap">
                      <strong className="figma-hero-preview-option-percent" style={{ color }}>
                        {percent(optionVotes, total)}
                      </strong>
                    </span>
                  </span>
                  <span className="figma-hero-preview-option-track" aria-hidden="true">
                    <span className="figma-hero-preview-option-fill" style={{ width: `${Math.max(0, Math.min(100, optionPercent))}%`, backgroundColor: color }} />
                  </span>
                </button>
              </form>
            );
          })}

        </div>

        <div className="figma-hero-preview-chart" data-dev-target="chartWrap">
          <p className="figma-hero-preview-brand" data-dev-target="logo">
            Pollzone
          </p>
          <svg className="figma-hero-preview-chart-svg" viewBox="0 -36 620 336" role="img" aria-label="Hero bar chart" data-dev-target="graph">
            {yTicks.map((tick) => {
              const y = axisBottomY - (tick / Math.max(yMax, 1)) * axisSpan;
              return <line key={tick} x1="58" y1={y} x2="590" y2={y} className="figma-hero-preview-grid-line" />;
            })}

            <line x1="58" y1={axisTopY} x2="58" y2={axisBottomY} className="figma-hero-preview-axis-line" />
            <line x1="58" y1={axisBottomY} x2="590" y2={axisBottomY} className="figma-hero-preview-axis-line" />

            {yTicks.map((tick) => {
              const y = axisBottomY - (tick / Math.max(yMax, 1)) * axisSpan;
              return (
                <g key={`label-${tick}`}>
                  <line x1="52" y1={y} x2="58" y2={y} className="figma-hero-preview-axis-line" />
                  <text x="47" y={y + 6} textAnchor="end" className="figma-hero-preview-axis-text">
                    {tick}
                  </text>
                </g>
              );
            })}

            {leftOption ? (
              <>
                <rect x="175" y={topValueY(leftPercent)} width="100" height={256 - topValueY(leftPercent)} rx="12" fill="#3b82f6" />
                <text x="225" y={topValueY(leftPercent) - 8} textAnchor="middle" className="figma-hero-preview-bar-label">
                  {leftPercent}%
                </text>
                <text x="225" y="288" textAnchor="middle" className="figma-hero-preview-x-text">
                  {leftOption.label}
                </text>
              </>
            ) : null}

            {rightOption ? (
              <>
                <rect x="425" y={topValueY(rightPercent)} width="100" height={256 - topValueY(rightPercent)} rx="12" fill="#22c55e" />
                <text x="475" y={topValueY(rightPercent) - 8} textAnchor="middle" className="figma-hero-preview-bar-label">
                  {rightPercent}%
                </text>
                <text x="475" y="288" textAnchor="middle" className="figma-hero-preview-x-text">
                  {rightOption.label}
                </text>
              </>
            ) : null}
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
