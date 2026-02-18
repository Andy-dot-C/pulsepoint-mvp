import { NextResponse } from "next/server";
import { assistPollDraft } from "@/lib/ai/poll-assist";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = String(body?.title ?? "").trim();
    const category = String(body?.category ?? "").trim();
    const options = Array.isArray(body?.options) ? body.options.map((item: unknown) => String(item ?? "")) : [];

    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    const improved = await assistPollDraft({ title, category, options });
    return NextResponse.json(improved);
  } catch {
    return NextResponse.json({ error: "Could not improve poll draft." }, { status: 500 });
  }
}
