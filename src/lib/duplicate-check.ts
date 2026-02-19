type CandidatePoll = {
  id: string;
  slug: string;
  title: string;
};

type DuplicateMatch = {
  pollId: string;
  slug: string;
  title: string;
  score: number;
};

type CandidateOption = {
  poll_id: string;
  label: string;
};

function tokenize(value: string): string[] {
  const STOP_WORDS = new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "best",
    "by",
    "did",
    "do",
    "does",
    "favorite",
    "favourite",
    "for",
    "from",
    "how",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "should",
    "that",
    "the",
    "their",
    "them",
    "these",
    "they",
    "this",
    "to",
    "want",
    "what",
    "when",
    "where",
    "which",
    "who",
    "why",
    "will",
    "win",
    "with",
    "would",
    "your"
  ]);

  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 0)
    .filter((token) => /^\d+$/.test(token) || token.length >= 3)
    .filter((token) => !STOP_WORDS.has(token));
}

function jaccard(left: string[], right: string[]): number {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const union = new Set([...leftSet, ...rightSet]);
  if (union.size === 0) return 0;
  let intersection = 0;
  for (const token of leftSet) {
    if (rightSet.has(token)) intersection += 1;
  }
  return intersection / union.size;
}

export function findPossibleDuplicates(
  title: string,
  options: string[],
  candidatePolls: CandidatePoll[],
  candidateOptions: CandidateOption[]
): DuplicateMatch[] {
  const candidateOptionsByPollId = new Map<string, string[]>();
  candidateOptions.forEach((item) => {
    const existing = candidateOptionsByPollId.get(item.poll_id) ?? [];
    existing.push(item.label);
    candidateOptionsByPollId.set(item.poll_id, existing);
  });

  const currentTitleTokens = tokenize(title);
  const currentOptionTokens = tokenize(options.join(" "));

  return candidatePolls
    .map((candidate) => {
      const candidateTitleTokens = tokenize(candidate.title);
      const candidateOptionTokens = tokenize((candidateOptionsByPollId.get(candidate.id) ?? []).join(" "));
      const titleScore = jaccard(currentTitleTokens, candidateTitleTokens);
      const optionScore = jaccard(currentOptionTokens, candidateOptionTokens);
      const score = titleScore * 0.75 + optionScore * 0.25;
      return {
        pollId: candidate.id,
        slug: candidate.slug,
        title: candidate.title,
        score,
        titleScore
      };
    })
    .filter((item) => item.score >= 0.18 || item.titleScore >= 0.25)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ pollId, slug, title, score }) => ({ pollId, slug, title, score }));
}
