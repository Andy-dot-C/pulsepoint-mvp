import { CategoryKey } from "@/lib/types";

export const TITLE_MAX_LENGTH = 200;
export const SUMMARY_MAX_LENGTH = 500;
export const OPTION_MAX_LENGTH = 120;
export const OPTION_MIN_COUNT = 2;
export const OPTION_MAX_COUNT = 10;

export const VALID_CATEGORIES: CategoryKey[] = [
  "politics",
  "sport",
  "entertainment",
  "business",
  "technology"
];

export function normalizeOption(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function parseOptions(values: FormDataEntryValue[]): string[] {
  const unique = new Set<string>();

  values
    .map((value) => normalizeOption(String(value ?? "")))
    .filter(Boolean)
    .forEach((value) => unique.add(value));

  return Array.from(unique);
}

export function optionsExceedLength(options: string[]): boolean {
  return options.some((option) => option.length > OPTION_MAX_LENGTH);
}

export function isCategory(value: string): value is CategoryKey {
  return VALID_CATEGORIES.includes(value as CategoryKey);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function clampFutureDate(date: string | null): string | null {
  if (!date) return null;
  const parsed = Date.parse(date);
  if (Number.isNaN(parsed)) return null;
  if (parsed <= Date.now()) return null;
  return new Date(parsed).toISOString();
}

export function defaultEndDate(days = 30): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export function sanitizeText(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

const CATEGORY_KEYWORDS: Record<CategoryKey, string[]> = {
  politics: [
    "election",
    "vote",
    "voting",
    "parliament",
    "congress",
    "senate",
    "government",
    "policy",
    "tax",
    "immigration",
    "president",
    "prime minister",
    "labour",
    "conservative",
    "democrat",
    "republican",
    "eu",
    "nhs",
    "border",
    "tariff"
  ],
  sport: [
    "football",
    "soccer",
    "premier league",
    "champions league",
    "f1",
    "formula 1",
    "race",
    "referee",
    "var",
    "goal",
    "match",
    "tournament",
    "nba",
    "nfl",
    "mlb"
  ],
  entertainment: [
    "film",
    "movie",
    "series",
    "show",
    "music",
    "album",
    "actor",
    "actress",
    "celebrity",
    "netflix",
    "oscar",
    "grammy"
  ],
  business: [
    "market",
    "economy",
    "salary",
    "wage",
    "company",
    "startup",
    "profit",
    "cost",
    "price",
    "inflation",
    "housing",
    "mortgage",
    "work week",
    "remote work"
  ],
  technology: [
    "ai",
    "artificial intelligence",
    "tech",
    "software",
    "app",
    "platform",
    "social media",
    "algorithm",
    "data",
    "cyber",
    "privacy",
    "device",
    "robot"
  ]
};

export function inferCategoryFromPollContent(input: {
  title: string;
  options: string[];
  summary?: string;
}): CategoryKey {
  const haystack = `${input.title} ${input.options.join(" ")} ${input.summary ?? ""}`.toLowerCase();
  const scores: Record<CategoryKey, number> = {
    politics: 0,
    sport: 0,
    entertainment: 0,
    business: 0,
    technology: 0
  };

  (Object.keys(CATEGORY_KEYWORDS) as CategoryKey[]).forEach((category) => {
    CATEGORY_KEYWORDS[category].forEach((keyword) => {
      if (haystack.includes(keyword)) {
        scores[category] += 1;
      }
    });
  });

  let bestCategory: CategoryKey = "technology";
  let bestScore = 0;
  (Object.keys(scores) as CategoryKey[]).forEach((category) => {
    if (scores[category] > bestScore) {
      bestCategory = category;
      bestScore = scores[category];
    }
  });

  return bestCategory;
}

export function generateFallbackSummary(title: string): string {
  const cleanTitle = title.replace(/\?+$/, "").trim();
  if (!cleanTitle) {
    return "Vote on this poll and see how community opinion changes in real time.";
  }
  return `Vote on "${cleanTitle}" and track how the community breaks down across each option.`;
}
