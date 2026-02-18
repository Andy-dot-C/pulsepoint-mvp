import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function parseEnvFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const entries = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx), line.slice(idx + 1)];
    });

  return Object.fromEntries(entries);
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const envPath = path.join(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  throw new Error(".env.local not found in project root");
}

const env = parseEnvFile(envPath);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
}

const supabase = createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });

const seed = [
  {
    title: "Should the UK lower the voting age to 16?",
    blurb: "A recurring Westminster topic with broad impact on turnout and civic education.",
    description:
      "Parliament periodically revisits voting age reform. This poll tracks how sentiment shifts as party leaders and MPs debate democratic participation for younger voters.",
    category_key: "politics",
    options: ["Yes", "No"],
    endDays: 30
  },
  {
    title: "Should MPs be banned from second jobs while in office?",
    blurb: "A governance and trust issue with strong public interest.",
    description:
      "This poll measures sentiment on conflict-of-interest concerns and whether full-time representation should exclude outside employment.",
    category_key: "politics",
    options: ["Yes, ban second jobs", "Allow with strict limits", "No ban needed"],
    endDays: 30
  },
  {
    title: "Who should win Best Actor at the Oscars?",
    blurb: "Public sentiment before awards night often diverges from industry voters.",
    description:
      "Tracks fan preference and momentum as campaigns, interviews, and critic reactions shape mainstream opinion.",
    category_key: "entertainment",
    options: ["Candidate A", "Candidate B", "Candidate C"],
    endDays: 30
  },
  {
    title: "Greatest Premier League midfielder of all time?",
    blurb: "Legacy debates drive high engagement across football communities.",
    description:
      "A broad sports poll designed for repeat participation and social sharing as fans compare eras and achievements.",
    category_key: "sport",
    options: ["Player A", "Player B", "Player C"],
    endDays: 30
  },
  {
    title: "Should museums return contested artifacts to their country of origin?",
    blurb: "Culture policy with ethical, legal, and historical dimensions.",
    description:
      "Captures opinion on restitution debates and how institutions should balance preservation, access, and ownership claims.",
    category_key: "culture",
    options: ["Yes, return them", "Case-by-case", "No, keep them"],
    endDays: 30
  },
  {
    title: "Hot take: four-day work week should be the norm by 2030",
    blurb: "A high-contrast opinion poll on productivity and quality of life.",
    description:
      "Measures appetite for major labor model changes and whether people see reduced work weeks as realistic at scale.",
    category_key: "hot-takes",
    options: ["Agree", "Disagree", "Unsure"],
    endDays: 30
  }
];

for (const poll of seed) {
  const slug = slugify(poll.title);
  const endAt = new Date(Date.now() + poll.endDays * 24 * 60 * 60 * 1000).toISOString();

  const { data: pollRow, error: pollErr } = await supabase
    .from("polls")
    .upsert(
      {
        slug,
        title: poll.title,
        blurb: poll.blurb,
        description: poll.description,
        category_key: poll.category_key,
        status: "published",
        source_type: "admin_seed",
        start_at: new Date().toISOString(),
        end_at: endAt
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (pollErr) {
    throw new Error(`Poll upsert failed for ${poll.title}: ${pollErr.message}`);
  }

  const pollId = pollRow.id;

  const { error: deleteErr } = await supabase.from("poll_options").delete().eq("poll_id", pollId);
  if (deleteErr) {
    throw new Error(`Option cleanup failed for ${poll.title}: ${deleteErr.message}`);
  }

  const optionsPayload = poll.options.map((label, idx) => ({
    poll_id: pollId,
    label,
    position: idx + 1
  }));

  const { error: optErr } = await supabase.from("poll_options").insert(optionsPayload);
  if (optErr) {
    throw new Error(`Options insert failed for ${poll.title}: ${optErr.message}`);
  }

  console.log(`Seeded: ${poll.title}`);
}

console.log("Seeding complete.");
