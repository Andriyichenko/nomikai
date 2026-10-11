import Link from "next/link";
import Splash from "@/components/Splash";
import Tagline from "@/components/Tagline";
import HeroMascot from "@/components/HeroMascot";
import NoticeCard from "@/components/NoticeCard";
import EventAccordion from "@/components/EventAccordion";
import ArchiveGallery from "@/components/ArchiveGallery";
import SetupNotice from "@/components/SetupNotice";
import { effectiveStatus } from "@/components/StatusPill";
import { getArchive, getPublicEvents, getResults, getSettings, getTaglines } from "@/lib/data";
import { getDict } from "@/lib/lang";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function Home() {
  const [{ lang, t }, settings, taglines, events, archive] = await Promise.all([
    getDict(),
    getSettings(),
    getTaglines(),
    getPublicEvents(),
    getArchive(8),
  ]);

  // Several active slogans rotate per visit; the splash and the hero share the same pick.
  const tl = taglines[Math.floor(Math.random() * taglines.length)];
  const line = tl ? (lang === "zh" && tl.line_zh) || tl.line_ja : "一緒に、いい夜を。";
  const caption = tl ? (lang === "zh" && tl.caption_zh) || tl.caption_ja : "";

  const open = events.filter((e) => effectiveStatus(e.status, e.deadline) === "open");
  const decided = events.filter((e) => e.status === "decided").slice(0, 3);

  const results = await Promise.all(open.map((e) => getResults(e.id)));
  const respondents = Object.fromEntries(open.map((e, i) => [e.id, results[i]?.respondents ?? 0]));
  const decidedShopNames = Object.fromEntries(
    decided.map((e) => [e.id, e.shops.find((s) => s.id === e.decided_shop_id)?.name ?? ""]),
  );

  return (
    <>
      <Splash line={line} caption={caption} brand={settings.brand} />

      <section className="mx-auto grid max-w-6xl items-end gap-6 px-4 pb-8 pt-8 md:grid-cols-[1fr_20rem] md:gap-10 md:px-8 md:pb-16 md:pt-16 lg:grid-cols-[1fr_24rem]">
        <div className="pb-2 md:pb-10">
          {!isSupabaseConfigured && <SetupNotice />}
          <div className="rise">
            <Tagline line={line} caption={caption} size="hero" />
          </div>
          <div className="rise mt-4 flex items-end justify-between gap-3 md:mt-10" style={{ animationDelay: "0.15s" }}>
            {open[0] ? (
              <Link href={`/e/${open[0].slug}`} className="btn btn-primary">
                {open[0].title} →
              </Link>
            ) : (
              <span />
            )}
            {/* phone: smaller and pulled up beside the caption so the row doesn't leave a gap */}
            <HeroMascot size="sm" className="-mb-1 -mt-11 w-28 shrink-0 md:hidden" />
          </div>
        </div>
        <HeroMascot className="rise hidden md:block" />
      </section>

      {(settings.notice_title || settings.notice_body) && (
        <section className="mx-auto max-w-6xl px-4 md:px-8">
          <NoticeCard
            title={settings.notice_title}
            body={settings.notice_body}
            updatedAt={settings.notice_updated_at}
            label={t.home.notice}
            more={t.home.readMore}
          />
        </section>
      )}

      <section className="mx-auto mt-16 max-w-6xl px-4 md:mt-24 md:px-8">
        <header className="mb-6 flex items-end justify-between gap-4 md:mb-8">
          <div>
            <p className="flex items-center gap-2 font-display text-sm uppercase tracking-[0.35em] text-accent">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
              Open call
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold tracking-[0.12em] md:text-5xl">{t.home.open}</h2>
          </div>
          {open.length > 0 && (
            <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full bg-accent text-accent-ink md:h-16 md:w-16">
              <span className="font-display text-2xl leading-none md:text-3xl">{open.length}</span>
              <span className="text-[10px] tracking-wider">{t.home.openCount(open.length).replace(/[\d\s]/g, "")}</span>
            </span>
          )}
        </header>
        {open.length ? (
          <EventAccordion events={open} respondents={respondents} lang={lang} t={t.event} group="open" />
        ) : (
          <p className="border-t border-line py-10 text-ink-2">{t.home.noOpen}</p>
        )}
      </section>

      {decided.length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl px-4 md:mt-24 md:px-8">
          {/* same scale as the "いま募集中" header so the two sections read as equals */}
          <header className="mb-6 flex items-end justify-between gap-4 md:mb-8">
            <div>
              <p className="flex items-center gap-2 font-display text-sm uppercase tracking-[0.35em] text-muted">
                <span className="h-2 w-2 rounded-full bg-ink" />
                Confirmed
              </p>
              <h2 className="mt-2 font-serif text-3xl font-bold tracking-[0.12em] md:text-5xl">{t.home.decided}</h2>
            </div>
            <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full bg-ink text-paper md:h-16 md:w-16">
              <span className="font-display text-2xl leading-none md:text-3xl">{decided.length}</span>
              <span className="text-[10px] tracking-wider">{t.home.openCount(decided.length).replace(/[\d\s]/g, "")}</span>
            </span>
          </header>
          <EventAccordion
            events={decided}
            respondents={{}}
            lang={lang}
            t={t.event}
            group="decided"
            decidedShopNames={decidedShopNames}
          />
        </section>
      )}

      {archive.length > 0 && (
        <ArchiveGallery entries={archive} title={t.home.archive} lead={t.home.archiveLead} viewAll={t.home.viewAll} />
      )}
    </>
  );
}
