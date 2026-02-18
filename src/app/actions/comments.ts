"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { moderateComment } from "@/lib/moderation/comments";

function safePath(value: string | null | undefined, fallback = "/"): string {
  if (!value || !value.startsWith("/")) return fallback;
  return value;
}

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
  const returnTo = safePath(readText(formData.get("returnTo")), "/");

  if (!pollId || !body) {
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
    redirect(withCommentStatus(returnTo, "error", error.message));
  }

  revalidatePath(revalidateTarget(returnTo));
  redirect(withCommentStatus(returnTo, "success", "Comment posted"));
}

export async function toggleCommentUpvoteAction(formData: FormData) {
  const commentId = readText(formData.get("commentId"));
  const pollId = readText(formData.get("pollId"));
  const intent = readText(formData.get("intent"));
  const returnTo = safePath(readText(formData.get("returnTo")), "/");

  if (!commentId || !pollId || (intent !== "upvote" && intent !== "remove")) {
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
      redirect(withCommentStatus(returnTo, "error", error.message));
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
      redirect(withCommentStatus(returnTo, "error", error.message));
    }
  }

  revalidatePath(revalidateTarget(returnTo));
  redirect(returnTo);
}

export async function deleteCommentByAdminAction(formData: FormData) {
  const commentId = readText(formData.get("commentId"));
  const returnTo = safePath(readText(formData.get("returnTo")), "/");
  if (!commentId) {
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
    redirect(withCommentStatus(returnTo, "error", error.message));
  }

  revalidatePath(revalidateTarget(returnTo));
  redirect(withCommentStatus(returnTo, "success", "Comment deleted"));
}
