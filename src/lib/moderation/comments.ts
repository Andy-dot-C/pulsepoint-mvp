import "server-only";

export type CommentModerationResult = {
  action: "allow" | "block";
  reason?: string;
};

const PROFANITY_TERMS = [
  "fuck",
  "fucking",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "cunt",
  "motherfucker",
  "wanker",
  "twat"
];

const HATE_OR_SLUR_TERMS = [
  "nigger",
  "nigga",
  "faggot",
  "kike",
  "paki",
  "spic",
  "chink",
  "raghead",
  "tranny"
];

const THREAT_PATTERNS = [/\bkill\s+you\b/i, /\bshould\s+die\b/i, /\bi[' ]?ll\s+hurt\s+you\b/i];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsTerm(input: string, terms: string[]): boolean {
  const haystack = ` ${normalize(input)} `;
  return terms.some((term) => haystack.includes(` ${term} `));
}

function heuristicModeration(input: string): CommentModerationResult {
  if (containsTerm(input, HATE_OR_SLUR_TERMS)) {
    return { action: "block", reason: "hateful language" };
  }

  if (containsTerm(input, PROFANITY_TERMS)) {
    return { action: "block", reason: "profanity" };
  }

  if (THREAT_PATTERNS.some((pattern) => pattern.test(input))) {
    return { action: "block", reason: "threatening language" };
  }

  return { action: "allow" };
}

export async function moderateComment(input: string): Promise<CommentModerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return heuristicModeration(input);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "omni-moderation-latest",
        input
      })
    });

    if (!response.ok) {
      return heuristicModeration(input);
    }

    const payload = await response.json();
    const result = payload?.results?.[0];
    const categories = result?.categories ?? {};
    const flagged = Boolean(result?.flagged);

    const severe =
      categories.hate ||
      categories["hate/threatening"] ||
      categories.harassment ||
      categories["harassment/threatening"] ||
      categories.violence ||
      categories["violence/graphic"] ||
      categories.sexual ||
      categories["sexual/minors"] ||
      categories.self_harm;

    if (flagged && severe) {
      return { action: "block", reason: "unsafe content" };
    }

    return heuristicModeration(input);
  } catch {
    return heuristicModeration(input);
  }
}
