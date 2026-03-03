export function exceedsRequestSize(request: Request, maxBytes: number): boolean {
  const header = request.headers.get("content-length");
  if (!header) return false;

  const length = Number(header);
  if (!Number.isFinite(length) || length <= 0) return false;
  return length > maxBytes;
}
