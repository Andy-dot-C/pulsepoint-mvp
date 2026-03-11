"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { trackPollEvent } from "@/lib/analytics/events";
import { sanitizeInternalPath } from "@/lib/safe-path";
import { isEntityId } from "@/lib/id-validation";

const BOOKMARK_ERROR_MESSAGE = "Could not update bookmark right now. Please try again.";

export async function toggleBookmarkAction(formData: FormData) {
  const pollId = String(formData.get("pollId") ?? "");
  const intent = String(formData.get("intent") ?? "");
  const returnTo = sanitizeInternalPath(formData.get("returnTo") as string | null);

  if (!isEntityId(pollId) || (intent !== "save" && intent !== "remove")) {
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
          : BOOKMARK_ERROR_MESSAGE;
      redirect(`${returnTo}?bookmarkError=${encodeURIComponent(message)}`);
    }
    await trackPollEvent({
      pollId,
      userId: user.id,
      eventType: "bookmark_remove",
      source: returnTo.includes("/polls/") ? "poll_detail" : "feed"
    });
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
          : BOOKMARK_ERROR_MESSAGE;
      redirect(`${returnTo}?bookmarkError=${encodeURIComponent(message)}`);
    }
    await trackPollEvent({
      pollId,
      userId: user.id,
      eventType: "bookmark_add",
      source: returnTo.includes("/polls/") ? "poll_detail" : "feed"
    });
  }

  revalidatePath("/");
  revalidatePath(returnTo);
  redirect(returnTo);
}
