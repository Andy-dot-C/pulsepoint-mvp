import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-shell detail-shell">
      <article className="detail-card">
        <h1>Page not found</h1>
        <p className="poll-blurb">The page you are looking for does not exist.</p>
        <Link className="back-link" href="/">
          Return to home feed
        </Link>
      </article>
    </main>
  );
}
