"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWithdraw } from "@/lib/links";
import { notifyResponseWithdrawn } from "@/lib/notify";

/**
 * "回答を取り消す" from the confirmation mail. The link is HMAC-signed per (event, member), so it
 * works in whatever browser the mail app opens — no login. Same rules as the page: only while
 * the event is open, and the daily cap (responses_limit_changes) applies.
 */
export async function withdrawByLink(form: FormData) {
  const slug = String(form.get("slug") ?? "");
  const profileId = String(form.get("p") ?? "");
  const token = String(form.get("t") ?? "");
  const back = (state: string) => redirect(`/e/${encodeURIComponent(slug)}?attend=${state}`);

  const db = createAdminClient();
  const { data: ev } = await db.from("events").select("id, status, deadline").eq("slug", slug).maybeSingle();
  if (!ev || !verifyWithdraw(ev.id, profileId, token)) back("invalid");
  if (ev!.status !== "open" || (ev!.deadline && new Date(ev!.deadline) < new Date())) back("closed");

  const { data: deleted, error } = await db
    .from("responses")
    .delete()
    .eq("event_id", ev!.id)
    .eq("profile_id", profileId)
    .select("event_id");
  if (error) back(error.message.includes("response change limit") ? "responseLimit" : "invalid");

  revalidatePath(`/e/${slug}`);
  revalidatePath("/");
  if (deleted?.length) await notifyResponseWithdrawn(ev!.id, profileId);
  back("withdrawn");
}
