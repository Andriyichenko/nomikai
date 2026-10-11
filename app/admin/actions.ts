"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSettings, getViewer } from "@/lib/data";
import { ImportError, importShop } from "@/lib/shop-import";
import { notifyDecision } from "@/lib/notify";
import type { ShopDraft } from "@/lib/types";

type Result<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

async function admin() {
  const viewer = await getViewer();
  if (!viewer?.profile?.is_admin) throw new Error("管理者のみ実行できます");
  return { supabase: await createClient(), profile: viewer.profile };
}

async function guard<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

const refreshPublic = () => {
  revalidatePath("/", "layout");
};

// ---------------------------------------------------------------- shops

export async function importShopAction(input: string): Promise<Result<{ draft: ShopDraft; existingId: string | null }>> {
  return guard(async () => {
    const { supabase } = await admin();
    try {
      const draft = await importShop(input);
      const { data } = await supabase.from("shops").select("id").eq("source_url", draft.source_url!).maybeSingle();
      return { draft, existingId: data?.id ?? null };
    } catch (e) {
      if (e instanceof ImportError) throw e;
      console.error(e);
      throw new Error("読み取りに失敗しました。手動で入力してください。");
    }
  });
}

const ShopSchema = z.object({
  name: z.string().trim().min(1, "店名は必須です").max(120),
  genre: z.string().max(120),
  summary: z.string().max(2000),
  logo_url: z.string().nullable(),
  cover_url: z.string().nullable(),
  budget: z.string().max(120),
  address: z.string().max(300),
  access: z.string().max(500),
  hours: z.string().max(800),
  phone: z.string().max(40),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  rating: z.number().min(0).max(5).nullable(),
  review_count: z.number().int().nullable(),
  reviews: z.array(z.object({ author: z.string(), rating: z.number().nullable(), body: z.string(), date: z.string().optional() })).max(20),
  menu: z.array(z.object({ name: z.string(), price: z.string(), note: z.string().optional() })).max(100),
  photos: z.array(z.string()).max(30),
  source: z.enum(["tabelog", "hotpepper", "manual", "other"]),
  source_url: z.string().nullable(),
});

export async function saveShop(id: string | null, draft: ShopDraft): Promise<Result<{ id: string }>> {
  return guard(async () => {
    const { supabase } = await admin();
    const parsed = ShopSchema.parse({ ...draft, source_url: draft.source_url || null, logo_url: draft.logo_url || null, cover_url: draft.cover_url || null });
    const q = id
      ? supabase.from("shops").update(parsed).eq("id", id).select("id").single()
      : supabase.from("shops").insert(parsed).select("id").single();
    const { data, error } = await q;
    if (error?.code === "23505") throw new Error("このURLのお店はすでに登録されています");
    fail(error);
    revalidatePath("/admin/shops");
    refreshPublic();
    return { id: data!.id as string };
  });
}

export async function deleteShop(id: string): Promise<Result> {
  return guard(async () => {
    const { supabase } = await admin();
    fail((await supabase.from("shops").delete().eq("id", id)).error);
    revalidatePath("/admin/shops");
    refreshPublic();
    return undefined;
  });
}

// ---------------------------------------------------------------- events

const EventSchema = z.object({
  title: z.string().trim().min(1, "タイトルは必須です").max(120),
  slug: z.string().trim().regex(/^[a-z0-9-]{2,60}$/, "URLは半角英小文字・数字・ハイフン（2〜60文字）"),
  description: z.string().max(4000),
  area: z.string().max(120),
  start_time: z.string().max(20),
  budget_note: z.string().max(120),
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(400),
  deadline: z.string().nullable(),
  status: z.enum(["draft", "open", "closed", "decided"]),
});

export type EventInput = z.infer<typeof EventSchema>;

export async function saveEvent(id: string | null, input: EventInput, shopIds: string[]): Promise<Result<{ id: string }>> {
  return guard(async () => {
    const { supabase } = await admin();
    const ev = EventSchema.parse(input);
    ev.dates = [...new Set(ev.dates)].sort();
    const q = id
      ? supabase.from("events").update(ev).eq("id", id).select("id").single()
      : supabase.from("events").insert(ev).select("id").single();
    const { data, error } = await q;
    if (error?.code === "23505") throw new Error("このURLはすでに使われています");
    fail(error);
    const eventId = data!.id as string;

    fail((await supabase.from("event_shops").delete().eq("event_id", eventId)).error);
    if (shopIds.length) {
      fail(
        (await supabase.from("event_shops").insert(shopIds.map((shop_id, position) => ({ event_id: eventId, shop_id, position })))).error,
      );
    }
    revalidatePath("/admin/events");
    refreshPublic();
    return { id: eventId };
  });
}

export async function deleteEvent(id: string): Promise<Result> {
  return guard(async () => {
    const { supabase } = await admin();
    fail((await supabase.from("events").delete().eq("id", id)).error);
    revalidatePath("/admin/events");
    refreshPublic();
    return undefined;
  });
}

export async function setEventStatus(id: string, status: "draft" | "open" | "closed"): Promise<Result> {
  return guard(async () => {
    const { supabase } = await admin();
    const patch = status === "open" ? { status, decided_shop_id: null, decided_date: null } : { status };
    fail((await supabase.from("events").update(patch).eq("id", id)).error);
    revalidatePath(`/admin/events/${id}`);
    refreshPublic();
    return undefined;
  });
}

/** Lock in the final shop + date, and optionally email everyone who answered. */
export async function decideEvent(
  id: string,
  shopId: string,
  date: string,
  notify: boolean,
  note: string,
): Promise<Result<{ going: number; invited: number; mailed: number }>> {
  return guard(async () => {
    const { supabase } = await admin();
    const { error } = await supabase
      .from("events")
      .update({ status: "decided", decided_shop_id: shopId, decided_date: date })
      .eq("id", id);
    fail(error);
    // respondents who can make the date become attendees ("決定" mail), the rest get an invitation
    const result = await notifyDecision(id, note.trim(), notify);
    refreshPublic();
    revalidatePath(`/admin/events/${id}`);
    return result;
  });
}

// ---------------------------------------------------------------- taglines & settings

const TaglineSchema = z.object({
  line_ja: z.string().trim().min(1, "標語（日本語）は必須です").max(120),
  line_zh: z.string().max(120),
  caption_ja: z.string().max(200),
  caption_zh: z.string().max(200),
  is_active: z.boolean(),
  position: z.number().int(),
});

export async function saveTagline(id: string | null, input: z.infer<typeof TaglineSchema>): Promise<Result> {
  return guard(async () => {
    const { supabase } = await admin();
    const t = TaglineSchema.parse(input);
    fail((id ? await supabase.from("taglines").update(t).eq("id", id) : await supabase.from("taglines").insert(t)).error);
    revalidatePath("/admin/settings");
    refreshPublic();
    return undefined;
  });
}

export async function deleteTagline(id: string): Promise<Result> {
  return guard(async () => {
    const { supabase } = await admin();
    fail((await supabase.from("taglines").delete().eq("id", id)).error);
    revalidatePath("/admin/settings");
    refreshPublic();
    return undefined;
  });
}

/** Make exactly this tagline the active one. */
export async function activateOnlyTagline(id: string): Promise<Result> {
  return guard(async () => {
    const { supabase } = await admin();
    fail((await supabase.from("taglines").update({ is_active: false }).neq("id", id)).error);
    fail((await supabase.from("taglines").update({ is_active: true }).eq("id", id)).error);
    revalidatePath("/admin/settings");
    refreshPublic();
    return undefined;
  });
}

const SettingsSchema = z.object({
  brand: z.string().trim().min(1).max(40),
  brand_sub: z.string().max(40),
  notice_title: z.string().max(120),
  notice_body: z.string().max(4000),
  contact_url: z.string().max(300),
});

export async function saveSettings(input: z.infer<typeof SettingsSchema>): Promise<Result> {
  return guard(async () => {
    const { supabase } = await admin();
    const s = SettingsSchema.parse(input);
    const current = await getSettings();
    const noticeChanged = s.notice_title !== current.notice_title || s.notice_body !== current.notice_body;
    fail(
      (
        await supabase
          .from("site_settings")
          .update({ ...s, ...(noticeChanged ? { notice_updated_at: new Date().toISOString() } : {}) })
          .eq("id", 1)
      ).error,
    );
    refreshPublic();
    return undefined;
  });
}

// ---------------------------------------------------------------- members

export async function setMemberAdmin(profileId: string, value: boolean): Promise<Result> {
  return guard(async () => {
    const { supabase } = await admin();
    fail((await supabase.rpc("set_admin", { p_profile: profileId, p_value: value })).error);
    revalidatePath("/admin/members");
    return undefined;
  });
}

export async function renameMember(profileId: string, name: string): Promise<Result> {
  return guard(async () => {
    const { supabase } = await admin();
    const n = name.trim().slice(0, 40);
    if (!n) throw new Error("名前を入力してください");
    fail((await supabase.from("profiles").update({ display_name: n }).eq("id", profileId)).error);
    revalidatePath("/admin/members");
    refreshPublic();
    return undefined;
  });
}

// ---------------------------------------------------------------- archive

const ArchiveSchema = z.object({
  title: z.string().trim().min(1, "タイトルは必須です").max(120),
  held_on: z.string().nullable(),
  place: z.string().max(200),
  body: z.string().max(4000),
  images: z.array(z.string()).max(40),
  position: z.number().int(),
});

export async function saveArchive(id: string | null, input: z.infer<typeof ArchiveSchema>): Promise<Result> {
  return guard(async () => {
    const { supabase } = await admin();
    const a = ArchiveSchema.parse({ ...input, held_on: input.held_on || null });
    fail((id ? await supabase.from("archive_entries").update(a).eq("id", id) : await supabase.from("archive_entries").insert(a)).error);
    revalidatePath("/admin/archive");
    refreshPublic();
    return undefined;
  });
}

export async function deleteArchive(id: string): Promise<Result> {
  return guard(async () => {
    const { supabase } = await admin();
    fail((await supabase.from("archive_entries").delete().eq("id", id)).error);
    revalidatePath("/admin/archive");
    refreshPublic();
    return undefined;
  });
}
