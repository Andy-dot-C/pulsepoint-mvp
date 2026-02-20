import { CategoryKey, FeedTabKey } from "@/lib/types";

type FeedQuery = {
  filter?: FeedTabKey | CategoryKey | "all";
  tab?: FeedTabKey;
  category?: CategoryKey | "all";
  q?: string;
};

export function buildFeedHref(query: FeedQuery): string {
  const params = new URLSearchParams();

  if (query.filter && query.filter !== "all") {
    if (query.filter !== "trending") {
      params.set("filter", query.filter);
    }
  } else {
    if (query.tab && query.tab !== "trending") {
      params.set("tab", query.tab);
    }
    if (query.category && query.category !== "all") {
      params.set("category", query.category);
    }
  }

  const normalizedQuery = query.q?.trim();
  if (normalizedQuery) {
    params.set("q", normalizedQuery);
  }

  const asString = params.toString();
  return asString ? `/?${asString}` : "/";
}
