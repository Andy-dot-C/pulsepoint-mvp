"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isReportReason } from "@/lib/report-reasons";
import { deriveBlurb, isCategory, parseOptions } from "@/lib/submissions";

function safePath(value: string | null | undefined, fallback = "/"): string {
  if (!value || !value.startsWith("/")) return fallback;
  return value;
}

function readText(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

export async function submitPollReportAction(formData: FormData) {
  const pollId = readText(formData.get("pollId"));
  const reason = readText(formData.get("reason"));
  const details = readText(formData.get("details"));
  const returnTo = safePath(readText(formData.get("returnTo")));

  if (!pollId || !isReportReason(reason)) {
    redirect(`${returnTo}?report=error&message=${encodeURIComponent("Invalid report payload")}`);
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
    redirect(`${returnTo}?report=error&message=${encodeURIComponent(error.message)}`);
  }

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

  if (!reportId) {
    redirect("/admin/reports?type=error&message=Missing+report+id");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("poll_reports")
    .update({ status: "reviewed", resolved_by: user.id })
    .eq("id", reportId);

  if (error) {
    redirect(`/admin/reports?type=error&message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/reports");
  redirect("/admin/reports?type=success&message=Report+marked+reviewed");
}

export async function resolveReportAction(formData: FormData) {
  const user = await requireAdminUser();
  const reportId = readText(formData.get("reportId"));

  if (!reportId) {
    redirect("/admin/reports?type=error&message=Missing+report+id");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("poll_reports")
    .update({ status: "resolved", resolved_by: user.id, resolved_at: new Date().toISOString() })
    .eq("id", reportId);

  if (error) {
    redirect(`/admin/reports?type=error&message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/reports");
  redirect("/admin/reports?type=success&message=Report+resolved");
}

export async function updatePollFromAdminAction(formData: FormData) {
  await requireAdminUser();

  const pollId = readText(formData.get("pollId"));
  const title = readText(formData.get("title"));
  const description = readText(formData.get("description"));
  const category = readText(formData.get("category"));
  const options = parseOptions(formData.getAll("options"));
  const endAtRaw = readText(formData.get("endAt"));

  if (!pollId || !title || !description || !isCategory(category)) {
    redirect("/admin/reports?type=error&message=Invalid+poll+update+payload");
  }

  if (options.length < 2 || options.length > 10) {
    redirect("/admin/reports?type=error&message=Poll+must+have+2-10+options");
  }

  const admin = createAdminClient();
  const blurb = deriveBlurb(description, title);
  const endAt = endAtRaw ? new Date(endAtRaw).toISOString() : null;

  const { error: pollError } = await admin
    .from("polls")
    .update({
      title,
      blurb,
      description,
      category_key: category,
      end_at: endAt,
      updated_at: new Date().toISOString()
    })
    .eq("id", pollId);

  if (pollError) {
    redirect(`/admin/reports?type=error&message=${encodeURIComponent(pollError.message)}`);
  }

  const { error: deleteOptionsError } = await admin.from("poll_options").delete().eq("poll_id", pollId);
  if (deleteOptionsError) {
    redirect(`/admin/reports?type=error&message=${encodeURIComponent(deleteOptionsError.message)}`);
  }

  const newOptions = options.map((label, index) => ({
    poll_id: pollId,
    label,
    position: index + 1
  }));

  const { error: optionsError } = await admin.from("poll_options").insert(newOptions);
  if (optionsError) {
    redirect(`/admin/reports?type=error&message=${encodeURIComponent(optionsError.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/reports");
  redirect("/admin/reports?type=success&message=Poll+updated");
}

export async function archivePollFromAdminAction(formData: FormData) {
  await requireAdminUser();

  const pollId = readText(formData.get("pollId"));
  if (!pollId) {
    redirect("/admin/reports?type=error&message=Missing+poll+id");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("polls")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", pollId);

  if (error) {
    redirect(`/admin/reports?type=error&message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/reports");
  redirect("/admin/reports?type=success&message=Poll+deleted+from+feed");
}
