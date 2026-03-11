"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { trackPollEvent } from "@/lib/analytics/events";
import { sanitizeInternalPath } from "@/lib/safe-path";
import { isEntityId } from "@/lib/id-validation";

const VOTE_ERROR_MESSAGE = "Could not update your vote. Please try again.";

export async function submitVoteAction(formData: FormData) {
  const pollId = String(formData.get("pollId") ?? "");
  const optionId = String(formData.get("optionId") ?? "");
  const returnTo = sanitizeInternalPath(formData.get("returnTo") as string | null);

  if (!isEntityId(pollId) || !isEntityId(optionId)) {
    redirect(returnTo);
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth?next=${encodeURIComponent(returnTo)}`);
  }

  const { data: existingVote, error: existingVoteError } = await supabase
    .from("votes")
    .select("option_id")
    .eq("poll_id", pollId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingVoteError) {
    redirect(`${returnTo}?voteError=${encodeURIComponent(VOTE_ERROR_MESSAGE)}`);
  }

  const isRemovingVote = existingVote?.option_id === optionId;

  const { error } = isRemovingVote
    ? await supabase
        .from("votes")
        .delete()
        .eq("poll_id", pollId)
        .eq("user_id", user.id)
        .eq("option_id", optionId)
    : await supabase.from("votes").upsert(
        {
          poll_id: pollId,
          option_id: optionId,
          user_id: user.id,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: "poll_id,user_id"
        }
      );

  if (error) {
    redirect(`${returnTo}?voteError=${encodeURIComponent(VOTE_ERROR_MESSAGE)}`);
  }

  if (!isRemovingVote) {
    await trackPollEvent({
      pollId,
      userId: user.id,
      eventType: "vote_cast",
      source: returnTo.includes("/polls/") ? "poll_detail" : "feed"
    });
  }

  revalidatePath("/");
  revalidatePath(returnTo);
  redirect(returnTo);
}
