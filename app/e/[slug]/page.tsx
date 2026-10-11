import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CalendarPlus, MapPin } from "lucide-react";
import VoteForm from "@/components/VoteForm";
import ResultsBoard from "@/components/ResultsBoard";
import EventFacts from "@/components/EventFacts";
import ShopLogo from "@/components/ShopLogo";
import StatusPill, { effectiveStatus } from "@/components/StatusPill";
import { mapUrl } from "@/lib/shop-utils";
import { getAttendees, getEventBySlug, getMyAttendance, getMyResponse, getResults, getViewer } from "@/lib/data";
import AttendanceBox from "@/components/AttendanceBox";
import { getDict } from "@/lib/lang";
import { isPast, longDate, remaining, todayJST } from "@/lib/format";

type Params = { params: Promise<{ slug: string }>; searchParams?: Promise<{ attend?: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const data = await getEventBySlug((await params).slug);
  return data ? { title: data.event.title, description: data.event.description.slice(0, 120) } : {};
}

export default async function EventPage({ params, searchParams }: Params) {
  const { slug } = await params;
  const data = await getEventBySlug(slug);
  if (!data) notFound();
  const { event, shops } = data;

  const [{ lang, t }, viewer, results] = await Promise.all([getDict(), getViewer(), getResults(event.id)]);
  const mine = viewer?.profile ? await getMyResponse(event.id, viewer.profile.id) : null;
  const isDecided = event.status === "decided" && Boolean(event.decided_date);
  const [attendees, myAttendance] = isDecided
    ? await Promise.all([getAttendees(event.id), viewer?.profile ? getMyAttendance(event.id, viewer.profile.id) : null])
    : [[], null];
  const attendState = (await searchParams)?.attend as keyof typeof t.event.attendBanner | undefined;

  const status = effectiveStatus(event.status, event.deadline);
  const isOpen = status === "open";
  const left = event.deadline && !isPast(event.deadline) ? remaining(event.deadline) : null;
  const decidedShop = shops.find((s) => s.id === event.decided_shop_id);

  const shopCounts = Object.fromEntries((results?.shops ?? []).map((s) => [s.shop_id, s.count]));
  const dateCounts = Object.fromEntries((results?.dates ?? []).map((d) => [d.date, d.count]));

  return (
    // bottom padding keeps the last section clear of the sticky submit bar
    <article className="pb-28">
      {attendState && t.event.attendBanner[attendState] && (
        <div
          className={`mx-auto mt-6 max-w-6xl px-4 md:px-8`}
        >
          <p className={`rounded-2xl px-5 py-3 text-sm ${attendState === "yes" ? "bg-ink text-paper" : "border border-line bg-card text-ink-2"}`}>
            {t.event.attendBanner[attendState]}
          </p>
        </div>
      )}
      <header className="mx-auto max-w-6xl px-4 pb-14 pt-12 md:px-8 md:pb-20 md:pt-20">
        <div className="rise flex flex-wrap items-center gap-2">
          <StatusPill status={event.status} deadline={event.deadline} t={t.event} />
          {isOpen && left && <span className="chip">{t.event.closesIn(left)}</span>}
        </div>
        <h1 className="rise mt-5 max-w-4xl font-serif text-[clamp(1.9rem,5vw,3.4rem)] font-bold leading-[1.3] tracking-[0.06em] [text-wrap:balance]">
          {event.title}
        </h1>

        <div className="rise mt-8" style={{ animationDelay: "0.1s" }}>
          <EventFacts event={event} lang={lang} t={t.event} />
        </div>

        {event.description && (
          <p className="rise mt-8 max-w-2xl whitespace-pre-line text-[15px] leading-loose text-ink-2" style={{ animationDelay: "0.15s" }}>
            {event.description}
          </p>
        )}
      </header>

      {status === "decided" && event.decided_date && (
        <section className="mx-auto mb-16 max-w-6xl px-4 md:px-8">
          <div className="relative overflow-hidden rounded-[1.5rem] bg-ink p-6 text-paper md:p-10">
            <p className="font-display text-sm uppercase tracking-[0.3em] text-paper/60">Confirmed</p>
            <div className="mt-6 grid gap-8 md:grid-cols-2">
              <div>
                <p className="text-xs text-paper/60">{t.event.finalDate}</p>
                <p className="mt-1 font-serif text-2xl font-bold tracking-wide md:text-3xl">
                  {longDate(event.decided_date, lang)}
                </p>
                {event.start_time && <p className="mt-1 font-display text-2xl">{event.start_time} —</p>}
              </div>
              {decidedShop && (
                <div className="flex items-start gap-4">
                  <ShopLogo shop={decidedShop} size={56} />
                  <div className="min-w-0">
                    <p className="text-xs text-paper/60">{t.event.finalShop}</p>
                    <p className="mt-1 font-serif text-2xl font-bold tracking-wide">{decidedShop.name}</p>
                    {decidedShop.address && <p className="mt-1 text-sm text-paper/70">{decidedShop.address}</p>}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={`/e/${event.slug}/ics`} className="btn bg-paper text-ink hover:bg-accent hover:text-accent-ink">
                <CalendarPlus size={16} /> {t.event.addCalendar}
              </a>
              {decidedShop && (
                <a href={mapUrl(decidedShop)} target="_blank" rel="noreferrer" className="btn border border-paper/30 text-paper hover:border-paper">
                  <MapPin size={16} /> {t.event.map}
                </a>
              )}
            </div>
            <AttendanceBox
              eventId={event.id}
              slug={event.slug}
              people={attendees}
              mine={myAttendance}
              loggedIn={Boolean(viewer?.profile)}
              canChange={event.decided_date! >= todayJST()}
              lang={lang}
            />
          </div>
        </section>
      )}

      <VoteForm
        eventId={event.id}
        slug={event.slug}
        shops={shops}
        dates={event.dates}
        shopCounts={shopCounts}
        dateCounts={dateCounts}
        mine={mine}
        loggedIn={Boolean(viewer?.profile)}
        isOpen={isOpen}
        lang={lang}
      />

      <ResultsBoard
        people={results?.people ?? []}
        shops={shops.map((s) => ({ id: s.id, name: s.name, logo_url: s.logo_url }))}
        dates={event.dates}
        lang={lang}
      />
    </article>
  );
}
