import { getEventBySlug } from "@/lib/data";

/** iCalendar file for a decided event (2.5h block in JST). */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const data = await getEventBySlug((await params).slug);
  if (!data?.event.decided_date) return new Response("Not decided", { status: 404 });
  const { event, shops } = data;
  const shop = shops.find((s) => s.id === event.decided_shop_id);

  const [h, m] = (event.start_time.match(/^(\d{1,2}):(\d{2})/)?.slice(1) ?? ["19", "00"]).map(Number);
  const start = new Date(`${event.decided_date}T00:00:00+09:00`);
  start.setTime(start.getTime() + (h * 60 + m) * 60_000);
  const end = new Date(start.getTime() + 150 * 60_000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s: string) => s.replace(/[\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//nomikai//JP",
    "BEGIN:VEVENT",
    `UID:${event.id}@nomikai`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${esc(event.title)}`,
    shop ? `LOCATION:${esc(`${shop.name} ${shop.address}`)}` : "",
    shop?.source_url ? `URL:${shop.source_url}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return new Response(ics, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="${event.slug}.ics"`,
    },
  });
}
