"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sanitizeInternalPath } from "@/lib/safe-path";
import { isEntityId } from "@/lib/id-validation";
import { updatePipelineDraft } from "@/lib/pipeline-review-api";

function readText(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
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
