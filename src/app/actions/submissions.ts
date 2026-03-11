"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  clampFutureDate,
  defaultEndDate,
  isCategory,
  OPTION_MAX_COUNT,
  OPTION_MIN_COUNT,
  OPTION_MAX_LENGTH,
  optionsExceedLength,
  parseOptions,
  SUMMARY_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  sanitizeText,
  slugify
} from "@/lib/submissions";
import { shouldRequireModeration } from "@/lib/moderation/rules";
import { findPossibleDuplicates } from "@/lib/duplicate-check";
import { isEntityId } from "@/lib/id-validation";

const SUBMISSION_SAVE_ERROR_MESSAGE = "Could not save submission right now.";
const SUBMISSION_PUBLISH_ERROR_MESSAGE = "Could not publish poll right now.";
const SUBMISSION_REVIEW_ERROR_MESSAGE = "Could not update submission status.";

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

type DuplicateCandidatePollRow = {
  id: string;
  slug: string;
  title: string;
};

type DuplicateCandidateOptionRow = {
  poll_id: string;
  label: string;
};

async function detectPossibleDuplicateIds(title: string, options: string[]): Promise<string[]> {
  const admin = createAdminClient();
  const { data: pollRowsData, error: pollError } = await admin
    .from("polls")
    .select("id,slug,title")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(300);

  if (pollError || !pollRowsData || pollRowsData.length === 0) {
    return [];
  }

  const pollRows = pollRowsData as DuplicateCandidatePollRow[];
  const pollIds = pollRows.map((item) => item.id);
  const { data: optionRowsData, error: optionError } = await admin
    .from("poll_options")
    .select("poll_id,label")
    .in("poll_id", pollIds);

  if (optionError) {
    return [];
  }

  const optionRows = (optionRowsData ?? []) as DuplicateCandidateOptionRow[];
  return findPossibleDuplicates(title, options, pollRows, optionRows).map((item) => item.pollId);
}

type PublishPollInput = {
  slug: string;
  title: string;
  summary: string;
  categoryKey: string;
  userId: string;
  endAt: string | null;
  options: string[];
};

async function createPublishedPollWithOptions(input: PublishPollInput): Promise<{ id: string }> {
  const admin = createAdminClient();
  const { data: pollRow, error: pollError } = await admin
    .from("polls")
    .insert({
      slug: input.slug,
      title: input.title,
      blurb: input.summary,
      description: input.summary,
      category_key: input.categoryKey,
      status: "published",
      source_type: "submission",
      created_by: input.userId,
      published_by: input.userId,
      start_at: new Date().toISOString(),
      end_at: input.endAt
    })
    .select("id")
    .single();

  if (pollError || !pollRow) {
    throw new Error(pollError?.message ?? "Could not publish poll.");
  }

  const optionRows = input.options.map((label, index) => ({
    poll_id: pollRow.id,
    label,
    position: index + 1
  }));
  const { error: optionError } = await admin.from("poll_options").insert(optionRows);
  if (!optionError) {
    return { id: String(pollRow.id) };
  }

  await admin.from("polls").delete().eq("id", pollRow.id);
  throw new Error(optionError.message);
}

export async function submitPollAction(formData: FormData) {
  const { user } = await getAuthedUser();

  if (!user) {
    redirect("/auth?next=/submit");
  }

  const title = sanitizeText(formData.get("title"));
  const summary = sanitizeText(formData.get("summary")) || sanitizeText(formData.get("description"));
  const categoryRaw = sanitizeText(formData.get("category"));
  const options = parseOptions(formData.getAll("options"));
  const endAtRaw = sanitizeText(formData.get("endAt"));
  const durationPreset = sanitizeText(formData.get("durationPreset")) || "30d";
  const endAt = resolveEndAt(durationPreset, endAtRaw);
  const duplicateOverride = sanitizeText(formData.get("duplicateOverride")) === "1";

  if (!title || !summary) {
    toStatusMessage("error", "Title and summary are required.");
  }

  if (title.length > TITLE_MAX_LENGTH) {
    toStatusMessage("error", `Title must be ${TITLE_MAX_LENGTH} characters or fewer.`);
  }

  if (summary.length > SUMMARY_MAX_LENGTH) {
    toStatusMessage("error", `Summary must be ${SUMMARY_MAX_LENGTH} characters or fewer.`);
  }

  if (!isCategory(categoryRaw)) {
    toStatusMessage("error", "Please choose a valid category.");
  }

  if (options.length < OPTION_MIN_COUNT || options.length > OPTION_MAX_COUNT) {
    toStatusMessage(
      "error",
      `Polls must have between ${OPTION_MIN_COUNT} and ${OPTION_MAX_COUNT} unique options.`
    );
  }

  if (optionsExceedLength(options)) {
    toStatusMessage("error", `Each option must be ${OPTION_MAX_LENGTH} characters or fewer.`);
  }

  const requiresModeration = shouldRequireModeration({
    category: categoryRaw,
    title,
    summary
  });
  const possibleDuplicateIds = await detectPossibleDuplicateIds(title, options);
  const forceDuplicateModeration = possibleDuplicateIds.length > 0;
  const willRequireModeration = requiresModeration || forceDuplicateModeration;
  const duplicateReviewNote = forceDuplicateModeration
    ? `${
        duplicateOverride ? "Duplicate warning overridden by submitter." : "Server duplicate scan matched existing polls."
      } Similar poll IDs: ${possibleDuplicateIds.join(", ")}`
    : null;

  const admin = createAdminClient();
  const { data: submission, error: submissionError } = await admin
    .from("poll_submissions")
    .insert({
      submitted_by: user.id,
      title,
      blurb: summary,
      description: summary,
      category_key: categoryRaw,
      options,
      end_at: endAt,
      status: willRequireModeration ? "pending" : "approved",
      review_notes: willRequireModeration ? duplicateReviewNote : "Auto-published by risk routing",
      reviewed_by: willRequireModeration ? null : user.id,
      reviewed_at: willRequireModeration ? null : new Date().toISOString()
    })
    .select("id")
    .single();

  if (submissionError || !submission) {
    toStatusMessage("error", SUBMISSION_SAVE_ERROR_MESSAGE);
  }

  if (willRequireModeration) {
    revalidatePath("/admin/submissions");
    if (forceDuplicateModeration) {
      redirect("/?submission=under-review");
    }
    toStatusMessage("success", "Submitted for moderation review.");
  }

  const baseSlug = slugify(title);
  const slug = await createUniqueSlug(baseSlug);
  try {
    await createPublishedPollWithOptions({
      slug,
      title,
      summary,
      categoryKey: categoryRaw,
      userId: user.id,
      endAt,
      options
    });
  } catch {
    await admin
      .from("poll_submissions")
      .update({
        status: "pending",
        review_notes: "Auto-publish failed",
        reviewed_by: null,
        reviewed_at: null
      })
      .eq("id", submission.id);
    toStatusMessage("error", SUBMISSION_PUBLISH_ERROR_MESSAGE);
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
  const summary = sanitizeText(formData.get("summary")) || sanitizeText(formData.get("description"));
  const categoryRaw = sanitizeText(formData.get("category"));
  const options = parseOptions(formData.getAll("options"));
  const reviewNotes = sanitizeText(formData.get("reviewNotes"));
  const requestedEndAt = clampFutureDate(sanitizeText(formData.get("endAt")) || null);
  const originalEndAt = clampFutureDate(sanitizeText(formData.get("originalEndAt")) || null);
  const endAt = requestedEndAt ?? originalEndAt ?? null;

  if (!isEntityId(submissionId) || !title || !summary || !isCategory(categoryRaw)) {
    redirect("/admin/submissions?type=error&message=Invalid+approval+payload");
  }

  if (title.length > TITLE_MAX_LENGTH) {
    redirect(
      `/admin/submissions?type=error&message=${encodeURIComponent(
        `Title must be ${TITLE_MAX_LENGTH} characters or fewer`
      )}`
    );
  }

  if (summary.length > SUMMARY_MAX_LENGTH) {
    redirect(
      `/admin/submissions?type=error&message=${encodeURIComponent(
        `Summary must be ${SUMMARY_MAX_LENGTH} characters or fewer`
      )}`
    );
  }

  if (options.length < OPTION_MIN_COUNT || options.length > OPTION_MAX_COUNT) {
    redirect(
      `/admin/submissions?type=error&message=${encodeURIComponent(
        `Poll must have ${OPTION_MIN_COUNT}-${OPTION_MAX_COUNT} options`
      )}`
    );
  }

  if (optionsExceedLength(options)) {
    redirect(
      `/admin/submissions?type=error&message=${encodeURIComponent(
        `Each option must be ${OPTION_MAX_LENGTH} characters or fewer`
      )}`
    );
  }

  const admin = createAdminClient();
  const baseSlug = slugify(title);
  const slug = await createUniqueSlug(baseSlug);
  try {
    await createPublishedPollWithOptions({
      slug,
      title,
      summary,
      categoryKey: categoryRaw,
      userId: user.id,
      endAt,
      options
    });
  } catch {
    redirect(`/admin/submissions?type=error&message=${encodeURIComponent(SUBMISSION_PUBLISH_ERROR_MESSAGE)}`);
  }

  const { error: updateError } = await admin
    .from("poll_submissions")
    .update({
      status: "approved",
      title,
      blurb: summary,
      description: summary,
      category_key: categoryRaw,
      options,
      review_notes: reviewNotes || "Approved",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    })
    .eq("id", submissionId);

  if (updateError) {
    redirect(`/admin/submissions?type=error&message=${encodeURIComponent(SUBMISSION_REVIEW_ERROR_MESSAGE)}`);
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

  if (!isEntityId(submissionId)) {
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
    redirect(`/admin/submissions?type=error&message=${encodeURIComponent(SUBMISSION_REVIEW_ERROR_MESSAGE)}`);
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

  if (!isEntityId(submissionId) || !isEntityId(duplicateOf)) {
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
    redirect(`/admin/submissions?type=error&message=${encodeURIComponent(SUBMISSION_REVIEW_ERROR_MESSAGE)}`);
  }

  revalidatePath("/admin/submissions");
  redirect(`/admin/submissions?type=success&message=${encodeURIComponent("Submission merged")}`);
}
