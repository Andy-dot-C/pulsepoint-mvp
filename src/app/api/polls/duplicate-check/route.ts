import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseOptions } from "@/lib/submissions";
import { findPossibleDuplicates } from "@/lib/duplicate-check";

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

export async function POST(request: Request) {
  let payload: RequestPayload | null = null;
  try {
    payload = (await request.json()) as RequestPayload;
  } catch {
    return NextResponse.json({ ok: false, matches: [] }, { status: 400 });
  }

  const title = String(payload?.title ?? "").trim();
  const options = parseOptions((payload?.options ?? []).map((item) => String(item)));

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
