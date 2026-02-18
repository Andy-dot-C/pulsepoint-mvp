import { CategoryKey } from "@/lib/types";

export const VALID_CATEGORIES: CategoryKey[] = [
  "politics",
  "sport",
  "entertainment",
  "culture",
  "hot-takes"
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
  return new Date(parsed).toISOString();
}

export function defaultEndDate(days = 30): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export function sanitizeText(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

export function deriveBlurb(description: string, fallbackTitle: string): string {
  const source = description.trim() || fallbackTitle.trim();
  if (!source) return "Community opinion poll.";
  if (source.length <= 120) return source;
  return `${source.slice(0, 117).trimEnd()}...`;
}
