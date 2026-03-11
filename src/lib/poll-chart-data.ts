import { totalVotes } from "@/lib/mock-data";
import { Poll } from "@/lib/types";

export const GRAPH_VARIANTS = ["horizontal-bars", "donut", "dot-grid", "trend-line", "trend-stack"] as const;
export const GRAPH_TIMEFRAMES = ["24h", "7d", "30d", "all"] as const;

export type PollGraphVariant = (typeof GRAPH_VARIANTS)[number];
export type PollGraphTimeframe = (typeof GRAPH_TIMEFRAMES)[number];

export type PollChartOption = {
  id: string;
  label: string;
  votes: number;
  percent: number;
  rank: number;
  color: string;
};

export type PollChartData = {
  totalVotes: number;
  options: PollChartOption[];
  trend: PollChartTrendPoint[];
  lineTimeframes: PollChartLineTimeframeData[];
  timeframes: PollChartTimeframeData[];
};

export type PollChartTrendSegment = {
  id: string;
  label: string;
  percent: number;
  color: string;
};

export type PollChartTrendPoint = {
  label: string;
  totalVotes: number;
  segments: PollChartTrendSegment[];
};

export type PollChartTimeframeData = {
  id: PollGraphTimeframe;
  label: string;
  totalVotes: number;
  options: PollChartOption[];
};

export type PollChartLineTimeframeData = {
  id: PollGraphTimeframe;
  label: string;
  points: PollChartTrendPoint[];
};

export function parsePollGraphVariant(value: string | undefined): PollGraphVariant {
  if (!value) return "horizontal-bars";
  if (value === "horizontal-bars" || value === "donut" || value === "dot-grid" || value === "trend-line" || value === "trend-stack") {
    return value;
  }
  return "horizontal-bars";
}

export function parsePollGraphTimeframe(value: string | undefined): PollGraphTimeframe {
  if (!value) return "all";
  if (value === "24h" || value === "7d" || value === "30d" || value === "all") return value;
  return "all";
}

function toTrendTimeframeId(label: string): PollGraphTimeframe | null {
  const normalized = label.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (normalized === "24h") return "24h";
  if (normalized === "7d") return "7d";
  if (normalized === "30d") return "30d";
  if (normalized === "alltime") return "all";
  return null;
}

function sortByVotesAndLabel(left: PollChartOption, right: PollChartOption) {
  return right.votes - left.votes || left.label.localeCompare(right.label);
}

const DETAIL_GRAPH_COLORS: readonly string[] = [
  "#3B82F6",
  "#22C55E",
  "#F59E0B",
  "#8B5CF6",
  "#EF4444",
  "#14B8A6",
  "#F97316",
  "#6366F1"
];

function getDetailGraphColor(seed: string, optionIndex: number): string {
  void seed;
  return DETAIL_GRAPH_COLORS[((optionIndex % DETAIL_GRAPH_COLORS.length) + DETAIL_GRAPH_COLORS.length) % DETAIL_GRAPH_COLORS.length];
}

export function buildPollChartData(poll: Poll): PollChartData {
  const total = totalVotes(poll);
  const ranked = [...poll.options].sort(
    (left, right) => right.votes - left.votes || left.label.localeCompare(right.label)
  );
  const options = ranked.map((option, index) => ({
    id: option.id,
    label: option.label,
    votes: option.votes,
    percent: total === 0 ? 0 : (option.votes / total) * 100,
    rank: index + 1,
    color: getDetailGraphColor(poll.id, index)
  }));
  const trend = poll.trend.map((point) => {
    const segments = options.map((option) => ({
      id: option.id,
      label: option.label,
      percent: Math.max(0, (point.shares[option.id] ?? 0) * 100),
      color: option.color
    }));
    return {
      label: point.label,
      totalVotes: point.totalVotes,
      segments
    };
  });
  const lineAllPoints = (poll.dailyTrend && poll.dailyTrend.length > 0 ? poll.dailyTrend : poll.trend).map((point) => ({
    label: point.label,
    totalVotes: point.totalVotes,
    segments: options.map((option) => ({
      id: option.id,
      label: option.label,
      percent: Math.max(0, (point.shares[option.id] ?? 0) * 100),
      color: option.color
    }))
  }));
  const line24hPoints = (poll.hourlyTrend && poll.hourlyTrend.length > 0 ? poll.hourlyTrend : poll.trend).map((point) => ({
    label: point.label,
    totalVotes: point.totalVotes,
    segments: options.map((option) => ({
      id: option.id,
      label: option.label,
      percent: Math.max(0, (point.shares[option.id] ?? 0) * 100),
      color: option.color
    }))
  }));
  const timeframeMap = new Map<PollGraphTimeframe, PollChartTimeframeData>();
  trend.forEach((point) => {
    const timeframeId = toTrendTimeframeId(point.label);
    if (!timeframeId || timeframeId === "all") return;
    const timeframeOptions = options
      .map((option) => {
        const percent = Math.max(0, point.segments.find((segment) => segment.id === option.id)?.percent ?? 0);
        return {
          id: option.id,
          label: option.label,
          votes: Math.round((point.totalVotes * percent) / 100),
          percent,
          rank: option.rank,
          color: option.color
        };
      })
      .sort(sortByVotesAndLabel)
      .map((option, index) => ({ ...option, rank: index + 1 }));
    timeframeMap.set(timeframeId, {
      id: timeframeId,
      label: point.label,
      totalVotes: point.totalVotes,
      options: timeframeOptions
    });
  });
  const hasAllTimePoint = trend.some((point) => point.label.trim().toLowerCase().replace(/[^a-z]/g, "") === "alltime");
  if (!hasAllTimePoint) {
    trend.push({
      label: "All time",
      totalVotes: total,
      segments: options.map((option) => ({
        id: option.id,
        label: option.label,
        percent: total === 0 ? 0 : (option.votes / total) * 100,
        color: option.color
      }))
    });
  }
  timeframeMap.set("all", {
    id: "all",
    label: "All time",
    totalVotes: total,
    options
  });

  const timeframes = GRAPH_TIMEFRAMES.filter((frame) => timeframeMap.has(frame)).map(
    (frame) => timeframeMap.get(frame)!
  );

  const lineTimeframes: PollChartLineTimeframeData[] = [];
  const lineFrameCandidates: PollChartLineTimeframeData[] = [
    { id: "24h", label: "24h", points: line24hPoints },
    { id: "7d", label: "7d", points: lineAllPoints.slice(Math.max(lineAllPoints.length - 7, 0)) },
    { id: "30d", label: "30d", points: lineAllPoints.slice(Math.max(lineAllPoints.length - 30, 0)) },
    { id: "all", label: "All time", points: lineAllPoints }
  ];

  lineFrameCandidates.forEach((frame) => {
    if (frame.points.length > 0) {
      lineTimeframes.push(frame);
    }
  });

  return { totalVotes: total, options, trend, lineTimeframes, timeframes };
}
