import Link from "next/link";
import { notFound } from "next/navigation";
import EventEditor from "@/components/admin/EventEditor";
import DecidePanel from "@/components/admin/DecidePanel";
import Avatar from "@/components/Avatar";
import { createClient } from "@/lib/supabase/server";
import { getResults } from "@/lib/data";
import { mailConfigured } from "@/lib/mail";
import { shortDate, todayJST } from "@/lib/format";
import type { EventInput } from "@/app/admin/actions";
import type { EventRow, Shop } from "@/lib/types";

export default async function AdminEvent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: lib } = await supabase.from("shops").select("id, name, genre, logo_url").order("created_at", { ascending: false });
  const library = (lib ?? []) as Pick<Shop, "id" | "name" | "genre" | "logo_url">[];

  if (id === "new") {
    const initial: EventInput = {
      title: "",
      slug: `${todayJST().slice(0, 7)}-${Math.random().toString(36).slice(2, 6)}`,
      description: "",
      area: "",
      start_time: "19:00",
      budget_note: "",
      dates: [],
      deadline: null,
      status: "open",
    };
    return (
      <div>
        <Link href="/admin/events" className="text-sm text-muted hover:text-ink">← 会の一覧</Link>
        <h2 className="mb-10 mt-4 font-serif text-2xl font-bold tracking-wide">新しい会</h2>
        <EventEditor id={null} initial={initial} initialShopIds={[]} library={library} />
      </div>
    );
  }

  const { data: ev } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (!ev) notFound();
  const event = ev as EventRow;
  const [{ data: links }, results] = await Promise.all([
    supabase.from("event_shops").select("shop_id").eq("event_id", id).order("position"),
    getResults(id),
  ]);
  const shopIds = (links ?? []).map((l) => l.shop_id as string);
  const shopName = (sid: string) => library.find((s) => s.id === sid)?.name ?? "—";

  const initial: EventInput = {
    title: event.title,
    slug: event.slug,
    description: event.description,
    area: event.area,
    start_time: event.start_time,
    budget_note: event.budget_note,
    dates: event.dates,
    deadline: event.deadline,
    status: event.status,
  };

  return (
    <div className="space-y-16">
      <div>
        <Link href="/admin/events" className="text-sm text-muted hover:text-ink">← 会の一覧</Link>
        <h2 className="mt-4 font-serif text-2xl font-bold tracking-wide">{event.title}</h2>
      </div>

      <DecidePanel
        eventId={event.id}
        status={event.status}
        shops={shopIds.map((sid) => ({ id: sid, name: shopName(sid) }))}
        dates={event.dates}
        results={results}
        decidedShopId={event.decided_shop_id}
        decidedDate={event.decided_date}
        mailReady={mailConfigured}
      />

      {results && results.people.length > 0 && (
        <section>
          <h3 className="eyebrow mb-4">回答一覧（{results.people.length}）</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr className="border-b border-line">
                  <th className="py-2 pr-4 font-normal">名前</th>
                  <th className="py-2 pr-4 font-normal">お店</th>
                  <th className="py-2 pr-4 font-normal">日程</th>
                  <th className="py-2 font-normal">ひとこと</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {results.people.map((p, i) => (
                  <tr key={i} className="align-top">
                    <td className="py-3 pr-4"><span className="flex items-center gap-2"><Avatar name={p.name} src={p.avatar} size={24} />{p.name}</span></td>
                    <td className="py-3 pr-4 text-ink-2">{p.shops.map(shopName).join("、") || "—"}</td>
                    <td className="py-3 pr-4 text-ink-2">{p.dates.map((d) => shortDate(d, "ja")).join(" ") || "—"}</td>
                    <td className="py-3 text-ink-2">{p.comment || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <EventEditor id={event.id} initial={initial} initialShopIds={shopIds} library={library} />
    </div>
  );
}
