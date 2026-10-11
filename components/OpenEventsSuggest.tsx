/* eslint-disable @next/next/no-img-element -- shop photos come from external CDNs */
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { Dict, Lang } from "@/lib/i18n";
import type { PublicEvent } from "@/lib/data";
import { isPast, remaining } from "@/lib/format";
import { AreaName } from "./EventFacts";

/** "Still recruiting" cards shown where a decided event used to show its vote form. */
export default function OpenEventsSuggest({ events, t, lang }: { events: PublicEvent[]; t: Dict["event"]; lang: Lang }) {
  void lang;
  return (
    <section className="mx-auto mt-4 max-w-6xl px-4 md:px-8">
      <header className="mb-6 flex items-end justify-between gap-4 border-t border-line pt-6">
        <div>
          <p className="flex items-center gap-2 font-display text-sm uppercase tracking-[0.3em] text-accent">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            Open call
          </p>
          <h2 className="mt-1 font-serif text-xl font-bold tracking-[0.1em] md:text-2xl">{t.otherOpen}</h2>
        </div>
      </header>
      {events.length === 0 ? (
        <p className="text-sm text-ink-2">{t.noOtherOpen}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => {
            const left = e.deadline && !isPast(e.deadline) ? remaining(e.deadline) : null;
            const covers = e.shops.map((s) => s.cover_url).filter(Boolean).slice(0, 3) as string[];
            return (
              <Link key={e.id} href={`/e/${e.slug}`} className="group card overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-soft">
                <div className="grid h-32 grid-cols-3 gap-0.5 bg-paper-2">
                  {covers.length ? (
                    covers.map((c, i) => (
                      <img key={i} src={c} alt="" loading="lazy" referrerPolicy="no-referrer" className={`h-full w-full object-cover ${covers.length === 1 ? "col-span-3" : covers.length === 2 && i === 0 ? "col-span-2" : ""}`} />
                    ))
                  ) : (
                    <span className="col-span-3" />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-accent px-2 py-0.5 text-accent-ink">{t.open}</span>
                    {left && <span className="font-medium text-accent">{t.closesIn(left)}</span>}
                  </div>
                  <p className="mt-2 font-serif text-lg font-bold leading-snug tracking-wide">{e.title}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-ink-2">
                    <span className="inline-flex items-center gap-1">
                      {e.area && (
                        <>
                          <MapPin size={12} className="text-muted" /> <AreaName area={e.area} />
                        </>
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-ink group-hover:text-accent">
                      {t.vote} <ArrowUpRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
