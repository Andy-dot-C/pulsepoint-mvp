"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { moderateComment } from "@/lib/moderation/comments";
import { trackPollEvent } from "@/lib/analytics/events";
import { sanitizeInternalPath } from "@/lib/safe-path";
import { isEntityId } from "@/lib/id-validation";

const COMMENT_POST_ERROR_MESSAGE = "Could not post comment. Please try again.";
const COMMENT_VOTE_ERROR_MESSAGE = "Could not update comment vote. Please try again.";
const COMMENT_DELETE_ERROR_MESSAGE = "Could not delete comment right now.";

function readText(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

function withCommentStatus(
  returnTo: string,
  type: "success" | "error",
  message: string
): string {
  const [withoutHash, hash = ""] = returnTo.split("#");
  const params = new URLSearchParams();
  params.set("commentType", type);
  params.set("commentMessage", message);
  const joiner = withoutHash.includes("?") ? "&" : "?";
  return `${withoutHash}${joiner}${params.toString()}${hash ? `#${hash}` : ""}`;
}

function revalidateTarget(returnTo: string): string {
  return returnTo.split("#")[0].split("?")[0] || "/";
}

async function requireSignedIn(returnTo: string) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth?next=${encodeURIComponent(returnTo)}`);
  }

  return { supabase, user };
}

export async function submitCommentAction(formData: FormData) {
  const pollId = readText(formData.get("pollId"));
  const body = readText(formData.get("body"));
  const returnTo = sanitizeInternalPath(readText(formData.get("returnTo")), "/");

  if (!isEntityId(pollId)) {
    redirect(withCommentStatus(returnTo, "error", "Invalid poll id"));
  }

  if (!body) {
    redirect(withCommentStatus(returnTo, "error", "Comment cannot be empty"));
  }

  if (body.length > 1000) {
    redirect(withCommentStatus(returnTo, "error", "Comment must be under 1000 characters"));
  }

  const moderation = await moderateComment(body);
  if (moderation.action === "block") {
    redirect(
      withCommentStatus(
        returnTo,
        "error",
        "Comment blocked by safety rules. Remove profanity, hate, or abusive language and try again."
      )
    );
  }

  const { supabase, user } = await requireSignedIn(returnTo);
  const { error } = await supabase.from("poll_comments").insert({
    poll_id: pollId,
    user_id: user.id,
    body
  });

  if (error) {
    redirect(withCommentStatus(returnTo, "error", COMMENT_POST_ERROR_MESSAGE));
  }

  await trackPollEvent({
    pollId,
    userId: user.id,
    eventType: "comment_post",
    source: "poll_detail"
  });

  revalidatePath(revalidateTarget(returnTo));
  redirect(withCommentStatus(returnTo, "success", "Comment posted"));
}

export async function toggleCommentUpvoteAction(formData: FormData) {
  const commentId = readText(formData.get("commentId"));
  const pollId = readText(formData.get("pollId"));
  const intent = readText(formData.get("intent"));
  const returnTo = sanitizeInternalPath(readText(formData.get("returnTo")), "/");

  if (!isEntityId(commentId) || !isEntityId(pollId) || (intent !== "upvote" && intent !== "remove")) {
    redirect(returnTo);
  }

  const { supabase, user } = await requireSignedIn(returnTo);
  if (intent === "remove") {
    const { error } = await supabase
      .from("poll_comment_votes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", user.id);
    if (error) {
      redirect(withCommentStatus(returnTo, "error", COMMENT_VOTE_ERROR_MESSAGE));
    }
  } else {
    const { error } = await supabase.from("poll_comment_votes").upsert(
      {
        poll_id: pollId,
        comment_id: commentId,
        user_id: user.id
      },
      { onConflict: "comment_id,user_id" }
    );
    if (error) {
      redirect(withCommentStatus(returnTo, "error", COMMENT_VOTE_ERROR_MESSAGE));
    }
    await trackPollEvent({
      pollId,
      userId: user.id,
      eventType: "comment_upvote",
      source: "poll_detail"
    });
  }

  revalidatePath(revalidateTarget(returnTo));
  redirect(returnTo);
}

export async function deleteCommentByAdminAction(formData: FormData) {
  const commentId = readText(formData.get("commentId"));
  const returnTo = sanitizeInternalPath(readText(formData.get("returnTo")), "/");
  if (!isEntityId(commentId)) {
    redirect(withCommentStatus(returnTo, "error", "Missing comment id"));
  }

  const { supabase, user } = await requireSignedIn(returnTo);
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") {
    redirect(withCommentStatus(returnTo, "error", "Admin access required"));
  }

  const admin = createAdminClient();
  const { error } = await admin.from("poll_comments").delete().eq("id", commentId);
  if (error) {
    redirect(withCommentStatus(returnTo, "error", COMMENT_DELETE_ERROR_MESSAGE));
  }

  revalidatePath(revalidateTarget(returnTo));
  redirect(withCommentStatus(returnTo, "success", "Comment deleted"));
}
