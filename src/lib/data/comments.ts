import { createClient } from "@/lib/supabase/server";

export type CommentSortKey = "newest" | "top";

export type PollComment = {
  id: string;
  pollId: string;
  userId: string;
  username: string;
  body: string;
  createdAt: string;
  upvotes: number;
  viewerHasUpvoted: boolean;
};

type CommentRow = {
  id: string;
  poll_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  username: string;
};

type VoteRow = {
  comment_id: string;
  user_id: string;
};

function hasSupabaseConfig(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function resolveCommentSort(input: string | undefined): CommentSortKey {
  return input === "newest" ? "newest" : "top";
}

export async function fetchPollComments(
  pollId: string,
  sort: CommentSortKey,
  viewerId: string | null
): Promise<PollComment[]> {
  if (!hasSupabaseConfig()) {
    return [];
  }

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("poll_comments")
    .select("id,poll_id,user_id,body,created_at")
    .eq("poll_id", pollId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error || !rows || rows.length === 0) {
    return [];
  }

  const comments = rows as CommentRow[];
  const commentIds = comments.map((item) => item.id);
  const userIds = [...new Set(comments.map((item) => item.user_id))];

  const [profileResult, voteResult] = await Promise.all([
    userIds.length > 0
      ? supabase.from("profiles").select("id,username").in("id", userIds)
      : Promise.resolve({ data: [] as ProfileRow[], error: null }),
    commentIds.length > 0
      ? supabase.from("poll_comment_votes").select("comment_id,user_id").in("comment_id", commentIds)
      : Promise.resolve({ data: [] as VoteRow[], error: null })
  ]);

  if (profileResult.error || voteResult.error) {
    return [];
  }

  const profileMap = new Map(((profileResult.data ?? []) as ProfileRow[]).map((item) => [item.id, item.username]));
  const upvoteCountByCommentId = new Map<string, number>();
  const viewerVotes = new Set<string>();

  ((voteResult.data ?? []) as VoteRow[]).forEach((item) => {
    upvoteCountByCommentId.set(item.comment_id, (upvoteCountByCommentId.get(item.comment_id) ?? 0) + 1);
    if (viewerId && item.user_id === viewerId) {
      viewerVotes.add(item.comment_id);
    }
  });

  const mapped: PollComment[] = comments.map((item) => ({
    id: item.id,
    pollId: item.poll_id,
    userId: item.user_id,
    username: profileMap.get(item.user_id) ?? "pulse_user",
    body: item.body,
    createdAt: item.created_at,
    upvotes: upvoteCountByCommentId.get(item.id) ?? 0,
    viewerHasUpvoted: viewerVotes.has(item.id)
  }));

  if (sort === "top") {
    return mapped.sort((left, right) => right.upvotes - left.upvotes || Date.parse(right.createdAt) - Date.parse(left.createdAt));
  }

  return mapped.sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}
