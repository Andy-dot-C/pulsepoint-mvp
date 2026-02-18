"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function safeReturnPath(input: string | null): string {
  if (!input || !input.startsWith("/")) return "/";
  return input;
}

export async function toggleBookmarkAction(formData: FormData) {
  const pollId = String(formData.get("pollId") ?? "");
  const intent = String(formData.get("intent") ?? "");
  const returnTo = safeReturnPath(formData.get("returnTo") as string | null);

  if (!pollId || (intent !== "save" && intent !== "remove")) {
    redirect(returnTo);
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth?next=${encodeURIComponent(returnTo)}`);
  }

  if (intent === "remove") {
    const { error } = await supabase.from("poll_bookmarks").delete().eq("user_id", user.id).eq("poll_id", pollId);
    if (error) {
      const message =
        error.message.includes("poll_bookmarks") || error.message.includes("relation")
          ? "Bookmarks are not set up yet. Please run the bookmark SQL migration."
          : error.message;
      redirect(`${returnTo}?bookmarkError=${encodeURIComponent(message)}`);
    }
  } else {
    const { error } = await supabase.from("poll_bookmarks").upsert(
      {
        user_id: user.id,
        poll_id: pollId
      },
      { onConflict: "user_id,poll_id" }
    );

    if (error) {
      const message =
        error.message.includes("poll_bookmarks") || error.message.includes("relation")
          ? "Bookmarks are not set up yet. Please run the bookmark SQL migration."
          : error.message;
      redirect(`${returnTo}?bookmarkError=${encodeURIComponent(message)}`);
    }
  }

  revalidatePath("/");
  revalidatePath(returnTo);
  redirect(returnTo);
}
