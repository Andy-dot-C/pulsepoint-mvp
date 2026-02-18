import { fetchPollBySlug } from "@/lib/data/polls";
import { totalVotes } from "@/lib/mock-data";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function GET(
  _request: Request,
  context: { params: { slug: string } | Promise<{ slug: string }> }
) {
  const { slug } = await Promise.resolve(context.params);
  const poll = await fetchPollBySlug(slug);
  if (!poll) {
    return new Response("Not found", { status: 404 });
  }

  const rankedOptions = [...poll.options].sort(
    (left, right) => right.votes - left.votes || left.label.localeCompare(right.label)
  );
  const total = Math.max(totalVotes(poll), 1);
  const optionRows = rankedOptions
    .slice(0, 8)
    .map((option) => {
      const share = Math.round((option.votes / total) * 100);
      return `<li><span>${escapeHtml(option.label)}</span><strong>${share}%</strong></li>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(poll.title)}</title>
  <style>
    :root { color-scheme: light; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f8fafc; color: #0f172a; }
    .wrap { padding: 14px; }
    .card { background: #fff; border: 1px solid #d9e2ec; border-radius: 14px; padding: 14px; box-shadow: 0 8px 18px rgba(16,42,67,.06); }
    h1 { margin: 0; font-size: 18px; line-height: 1.2; }
    p { margin: 6px 0 0; color: #475569; font-size: 13px; }
    ul { margin: 12px 0 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 8px; }
    li { display: flex; justify-content: space-between; align-items: center; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 10px; font-size: 13px; }
    a { display: inline-block; margin-top: 10px; color: #1d4ed8; font-size: 12px; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="wrap">
    <article class="card">
      <h1>${escapeHtml(poll.title)}</h1>
      <p>${escapeHtml(poll.blurb)}</p>
      <ul>${optionRows}</ul>
      <a href="/polls/${encodeURIComponent(poll.slug)}" target="_top" rel="noopener noreferrer">Vote on PulsePoint</a>
    </article>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=60"
    }
  });
}
