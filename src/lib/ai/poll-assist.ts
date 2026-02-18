import "server-only";

export type OptionChange = {
  from: string;
  to: string;
};

export type PollAssistResult = {
  title: string;
  blurb: string;
  description: string;
  options: string[];
  optionChanges: OptionChange[];
};

function ensureQuestion(title: string): string {
  const clean = title.trim().replace(/\s+/g, " ");
  if (!clean) return "";
  if (clean.endsWith("?")) return clean;
  return `${clean}?`;
}

function neutralizeTitle(title: string): string {
  let value = ensureQuestion(title);
  value = value
    .replace(/\b(obviously|clearly|must|definitely|everyone\s+knows)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return ensureQuestion(value);
}

function cleanOptions(options: string[]): string[] {
  const unique = new Set<string>();
  options
    .map((option) => option.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .forEach((option) => unique.add(option));
  return Array.from(unique).slice(0, 10);
}

const COMMON_OPTION_TYPOS: Record<string, string> = {
  "barak obama": "Barack Obama",
  "barrack obama": "Barack Obama",
  "barrak obama": "Barack Obama",
  "barack obma": "Barack Obama",
  "barack obam": "Barack Obama",
  renalso: "Ronaldo",
  ronadlo: "Ronaldo",
  ronalod: "Ronaldo",
  mesi: "Messi",
  mesii: "Messi",
  "taylor swfit": "Taylor Swift"
};

const KNOWN_ENTITIES = [
  "Barack Obama",
  "Donald Trump",
  "Joe Biden",
  "Kamala Harris",
  "Rishi Sunak",
  "Keir Starmer",
  "Taylor Swift",
  "Lionel Messi",
  "Cristiano Ronaldo"
];

function normalizeForMatch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array.from({ length: b.length + 1 }, () => 0)
  );
  for (let i = 0; i <= a.length; i += 1) dp[i]![0] = i;
  for (let j = 0; j <= b.length; j += 1) dp[0]![j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(dp[i - 1]![j]! + 1, dp[i]![j - 1]! + 1, dp[i - 1]![j - 1]! + cost);
    }
  }
  return dp[a.length]![b.length]!;
}

function maybeCorrectToKnownEntity(option: string): string {
  const normalized = normalizeForMatch(option);
  if (!normalized || normalized.length < 5) return option;

  let best = option;
  let bestDistance = Number.MAX_SAFE_INTEGER;

  for (const entity of KNOWN_ENTITIES) {
    const distance = levenshtein(normalized, normalizeForMatch(entity));
    if (distance < bestDistance) {
      bestDistance = distance;
      best = entity;
    }
  }

  const threshold = Math.max(1, Math.floor(normalized.length * 0.22));
  return bestDistance <= threshold ? best : option;
}

function correctCommonOptionTypos(options: string[]): { options: string[]; optionChanges: OptionChange[] } {
  const optionChanges: OptionChange[] = [];
  const corrected = options.map((option) => {
    const normalized = normalizeForMatch(option);
    const correctedByMap = COMMON_OPTION_TYPOS[normalized];
    const candidate = correctedByMap ?? maybeCorrectToKnownEntity(option);

    if (candidate !== option) {
      optionChanges.push({ from: option, to: candidate });
    }

    return candidate;
  });

  return { options: corrected, optionChanges };
}

function appendOptionChanges(base: OptionChange[], next: OptionChange[]): OptionChange[] {
  const seen = new Set(base.map((change) => `${change.from}=>${change.to}`));
  const out = [...base];
  for (const change of next) {
    const key = `${change.from}=>${change.to}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(change);
    }
  }
  return out;
}

function heuristicAssist(input: {
  title: string;
  category: string;
  options: string[];
}): PollAssistResult {
  const title = neutralizeTitle(input.title);
  const corrected = correctCommonOptionTypos(input.options);
  const options = cleanOptions(corrected.options);
  const topic = title.replace(/\?$/, "");

  return {
    title,
    blurb: `A neutral community poll about ${topic.toLowerCase()}.`,
    description:
      `This poll gathers opinion on ${topic.toLowerCase()} across PulsePoint users. ` +
      `Votes are anonymous and results update in real time as participation grows.`,
    options,
    optionChanges: corrected.optionChanges
  };
}

export async function assistPollDraft(input: {
  title: string;
  category: string;
  options: string[];
}): Promise<PollAssistResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return heuristicAssist(input);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        input: [
          {
            role: "system",
            content:
              "You rewrite polls to neutral wording and generate concise blurb/description. Keep politically and socially neutral framing, avoid persuasive language, and preserve intended names/entities and user meaning. Fix obvious spelling mistakes in options without changing intent. Return strict JSON with keys: title, blurb, description, options. No extra text."
          },
          {
            role: "user",
            content: JSON.stringify(input)
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "poll_assist",
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string" },
                blurb: { type: "string" },
                description: { type: "string" },
                options: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 2,
                  maxItems: 10
                }
              },
              required: ["title", "blurb", "description", "options"]
            }
          }
        }
      })
    });

    if (!response.ok) {
      return heuristicAssist(input);
    }

    const payload = await response.json();
    const text = payload?.output_text;
    if (!text) {
      return heuristicAssist(input);
    }

    const parsed = JSON.parse(text);
    const aiOptions = Array.isArray(parsed.options) ? parsed.options.map(String) : input.options;
    const corrected = correctCommonOptionTypos(aiOptions);

    return {
      title: ensureQuestion(String(parsed.title ?? input.title)),
      blurb: String(parsed.blurb ?? "").trim(),
      description: String(parsed.description ?? "").trim(),
      options: cleanOptions(corrected.options),
      optionChanges: appendOptionChanges([], corrected.optionChanges)
    };
  } catch {
    return heuristicAssist(input);
  }
}
