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

export type Poll = {
  id: string;
  slug: string;
  title: string;
  blurb: string;
  description: string;
  category: CategoryKey;
  createdAt: string;
  endsAt?: string;
  isTrending: boolean;
  isBookmarked: boolean;
  commentCount: number;
  options: PollOption[];
  trend: PollTrendPoint[];
};

export type Category = {
  key: CategoryKey;
  label: string;
};

export type FeedTab = {
  key: FeedTabKey;
  label: string;
};
