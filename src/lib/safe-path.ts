export function sanitizeInternalPath(
  value: string | null | undefined,
  fallback = "/"
): string {
  if (!value) return fallback;
  const normalized = value.trim();

  if (
    !normalized.startsWith("/") ||
    normalized.startsWith("//") ||
    normalized.includes("\\") ||
    normalized.includes("\u0000")
  ) {
    return fallback;
  }

  return normalized;
}
