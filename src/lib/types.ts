export type CategoryKey =
  | "politics"
  | "sport"
  | "entertainment"
  | "culture"
  | "hot-takes";

export type FeedTabKey = "trending" | "new" | "most-voted" | "saved";
export type FeedFilterKey = FeedTabKey | CategoryKey | "all";

export type PollOption = {
  id: string;
  label: string;
  votes: number;
};

export type PollTrendPoint = {
  label: string;
  totalVotes: number;
  shares: Record<string, number>;
};

export type PollDailyTrendPoint = {
  date: string;
  label: string;
  totalVotes: number;
  shares: Record<string, number>;
};

export type PollHourlyTrendPoint = {
  iso: string;
  label: string;
  totalVotes: number;
  shares: Record<string, number>;
};

export type Poll = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: CategoryKey;
  createdAt: string;
  endsAt?: string;
  isTrending: boolean;
  isBookmarked: boolean;
  commentCount: number;
  viewerVoteOptionId?: string;
  options: PollOption[];
  trend: PollTrendPoint[];
  dailyTrend?: PollDailyTrendPoint[];
  hourlyTrend?: PollHourlyTrendPoint[];
};

export type Category = {
  key: CategoryKey;
  label: string;
};

export type FeedTab = {
  key: FeedTabKey;
  label: string;
};
