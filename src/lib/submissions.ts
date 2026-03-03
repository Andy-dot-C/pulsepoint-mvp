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
