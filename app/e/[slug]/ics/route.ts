import { getEventBySlug } from "@/lib/data";
import { buildIcs } from "@/lib/ics";
import { siteUrl } from "@/lib/links";

/** iCalendar file for a decided event (2.5h block in JST). */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const data = await getEventBySlug((await params).slug);
  if (!data?.event.decided_date) return new Response("Not decided", { status: 404 });
  const { event, shops } = data;
  const shop = shops.find((s) => s.id === event.decided_shop_id);

  return new Response(buildIcs(event, shop, `${siteUrl()}/e/${event.slug}`), {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      // inline (not attachment): iOS Safari / in-app browsers then offer "add to calendar"
      // directly instead of saving a file
      "content-disposition": `inline; filename="${event.slug}.ics"`,
    },
  });
}
