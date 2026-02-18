import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { archivePollFromAdminAction, updatePollFromAdminAction } from "@/app/actions/reports";
import { categories } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";

type PollEditorPageProps = {
  params: { pollId: string } | Promise<{ pollId: string }>;
};

export default async function PollEditorPage({ params }: PollEditorPageProps) {
  const { pollId } = await Promise.resolve(params);
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?next=/admin/reports");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") {
    redirect("/");
  }

  const { data: poll } = await supabase
    .from("polls")
    .select("id,title,description,category_key,end_at,status")
    .eq("id", pollId)
    .maybeSingle();

  if (!poll) {
    notFound();
  }

  const { data: options } = await supabase
    .from("poll_options")
    .select("label,position")
    .eq("poll_id", pollId)
    .order("position", { ascending: true });

  const optionLabels = (options ?? []).map((item) => item.label);

  return (
    <main className="page-shell submit-shell">
      <Link href="/admin/reports" className="back-link">
        Back to reports
      </Link>

      <article className="detail-card">
        <h1>Edit Poll</h1>
        <p className="poll-blurb">Update wording/options or delete this post from public feed.</p>
        <p className="poll-blurb">Current status: {poll.status}</p>

        <form action={updatePollFromAdminAction} className="submit-form">
          <input type="hidden" name="pollId" value={poll.id} />

          <label>
            Title
            <input name="title" defaultValue={poll.title} required />
          </label>

          <label>
            Category
            <select name="category" defaultValue={poll.category_key}>
              {categories.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Description
            <textarea name="description" rows={4} defaultValue={poll.description} required />
          </label>

          <div className="submit-options">
            <p>Options (2-10)</p>
            {optionLabels.map((label, idx) => (
              <input key={`${poll.id}-option-${idx}`} name="options" defaultValue={label} required />
            ))}
          </div>

          <label>
            End date (optional)
            <input
              type="datetime-local"
              name="endAt"
              defaultValue={poll.end_at ? new Date(poll.end_at).toISOString().slice(0, 16) : ""}
            />
          </label>

          <button type="submit" className="create-btn">
            Save edits
          </button>
        </form>

        <form action={archivePollFromAdminAction} style={{ marginTop: 12 }}>
          <input type="hidden" name="pollId" value={poll.id} />
          <button type="submit" className="ghost-btn">
            Delete post (remove from feed)
          </button>
        </form>
      </article>
    </main>
  );
}
