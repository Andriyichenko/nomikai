import clsx from "clsx";
import { CalendarDays, Clock, Hourglass, MapPin, Wallet } from "lucide-react";
import type { Dict, Lang } from "@/lib/i18n";
import type { EventRow } from "@/lib/types";
import { deadlineLabel, isPast, remaining, shortDate } from "@/lib/format";

/**
 * The key facts of an event as a grid of labelled tiles — the same component on the home
 * accordion and the event page so the information always reads the same way.
 */
export default function EventFacts({
  event,
  lang,
  t,
  compact,
}: {
  event: EventRow;
  lang: Lang;
  t: Dict["event"];
  compact?: boolean;
}) {
  const d = event.dates;
  const left = event.deadline && !isPast(event.deadline) ? remaining(event.deadline) : null;

  const items: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string; strong?: boolean }[] = [];
  if (event.area)
    items.push({ icon: <MapPin size={15} />, label: t.area, value: <AreaName area={event.area} /> });
  if (!d.length)
    items.push({ icon: <CalendarDays size={15} />, label: t.period, value: t.freeDates, sub: t.freeDatesSub });
  else
    items.push({
      icon: <CalendarDays size={15} />,
      label: t.period,
      value: d.length === 1 ? shortDate(d[0], lang) : `${shortDate(d[0], lang)} 〜 ${shortDate(d[d.length - 1], lang)}`,
      sub: t.candidates(d.length),
    });
  if (event.deadline)
    items.push({
      icon: <Hourglass size={15} />,
      label: t.deadline,
      value: left && event.status === "open" ? t.closesIn(left) : t.closed,
      sub: deadlineLabel(event.deadline, lang),
      strong: Boolean(left) && event.status === "open",
    });
  if (event.start_time) items.push({ icon: <Clock size={15} />, label: t.time, value: `${event.start_time} 〜` });
  if (event.budget_note) items.push({ icon: <Wallet size={15} />, label: t.budget, value: event.budget_note });

  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">
      {items.map((it, i) => (
        <div
          key={i}
          className={clsx(
            "flex flex-col bg-card",
            compact ? "p-3.5" : "p-4 md:p-5",
            // first tile (area) spans the full width on phones so long place names never wrap awkwardly
            i === 0 && items.length % 2 === 1 && "col-span-2 md:col-span-1",
          )}
        >
          <dt className="flex items-center gap-1.5 text-[11px] tracking-wider text-muted">
            {it.icon}
            {it.label}
          </dt>
          <dd className={clsx("mt-1.5 font-serif font-bold leading-snug", compact ? "text-[15px]" : "text-base md:text-lg", it.strong && "text-accent")}>
            {it.value}
          </dd>
          {it.sub && <dd className="mt-0.5 text-[11px] text-muted">{it.sub}</dd>}
        </div>
      ))}
    </dl>
  );
}

/** "大阪 梅田" / "大阪・梅田" → small prefecture + large district. */
export function AreaName({ area }: { area: string }) {
  const parts = area.split(/[\s・/／]+/).filter(Boolean);
  if (parts.length < 2) return <>{area}</>;
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-[0.75em] font-medium text-ink-2">{parts[0]}</span>
      <span>{parts.slice(1).join(" ")}</span>
    </span>
  );
}
