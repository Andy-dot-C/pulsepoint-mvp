import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseOptions } from "@/lib/submissions";
import { findPossibleDuplicates } from "@/lib/duplicate-check";
import { checkRateLimit } from "@/lib/rate-limit";
import { exceedsRequestSize } from "@/lib/request-size";
import { isTrustedWriteRequest } from "@/lib/trusted-request";

type RequestPayload = {
  title?: string;
  options?: string[];
};

type PollRow = {
  id: string;
  slug: string;
  title: string;
};

type PollOptionRow = {
  poll_id: string;
  label: string;
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

export async function POST(request: NextRequest) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ ok: false, matches: [] }, { status: 403 });
  }

  if (exceedsRequestSize(request, 8_000)) {
    return NextResponse.json({ ok: false, matches: [] }, { status: 413 });
  }

  const limiter = await checkRateLimit({
    key: `duplicate-check:${readClientIp(request)}`,
    limit: 80,
    windowMs: 10 * 60 * 1000
  });
  if (!limiter.allowed) {
    return NextResponse.json({ ok: false, matches: [] }, { status: 429 });
  }

  let payload: RequestPayload | null = null;
  try {
    payload = (await request.json()) as RequestPayload;
  } catch {
    return NextResponse.json({ ok: false, matches: [] }, { status: 400 });
  }

  const title = String(payload?.title ?? "")
    .trim()
    .slice(0, 200);
  const options = parseOptions(
    (payload?.options ?? [])
      .slice(0, 10)
      .map((item) => String(item).trim().slice(0, 120))
  );

  if (!title || options.length < 2) {
    return NextResponse.json({ ok: true, matches: [] });
  }

  const supabase = await createClient();
  const { data: candidatePollRowsData, error: pollError } = await supabase
    .from("polls")
    .select("id,slug,title")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(300);

  if (pollError) {
    return NextResponse.json({ ok: false, matches: [] }, { status: 500 });
  }

  const candidatePollRows = (candidatePollRowsData ?? []) as PollRow[];
  if (candidatePollRows.length === 0) {
    return NextResponse.json({ ok: true, matches: [] });
  }

  const candidatePollIds = candidatePollRows.map((item) => item.id);
  const { data: candidateOptionRowsData, error: optionError } = await supabase
    .from("poll_options")
    .select("poll_id,label")
    .in("poll_id", candidatePollIds);

  if (optionError) {
    return NextResponse.json({ ok: false, matches: [] }, { status: 500 });
  }

  const candidateOptionRows = (candidateOptionRowsData ?? []) as PollOptionRow[];
  const matches = findPossibleDuplicates(title, options, candidatePollRows, candidateOptionRows);
  return NextResponse.json({ ok: true, matches });
}
