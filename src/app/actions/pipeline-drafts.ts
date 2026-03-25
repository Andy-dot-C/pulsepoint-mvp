"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sanitizeInternalPath } from "@/lib/safe-path";
import { isEntityId } from "@/lib/id-validation";
import { PIPELINE_REVIEW_TAGS, type PipelineReviewTag, updatePipelineDraft } from "@/lib/pipeline-review-api";

function readText(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

function readRating(value: FormDataEntryValue | null, fieldName: string): number {
  const raw = readText(value);
  const rating = Number.parseInt(raw, 10);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error(`Invalid ${fieldName} rating`);
  }
  return rating;
}

function readTags(formData: FormData): PipelineReviewTag[] {
  const raw = formData.getAll("reviewTag").map((entry) => readText(entry)).filter(Boolean);
  const out: PipelineReviewTag[] = [];
  for (const tag of raw) {
    if (PIPELINE_REVIEW_TAGS.includes(tag as PipelineReviewTag)) {
      out.push(tag as PipelineReviewTag);
    }
  }
  return [...new Set(out)];
}

async function requireAdmin(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?next=/admin/drafts");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") {
    redirect("/");
  }
}

async function updateDraftAction(formData: FormData, action: "approve" | "reject") {
  await requireAdmin();

  const draftId = readText(formData.get("draftId"));
  const ownerNotes = readText(formData.get("ownerNotes"));
  const returnTo = sanitizeInternalPath(readText(formData.get("returnTo")), "/admin/drafts");

  if (!isEntityId(draftId)) {
    redirect(`${returnTo}?type=error&message=${encodeURIComponent("Invalid draft id")}`);
  }

  const result = await updatePipelineDraft({
    action,
    draftId,
    ownerNotes: ownerNotes || undefined,
  });

  if (!result.ok) {
    redirect(
      `${returnTo}?type=error&message=${encodeURIComponent(result.error ?? `Could not ${action} draft right now`)}`,
    );
  }

  revalidatePath("/admin/drafts");
  redirect(
    `${returnTo}?type=success&message=${encodeURIComponent(action === "approve" ? "Draft approved" : "Draft rejected")}`,
  );
}

export async function approvePipelineDraftAction(formData: FormData) {
  await updateDraftAction(formData, "approve");
}

export async function rejectPipelineDraftAction(formData: FormData) {
  await updateDraftAction(formData, "reject");
}

export async function gradePipelineDraftAction(formData: FormData) {
  await requireAdmin();

  const draftId = readText(formData.get("draftId"));
  const ownerNotes = readText(formData.get("ownerNotes"));
  const reviewNotes = readText(formData.get("reviewNotes"));
  const returnTo = sanitizeInternalPath(readText(formData.get("returnTo")), "/admin/drafts");

  if (!isEntityId(draftId)) {
    redirect(`${returnTo}?type=error&message=${encodeURIComponent("Invalid draft id")}`);
  }

  let ratings:
    | {
        clickPotential: number;
        clarity: number;
        neutrality: number;
        relevanceNow: number;
        answerQuality: number;
        overallGrade: number;
      }
    | null = null;
  try {
    ratings = {
      clickPotential: readRating(formData.get("clickPotential"), "click potential"),
      clarity: readRating(formData.get("clarity"), "clarity"),
      neutrality: readRating(formData.get("neutrality"), "neutrality"),
      relevanceNow: readRating(formData.get("relevanceNow"), "relevance now"),
      answerQuality: readRating(formData.get("answerQuality"), "answer quality"),
      overallGrade: readRating(formData.get("overallGrade"), "overall grade"),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid review inputs";
    redirect(`${returnTo}?type=error&message=${encodeURIComponent(message)}`);
  }
  if (!ratings) {
    redirect(`${returnTo}?type=error&message=${encodeURIComponent("Invalid review inputs")}`);
  }

  const result = await updatePipelineDraft({
    action: "grade",
    draftId,
    ownerNotes: ownerNotes || undefined,
    review: {
      clickPotential: ratings.clickPotential,
      clarity: ratings.clarity,
      neutrality: ratings.neutrality,
      relevanceNow: ratings.relevanceNow,
      answerQuality: ratings.answerQuality,
      overallGrade: ratings.overallGrade,
      tags: readTags(formData),
      notes: reviewNotes || undefined,
    },
  });

  if (!result.ok) {
    redirect(`${returnTo}?type=error&message=${encodeURIComponent(result.error ?? "Could not save review right now")}`);
  }

  revalidatePath("/admin/drafts");
  redirect(`${returnTo}?type=success&message=${encodeURIComponent("Review saved")}`);
}
