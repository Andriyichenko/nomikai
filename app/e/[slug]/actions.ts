"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSettings, getViewer } from "@/lib/data";
import { responseMail } from "@/lib/email/templates";
import { sendMails } from "@/lib/mail";
import { siteUrl } from "@/lib/links";
import { deadlineLabel, shortDate } from "@/lib/format";

const Input = z.object({
  eventId: z.string().uuid(),
  slug: z.string(),
  shopIds: z.array(z.string().uuid()).max(50),
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(400),
  comment: z.string().max(500),
});

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function submitResponse(input: z.infer<typeof Input>): Promise<ActionResult> {
  const parsed = Input.safeParse(input);
  if (!parsed.success) return { ok: false, error: "入力内容を確認してください" };
  const viewer = await getViewer();
  if (!viewer?.profile) return { ok: false, error: "ログインが必要です" };

  const { eventId, slug, shopIds, dates, comment } = parsed.data;
  const supabase = await createClient();
  const { data: before } = await supabase
    .from("responses")
    .select("event_id")
    .eq("event_id", eventId)
    .eq("profile_id", viewer.profile.id)
    .maybeSingle();
  const { error } = await supabase.from("responses").upsert({
    event_id: eventId,
    profile_id: viewer.profile.id,
    shop_ids: shopIds,
    dates,
    comment: comment.trim(),
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/e/${slug}`);
  revalidatePath("/");

  // Confirmation mail. Awaited (not `after()`): on AWS Amplify the function may be frozen as
  // soon as the response is sent. A mail failure never fails the submission.
  const profile = viewer.profile;
  if (profile.email) {
    await (async () => {
      const [{ data: ev }, { data: shops }, settings] = await Promise.all([
        supabase.from("events").select("title, deadline").eq("id", eventId).single(),
        shopIds.length ? supabase.from("shops").select("id, name").in("id", shopIds) : Promise.resolve({ data: [] }),
        getSettings(),
      ]);
      if (!ev) return;
      const names = shopIds.map((id) => (shops ?? []).find((s) => s.id === id)?.name).filter(Boolean) as string[];
      const site = siteUrl();
      const mail = responseMail({
        brand: `${settings.brand} ${settings.brand_sub}`,
        name: profile.display_name,
        event: { title: ev.title, url: `${site}/e/${slug}` },
        shops: names,
        dates: [...dates].sort().map((d) => shortDate(d, "ja")),
        comment: comment.trim(),
        deadline: ev.deadline ? deadlineLabel(ev.deadline) : "",
        updated: Boolean(before),
        site,
      });
      await sendMails([{ to: profile.email!, ...mail }]);
    })().catch((e) => console.error("confirmation mail", e));
  }
  return { ok: true };
}

/** Join / decline a decided event from its page. */
export async function setAttendance(eventId: string, slug: string, going: boolean): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer?.profile) return { ok: false, error: "ログインが必要です" };
  const supabase = await createClient();
  // Not an upsert: members may only update status/source/updated_at (column grants), and
  // ON CONFLICT DO UPDATE would need update rights on the key columns too.
  const patch = { status: going ? "going" : "declined", source: "page", updated_at: new Date().toISOString() };
  const { data: existing } = await supabase
    .from("attendees")
    .select("status")
    .eq("event_id", eventId)
    .eq("profile_id", viewer.profile.id)
    .maybeSingle();
  const { error } = existing
    ? await supabase.from("attendees").update(patch).eq("event_id", eventId).eq("profile_id", viewer.profile.id)
    : await supabase.from("attendees").insert({ event_id: eventId, profile_id: viewer.profile.id, ...patch });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/e/${slug}`);
  return { ok: true };
}

export async function withdrawResponse(eventId: string, slug: string): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer?.profile) return { ok: false, error: "ログインが必要です" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("responses")
    .delete()
    .eq("event_id", eventId)
    .eq("profile_id", viewer.profile.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/e/${slug}`);
  return { ok: true };
}
