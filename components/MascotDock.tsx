"use client";

/* eslint-disable @next/next/no-img-element -- tiny fixed sprite; next/image adds nothing here */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { ArrowUp, ChevronRight, X } from "lucide-react";
import { dictionaries, type Lang } from "@/lib/i18n";
import { remaining } from "@/lib/format";
import Smoke from "./Smoke";

export type DockEvent = {
  slug: string;
  title: string;
  deadline: string | null;
  shops: { id: string; name: string; cover_url: string | null }[];
};

const DOCK = { right: 12, bottom: 16, w: 72, h: 100 }; // mascot box in the corner
const EVENT_PAGE_LIFT = 76; // clear the sticky submit bar on /e/*
const HEADER = 64;

/**
 * The mascot follows you around. On the home page he only appears in the bottom-right corner
 * once the big hero mascot has scrolled completely out of view — dropping in with a "ドロン"
 * puff — and vanishes again when the hero comes back. Everywhere else he simply waits there.
 * Tap him for a small ninja menu.
 */
export default function MascotDock({ lang, events, loggedIn }: { lang: Lang; events: DockEvent[]; loggedIn: boolean }) {
  const t = dictionaries[lang].dock;
  const path = usePathname();
  const router = useRouter();
  const hidden = path.startsWith("/admin");
  const lift = path.startsWith("/e/") ? EVENT_PAGE_LIFT : 0;

  const [docked, setDocked] = useState(false);
  const [entry, setEntry] = useState(0); // bumps on every appearance to replay the drop + smoke
  const [open, setOpen] = useState(false);
  const [hop, setHop] = useState(0);
  // survives route changes, so moving between pages (or swiping back) doesn't replay the drop-in
  const current = useRef<boolean | null>(null);

  useEffect(() => {
    if (hidden) return;
    const hero = [...document.querySelectorAll<HTMLElement>("[data-mascot-hero]")].find((h) => h.getBoundingClientRect().width > 0);
    const check = () => {
      // docked when there is no hero, or the hero is entirely above the header
      const show = !hero || hero.getBoundingClientRect().bottom <= HEADER;
      if (show === current.current) return;
      current.current = show;
      setDocked(show);
      if (show) setEntry((n) => n + 1);
      else setOpen(false);
    };
    check();
    // Visibility of the hero drives it; the scroll listener is only a fallback (once per frame,
    // and only where there is a hero to measure).
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        check();
      });
    };
    const io = hero ? new IntersectionObserver(check, { rootMargin: `-${HEADER}px 0px 0px 0px`, threshold: 0 }) : null;
    if (hero && io) io.observe(hero);
    if (hero) window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      io?.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [path, hidden]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (hidden) return null;

  const setLang = (next: Lang) => {
    document.cookie = `lang=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };

  return (
    <>
      <div
        className={clsx("fixed z-40 transition-opacity duration-200", docked ? "opacity-100" : "pointer-events-none opacity-0")}
        style={{ right: DOCK.right, bottom: DOCK.bottom + lift, width: DOCK.w + 8, height: DOCK.h + 8 }}
        aria-hidden={!docked}
      >
        {/* seal */}
        <span
          className={clsx(
            "absolute bottom-0 right-1 h-14 w-14 rounded-full bg-accent shadow-soft transition-transform duration-300",
            docked ? "scale-100" : "scale-0",
          )}
        />
        <button
          type="button"
          aria-label={t.hello}
          aria-expanded={open}
          tabIndex={docked ? 0 : -1}
          onClick={() => {
            setOpen((o) => !o);
            setHop((n) => n + 1);
          }}
          className="absolute bottom-2 right-0 block"
          style={{ width: DOCK.w, height: DOCK.h }}
        >
          {docked && (
            <span key={`in-${entry}`} className="ninja-land absolute inset-0 block">
              <img
                key={`img-${hop}`}
                src="/mascot-sm-v3.webp"
                alt=""
                className={clsx("h-full w-full object-contain object-bottom drop-shadow-[0_6px_10px_rgba(23,22,20,0.25)]", hop > 0 && "pop")}
              />
            </span>
          )}
          {docked && (
            <span key={`smoke-${entry}`} className="absolute inset-0">
              <Smoke delay={0.35} scale={0.7} className="top-[40%]" />
            </span>
          )}
        </button>
      </div>

      {open && docked && (
        <>
          <button type="button" aria-label={t.close} className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-label={t.hello}
            className="menu-in fixed z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-line bg-card shadow-2xl"
            style={{ right: DOCK.right, bottom: DOCK.bottom + lift + DOCK.h + 18 }}
          >
            <header className="flex items-start justify-between gap-3 bg-ink px-5 py-4 text-paper">
              <div>
                <p className="glitch text-lg !text-paper not-italic" style={{ textShadow: "1px 1px 0 #fe1644, 2px 2px 0 #a8173a" }}>
                  {t.hello}
                </p>
                <p className="mt-0.5 text-[11px] text-paper/60">{t.sub}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label={t.close} className="-mr-1 p-1 text-paper/60 hover:text-paper">
                <X size={18} />
              </button>
            </header>

            <div className="max-h-[60dvh] overflow-y-auto">
              <section className="px-5 pt-4">
                <p className="eyebrow mb-2">{t.missions}</p>
                {events.length ? (
                  <ul className="space-y-1">
                    {events.map((e) => {
                      const left = e.deadline ? remaining(e.deadline) : null;
                      return (
                        <li key={e.slug}>
                          <Link
                            href={`/e/${e.slug}`}
                            onClick={() => setOpen(false)}
                            className="-mx-2 flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-paper-2"
                          >
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                            <span className="min-w-0 flex-1 truncate text-sm font-medium">{e.title}</span>
                            {left && <span className="shrink-0 text-[11px] text-accent">{t.left(left)}</span>}
                            <ChevronRight size={14} className="shrink-0 text-muted" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">{t.noMission}</p>
                )}
              </section>

              <Gacha events={events} lang={lang} onGo={() => setOpen(false)} />

              <nav className="mt-2 grid grid-cols-3 border-t border-line text-xs">
                <Link
                  href={loggedIn ? "/me" : `/login?next=${encodeURIComponent(path)}`}
                  onClick={() => setOpen(false)}
                  className="px-2 py-3 text-center hover:bg-paper-2"
                >
                  {loggedIn ? t.me : t.login}
                </Link>
                <span className="flex items-center justify-center gap-1 border-x border-line">
                  {(["ja", "zh"] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLang(l)}
                      className={clsx("rounded-full px-2 py-1", lang === l ? "bg-ink text-paper" : "text-muted hover:text-ink")}
                    >
                      {l === "ja" ? "JA" : "中"}
                    </button>
                  ))}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="flex items-center justify-center gap-1 px-2 py-3 hover:bg-paper-2"
                >
                  <ArrowUp size={12} /> {t.top}
                </button>
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/** "忍法・店選びの術": draws one candidate shop at random (with a smoke reveal). */
function Gacha({ events, lang, onGo }: { events: DockEvent[]; lang: Lang; onGo: () => void }) {
  const t = dictionaries[lang].dock;
  const pool = events.flatMap((e) => e.shops.map((s) => ({ ...s, slug: e.slug, event: e.title })));
  const [pick, setPick] = useState<(typeof pool)[number] | null>(null);
  const [n, setN] = useState(0);

  const cast = () => {
    if (!pool.length) return;
    let next = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1) while (next.id === pick?.id && next.slug === pick?.slug) next = pool[Math.floor(Math.random() * pool.length)];
    setPick(next);
    setN((x) => x + 1);
  };

  return (
    <section className="mx-5 mt-4 rounded-2xl border border-dashed border-line p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold">{t.gacha}</p>
          <p className="text-[11px] text-muted">{t.gachaHint}</p>
        </div>
        <button type="button" onClick={cast} disabled={!pool.length} className="btn btn-accent !min-h-8 shrink-0 !px-3 text-xs">
          {pick ? t.gachaAgain : t.gachaGo}
        </button>
      </div>
      {!pool.length && <p className="mt-2 text-xs text-muted">{t.gachaNone}</p>}
      {pick && (
        <Link key={n} href={`/e/${pick.slug}`} onClick={onGo} className="relative mt-3 flex items-center gap-3 overflow-hidden rounded-xl bg-paper-2 p-2">
          <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-line">
            {pick.cover_url && <img src={pick.cover_url} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />}
          </span>
          <span className="pop min-w-0 flex-1" style={{ animationDelay: "0.25s" }}>
            <span className="block truncate font-serif text-sm font-bold">{pick.name}</span>
            <span className="block truncate text-[11px] text-muted">{pick.event}</span>
            <span className="mt-0.5 block text-[11px] text-accent">{t.see} →</span>
          </span>
          <Smoke scale={0.9} />
        </Link>
      )}
    </section>
  );
}
