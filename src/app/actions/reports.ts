"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isReportReason } from "@/lib/report-reasons";
import {
  isCategory,
  OPTION_MAX_COUNT,
  OPTION_MAX_LENGTH,
  OPTION_MIN_COUNT,
  optionsExceedLength,
  parseOptions,
  SUMMARY_MAX_LENGTH,
  TITLE_MAX_LENGTH
} from "@/lib/submissions";
import { trackPollEvent } from "@/lib/analytics/events";
import { sanitizeInternalPath } from "@/lib/safe-path";
import { isEntityId } from "@/lib/id-validation";

const REPORT_SUBMIT_ERROR_MESSAGE = "Could not submit report right now.";
const REPORT_REVIEW_ERROR_MESSAGE = "Could not update report status.";
const POLL_UPDATE_ERROR_MESSAGE = "Could not save poll updates.";
const POLL_ARCHIVE_ERROR_MESSAGE = "Could not archive poll right now.";

function readText(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

export async function submitPollReportAction(formData: FormData) {
  const pollId = readText(formData.get("pollId"));
  const reason = readText(formData.get("reason"));
  const details = readText(formData.get("details"));
  const returnTo = sanitizeInternalPath(readText(formData.get("returnTo")));

  if (!isEntityId(pollId) || !isReportReason(reason)) {
    redirect(`${returnTo}?report=error&message=${encodeURIComponent("Invalid report payload")}`);
  }

  if (details.length > 1000) {
    redirect(`${returnTo}?report=error&message=${encodeURIComponent("Report details are too long")}`);
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth?next=${encodeURIComponent(returnTo)}`);
  }

  const admin = createAdminClient();
  const { error } = await admin.from("poll_reports").insert({
    poll_id: pollId,
    reporter_id: user.id,
    reason,
    details: details || null,
    status: "open"
  });

  if (error) {
    redirect(`${returnTo}?report=error&message=${encodeURIComponent(REPORT_SUBMIT_ERROR_MESSAGE)}`);
  }

  await trackPollEvent({
    pollId,
    userId: user.id,
    eventType: "report_submit",
    source: "poll_detail",
    metadata: { reason }
  });

  revalidatePath("/admin/reports");
  redirect(`${returnTo}?report=success&message=${encodeURIComponent("Report submitted")}`);
}

async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") {
    redirect("/");
  }

  return user;
}

export async function markReportReviewedAction(formData: FormData) {
  const user = await requireAdminUser();
  const reportId = readText(formData.get("reportId"));
  const pollId = readText(formData.get("pollId"));
  const returnTo = sanitizeInternalPath(readText(formData.get("returnTo")), "/admin/reports");

  if ((!reportId && !pollId) || (reportId && !isEntityId(reportId)) || (pollId && !isEntityId(pollId))) {
    redirect(`${returnTo}?type=error&message=Missing+report+or+poll+id`);
  }

  const admin = createAdminClient();
  const updateQuery = admin
    .from("poll_reports")
    .update({ status: "reviewed", resolved_by: user.id })
    .eq("status", "open");

  const { error } = pollId ? await updateQuery.eq("poll_id", pollId) : await updateQuery.eq("id", reportId);

  if (error) {
    redirect(`${returnTo}?type=error&message=${encodeURIComponent(REPORT_REVIEW_ERROR_MESSAGE)}`);
  }

  revalidatePath("/admin/reports");
  redirect(`${returnTo}?type=success&message=Marked+as+no+action+needed`);
}

export async function resolveReportAction(formData: FormData) {
  const user = await requireAdminUser();
  const reportId = readText(formData.get("reportId"));
  const pollId = readText(formData.get("pollId"));
  const returnTo = sanitizeInternalPath(readText(formData.get("returnTo")), "/admin/reports");

  if ((!reportId && !pollId) || (reportId && !isEntityId(reportId)) || (pollId && !isEntityId(pollId))) {
    redirect(`${returnTo}?type=error&message=Missing+report+or+poll+id`);
  }

  const admin = createAdminClient();
  const updateQuery = admin
    .from("poll_reports")
    .update({ status: "resolved", resolved_by: user.id, resolved_at: new Date().toISOString() })
    .eq("status", "open");

  const { error } = pollId ? await updateQuery.eq("poll_id", pollId) : await updateQuery.eq("id", reportId);

  if (error) {
    redirect(`${returnTo}?type=error&message=${encodeURIComponent(REPORT_REVIEW_ERROR_MESSAGE)}`);
  }

  revalidatePath("/admin/reports");
  redirect(`${returnTo}?type=success&message=Marked+as+resolved`);
}

export async function updatePollFromAdminAction(formData: FormData) {
  await requireAdminUser();
  const returnTo = sanitizeInternalPath(readText(formData.get("returnTo")), "/admin/reports");

  const pollId = readText(formData.get("pollId"));
  const title = readText(formData.get("title"));
  const summary = readText(formData.get("summary")) || readText(formData.get("description"));
  const category = readText(formData.get("category"));
  const options = parseOptions(formData.getAll("options"));
  const endAtRaw = readText(formData.get("endAt"));

  if (!isEntityId(pollId) || !title || !summary || !isCategory(category)) {
    redirect(`${returnTo}?type=error&message=Invalid+poll+update+payload`);
  }

  if (title.length > TITLE_MAX_LENGTH) {
    redirect(
      `${returnTo}?type=error&message=${encodeURIComponent(
        `Title must be ${TITLE_MAX_LENGTH} characters or fewer`
      )}`
    );
  }

  if (summary.length > SUMMARY_MAX_LENGTH) {
    redirect(
      `${returnTo}?type=error&message=${encodeURIComponent(
        `Summary must be ${SUMMARY_MAX_LENGTH} characters or fewer`
      )}`
    );
  }

  if (options.length < OPTION_MIN_COUNT || options.length > OPTION_MAX_COUNT) {
    redirect(
      `${returnTo}?type=error&message=${encodeURIComponent(
        `Poll must have ${OPTION_MIN_COUNT}-${OPTION_MAX_COUNT} options`
      )}`
    );
  }

  if (optionsExceedLength(options)) {
    redirect(
      `${returnTo}?type=error&message=${encodeURIComponent(
        `Each option must be ${OPTION_MAX_LENGTH} characters or fewer`
      )}`
    );
  }

  const admin = createAdminClient();
  let endAt: string | null = null;
  if (endAtRaw) {
    const parsed = Date.parse(endAtRaw);
    if (Number.isNaN(parsed)) {
      redirect(`${returnTo}?type=error&message=Invalid+end+date`);
    }
    endAt = new Date(parsed).toISOString();
  }

  const { data: existingOptions, error: existingOptionsError } = await admin
    .from("poll_options")
    .select("id,position")
    .eq("poll_id", pollId)
    .order("position", { ascending: true });

  if (existingOptionsError) {
    redirect(`${returnTo}?type=error&message=${encodeURIComponent(existingOptionsError.message)}`);
  }

  if (!existingOptions || existingOptions.length !== options.length) {
    redirect(`${returnTo}?type=error&message=Option+count+cannot+change+in+admin+edit.+Rename+existing+options+only.`);
  }

  const { error: pollError } = await admin
    .from("polls")
    .update({
      title,
      blurb: summary,
      description: summary,
      category_key: category,
      end_at: endAt,
      updated_at: new Date().toISOString()
    })
    .eq("id", pollId);

  if (pollError) {
    redirect(`${returnTo}?type=error&message=${encodeURIComponent(POLL_UPDATE_ERROR_MESSAGE)}`);
  }

  for (let index = 0; index < existingOptions.length; index += 1) {
    const existing = existingOptions[index];
    const nextLabel = options[index];
    const { error: optionUpdateError } = await admin
      .from("poll_options")
      .update({ label: nextLabel, position: index + 1 })
      .eq("id", existing.id);

    if (optionUpdateError) {
      redirect(`${returnTo}?type=error&message=${encodeURIComponent(POLL_UPDATE_ERROR_MESSAGE)}`);
    }
  }

  revalidatePath("/");
  revalidatePath("/admin/reports");
  redirect(`${returnTo}?type=success&message=Poll+updated`);
}

export async function archivePollFromAdminAction(formData: FormData) {
  const user = await requireAdminUser();
  const returnTo = sanitizeInternalPath(readText(formData.get("returnTo")), "/admin/reports");

  const pollId = readText(formData.get("pollId"));
  if (!isEntityId(pollId)) {
    redirect(`${returnTo}?type=error&message=Missing+poll+id`);
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("polls")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", pollId);

  if (error) {
    redirect(`${returnTo}?type=error&message=${encodeURIComponent(POLL_ARCHIVE_ERROR_MESSAGE)}`);
  }

  const { error: reportError } = await admin
    .from("poll_reports")
    .update({ status: "resolved", resolved_by: user.id, resolved_at: new Date().toISOString() })
    .eq("poll_id", pollId)
    .eq("status", "open");

  if (reportError) {
    redirect(`${returnTo}?type=error&message=${encodeURIComponent(REPORT_REVIEW_ERROR_MESSAGE)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/reports");
  redirect(`${returnTo}?type=success&message=Poll+deleted+from+feed+and+reports+resolved`);
}
