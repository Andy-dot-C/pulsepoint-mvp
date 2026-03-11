import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { trackPollEvent } from "@/lib/analytics/events";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeInternalPath } from "@/lib/safe-path";
import { isEntityId } from "@/lib/id-validation";
import { exceedsRequestSize } from "@/lib/request-size";
import { isTrustedWriteRequest } from "@/lib/trusted-request";

type RequestPayload = {
  pollId?: string;
  intent?: string;
  source?: string;
  returnTo?: string;
};

function readClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

function sanitizeSource(source: unknown): string {
  const value = String(source ?? "web").trim();
  if (!value) return "web";
  return value.slice(0, 40);
}

function toBookmarkErrorMessage(error: { message: string }): string {
  if (error.message.includes("poll_bookmarks") || error.message.includes("relation")) {
    return "Bookmarks are not set up yet. Please run the bookmark SQL migration.";
  }
  return "Could not update bookmark right now. Please try again.";
}

export async function POST(request: NextRequest) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ ok: false, error: "Invalid request origin." }, { status: 403 });
  }

  if (exceedsRequestSize(request, 4_000)) {
    return NextResponse.json({ ok: false, error: "Request body too large." }, { status: 413 });
  }

  const ip = readClientIp(request);
  const limiter = await checkRateLimit({
    key: `bookmark-toggle:${ip}`,
    limit: 120,
    windowMs: 10 * 60 * 1000
  });
  if (!limiter.allowed) {
    return NextResponse.json({ ok: false, error: "Too many bookmark requests." }, { status: 429 });
  }

  let payload: RequestPayload | null = null;
  try {
    payload = (await request.json()) as RequestPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request payload." }, { status: 400 });
  }

  const pollId = String(payload?.pollId ?? "").trim();
  const intent = String(payload?.intent ?? "").trim();
  const source = sanitizeSource(payload?.source);
  const returnTo = sanitizeInternalPath(payload?.returnTo);

  if (!pollId || !isEntityId(pollId) || (intent !== "save" && intent !== "remove")) {
    return NextResponse.json({ ok: false, error: "Invalid bookmark request." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        error: "Please sign in to bookmark polls.",
        authUrl: `/auth?next=${encodeURIComponent(returnTo)}`
      },
      { status: 401 }
    );
  }

  if (intent === "remove") {
    const { error } = await supabase.from("poll_bookmarks").delete().eq("user_id", user.id).eq("poll_id", pollId);
    if (error) {
      return NextResponse.json({ ok: false, error: toBookmarkErrorMessage(error) }, { status: 500 });
    }

    await trackPollEvent({
      pollId,
      userId: user.id,
      eventType: "bookmark_remove",
      source
    });

    return NextResponse.json({ ok: true, isBookmarked: false });
  }

  const { error } = await supabase.from("poll_bookmarks").upsert(
    {
      user_id: user.id,
      poll_id: pollId
    },
    { onConflict: "user_id,poll_id" }
  );

  if (error) {
    return NextResponse.json({ ok: false, error: toBookmarkErrorMessage(error) }, { status: 500 });
  }

  await trackPollEvent({
    pollId,
    userId: user.id,
    eventType: "bookmark_add",
    source
  });

  return NextResponse.json({ ok: true, isBookmarked: true });
}
