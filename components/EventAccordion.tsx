/* eslint-disable @next/next/no-img-element -- shop photos come from external CDNs */
import Link from "next/link";
import { ArrowRight, ChevronDown, MapPin, Users } from "lucide-react";
import type { Dict, Lang } from "@/lib/i18n";
import type { PublicEvent } from "@/lib/data";
import { isPast, longDate, remaining } from "@/lib/format";
import StatusPill from "./StatusPill";
import EventFacts, { AreaName } from "./EventFacts";

/**
 * Collapsible list of events. Native <details name> makes it an exclusive accordion
 * (opening one closes the others) with zero JavaScript.
 */
export default function EventAccordion({
  events,
  respondents,
  lang,
  t,
  group,
  decidedShopNames = {},
}: {
  events: PublicEvent[];
  respondents: Record<string, number>;
  lang: Lang;
  t: Dict["event"];
  group: string;
  decidedShopNames?: Record<string, string>;
}) {
  return (
    <div className="border-t border-line">
      {events.map((e, i) => {
        const left = e.deadline && !isPast(e.deadline) ? remaining(e.deadline) : null;
        const decided = e.status === "decided" && e.decided_date;
        return (
          <details key={e.id} name={group} open={i === 0} className="group border-b border-line">
            <summary className="flex cursor-pointer list-none items-center gap-4 py-5 md:gap-8 md:py-7 [&::-webkit-details-marker]:hidden">
              <span className="w-10 shrink-0 font-display text-3xl leading-none text-muted transition-colors group-open:text-accent md:w-16 md:text-5xl">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <StatusPill status={e.status} deadline={e.deadline} t={t} />
                  {left && e.status === "open" && <span className="text-xs font-medium text-accent">{t.closesIn(left)}</span>}
                </span>
                <span className="mt-1.5 block font-serif text-lg font-bold leading-snug tracking-wide md:text-2xl">{e.title}</span>
                <span className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2 md:text-sm">
                  {decided ? (
                    <span>
                      <span className="text-accent">●</span> {longDate(e.decided_date!, lang)}
                      {e.start_time && ` ${e.start_time}`}
                      {decidedShopNames[e.id] && ` ・ ${decidedShopNames[e.id]}`}
                    </span>
                  ) : (
                    <>
                      {e.area && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={12} className="text-muted" />
                          <AreaName area={e.area} />
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Users size={12} className="text-muted" />
                        {t.people(respondents[e.id] ?? 0)}
                      </span>
                    </>
                  )}
                </span>
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line transition-transform duration-300 group-open:rotate-180 group-open:border-ink">
                <ChevronDown size={16} />
              </span>
            </summary>

            <div className="pb-8 md:pl-24">
              <EventFacts event={e} lang={lang} t={t} compact />

              {e.shops.length > 0 && (
                <div className="mt-5">
                  <p className="mb-2 text-[11px] tracking-wider text-muted">
                    {t.shopsShort} — {e.shops.length}
                  </p>
                  <div className="-mx-4 flex snap-x gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1 md:mx-0 md:px-0">
                    {e.shops.map((s) => (
                      <div key={s.id} className="w-36 shrink-0 snap-start md:w-44">
                        <div className="aspect-[4/3] overflow-hidden rounded-xl bg-paper-2">
                          {s.cover_url && <img src={s.cover_url} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" />}
                        </div>
                        <p className="mt-1.5 truncate text-xs font-medium">{s.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Link href={`/e/${e.slug}`} className="btn btn-primary mt-6 w-full sm:w-auto sm:px-8">
                {e.status === "open" && !isPast(e.deadline) ? t.vote : t.view} <ArrowRight size={16} />
              </Link>
            </div>
          </details>
        );
      })}
    </div>
  );
}
