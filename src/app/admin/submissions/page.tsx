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
    .select("id,title,description,category_key,options,created_at,end_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const submissions: SubmissionRow[] = (data ?? []).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    description: String(row.description),
    category_key: String(row.category_key),
    options: safeOptions(row.options),
    created_at: String(row.created_at),
    end_at: row.end_at ? String(row.end_at) : null
  }));

  const resolved = searchParams ? await searchParams : {};
  const statusType = readValue(resolved.type);
  const statusMessage = readValue(resolved.message);

  return (
    <main className="page-shell submit-shell">
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
        submissions.map((submission) => <AdminSubmissionEditor key={submission.id} submission={submission} />)
      )}
    </main>
  );
}
