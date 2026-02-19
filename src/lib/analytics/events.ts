import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type PollEventType =
  | "poll_impression"
  | "poll_view"
  | "poll_share"
  | "vote_cast"
  | "comment_post"
  | "comment_upvote"
  | "bookmark_add"
  | "bookmark_remove"
  | "report_submit";

type TrackPollEventInput = {
  pollId: string;
  userId?: string | null;
  eventType: PollEventType;
  source?: string;
  metadata?: Record<string, unknown>;
};

export async function trackPollEvent(input: TrackPollEventInput): Promise<void> {
  if (!input.pollId || !input.eventType) return;

  try {
    const admin = createAdminClient();
    await admin.from("poll_events").insert({
      poll_id: input.pollId,
      user_id: input.userId ?? null,
      event_type: input.eventType,
      source: input.source ?? "web",
      metadata: input.metadata ?? {}
    });
  } catch {
    // Analytics should never block core user actions.
  }
}
