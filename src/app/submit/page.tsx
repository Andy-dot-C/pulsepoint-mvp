import Link from "next/link";
import { SubmitPollForm } from "@/components/submit-poll-form";

type SubmitPageProps = {
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
};

function readValue(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export default async function SubmitPage({ searchParams }: SubmitPageProps) {
  const resolved = searchParams ? await searchParams : {};
  const statusType = readValue(resolved.type);
  const statusMessage = readValue(resolved.message);

  return (
    <main className="page-shell submit-shell">
      <Link href="/" className="back-link">
        Back to feed
      </Link>
      <article className="detail-card">
        <h1>Submit a Poll</h1>
        <p className="poll-blurb">
          Create text polls with 2-10 options. Use AI assist for neutral wording and quick descriptions.
        </p>
        <SubmitPollForm statusType={statusType} statusMessage={statusMessage} />
      </article>
    </main>
  );
}
