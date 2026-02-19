import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { trackPollEvent } from "@/lib/analytics/events";

type RequestPayload = {
  pollId?: string;
  intent?: string;
  source?: string;
  returnTo?: string;
};

function safeReturnPath(input: string | null | undefined): string {
  if (!input || !input.startsWith("/")) return "/";
  return input;
}

export async function POST(request: Request) {
  let payload: RequestPayload | null = null;
  try {
    payload = (await request.json()) as RequestPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request payload." }, { status: 400 });
  }

  const pollId = String(payload?.pollId ?? "").trim();
  const intent = String(payload?.intent ?? "").trim();
  const source = String(payload?.source ?? "web").trim() || "web";
  const returnTo = safeReturnPath(payload?.returnTo);

  if (!pollId || (intent !== "save" && intent !== "remove")) {
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
      const message =
        error.message.includes("poll_bookmarks") || error.message.includes("relation")
          ? "Bookmarks are not set up yet. Please run the bookmark SQL migration."
          : error.message;
      return NextResponse.json({ ok: false, error: message }, { status: 500 });
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
    const message =
      error.message.includes("poll_bookmarks") || error.message.includes("relation")
        ? "Bookmarks are not set up yet. Please run the bookmark SQL migration."
        : error.message;
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }

  await trackPollEvent({
    pollId,
    userId: user.id,
    eventType: "bookmark_add",
    source
  });

  return NextResponse.json({ ok: true, isBookmarked: true });
}
