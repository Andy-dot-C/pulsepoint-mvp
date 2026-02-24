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

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(input) {
  const copy = [...input];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildVoteDistribution(optionCount, totalVotes) {
  const weights = Array.from({ length: optionCount }, () => Math.random() + 0.2);
  const weightSum = weights.reduce((sum, value) => sum + value, 0);
  const counts = weights.map((weight) => Math.floor((weight / weightSum) * totalVotes));
  let assigned = counts.reduce((sum, value) => sum + value, 0);
  while (assigned < totalVotes) {
    counts[randomInt(0, optionCount - 1)] += 1;
    assigned += 1;
  }
  return counts;
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
    slug: "should-the-uk-lower-the-voting-age-to-16-for-all-general-elections",
    title: "Lower UK voting age to 16?",
    blurb: "A recurring Westminster topic with broad impact on turnout and civic education.",
    description:
      "Parliament periodically revisits voting age reform. This poll tracks how sentiment shifts as party leaders and MPs debate democratic participation for younger voters.",
    category_key: "politics",
    options: ["Yes", "No"],
    endDays: 30,
    voteRange: [120, 220]
  },
  {
    slug: "should-mps-be-banned-from-taking-second-jobs-while-they-are-in-elected-office",
    title: "Ban MPs from second jobs?",
    blurb: "A governance and trust issue with strong public interest.",
    description:
      "This poll measures sentiment on conflict-of-interest concerns and whether full-time representation should exclude outside employment.",
    category_key: "politics",
    options: ["Yes, ban second jobs", "Allow with strict limits", "No ban needed"],
    endDays: 30,
    voteRange: [80, 180]
  },
  {
    slug: "who-should-win-the-oscar-for-best-actor-this-year-based-on-performance-alone",
    title: "Who wins Best Actor at Oscars?",
    blurb: "Public sentiment before awards night often diverges from industry voters.",
    description:
      "Tracks fan preference and momentum as campaigns, interviews, and critic reactions shape mainstream opinion.",
    category_key: "entertainment",
    options: ["Adrien Brody", "Cillian Murphy", "Timothee Chalamet", "Paul Mescal", "Colman Domingo"],
    endDays: 30,
    voteRange: [60, 150]
  },
  {
    slug: "who-is-the-greatest-premier-league-midfielder-of-all-time-when-impact-and-trophies-are-both-considered",
    title: "Greatest Premier League midfielder ever?",
    blurb: "Legacy debates drive high engagement across football communities.",
    description:
      "A broad sports poll designed for repeat participation and social sharing as fans compare eras and achievements.",
    category_key: "sport",
    options: ["Steven Gerrard", "Kevin De Bruyne", "Frank Lampard", "Patrick Vieira", "Roy Keane"],
    endDays: 30,
    voteRange: [110, 260]
  },
  {
    slug: "should-museums-return-contested-artifacts-to-their-countries-of-origin-when-formal-claims-are-made",
    title: "Return contested artifacts to origin countries?",
    blurb: "Culture policy with ethical, legal, and historical dimensions.",
    description:
      "Captures opinion on restitution debates and how institutions should balance preservation, access, and ownership claims.",
    category_key: "culture",
    options: ["Yes, return them", "Case-by-case", "No, keep them"],
    endDays: 30,
    voteRange: [40, 120]
  },
  {
    slug: "hot-take-a-four-day-work-week-should-be-the-default-in-most-industries-by-2030",
    title: "Should four-day work week be default?",
    blurb: "A high-contrast opinion poll on productivity and quality of life.",
    description:
      "Measures appetite for major labor model changes and whether people see reduced work weeks as realistic at scale.",
    category_key: "hot-takes",
    options: ["Agree", "Disagree", "Unsure"],
    endDays: 30,
    voteRange: [70, 170]
  },
  {
    slug: "should-social-media-platforms-be-required-to-label-ai-generated-political-content-before-uk-elections",
    title: "Label AI political content before elections?",
    blurb: "Election integrity and online transparency are becoming tightly linked in policy debate.",
    description:
      "This poll gauges whether mandatory labeling of AI-generated campaign media is seen as necessary to prevent manipulation and misinformation.",
    category_key: "politics",
    options: ["Yes, mandatory labels", "Only for paid ads", "No additional regulation"],
    endDays: 20,
    voteRange: [90, 190]
  },
  {
    slug: "which-club-is-best-positioned-to-win-the-next-champions-league-based-on-current-squad-strength",
    title: "Who wins next Champions League?",
    blurb: "A football sentiment poll combining present form with long-term depth.",
    description:
      "Captures fan confidence around elite European clubs heading into knockout rounds and compares how narratives shift over time.",
    category_key: "sport",
    options: ["Manchester City", "Real Madrid", "Bayern Munich", "Arsenal", "Inter Milan"],
    endDays: 25,
    voteRange: [85, 210]
  },
  {
    slug: "should-streaming-platforms-release-major-shows-weekly-instead-of-dropping-full-seasons-at-once",
    title: "Weekly episodes or full-season drops?",
    blurb: "Release strategy heavily impacts conversation cycles and audience retention.",
    description:
      "This poll tracks whether viewers prefer weekly episodes for shared discussion or binge releases for convenience.",
    category_key: "entertainment",
    options: ["Weekly release", "Full season drop", "Hybrid model"],
    endDays: 18,
    voteRange: [45, 130]
  },
  {
    slug: "should-uk-cities-pedestrianise-more-central-high-streets-even-if-it-reduces-car-access",
    title: "Pedestrianise more city high streets?",
    blurb: "Urban planning trade-offs split opinions between livability and convenience.",
    description:
      "Measures sentiment around cleaner city centers, local business effects, and practical travel concerns.",
    category_key: "culture",
    options: ["Yes, strongly", "Yes, with exceptions", "No, keep current access"],
    endDays: 35,
    voteRange: [30, 100]
  },
  {
    slug: "hot-take-university-tuition-should-be-replaced-with-graduate-tax-over-a-fixed-income-threshold",
    title: "Replace tuition with graduate tax?",
    blurb: "A provocative education funding model with long-run economic implications.",
    description:
      "Evaluates whether a graduate tax model is viewed as fairer than upfront tuition debt while preserving university quality.",
    category_key: "hot-takes",
    options: ["Support", "Oppose", "Need more detail"],
    endDays: 30,
    voteRange: [25, 90]
  },
  {
    slug: "should-parliament-votes-on-major-constitutional-reform-require-a-national-referendum-to-be-ratified",
    title: "Major reforms need referendums?",
    blurb: "Constitutional legitimacy debates often hinge on direct public mandate.",
    description:
      "Tracks appetite for direct-democracy safeguards when long-term constitutional changes are proposed.",
    category_key: "politics",
    options: ["Yes, always", "Only for major reforms", "No, parliamentary vote is enough"],
    endDays: 28,
    voteRange: [12, 45]
  }
];

async function ensureDemoProfiles(targetCount) {
  const { data: existingRows, error: existingError } = await supabase
    .from("profiles")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1000);

  if (existingError) {
    throw new Error(`Failed reading profiles: ${existingError.message}`);
  }

  let profileIds = (existingRows ?? []).map((row) => row.id);
  const missing = Math.max(0, targetCount - profileIds.length);
  if (missing === 0) {
    return profileIds;
  }

  for (let i = 0; i < missing; i += 1) {
    const suffix = String(i + 1).padStart(3, "0");
    const email = `demo.seed.${suffix}@pulsepoint.local`;
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: `DemoSeed!${suffix}x`,
      email_confirm: true,
      user_metadata: { seed: "poll-demo" }
    });

    if (error) {
      if (!error.message.toLowerCase().includes("already registered")) {
        throw new Error(`Failed creating demo user ${email}: ${error.message}`);
      }
      continue;
    }

    if (data?.user?.id) {
      profileIds.push(data.user.id);
    }
  }

  const { data: refreshedRows, error: refreshError } = await supabase
    .from("profiles")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1000);

  if (refreshError) {
    throw new Error(`Failed re-reading profiles: ${refreshError.message}`);
  }

  profileIds = (refreshedRows ?? []).map((row) => row.id);
  return profileIds;
}

async function seedVotesForPoll({ pollId, optionRows, voteRange, profileIds }) {
  const [minVotes, maxVotes] = voteRange;
  const targetVotes = randomInt(minVotes, maxVotes);
  const availableVoters = shuffle(profileIds).slice(0, Math.min(targetVotes, profileIds.length));
  const distribution = buildVoteDistribution(optionRows.length, availableVoters.length);

  const voteRows = [];
  let cursor = 0;
  for (let optionIndex = 0; optionIndex < optionRows.length; optionIndex += 1) {
    const count = distribution[optionIndex];
    for (let i = 0; i < count; i += 1) {
      const userId = availableVoters[cursor];
      cursor += 1;
      if (!userId) continue;
      voteRows.push({
        poll_id: pollId,
        option_id: optionRows[optionIndex].id,
        user_id: userId
      });
    }
  }

  const { error: clearVotesError } = await supabase.from("votes").delete().eq("poll_id", pollId);
  if (clearVotesError) {
    throw new Error(`Failed clearing votes for poll ${pollId}: ${clearVotesError.message}`);
  }

  for (let i = 0; i < voteRows.length; i += 500) {
    const chunk = voteRows.slice(i, i + 500);
    const { error: voteInsertError } = await supabase.from("votes").insert(chunk);
    if (voteInsertError) {
      throw new Error(`Failed inserting votes for poll ${pollId}: ${voteInsertError.message}`);
    }
  }

  return voteRows.length;
}

const profileIds = await ensureDemoProfiles(260);
if (profileIds.length < 20) {
  throw new Error("Not enough profiles to seed varied vote totals.");
}

for (const poll of seed) {
  const slug = poll.slug ?? slugify(poll.title);
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

  const { error: deleteEventsErr } = await supabase.from("vote_events").delete().eq("poll_id", pollId);
  if (deleteEventsErr) {
    throw new Error(`Vote events cleanup failed for ${poll.title}: ${deleteEventsErr.message}`);
  }

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

  const { data: optionRows, error: optionRowsError } = await supabase
    .from("poll_options")
    .select("id,label")
    .eq("poll_id", pollId)
    .order("position", { ascending: true });

  if (optionRowsError || !optionRows) {
    throw new Error(`Failed reading options for ${poll.title}: ${optionRowsError?.message ?? "unknown error"}`);
  }

  const votesInserted = await seedVotesForPoll({
    pollId,
    optionRows,
    voteRange: poll.voteRange,
    profileIds
  });

  console.log(`Seeded: ${poll.title} (${votesInserted} demo votes)`);
}

console.log("Seeding complete.");
