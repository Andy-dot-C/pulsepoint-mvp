type Bucket = {
  count: number;
  resetAt: number;
};

type CheckRateLimitInput = {
  key: string;
  limit: number;
  windowMs: number;
};

type CheckRateLimitResult =
  | {
      allowed: true;
      remaining: number;
      resetAt: number;
    }
  | {
      allowed: false;
      remaining: 0;
      retryAfterSec: number;
      resetAt: number;
    };

const buckets = new Map<string, Bucket>();
let lastCleanupAt = 0;

function cleanupExpiredBuckets(now: number): void {
  if (now - lastCleanupAt < 60_000) return;
  lastCleanupAt = now;

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function checkRateLimitInMemory(input: CheckRateLimitInput): CheckRateLimitResult {
  const now = Date.now();
  cleanupExpiredBuckets(now);

  const existing = buckets.get(input.key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + input.windowMs;
    buckets.set(input.key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(0, input.limit - 1),
      resetAt
    };
  }

  if (existing.count >= input.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      resetAt: existing.resetAt
    };
  }

  existing.count += 1;
  buckets.set(input.key, existing);
  return {
    allowed: true,
    remaining: Math.max(0, input.limit - existing.count),
    resetAt: existing.resetAt
  };
}

function getUpstashConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return { url, token };
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

async function runUpstashPipeline(
  url: string,
  token: string,
  commands: Array<Array<string | number>>
): Promise<unknown[] | null> {
  const response = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(commands),
    cache: "no-store"
  });

  if (!response.ok) return null;
  const payload = (await response.json()) as Array<{ result?: unknown; error?: string }>;
  if (!Array.isArray(payload)) return null;

  return payload.map((entry) => (entry && typeof entry === "object" ? entry.result : null));
}

async function checkRateLimitInUpstash(input: CheckRateLimitInput): Promise<CheckRateLimitResult | null> {
  const config = getUpstashConfig();
  if (!config) return null;

  try {
    const namespacedKey = `rate-limit:${input.key}`;
    const initial = await runUpstashPipeline(config.url, config.token, [
      ["INCR", namespacedKey],
      ["PEXPIRE", namespacedKey, input.windowMs, "NX"],
      ["PTTL", namespacedKey]
    ]);

    if (!initial || initial.length < 3) return null;
    const count = asNumber(initial[0]);
    let ttlMs = asNumber(initial[2]);
    if (!count) return null;

    if (!ttlMs || ttlMs <= 0) {
      await runUpstashPipeline(config.url, config.token, [["PEXPIRE", namespacedKey, input.windowMs]]);
      ttlMs = input.windowMs;
    }

    const now = Date.now();
    const resetAt = now + ttlMs;
    if (count > input.limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSec: Math.max(1, Math.ceil(ttlMs / 1000)),
        resetAt
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, input.limit - count),
      resetAt
    };
  } catch {
    return null;
  }
}

export async function checkRateLimit(input: CheckRateLimitInput): Promise<CheckRateLimitResult> {
  const persistent = await checkRateLimitInUpstash(input);
  if (persistent) return persistent;
  return checkRateLimitInMemory(input);
}
