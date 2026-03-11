import { NextRequest } from "next/server";

function normalizeHost(value: string | null): string | null {
  if (!value) return null;
  const host = value.trim().toLowerCase();
  return host || null;
}

function getOriginHost(origin: string | null): string | null {
  if (!origin) return null;
  try {
    return new URL(origin).host.toLowerCase();
  } catch {
    return null;
  }
}

function getRefererHost(referer: string | null): string | null {
  if (!referer) return null;
  try {
    return new URL(referer).host.toLowerCase();
  } catch {
    return null;
  }
}

export function isTrustedWriteRequest(request: NextRequest): boolean {
  const secFetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
  if (secFetchSite === "cross-site") {
    return false;
  }

  const originHost = getOriginHost(request.headers.get("origin"));
  if (!originHost) {
    return true;
  }

  const requestHost = normalizeHost(
    request.headers.get("x-forwarded-host") ?? request.headers.get("host")
  );
  if (!requestHost) {
    return false;
  }

  if (originHost) {
    return originHost === requestHost;
  }

  // Some same-origin browser requests may omit Origin. Fall back to Referer.
  const refererHost = getRefererHost(request.headers.get("referer"));
  if (refererHost) {
    return refererHost === requestHost;
  }

  // No origin context present: treat as untrusted for write endpoints.
  return false;
}
