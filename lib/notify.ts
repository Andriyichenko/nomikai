import "server-only";
import { createAdminClient } from "./supabase/admin";
import { attendLink, siteUrl } from "./links";
import { longDate, todayJST } from "./format";
import { mapUrl } from "./shop-utils";
import { getSettings } from "./data";
import { decidedGoingMail, decidedInviteMail, dayOfMail } from "./email/templates";
import { sendMails, type Mail } from "./mail";
import type { EventRow, Shop } from "./types";

type Person = { id: string; email: string | null; display_name: string };

async function context(eventId: string) {
  const db = createAdminClient();
  const { data: ev } = await db.from("events").select("*").eq("id", eventId).single();
  if (!ev) throw new Error("event not found");
  const event = ev as EventRow;
  const { data: shop } = event.decided_shop_id
    ? await db.from("shops").select("*").eq("id", event.decided_shop_id).single()
    : { data: null };
  const settings = await getSettings();
  const site = siteUrl();
  const s = shop as Shop | null;
  const base = {
    brand: `${settings.brand} ${settings.brand_sub}`,
    event: { title: event.title, url: `${site}/e/${event.slug}` },
    when: `${event.decided_date ? longDate(event.decided_date, "ja") : ""}${event.start_time ? ` ${event.start_time}〜` : ""}`,
    shop: s ? { name: s.name, address: s.address, mapUrl: mapUrl(s) } : null,
    budget: event.budget_note,
    icsUrl: `${site}/e/${event.slug}/ics`,
    site,
  };
  return { db, event, shop: s, base, fromName: base.brand };
}

/**
 * After a decision: respondents who can make the decided date become attendees and get a
 * "決定" mail; everyone else who answered gets an invitation with one-click join/decline links.
 * Re-deciding resets the attendee list (the date may have changed).
 */
export async function notifyDecision(eventId: string, note: string, sendMail: boolean) {
  const { db, event, base, fromName } = await context(eventId);
  if (!event.decided_date) throw new Error("not decided");

  const { data: rows } = await db
    .from("responses")
    .select("dates, profiles(id, email, display_name)")
    .eq("event_id", eventId);
  const people = (rows ?? []).map((r) => ({ dates: r.dates as string[], p: r.profiles as unknown as Person }));
  const going = people.filter((x) => x.dates.includes(event.decided_date!));
  const others = people.filter((x) => !x.dates.includes(event.decided_date!));

  await db.from("attendees").delete().eq("event_id", eventId);
  if (going.length) {
    const { error } = await db
      .from("attendees")
      .insert(going.map((x) => ({ event_id: eventId, profile_id: x.p.id, status: "going", source: "vote" })));
    if (error) throw new Error(error.message);
  }
  if (!sendMail) return { going: going.length, invited: others.length, mailed: 0 };

  const mails: Mail[] = [];
  for (const x of going) {
    if (!x.p.email) continue;
    mails.push({ to: x.p.email, ...decidedGoingMail({ ...base, name: x.p.display_name, note }) });
  }
  for (const x of others) {
    if (!x.p.email) continue;
    mails.push({
      to: x.p.email,
      ...decidedInviteMail({
        ...base,
        name: x.p.display_name,
        note,
        joinUrl: attendLink(base.site, event.slug, eventId, x.p.id, "yes"),
        declineUrl: attendLink(base.site, event.slug, eventId, x.p.id, "no"),
      }),
    });
  }
  const mailed = await sendMails(mails, fromName);
  return { going: going.length, invited: others.length, mailed };
}

/** Morning-of reminder: every 'going' attendee of today's decided events, once. */
export async function sendDayOfReminders({ dryRun = false } = {}) {
  const db = createAdminClient();
  const today = todayJST();
  const { data: events } = await db.from("events").select("id").eq("status", "decided").eq("decided_date", today);
  const report: { event: string; sent: number; skipped: number }[] = [];

  for (const { id } of events ?? []) {
    const { base, fromName, shop } = await context(id);
    const { data: rows } = await db
      .from("attendees")
      .select("profile_id, profiles(id, email, display_name)")
      .eq("event_id", id)
      .eq("status", "going")
      .is("reminded_at", null);
    const list = (rows ?? []).map((r) => r.profiles as unknown as Person).filter((p) => p?.email);
    if (dryRun) {
      report.push({ event: base.event.title, sent: 0, skipped: list.length });
      continue;
    }
    let sent = 0;
    for (const p of list) {
      const mail = dayOfMail({ ...base, name: p.display_name, note: "", access: shop?.access ?? "" });
      if (await sendMails([{ to: p.email!, ...mail }], fromName)) {
        sent++;
        await db.from("attendees").update({ reminded_at: new Date().toISOString() }).eq("event_id", id).eq("profile_id", p.id);
      }
    }
    report.push({ event: base.event.title, sent, skipped: list.length - sent });
  }
  return { date: today, events: report };
}
