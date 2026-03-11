import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { trackPollEvent, type PollEventType } from "@/lib/analytics/events";
import { checkRateLimit } from "@/lib/rate-limit";
import { exceedsRequestSize } from "@/lib/request-size";
import { isTrustedWriteRequest } from "@/lib/trusted-request";

type RequestPayload = {
  pollId?: string;
  eventType?: PollEventType;
  source?: string;
  metadata?: Record<string, unknown>;
};

const PUBLIC_EVENT_TYPES = new Set<PollEventType>(["poll_impression", "poll_view", "poll_share"]);
const POLL_ID_PATTERN = /^[A-Za-z0-9-]{1,80}$/;

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

function sanitizeMetadata(metadata: unknown): Record<string, string | number | boolean | null> | undefined {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return undefined;
  }

  const output: Record<string, string | number | boolean | null> = {};
  const entries = Object.entries(metadata as Record<string, unknown>).slice(0, 12);
  entries.forEach(([rawKey, rawValue]) => {
    const key = rawKey.trim().slice(0, 64);
    if (!key) return;

    if (
      typeof rawValue === "string" ||
      typeof rawValue === "number" ||
      typeof rawValue === "boolean"
    ) {
      output[key] = typeof rawValue === "string" ? rawValue.slice(0, 300) : rawValue;
      return;
    }

    if (rawValue === null) {
      output[key] = null;
    }
  });

  return Object.keys(output).length > 0 ? output : undefined;
}

export async function POST(request: NextRequest) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  if (exceedsRequestSize(request, 12_000)) {
    return NextResponse.json({ ok: false }, { status: 413 });
  }

  let payload: RequestPayload | null = null;
  try {
    payload = (await request.json()) as RequestPayload;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const pollId = String(payload?.pollId ?? "").trim();
  const eventType = payload?.eventType;
  if (!pollId || !POLL_ID_PATTERN.test(pollId) || !eventType || !PUBLIC_EVENT_TYPES.has(eventType)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ip = readClientIp(request);
  const limiter = await checkRateLimit({
    key: `poll-events:${ip}`,
    limit: 240,
    windowMs: 10 * 60 * 1000
  });
  if (!limiter.allowed) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  await trackPollEvent({
    pollId,
    userId: user?.id ?? null,
    eventType,
    source: sanitizeSource(payload?.source),
    metadata: sanitizeMetadata(payload?.metadata)
  });

  return NextResponse.json({ ok: true });
}
