export function formatVoteLabel(value: number): string {
  const rounded = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  return `${rounded.toLocaleString()} ${rounded === 1 ? "vote" : "votes"}`;
}

export function formatTotalVoteLabel(value: number): string {
  return `${formatVoteLabel(value)} total`;
}
