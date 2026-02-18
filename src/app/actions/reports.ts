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
  const pollId = readText(formData.get("pollId"));
  const returnTo = safePath(readText(formData.get("returnTo")), "/admin/reports");

  if (!reportId && !pollId) {
    redirect(`${returnTo}?type=error&message=Missing+report+or+poll+id`);
  }

  const admin = createAdminClient();
  const updateQuery = admin
    .from("poll_reports")
    .update({ status: "reviewed", resolved_by: user.id })
    .eq("status", "open");

  const { error } = pollId ? await updateQuery.eq("poll_id", pollId) : await updateQuery.eq("id", reportId);

  if (error) {
    redirect(`${returnTo}?type=error&message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/reports");
  redirect(`${returnTo}?type=success&message=Marked+as+no+action+needed`);
}

export async function resolveReportAction(formData: FormData) {
  const user = await requireAdminUser();
  const reportId = readText(formData.get("reportId"));
  const pollId = readText(formData.get("pollId"));
  const returnTo = safePath(readText(formData.get("returnTo")), "/admin/reports");

  if (!reportId && !pollId) {
    redirect(`${returnTo}?type=error&message=Missing+report+or+poll+id`);
  }

  const admin = createAdminClient();
  const updateQuery = admin
    .from("poll_reports")
    .update({ status: "resolved", resolved_by: user.id, resolved_at: new Date().toISOString() })
    .eq("status", "open");

  const { error } = pollId ? await updateQuery.eq("poll_id", pollId) : await updateQuery.eq("id", reportId);

  if (error) {
    redirect(`${returnTo}?type=error&message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/reports");
  redirect(`${returnTo}?type=success&message=Marked+as+resolved`);
}

export async function updatePollFromAdminAction(formData: FormData) {
  await requireAdminUser();
  const returnTo = safePath(readText(formData.get("returnTo")), "/admin/reports");

  const pollId = readText(formData.get("pollId"));
  const title = readText(formData.get("title"));
  const description = readText(formData.get("description"));
  const category = readText(formData.get("category"));
  const options = parseOptions(formData.getAll("options"));
  const endAtRaw = readText(formData.get("endAt"));

  if (!pollId || !title || !description || !isCategory(category)) {
    redirect(`${returnTo}?type=error&message=Invalid+poll+update+payload`);
  }

  if (options.length < 2 || options.length > 10) {
    redirect(`${returnTo}?type=error&message=Poll+must+have+2-10+options`);
  }

  const admin = createAdminClient();
  const blurb = deriveBlurb(description, title);
  const endAt = endAtRaw ? new Date(endAtRaw).toISOString() : null;

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
      blurb,
      description,
      category_key: category,
      end_at: endAt,
      updated_at: new Date().toISOString()
    })
    .eq("id", pollId);

  if (pollError) {
    redirect(`${returnTo}?type=error&message=${encodeURIComponent(pollError.message)}`);
  }

  for (let index = 0; index < existingOptions.length; index += 1) {
    const existing = existingOptions[index];
    const nextLabel = options[index];
    const { error: optionUpdateError } = await admin
      .from("poll_options")
      .update({ label: nextLabel, position: index + 1 })
      .eq("id", existing.id);

    if (optionUpdateError) {
      redirect(`${returnTo}?type=error&message=${encodeURIComponent(optionUpdateError.message)}`);
    }
  }

  revalidatePath("/");
  revalidatePath("/admin/reports");
  redirect(`${returnTo}?type=success&message=Poll+updated`);
}

export async function archivePollFromAdminAction(formData: FormData) {
  const user = await requireAdminUser();
  const returnTo = safePath(readText(formData.get("returnTo")), "/admin/reports");

  const pollId = readText(formData.get("pollId"));
  if (!pollId) {
    redirect(`${returnTo}?type=error&message=Missing+poll+id`);
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("polls")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", pollId);

  if (error) {
    redirect(`${returnTo}?type=error&message=${encodeURIComponent(error.message)}`);
  }

  const { error: reportError } = await admin
    .from("poll_reports")
    .update({ status: "resolved", resolved_by: user.id, resolved_at: new Date().toISOString() })
    .eq("poll_id", pollId)
    .eq("status", "open");

  if (reportError) {
    redirect(`${returnTo}?type=error&message=${encodeURIComponent(reportError.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/reports");
  redirect(`${returnTo}?type=success&message=Poll+deleted+from+feed+and+reports+resolved`);
}
