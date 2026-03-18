export const PIPELINE_DRAFT_STATUSES = ["draft", "reviewed", "approved", "rejected", "published"] as const;
export type PipelineDraftStatus = (typeof PIPELINE_DRAFT_STATUSES)[number];

type PipelineStorySummary = {
  id?: string;
  title?: string;
  summary?: string;
  issue_type?: string;
  geo_scope?: string;
  pollworthiness_score?: number;
  risk_score?: number;
  story_status?: string;
  source_count?: number;
  source_types?: string[];
  domains?: string[];
  countries?: string[];
  first_seen_at?: string;
  last_seen_at?: string;
};

type PipelineScorecard = {
  trend_strength?: number | null;
  clickability?: number | null;
  freshness?: number | null;
  source_confidence?: number | null;
  opinion_fit?: number | null;
  why_now?: string | null;
  recommended_question_angle?: string | null;
  latest_scored_at?: string | null;
};

type PipelineEvidenceSource = {
  source_type?: string | null;
  feed_name?: string | null;
  title: string;
  domain?: string | null;
  url?: string | null;
  published_at?: string | null;
  collected_at?: string | null;
};

type PipelineSourceEvidence = {
  source_count?: number | null;
  source_types: string[];
  domains: string[];
  countries: string[];
  first_seen_at?: string | null;
  last_seen_at?: string | null;
  latest_source_at?: string | null;
  sources: PipelineEvidenceSource[];
};

export type PipelineDraftItem = {
  id: string;
  story_candidate_id?: string | null;
  status: PipelineDraftStatus;
  question: string;
  question_type?: string;
  context_blurb?: string | null;
  options: string[];
  neutrality_flags: string[];
  safety_flags: string[];
  confidence?: number | null;
  owner_notes?: string | null;
  created_at?: string;
  updated_at?: string;
  story_candidates?: PipelineStorySummary | null;
  latest_scorecard?: PipelineScorecard | null;
  source_evidence?: PipelineSourceEvidence | null;
};

export type PipelineDraftListResult = {
  ok: boolean;
  count: number | null;
  items: PipelineDraftItem[];
  error?: string;
};

export type PipelineDraftUpdateResult = {
  ok: boolean;
  updated?: boolean;
  item?: PipelineDraftItem;
  error?: string;
};

function cleanText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => cleanText(item)).filter((item): item is string => Boolean(item));
}

function toNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function toStatus(value: unknown): PipelineDraftStatus | undefined {
  const status = cleanText(value);
  if (!status) return undefined;
  return PIPELINE_DRAFT_STATUSES.includes(status as PipelineDraftStatus)
    ? (status as PipelineDraftStatus)
    : undefined;
}

function readApiBaseUrl(): string | undefined {
  const raw = process.env.PIPELINE_REVIEW_API_URL;
  if (!raw) return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed.replace(/\/+$/, "") : undefined;
}

function readApiToken(): string | undefined {
  const raw = process.env.PIPELINE_REVIEW_API_TOKEN;
  if (!raw) return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readApiConfigOrThrow(): { url: string; token: string } {
  const url = readApiBaseUrl();
  if (!url) {
    throw new Error("PIPELINE_REVIEW_API_URL is not configured.");
  }
  const token = readApiToken();
  if (!token) {
    throw new Error("PIPELINE_REVIEW_API_TOKEN is not configured.");
  }
  return { url, token };
}

function mapDraftItem(row: unknown): PipelineDraftItem | null {
  if (!row || typeof row !== "object" || Array.isArray(row)) return null;
  const record = row as Record<string, unknown>;
  const id = cleanText(record.id);
  const status = toStatus(record.status);
  const question = cleanText(record.question);
  if (!id || !status || !question) return null;

  const storyRaw =
    record.story_candidates && typeof record.story_candidates === "object" && !Array.isArray(record.story_candidates)
      ? (record.story_candidates as Record<string, unknown>)
      : null;
  const scorecardRaw =
    record.latest_scorecard && typeof record.latest_scorecard === "object" && !Array.isArray(record.latest_scorecard)
      ? (record.latest_scorecard as Record<string, unknown>)
      : null;
  const sourceEvidenceRaw =
    record.source_evidence && typeof record.source_evidence === "object" && !Array.isArray(record.source_evidence)
      ? (record.source_evidence as Record<string, unknown>)
      : null;
  const evidenceSources = Array.isArray(sourceEvidenceRaw?.sources) ? sourceEvidenceRaw.sources : [];

  return {
    id,
    story_candidate_id: cleanText(record.story_candidate_id) ?? null,
    status,
    question,
    question_type: cleanText(record.question_type),
    context_blurb: cleanText(record.context_blurb) ?? null,
    options: toStringArray(record.options),
    neutrality_flags: toStringArray(record.neutrality_flags),
    safety_flags: toStringArray(record.safety_flags),
    confidence: typeof record.confidence === "number" ? record.confidence : null,
    owner_notes: cleanText(record.owner_notes) ?? null,
    created_at: cleanText(record.created_at),
    updated_at: cleanText(record.updated_at),
    story_candidates: storyRaw
      ? {
          id: cleanText(storyRaw.id),
          title: cleanText(storyRaw.title),
          summary: cleanText(storyRaw.summary),
          issue_type: cleanText(storyRaw.issue_type),
          geo_scope: cleanText(storyRaw.geo_scope),
          pollworthiness_score: toNumber(storyRaw.pollworthiness_score),
          risk_score: toNumber(storyRaw.risk_score),
          story_status: cleanText(storyRaw.story_status),
          source_count: toNumber(storyRaw.source_count),
          source_types: toStringArray(storyRaw.source_types),
          domains: toStringArray(storyRaw.domains),
          countries: toStringArray(storyRaw.countries),
          first_seen_at: cleanText(storyRaw.first_seen_at),
          last_seen_at: cleanText(storyRaw.last_seen_at),
        }
      : null,
    latest_scorecard: scorecardRaw
      ? {
          trend_strength: toNumber(scorecardRaw.trend_strength) ?? null,
          clickability: toNumber(scorecardRaw.clickability) ?? null,
          freshness: toNumber(scorecardRaw.freshness) ?? null,
          source_confidence: toNumber(scorecardRaw.source_confidence) ?? null,
          opinion_fit: toNumber(scorecardRaw.opinion_fit) ?? null,
          why_now: cleanText(scorecardRaw.why_now) ?? null,
          recommended_question_angle: cleanText(scorecardRaw.recommended_question_angle) ?? null,
          latest_scored_at: cleanText(scorecardRaw.latest_scored_at) ?? null,
        }
      : null,
    source_evidence: sourceEvidenceRaw
      ? {
          source_count: toNumber(sourceEvidenceRaw.source_count) ?? null,
          source_types: toStringArray(sourceEvidenceRaw.source_types),
          domains: toStringArray(sourceEvidenceRaw.domains),
          countries: toStringArray(sourceEvidenceRaw.countries),
          first_seen_at: cleanText(sourceEvidenceRaw.first_seen_at) ?? null,
          last_seen_at: cleanText(sourceEvidenceRaw.last_seen_at) ?? null,
          latest_source_at: cleanText(sourceEvidenceRaw.latest_source_at) ?? null,
          sources: evidenceSources
            .map((source) => {
              if (!source || typeof source !== "object" || Array.isArray(source)) return null;
              const sourceRecord = source as Record<string, unknown>;
              const title = cleanText(sourceRecord.title);
              if (!title) return null;
              return {
                title,
                source_type: cleanText(sourceRecord.source_type) ?? null,
                feed_name: cleanText(sourceRecord.feed_name) ?? null,
                domain: cleanText(sourceRecord.domain) ?? null,
                url: cleanText(sourceRecord.url) ?? null,
                published_at: cleanText(sourceRecord.published_at) ?? null,
                collected_at: cleanText(sourceRecord.collected_at) ?? null,
              };
            })
            .filter((source): source is PipelineEvidenceSource => source !== null),
        }
      : null,
  };
}

export function isPipelineReviewApiConfigured(): boolean {
  return Boolean(readApiBaseUrl() && readApiToken());
}

export async function listPipelineDrafts(params?: {
  status?: PipelineDraftStatus | "all";
  limit?: number;
  offset?: number;
}): Promise<PipelineDraftListResult> {
  try {
    const { url: baseUrl, token } = readApiConfigOrThrow();
    const query = new URLSearchParams();
    if (params?.status && params.status !== "all") query.set("status", params.status);
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.offset !== undefined) query.set("offset", String(params.offset));
    const url = query.size > 0 ? `${baseUrl}?${query.toString()}` : baseUrl;

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        "x-review-api-token": token,
      },
    });

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const message =
        payload && typeof payload === "object" && !Array.isArray(payload)
          ? cleanText((payload as Record<string, unknown>).error)
          : undefined;
      return {
        ok: false,
        count: null,
        items: [],
        error: message ?? `Failed to load drafts (${response.status})`,
      };
    }

    const record = payload as Record<string, unknown>;
    const itemsRaw = Array.isArray(record.items) ? record.items : [];
    const items = itemsRaw.map((item) => mapDraftItem(item)).filter((item): item is PipelineDraftItem => item !== null);
    const count = typeof record.count === "number" ? record.count : null;

    return {
      ok: true,
      count,
      items,
    };
  } catch (error) {
    return {
      ok: false,
      count: null,
      items: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updatePipelineDraft(params: {
  action: "approve" | "reject";
  draftId: string;
  ownerNotes?: string;
}): Promise<PipelineDraftUpdateResult> {
  try {
    const { url: baseUrl, token } = readApiConfigOrThrow();
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-review-api-token": token,
      },
      cache: "no-store",
      body: JSON.stringify({
        action: params.action,
        draft_id: params.draftId,
        owner_notes: params.ownerNotes ?? undefined,
      }),
    });

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const message =
        payload && typeof payload === "object" && !Array.isArray(payload)
          ? cleanText((payload as Record<string, unknown>).error)
          : undefined;
      return {
        ok: false,
        error: message ?? `Failed to update draft (${response.status})`,
      };
    }

    const record = payload as Record<string, unknown>;
    const item = mapDraftItem(record.item);
    return {
      ok: true,
      updated: Boolean(record.updated),
      item: item ?? undefined,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
