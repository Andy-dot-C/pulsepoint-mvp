import { createClient } from "@/lib/supabase/server";
import { polls as mockPolls, totalVotes } from "@/lib/mock-data";
import { CategoryKey, FeedTabKey, Poll, PollOption, PollTrendPoint } from "@/lib/types";

type FeedInput = {
  tab: FeedTabKey;
  category: CategoryKey | "all";
  q: string;
};

type PollRow = {
  id: string;
  slug: string;
  title: string;
  blurb: string;
  description: string;
  category_key: CategoryKey;
  created_at: string;
  end_at: string | null;
};

type PollMetaRow = {
  slug: string;
  title: string;
  blurb: string;
  category_key: CategoryKey;
};

type PollOptionRow = {
  id: string;
  poll_id: string;
  label: string;
  position: number;
};

type PollOptionTotalRow = {
  poll_id: string;
  option_id: string;
  label: string;
  votes: number;
};

type VoteEventRow = {
  poll_id: string;
  new_option_id: string;
  changed_at: string;
};

type PollCommentRefRow = {
  poll_id: string;
};

function hasSupabaseConfig(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function normalizeQuery(query: string): string {
  return query.trim().replace(/[%_]/g, "").replace(/,/g, " ");
}

function nowMinusDays(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function byTab(tab: FeedTabKey, input: Poll[], velocityByPollId?: Map<string, number>): Poll[] {
  const copy = [...input];

  if (tab === "new" || tab === "saved") {
    return copy.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  if (tab === "most-voted") {
    return copy.sort((a, b) => totalVotes(b) - totalVotes(a));
  }

  return copy.sort((a, b) => {
    const left = velocityByPollId?.get(a.id) ?? 0;
    const right = velocityByPollId?.get(b.id) ?? 0;
    return right - left;
  });
}

function applyLocalFilters({ tab, category, q }: FeedInput, source: Poll[]): Poll[] {
  if (tab === "saved") {
    return [];
  }

  const byCategory =
    category === "all" ? source : source.filter((poll) => poll.category === category);

  const byQuery = q
    ? byCategory.filter((poll) => {
        const haystack = `${poll.title} ${poll.blurb} ${poll.description}`.toLowerCase();
        return haystack.includes(q.toLowerCase());
      })
    : byCategory;

  return byTab(tab, byQuery);
}

function buildTrendPoints(
  options: PollOption[],
  events: VoteEventRow[],
  fallbackTotals: PollOptionTotalRow[]
): PollTrendPoint[] {
  const windows = [
    { label: "24h", days: 1 },
    { label: "7d", days: 7 },
    { label: "30d", days: 30 }
  ];

  return windows.map((window) => {
    const floor = Date.now() - window.days * 24 * 60 * 60 * 1000;
    const scoped = events.filter((event) => Date.parse(event.changed_at) >= floor);
    const counts = new Map<string, number>();

    scoped.forEach((event) => {
      counts.set(event.new_option_id, (counts.get(event.new_option_id) ?? 0) + 1);
    });

    const total = Array.from(counts.values()).reduce((sum, count) => sum + count, 0);

    if (total === 0) {
      const fallbackTotal = fallbackTotals.reduce((sum, entry) => sum + Number(entry.votes ?? 0), 0);
      const sharesFromTotals = Object.fromEntries(
        options.map((option) => {
          const votes = Number(fallbackTotals.find((entry) => entry.option_id === option.id)?.votes ?? 0);
          const share = fallbackTotal === 0 ? 0 : votes / fallbackTotal;
          return [option.id, share];
        })
      );

      return {
        label: window.label,
        totalVotes: fallbackTotal,
        shares: sharesFromTotals
      };
    }

    const shares = Object.fromEntries(
      options.map((option) => [option.id, (counts.get(option.id) ?? 0) / total])
    );

    return {
      label: window.label,
      totalVotes: total,
      shares
    };
  });
}

function hydratePolls(
  rows: PollRow[],
  optionRows: PollOptionRow[],
  totalRows: PollOptionTotalRow[],
  velocityByPollId: Map<string, number>,
  bookmarkedPollIds: Set<string> = new Set(),
  commentCountByPollId: Map<string, number> = new Map()
): Poll[] {
  return rows.map((row) => {
    const optionsForPoll = optionRows
      .filter((option) => option.poll_id === row.id)
      .sort((a, b) => a.position - b.position)
      .map<PollOption>((option) => {
        const voteCount = totalRows.find((total) => total.option_id === option.id)?.votes ?? 0;
        return {
          id: option.id,
          label: option.label,
          votes: Number(voteCount)
        };
      });

    const totalVotesForPoll = optionsForPoll.reduce((sum, option) => sum + option.votes, 0);

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      blurb: row.blurb,
      description: row.description,
      category: row.category_key,
      createdAt: row.created_at,
      endsAt: row.end_at ?? undefined,
      isTrending: (velocityByPollId.get(row.id) ?? 0) > 0,
      isBookmarked: bookmarkedPollIds.has(row.id),
      commentCount: commentCountByPollId.get(row.id) ?? 0,
      options: optionsForPoll,
      trend: [
        {
          label: "24h",
          totalVotes: velocityByPollId.get(row.id) ?? 0,
          shares: Object.fromEntries(
            optionsForPoll.map((option) => [
              option.id,
              totalVotesForPoll === 0 ? 0 : option.votes / totalVotesForPoll
            ])
          )
        },
        {
          label: "7d",
          totalVotes: totalVotesForPoll,
          shares: Object.fromEntries(
            optionsForPoll.map((option) => [
              option.id,
              totalVotesForPoll === 0 ? 0 : option.votes / totalVotesForPoll
            ])
          )
        },
        {
          label: "30d",
          totalVotes: totalVotesForPoll,
          shares: Object.fromEntries(
            optionsForPoll.map((option) => [
              option.id,
              totalVotesForPoll === 0 ? 0 : option.votes / totalVotesForPoll
            ])
          )
        }
      ]
    };
  });
}

export async function fetchFeed(input: FeedInput): Promise<Poll[]> {
  if (!hasSupabaseConfig()) {
    return applyLocalFilters(input, mockPolls);
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;
  let savedPollIds: string[] | null = null;

  if (input.tab === "saved") {
    if (!userId) {
      return [];
    }

    const { data: savedRows, error: savedError } = await supabase
      .from("poll_bookmarks")
      .select("poll_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(500);

    if (savedError) {
      return [];
    }

    savedPollIds = (savedRows ?? []).map((row) => String(row.poll_id));
    if (savedPollIds.length === 0) {
      return [];
    }
  }

  let query = supabase
    .from("polls")
    .select("id,slug,title,blurb,description,category_key,created_at,end_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(100);

  if (input.category !== "all") {
    query = query.eq("category_key", input.category);
  }

  if (savedPollIds) {
    query = query.in("id", savedPollIds);
  }

  const normalizedQuery = normalizeQuery(input.q);
  if (normalizedQuery) {
    const like = `%${normalizedQuery}%`;
    query = query.or(`title.ilike.${like},blurb.ilike.${like},description.ilike.${like}`);
  }

  const { data: rows, error } = await query;
  if (error || !rows) {
    return applyLocalFilters(input, mockPolls);
  }

  if (rows.length === 0) {
    return [];
  }

  const pollIds = rows.map((row) => row.id);
  const bookmarkedPollIds = new Set<string>();
  const commentCountByPollId = new Map<string, number>();

  const [optionsResult, totalsResult, velocityResult, bookmarksResult, commentsResult] = await Promise.all([
    supabase
      .from("poll_options")
      .select("id,poll_id,label,position")
      .in("poll_id", pollIds)
      .order("position", { ascending: true }),
    supabase.from("poll_option_totals").select("poll_id,option_id,label,votes").in("poll_id", pollIds),
    supabase
      .from("vote_events")
      .select("poll_id")
      .in("poll_id", pollIds)
      .gte("changed_at", nowMinusDays(1)),
    userId
      ? supabase.from("poll_bookmarks").select("poll_id").eq("user_id", userId).in("poll_id", pollIds)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("poll_comments").select("poll_id").in("poll_id", pollIds)
  ]);

  if (optionsResult.error || totalsResult.error || velocityResult.error) {
    return applyLocalFilters(input, mockPolls);
  }

  if (!bookmarksResult.error) {
    (bookmarksResult.data ?? []).forEach((row) => {
      bookmarkedPollIds.add(String(row.poll_id));
    });
  }

  if (!commentsResult.error) {
    ((commentsResult.data ?? []) as PollCommentRefRow[]).forEach((row) => {
      commentCountByPollId.set(row.poll_id, (commentCountByPollId.get(row.poll_id) ?? 0) + 1);
    });
  }

  const velocityByPollId = new Map<string, number>();
  (velocityResult.data ?? []).forEach((event) => {
    velocityByPollId.set(event.poll_id, (velocityByPollId.get(event.poll_id) ?? 0) + 1);
  });

  const hydrated = hydratePolls(
    rows as PollRow[],
    (optionsResult.data ?? []) as PollOptionRow[],
    (totalsResult.data ?? []) as PollOptionTotalRow[],
    velocityByPollId,
    bookmarkedPollIds,
    commentCountByPollId
  );

  return byTab(input.tab, hydrated, velocityByPollId);
}

export async function fetchPollBySlug(slug: string): Promise<Poll | null> {
  if (!hasSupabaseConfig()) {
    return mockPolls.find((poll) => poll.slug === slug) ?? null;
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;
  const { data: row, error } = await supabase
    .from("polls")
    .select("id,slug,title,blurb,description,category_key,created_at,end_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !row) {
    return null;
  }

  const [optionsResult, totalsResult, eventsResult, bookmarkResult, commentsResult] = await Promise.all([
    supabase
      .from("poll_options")
      .select("id,poll_id,label,position")
      .eq("poll_id", row.id)
      .order("position", { ascending: true }),
    supabase
      .from("poll_option_totals")
      .select("poll_id,option_id,label,votes")
      .eq("poll_id", row.id),
    supabase
      .from("vote_events")
      .select("poll_id,new_option_id,changed_at")
      .eq("poll_id", row.id)
      .gte("changed_at", nowMinusDays(30)),
    userId
      ? supabase
          .from("poll_bookmarks")
          .select("poll_id")
          .eq("user_id", userId)
          .eq("poll_id", row.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase.from("poll_comments").select("id", { count: "exact", head: true }).eq("poll_id", row.id)
  ]);

  if (optionsResult.error || totalsResult.error || eventsResult.error) {
    return null;
  }

  const options = (optionsResult.data ?? []) as PollOptionRow[];
  const totals = (totalsResult.data ?? []) as PollOptionTotalRow[];
  const events = (eventsResult.data ?? []) as VoteEventRow[];

  const bookmarkedPollIds = new Set<string>();
  if (bookmarkResult.data?.poll_id) {
    bookmarkedPollIds.add(String(bookmarkResult.data.poll_id));
  }
  const commentCountByPollId = new Map<string, number>();
  commentCountByPollId.set(row.id, Number(commentsResult.count ?? 0));

  const hydrated = hydratePolls(
    [row as PollRow],
    options,
    totals,
    new Map([[row.id, events.filter((event) => Date.parse(event.changed_at) >= Date.now() - 86400000).length]]),
    bookmarkedPollIds,
    commentCountByPollId
  )[0];

  if (!hydrated) {
    return null;
  }

  hydrated.trend = buildTrendPoints(
    hydrated.options,
    events,
    totals
  );

  return hydrated;
}

export async function fetchMyPolls(userId: string): Promise<Poll[]> {
  if (!hasSupabaseConfig() || !userId) {
    return [];
  }

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("polls")
    .select("id,slug,title,blurb,description,category_key,created_at,end_at")
    .eq("created_by", userId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !rows || rows.length === 0) {
    return [];
  }

  const pollIds = rows.map((row) => row.id);
  const [optionsResult, totalsResult, velocityResult, bookmarksResult, commentsResult] = await Promise.all([
    supabase
      .from("poll_options")
      .select("id,poll_id,label,position")
      .in("poll_id", pollIds)
      .order("position", { ascending: true }),
    supabase.from("poll_option_totals").select("poll_id,option_id,label,votes").in("poll_id", pollIds),
    supabase
      .from("vote_events")
      .select("poll_id")
      .in("poll_id", pollIds)
      .gte("changed_at", nowMinusDays(1)),
    supabase.from("poll_bookmarks").select("poll_id").eq("user_id", userId).in("poll_id", pollIds),
    supabase.from("poll_comments").select("poll_id").in("poll_id", pollIds)
  ]);

  if (optionsResult.error || totalsResult.error || velocityResult.error) {
    return [];
  }

  const velocityByPollId = new Map<string, number>();
  (velocityResult.data ?? []).forEach((event) => {
    velocityByPollId.set(event.poll_id, (velocityByPollId.get(event.poll_id) ?? 0) + 1);
  });

  const bookmarkedPollIds = new Set<string>();
  if (!bookmarksResult.error) {
    (bookmarksResult.data ?? []).forEach((row) => bookmarkedPollIds.add(String(row.poll_id)));
  }
  const commentCountByPollId = new Map<string, number>();
  if (!commentsResult.error) {
    ((commentsResult.data ?? []) as PollCommentRefRow[]).forEach((row) => {
      commentCountByPollId.set(row.poll_id, (commentCountByPollId.get(row.poll_id) ?? 0) + 1);
    });
  }

  return hydratePolls(
    rows as PollRow[],
    (optionsResult.data ?? []) as PollOptionRow[],
    (totalsResult.data ?? []) as PollOptionTotalRow[],
    velocityByPollId,
    bookmarkedPollIds,
    commentCountByPollId
  ).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function fetchPollMetaBySlug(
  slug: string
): Promise<{ slug: string; title: string; blurb: string; category: CategoryKey } | null> {
  if (!hasSupabaseConfig()) {
    const mock = mockPolls.find((poll) => poll.slug === slug);
    if (!mock) return null;
    return {
      slug: mock.slug,
      title: mock.title,
      blurb: mock.blurb,
      category: mock.category
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("polls")
    .select("slug,title,blurb,category_key")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as PollMetaRow;
  return {
    slug: row.slug,
    title: row.title,
    blurb: row.blurb,
    category: row.category_key
  };
}
