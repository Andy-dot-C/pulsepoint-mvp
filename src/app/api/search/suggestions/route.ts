import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { polls as mockPolls } from "@/lib/mock-data";
import { selectTrendingPollIds } from "@/lib/trending";

type RequestPayload = {
  q?: string;
};

type PollRow = {
  id: string;
  slug: string;
  title: string;
  category_key: string;
};

type PollOptionRow = {
  poll_id: string;
  label: string;
};

type PollOptionTotalRow = {
  poll_id: string;
  votes: number;
};

type VoteEventRow = {
  poll_id: string;
};

function nowMinusDays(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function scoreText(query: string, value: string): number {
  const q = query.toLowerCase().trim();
  const text = value.toLowerCase();
  if (!q) return 0;
  if (text === q) return 100;
  if (text.startsWith(q)) return 80;
  if (text.includes(q)) return 50;
  return 0;
}

function scoreOptions(query: string, options: string[]): number {
  let best = 0;
  for (const option of options) {
    const score = scoreText(query, option);
    if (score > best) best = score;
  }
  if (best === 100) return 120;
  if (best === 80) return 95;
  if (best === 50) return 70;
  return 0;
}

function buildFallbackSuggestions(query: string) {
  const ranked = mockPolls
    .map((poll) => {
      const titleScore = scoreText(query, poll.title);
      const optionScore = scoreOptions(
        query,
        poll.options.map((option) => option.label)
      );
      return {
        poll,
        score: Math.max(titleScore, optionScore),
        optionScore,
        votes30d: poll.options.reduce((sum, option) => sum + option.votes, 0)
      };
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.optionScore - left.optionScore ||
        right.votes30d - left.votes30d
    );

  const velocityByPollId = new Map<string, number>(
    ranked.map((item) => [item.poll.id, item.poll.options.reduce((sum, option) => sum + option.votes, 0)])
  );
  const trendingPollIds = selectTrendingPollIds(velocityByPollId);

  return ranked.slice(0, 6).map((item) => ({
    id: item.poll.id,
    slug: item.poll.slug,
    title: item.poll.title,
    isTrending: trendingPollIds.has(item.poll.id)
  }));
}

export async function POST(request: Request) {
  let payload: RequestPayload | null = null;
  try {
    payload = (await request.json()) as RequestPayload;
  } catch {
    return NextResponse.json({ ok: false, polls: [] }, { status: 400 });
  }

  const q = String(payload?.q ?? "").trim();

  const supabase = await createClient();
  const { data: pollRowsData, error: pollError } = await supabase
    .from("polls")
    .select("id,slug,title,category_key")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(300);

  if (pollError) {
    return NextResponse.json({ ok: true, polls: buildFallbackSuggestions(q) });
  }

  const pollRows = (pollRowsData ?? []) as PollRow[];
  if (pollRows.length === 0) {
    return NextResponse.json({ ok: true, polls: buildFallbackSuggestions(q) });
  }

  const pollIds = pollRows.map((item) => item.id);
  const [optionRowsResult, totalsResult, velocityResult] = await Promise.all([
    supabase.from("poll_options").select("poll_id,label").in("poll_id", pollIds),
    supabase.from("poll_option_totals").select("poll_id,votes").in("poll_id", pollIds),
    supabase
      .from("vote_events")
      .select("poll_id")
      .in("poll_id", pollIds)
      .gte("changed_at", nowMinusDays(1))
  ]);
  if (optionRowsResult.error || totalsResult.error || velocityResult.error) {
    return NextResponse.json({ ok: true, polls: buildFallbackSuggestions(q) });
  }

  const optionRows = ((optionRowsResult.data ?? []) as PollOptionRow[]).filter((item) => item.poll_id && item.label);
  const totalsRows = ((totalsResult.data ?? []) as PollOptionTotalRow[]).filter((item) => item.poll_id);

  const optionsByPollId = new Map<string, string[]>();
  optionRows.forEach((item) => {
    const existing = optionsByPollId.get(item.poll_id) ?? [];
    existing.push(item.label);
    optionsByPollId.set(item.poll_id, existing);
  });

  const votesByPollId = new Map<string, number>();
  totalsRows.forEach((item) => {
    votesByPollId.set(item.poll_id, (votesByPollId.get(item.poll_id) ?? 0) + Number(item.votes ?? 0));
  });

  const velocityByPollId = new Map<string, number>();
  ((velocityResult.data ?? []) as VoteEventRow[]).forEach((event) => {
    velocityByPollId.set(event.poll_id, (velocityByPollId.get(event.poll_id) ?? 0) + 1);
  });
  const trendingPollIds = selectTrendingPollIds(velocityByPollId);

  const ranked = pollRows.map((poll) => {
    const options = optionsByPollId.get(poll.id) ?? [];
    const titleScore = scoreText(q, poll.title);
    const optionScore = scoreOptions(q, options);
    const score = Math.max(titleScore, optionScore);
    return {
      poll,
      score,
      optionScore,
      votes30d: votesByPollId.get(poll.id) ?? 0
    };
  });

  const matched = ranked
    .filter((item) => item.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.optionScore - left.optionScore ||
        right.votes30d - left.votes30d
    );
  const fallback = ranked
    .filter((item) => item.score === 0)
    .sort((left, right) => right.votes30d - left.votes30d);
  const ordered = q ? [...matched, ...fallback] : fallback;

  const suggestions = ordered.slice(0, 6).map((item) => ({
    id: item.poll.id,
    slug: item.poll.slug,
    title: item.poll.title,
    isTrending: trendingPollIds.has(item.poll.id)
  }));

  return NextResponse.json({ ok: true, polls: suggestions });
}
