import { CategoryKey } from "@/lib/types";

const SENSITIVE_CATEGORIES: CategoryKey[] = ["politics"];

const LOADED_PHRASES = [
  "obviously",
  "clearly",
  "only an idiot",
  "real patriots",
  "must",
  "everyone knows"
];

export function hasLoadedWording(value: string): boolean {
  const lower = value.toLowerCase();
  return LOADED_PHRASES.some((phrase) => lower.includes(phrase));
}

export function shouldRequireModeration(input: {
  category: CategoryKey;
  title: string;
  blurb: string;
  description: string;
}): boolean {
  if (SENSITIVE_CATEGORIES.includes(input.category)) {
    return true;
  }

  return [input.title, input.blurb, input.description].some(hasLoadedWording);
}
