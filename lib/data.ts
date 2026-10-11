import "server-only";
import { cache } from "react";
import { createClient } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/env";
import type {
  ArchiveEntry, EventResults, EventRow, Profile, Response, Shop, SiteSettings, Tagline,
} from "./types";

const DEFAULT_SETTINGS: SiteSettings = {
  brand: "バース人材",
  brand_sub: "飲み会",
  notice_title: "",
  notice_body: "",
  notice_updated_at: null,
  contact_url: "https://contact.andreyis.com",
};

export const getViewer = cache(async (): Promise<{ userId: string; profile: Profile | null } | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, email, display_name, avatar_url, is_admin")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  return { userId: user.id, profile: data as Profile | null };
});

export const getSettings = cache(async (): Promise<SiteSettings> => {
  if (!isSupabaseConfigured) return DEFAULT_SETTINGS;
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  return (data as SiteSettings | null) ?? DEFAULT_SETTINGS;
});

export const getTaglines = cache(async (activeOnly = true): Promise<Tagline[]> => {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  let q = supabase.from("taglines").select("*").order("position").order("created_at");
  if (activeOnly) q = q.eq("is_active", true);
  const { data } = await q;
  return (data as Tagline[]) ?? [];
});

export type ShopThumb = Pick<Shop, "id" | "name" | "logo_url" | "cover_url">;
export type PublicEvent = EventRow & { shops: ShopThumb[] };

export const getPublicEvents = cache(async (): Promise<PublicEvent[]> => {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*, event_shops(position, shops(id, name, logo_url, cover_url))")
    .neq("status", "draft")
    .order("created_at", { ascending: false });
  type Row = EventRow & { event_shops: { position: number; shops: ShopThumb | null }[] };
  return ((data ?? []) as Row[]).map(({ event_shops, ...e }) => ({
    ...e,
    shops: [...(event_shops ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((l) => l.shops)
      .filter((x): x is ShopThumb => Boolean(x)),
  }));
});

export async function getShopsByIds(ids: string[]): Promise<Shop[]> {
  if (!ids.length) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("shops").select("*").in("id", ids);
  return (data as Shop[]) ?? [];
}

export const getEventBySlug = cache(async (slug: string) => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
  if (!event) return null;
  const { data: links } = await supabase
    .from("event_shops")
    .select("position, shops(*)")
    .eq("event_id", event.id)
    .order("position");
  const shops = ((links ?? []) as unknown as { shops: Shop }[]).map((l) => l.shops).filter(Boolean);
  return { event: event as EventRow, shops };
});

export async function getResults(eventId: string): Promise<EventResults | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("event_results", { p_event: eventId });
  return (data as EventResults | null) ?? null;
}

export async function getMyResponse(eventId: string, profileId: string): Promise<Response | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("responses")
    .select("*")
    .eq("event_id", eventId)
    .eq("profile_id", profileId)
    .maybeSingle();
  return (data as Response | null) ?? null;
}

export async function getArchive(limit?: number): Promise<ArchiveEntry[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  let q = supabase.from("archive_entries").select("*").order("held_on", { ascending: false, nullsFirst: false });
  if (limit) q = q.limit(limit);
  const { data } = await q;
  return (data as ArchiveEntry[]) ?? [];
}

export async function getAttendees(eventId: string): Promise<{ name: string; avatar: string | null }[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("event_attendees", { p_event: eventId });
  return (data as { name: string; avatar: string | null }[] | null) ?? [];
}

export async function getMyAttendance(eventId: string, profileId: string): Promise<"going" | "declined" | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("attendees")
    .select("status")
    .eq("event_id", eventId)
    .eq("profile_id", profileId)
    .maybeSingle();
  return (data?.status as "going" | "declined" | undefined) ?? null;
}
