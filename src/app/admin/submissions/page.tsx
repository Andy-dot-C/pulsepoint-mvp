import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminSubmissionEditor } from "@/components/admin-submission-editor";

type SubmissionRow = {
  id: string;
  title: string;
  description: string;
  category_key: string;
  options: string[];
  created_at: string;
  end_at: string | null;
  review_notes: string | null;
};

type DuplicatePollPreview = {
  id: string;
  slug: string;
  title: string;
  blurb: string;
  category_key: string;
  options: string[];
};

type AdminPageProps = {
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
};

function readValue(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function safeOptions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item));
}

function extractUuidIds(value: string | null): string[] {
  if (!value) return [];
  const matches = value.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi);
  if (!matches) return [];
  return Array.from(new Set(matches.map((item) => item.toLowerCase())));
}

export default async function AdminSubmissionsPage({ searchParams }: AdminPageProps) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="page-shell submit-shell">
        <article className="detail-card">
          <h1>Admin access required</h1>
          <p className="poll-blurb">Sign in with an admin account to review submissions.</p>
        </article>
      </main>
    );
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

  if (profile?.role !== "admin") {
    return (
      <main className="page-shell submit-shell">
        <article className="detail-card">
          <h1>Admin access required</h1>
          <p className="poll-blurb">Your account is signed in but does not have admin permissions.</p>
        </article>
      </main>
    );
  }

  const { data } = await supabase
    .from("poll_submissions")
    .select("id,title,description,category_key,options,created_at,end_at,review_notes")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const submissions: SubmissionRow[] = (data ?? []).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    description: String(row.description),
    category_key: String(row.category_key),
    options: safeOptions(row.options),
    created_at: String(row.created_at),
    end_at: row.end_at ? String(row.end_at) : null,
    review_notes: row.review_notes ? String(row.review_notes) : null
  }));
  const duplicateIds = Array.from(
    new Set(submissions.flatMap((submission) => extractUuidIds(submission.review_notes)))
  );
  const { data: duplicatePollRowsData } =
    duplicateIds.length > 0
      ? await supabase.from("polls").select("id,slug,title,blurb,category_key").in("id", duplicateIds)
      : { data: [] as DuplicatePollPreview[] };
  const { data: duplicatePollOptionRowsData } =
    duplicateIds.length > 0
      ? await supabase.from("poll_options").select("poll_id,label,position").in("poll_id", duplicateIds).order("position", { ascending: true })
      : { data: [] as Array<{ poll_id: string; label: string; position: number }> };
  const duplicateOptionsByPollId = new Map<string, string[]>();
  (duplicatePollOptionRowsData ?? []).forEach((row) => {
    const key = String(row.poll_id).toLowerCase();
    const existing = duplicateOptionsByPollId.get(key) ?? [];
    existing.push(String(row.label));
    duplicateOptionsByPollId.set(key, existing);
  });
  const duplicatePollMap = new Map(
    ((duplicatePollRowsData ?? []) as Array<Omit<DuplicatePollPreview, "options">>).map((poll) => [
      poll.id.toLowerCase(),
      {
        ...poll,
        options: duplicateOptionsByPollId.get(poll.id.toLowerCase()) ?? []
      }
    ])
  );

  const resolved = searchParams ? await searchParams : {};
  const statusType = readValue(resolved.type);
  const statusMessage = readValue(resolved.message);

  return (
    <main className="page-shell submit-shell admin-review-shell">
      <Link href="/" className="back-link">
        Back to feed
      </Link>

      <article className="detail-card">
        <h1>Moderation Queue</h1>
        <p className="poll-blurb">Approve as-is, approve with edits, reject, or merge duplicates.</p>
        {statusMessage ? (
          <p className={statusType === "error" ? "auth-error" : "auth-success"}>{statusMessage}</p>
        ) : null}
      </article>

      {submissions.length === 0 ? (
        <article className="detail-card" style={{ marginTop: 16 }}>
          <p>No pending submissions.</p>
        </article>
      ) : (
        submissions.map((submission) => {
          const submissionDuplicateIds = extractUuidIds(submission.review_notes);
          const duplicatePolls = submissionDuplicateIds
            .map((id) => duplicatePollMap.get(id))
            .filter((item): item is DuplicatePollPreview => Boolean(item));
          return (
            <AdminSubmissionEditor key={submission.id} submission={submission} duplicatePolls={duplicatePolls} />
          );
        })
      )}
    </main>
  );
}
