import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { trackPollEvent, type PollEventType } from "@/lib/analytics/events";

type RequestPayload = {
  pollId?: string;
  eventType?: PollEventType;
  source?: string;
  metadata?: Record<string, unknown>;
};

const PUBLIC_EVENT_TYPES = new Set<PollEventType>(["poll_impression", "poll_view", "poll_share"]);

export async function POST(request: Request) {
  let payload: RequestPayload | null = null;
  try {
    payload = (await request.json()) as RequestPayload;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const pollId = String(payload?.pollId ?? "").trim();
  const eventType = payload?.eventType;
  if (!pollId || !eventType || !PUBLIC_EVENT_TYPES.has(eventType)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  await trackPollEvent({
    pollId,
    userId: user?.id ?? null,
    eventType,
    source: payload?.source ?? "web",
    metadata: payload?.metadata
  });

  return NextResponse.json({ ok: true });
}
