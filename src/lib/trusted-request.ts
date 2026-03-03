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

  return originHost === requestHost;
}
