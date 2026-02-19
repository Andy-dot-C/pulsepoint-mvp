"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { trackPollEvent } from "@/lib/analytics/events";

function safeReturnPath(input: string | null): string {
  if (!input || !input.startsWith("/")) return "/";
  return input;
}

export async function submitVoteAction(formData: FormData) {
  const pollId = String(formData.get("pollId") ?? "");
  const optionId = String(formData.get("optionId") ?? "");
  const returnTo = safeReturnPath(formData.get("returnTo") as string | null);

  if (!pollId || !optionId) {
    redirect(returnTo);
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth?next=${encodeURIComponent(returnTo)}`);
  }

  const { error } = await supabase.from("votes").upsert(
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
    redirect(`${returnTo}?voteError=${encodeURIComponent(error.message)}`);
  }

  await trackPollEvent({
    pollId,
    userId: user.id,
    eventType: "vote_cast",
    source: returnTo.includes("/polls/") ? "poll_detail" : "feed"
  });

  revalidatePath("/");
  revalidatePath(returnTo);
  redirect(returnTo);
}
