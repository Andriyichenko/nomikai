import Link from "next/link";
import { Plus } from "lucide-react";
import StatusPill from "@/components/StatusPill";
import { createClient } from "@/lib/supabase/server";
import { dictionaries } from "@/lib/i18n";
import { deadlineLabel } from "@/lib/format";
import type { EventRow } from "@/lib/types";

export default async function AdminEvents() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*, event_shops(count), responses(count)")
    .order("created_at", { ascending: false });
  const events = (data ?? []) as (EventRow & { event_shops: { count: number }[]; responses: { count: number }[] })[];
  const t = dictionaries.ja.event;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="eyebrow">すべての会（{events.length}）</h2>
        <Link href="/admin/events/new" className="btn btn-primary"><Plus size={16} /> 新しい会</Link>
      </div>
      <ul className="divide-y divide-line border-y border-line">
        {events.map((e) => (
          <li key={e.id}>
            <Link href={`/admin/events/${e.id}`} className="grid gap-2 py-5 hover:bg-paper-2/50 md:grid-cols-[1fr_auto] md:items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <StatusPill status={e.status} deadline={e.deadline} t={t} />
                  <span className="truncate font-serif text-lg font-bold">{e.title}</span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  /e/{e.slug} ・ 候補店 {e.event_shops?.[0]?.count ?? 0} ・ 候補日 {e.dates.length}
                  {e.deadline && ` ・ 締切 ${deadlineLabel(e.deadline)}`}
                </p>
              </div>
              <span className="text-sm text-ink-2">{e.responses?.[0]?.count ?? 0}人回答</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
