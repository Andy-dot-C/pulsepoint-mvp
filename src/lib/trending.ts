const TRENDING_PERCENTILE = 0.2;
const TRENDING_MIN_VOTES_24H = 10;
const TRENDING_FALLBACK_COUNT = 5;

export function selectTrendingPollIds(velocityByPollId: Map<string, number>): Set<string> {
  const ranked = Array.from(velocityByPollId.entries()).sort((left, right) => right[1] - left[1]);
  if (ranked.length === 0) {
    return new Set();
  }

  const topBucketSize = Math.max(1, Math.ceil(ranked.length * TRENDING_PERCENTILE));
  const thresholdMatches = ranked
    .slice(0, topBucketSize)
    .filter(([, votes24h]) => votes24h >= TRENDING_MIN_VOTES_24H);

  if (thresholdMatches.length > 0) {
    return new Set(thresholdMatches.map(([pollId]) => pollId));
  }

  return new Set(ranked.slice(0, TRENDING_FALLBACK_COUNT).map(([pollId]) => pollId));
}

