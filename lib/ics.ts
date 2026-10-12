import type { EventRow, Shop } from "./types";

type CalEvent = Pick<EventRow, "id" | "title" | "decided_date" | "start_time">;
type CalShop = Pick<Shop, "name" | "address" | "source_url"> | null | undefined;

/** Start / end of a decided event: start_time (default 19:00) JST, 2.5h block. */
function span(event: CalEvent) {
  const [h, m] = (event.start_time.match(/^(\d{1,2}):(\d{2})/)?.slice(1) ?? ["19", "00"]).map(Number);
  const start = new Date(`${event.decided_date}T00:00:00+09:00`);
  start.setTime(start.getTime() + (h * 60 + m) * 60_000);
  return { start, end: new Date(start.getTime() + 150 * 60_000) };
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const location = (shop: CalShop) => (shop ? `${shop.name} ${shop.address}`.trim() : "");

/** iCalendar text — served by /e/[slug]/ics and attached to the decision mails. */
export function buildIcs(event: CalEvent, shop: CalShop, url?: string) {
  const { start, end } = span(event);
  const esc = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//nomikai//JP",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@nomikai`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(event.title)}`,
    shop ? `LOCATION:${esc(location(shop))}` : "",
    url ? `URL:${url}` : shop?.source_url ? `URL:${shop.source_url}` : "",
    url ? `DESCRIPTION:${esc(url)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

/**
 * "Add to Google Calendar" link. Opens the Calendar app / page directly, so it does not depend
 * on which browser the mail app picks.
 */
export function googleCalendarUrl(event: CalEvent, shop: CalShop, url: string) {
  const { start, end } = span(event);
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${stamp(start)}/${stamp(end)}`,
    details: url,
    location: location(shop),
    ctz: "Asia/Tokyo",
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}
