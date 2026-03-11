import { NextRequest, NextResponse } from "next/server";
import { assistPollDraft } from "@/lib/ai/poll-assist";
import { checkRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { exceedsRequestSize } from "@/lib/request-size";
import { isTrustedWriteRequest } from "@/lib/trusted-request";

const TITLE_MAX_LENGTH = 200;
const CATEGORY_MAX_LENGTH = 40;
const OPTION_MAX_LENGTH = 120;
const OPTION_MAX_COUNT = 10;

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

export async function POST(request: NextRequest) {
  try {
    if (!isTrustedWriteRequest(request)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }

    if (exceedsRequestSize(request, 12_000)) {
      return NextResponse.json({ error: "Request body too large." }, { status: 413 });
    }

    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Please sign in to use AI improve." }, { status: 401 });
    }

    const limiter = await checkRateLimit({
      key: `poll-improve:${user.id}:${readClientIp(request)}`,
      limit: 20,
      windowMs: 10 * 60 * 1000
    });

    if (!limiter.allowed) {
      return NextResponse.json(
        { error: "Too many improve requests. Please wait a few minutes and try again." },
        {
          status: 429,
          headers: {
            "Retry-After": String(limiter.retryAfterSec)
          }
        }
      );
    }

    const body = await request.json();
    const title = String(body?.title ?? "").trim();
    const category = String(body?.category ?? "")
      .trim()
      .slice(0, CATEGORY_MAX_LENGTH);
    const options = Array.isArray(body?.options)
      ? body.options
          .slice(0, OPTION_MAX_COUNT)
          .map((item: unknown) => String(item ?? "").trim().slice(0, OPTION_MAX_LENGTH))
          .filter(Boolean)
      : [];

    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    if (title.length > TITLE_MAX_LENGTH) {
      return NextResponse.json(
        { error: `Title must be ${TITLE_MAX_LENGTH} characters or fewer.` },
        { status: 400 }
      );
    }

    const improved = await assistPollDraft({ title, category, options });
    return NextResponse.json(improved);
  } catch {
    return NextResponse.json({ error: "Could not improve poll draft." }, { status: 500 });
  }
}
