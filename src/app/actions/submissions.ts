"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  clampFutureDate,
  defaultEndDate,
  deriveBlurb,
  isCategory,
  parseOptions,
  sanitizeText,
  slugify
} from "@/lib/submissions";
import { shouldRequireModeration } from "@/lib/moderation/rules";

function toStatusMessage(type: "error" | "success", message: string): never {
  redirect(`/submit?type=${type}&message=${encodeURIComponent(message)}`);
}

function resolveEndAt(durationPreset: string, endAtRaw: string): string | null {
  if (durationPreset === "all-time") {
    return null;
  }

  if (durationPreset === "1d") return defaultEndDate(1);
  if (durationPreset === "7d") return defaultEndDate(7);
  if (durationPreset === "30d") return defaultEndDate(30);
  if (durationPreset === "90d") return defaultEndDate(90);

  if (durationPreset === "custom") {
    return clampFutureDate(endAtRaw || null) ?? defaultEndDate(30);
  }

  return defaultEndDate(30);
}

async function getAuthedUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return { supabase, user };
}

async function createUniqueSlug(base: string) {
  const admin = createAdminClient();

  for (let i = 0; i < 25; i += 1) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const { data } = await admin.from("polls").select("id").eq("slug", candidate).maybeSingle();
    if (!data) {
      return candidate;
    }
  }

  return `${base}-${Date.now()}`;
}

async function isAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  return data?.role === "admin";
}

export async function submitPollAction(formData: FormData) {
  const { user } = await getAuthedUser();

  if (!user) {
    redirect("/auth?next=/submit");
  }

  const title = sanitizeText(formData.get("title"));
  const description = sanitizeText(formData.get("description"));
  const blurb = deriveBlurb(description, title);
  const categoryRaw = sanitizeText(formData.get("category"));
  const options = parseOptions(formData.getAll("options"));
  const endAtRaw = sanitizeText(formData.get("endAt"));
  const durationPreset = sanitizeText(formData.get("durationPreset")) || "30d";
  const endAt = resolveEndAt(durationPreset, endAtRaw);

  if (!title || !description) {
    toStatusMessage("error", "Title and description are required.");
  }

  if (!isCategory(categoryRaw)) {
    toStatusMessage("error", "Please choose a valid category.");
  }

  if (options.length < 2 || options.length > 10) {
    toStatusMessage("error", "Polls must have between 2 and 10 unique options.");
  }

  const requiresModeration = shouldRequireModeration({
    category: categoryRaw,
    title,
    blurb,
    description
  });

  const admin = createAdminClient();
  const { data: submission, error: submissionError } = await admin
    .from("poll_submissions")
    .insert({
      submitted_by: user.id,
      title,
      blurb,
      description,
      category_key: categoryRaw,
      options,
      status: requiresModeration ? "pending" : "approved",
      review_notes: requiresModeration ? null : "Auto-published by risk routing",
      reviewed_by: requiresModeration ? null : user.id,
      reviewed_at: requiresModeration ? null : new Date().toISOString()
    })
    .select("id")
    .single();

  if (submissionError || !submission) {
    toStatusMessage("error", submissionError?.message ?? "Could not save submission.");
  }

  if (requiresModeration) {
    revalidatePath("/admin/submissions");
    toStatusMessage("success", "Submitted for moderation review.");
  }

  const baseSlug = slugify(title);
  const slug = await createUniqueSlug(baseSlug);

  const { data: pollRow, error: pollError } = await admin
    .from("polls")
    .insert({
      slug,
      title,
      blurb,
      description,
      category_key: categoryRaw,
      status: "published",
      source_type: "submission",
      created_by: user.id,
      published_by: user.id,
      start_at: new Date().toISOString(),
      end_at: endAt
    })
    .select("id")
    .single();

  if (pollError || !pollRow) {
    toStatusMessage("error", pollError?.message ?? "Could not publish poll.");
  }

  const optionRows = options.map((label, index) => ({
    poll_id: pollRow.id,
    label,
    position: index + 1
  }));

  const { error: optionError } = await admin.from("poll_options").insert(optionRows);

  if (optionError) {
    toStatusMessage("error", optionError.message);
  }

  revalidatePath("/");
  revalidatePath("/submit");

  redirect(`/polls/${slug}`);
}

export async function approveSubmissionAction(formData: FormData) {
  const { user } = await getAuthedUser();
  if (!user || !(await isAdmin(user.id))) {
    redirect("/");
  }

  const submissionId = sanitizeText(formData.get("submissionId"));
  const title = sanitizeText(formData.get("title"));
  const description = sanitizeText(formData.get("description"));
  const blurb = deriveBlurb(description, title);
  const categoryRaw = sanitizeText(formData.get("category"));
  const options = parseOptions(formData.getAll("options"));
  const reviewNotes = sanitizeText(formData.get("reviewNotes"));
  const endAt = clampFutureDate(sanitizeText(formData.get("endAt")) || null) ?? defaultEndDate(30);

  if (!submissionId || !title || !description || !isCategory(categoryRaw)) {
    redirect("/admin/submissions?type=error&message=Invalid+approval+payload");
  }

  if (options.length < 2 || options.length > 10) {
    redirect("/admin/submissions?type=error&message=Poll+must+have+2-10+options");
  }

  const admin = createAdminClient();
  const baseSlug = slugify(title);
  const slug = await createUniqueSlug(baseSlug);

  const { data: pollRow, error: pollError } = await admin
    .from("polls")
    .insert({
      slug,
      title,
      blurb,
      description,
      category_key: categoryRaw,
      status: "published",
      source_type: "submission",
      created_by: user.id,
      published_by: user.id,
      start_at: new Date().toISOString(),
      end_at: endAt
    })
    .select("id")
    .single();

  if (pollError || !pollRow) {
    redirect(`/admin/submissions?type=error&message=${encodeURIComponent(pollError?.message ?? "Could not publish")}`);
  }

  const optionRows = options.map((label, index) => ({
    poll_id: pollRow.id,
    label,
    position: index + 1
  }));

  const { error: optionError } = await admin.from("poll_options").insert(optionRows);
  if (optionError) {
    redirect(`/admin/submissions?type=error&message=${encodeURIComponent(optionError.message)}`);
  }

  const { error: updateError } = await admin
    .from("poll_submissions")
    .update({
      status: "approved",
      title,
      blurb,
      description,
      category_key: categoryRaw,
      options,
      review_notes: reviewNotes || "Approved",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    })
    .eq("id", submissionId);

  if (updateError) {
    redirect(`/admin/submissions?type=error&message=${encodeURIComponent(updateError.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/submissions");
  redirect(`/admin/submissions?type=success&message=${encodeURIComponent("Submission approved")}`);
}

export async function rejectSubmissionAction(formData: FormData) {
  const { user } = await getAuthedUser();
  if (!user || !(await isAdmin(user.id))) {
    redirect("/");
  }

  const submissionId = sanitizeText(formData.get("submissionId"));
  const reviewNotes = sanitizeText(formData.get("reviewNotes"));

  if (!submissionId) {
    redirect("/admin/submissions?type=error&message=Missing+submissionId");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("poll_submissions")
    .update({
      status: "rejected",
      review_notes: reviewNotes || "Rejected by moderator",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    })
    .eq("id", submissionId);

  if (error) {
    redirect(`/admin/submissions?type=error&message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/submissions");
  redirect(`/admin/submissions?type=success&message=${encodeURIComponent("Submission rejected")}`);
}

export async function mergeSubmissionAction(formData: FormData) {
  const { user } = await getAuthedUser();
  if (!user || !(await isAdmin(user.id))) {
    redirect("/");
  }

  const submissionId = sanitizeText(formData.get("submissionId"));
  const duplicateOf = sanitizeText(formData.get("duplicateOfSubmissionId"));
  const reviewNotes = sanitizeText(formData.get("reviewNotes"));

  if (!submissionId || !duplicateOf) {
    redirect("/admin/submissions?type=error&message=Missing+merge+ids");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("poll_submissions")
    .update({
      status: "merged",
      duplicate_of_submission_id: duplicateOf,
      review_notes: reviewNotes || "Merged as duplicate",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    })
    .eq("id", submissionId);

  if (error) {
    redirect(`/admin/submissions?type=error&message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/submissions");
  redirect(`/admin/submissions?type=success&message=${encodeURIComponent("Submission merged")}`);
}
