"use client";

/* eslint-disable @next/next/no-img-element -- the flying sprite is positioned per frame; next/image adds nothing here */
import { useCallback, useEffect, useRef, useState } from "react";
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

const SCROLL_RANGE = 380; // px of scrolling over which the hero mascot shrinks into the dock
const DOCK = { right: 12, bottom: 16, w: 72, h: 100 }; // mascot box when docked
const EVENT_PAGE_LIFT = 76; // clear the sticky submit bar on /e/*

type Rect = { x: number; y: number; w: number; h: number };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * The mascot follows you around. On the home page he lifts out of the hero and shrinks into
 * the bottom-right corner as you scroll (with ninja after-images, and a "ドロン" puff on
 * arrival); everywhere else he simply waits there. Tap him for a small ninja menu.
 */
export default function MascotDock({ lang, events, loggedIn }: { lang: Lang; events: DockEvent[]; loggedIn: boolean }) {
  const t = dictionaries[lang].dock;
  const path = usePathname();
  const router = useRouter();
  const hidden = path.startsWith("/admin");
  const lift = path.startsWith("/e/") ? EVENT_PAGE_LIFT : 0;

  const flyRef = useRef<HTMLDivElement>(null);
  const ghostRefs = [useRef<HTMLImageElement>(null), useRef<HTMLImageElement>(null)];
  const heroRef = useRef<HTMLElement | null>(null);
  const ghostP = useRef([1, 1]);
  const raf = useRef(0);
  const [docked, setDocked] = useState(true);
  const [poof, setPoof] = useState(0);
  const [open, setOpen] = useState(false);
  const [hop, setHop] = useState(0);
  const reduced = useRef(false);

  const dockRect = useCallback((): Rect => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return { x: vw - DOCK.right - DOCK.w - 6, y: vh - DOCK.bottom - lift - DOCK.h - 10, w: DOCK.w, h: DOCK.h };
  }, [lift]);

  const place = (el: HTMLElement | null, r: Rect) => {
    if (!el) return;
    el.style.transform = `translate3d(${r.x}px, ${r.y}px, 0)`;
    el.style.width = `${r.w}px`;
    el.style.height = `${r.h}px`;
  };

  // Main loop: map scroll position → progress → interpolated rect between hero and dock.
  useEffect(() => {
    if (hidden) return;
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const heroes = [...document.querySelectorAll<HTMLElement>("[data-mascot-hero]")];
    heroRef.current = heroes.find((h) => h.getBoundingClientRect().width > 0) ?? null;
    let wasDocked = !heroRef.current || window.scrollY >= SCROLL_RANGE;
    setDocked(wasDocked);

    const frame = () => {
      const hero = heroRef.current;
      const p = hero ? Math.min(1, Math.max(0, window.scrollY / SCROLL_RANGE)) : 1;
      const d = dockRect();
      const rectAt = (q: number): Rect => {
        if (!hero || q >= 1) return d;
        const h = hero.getBoundingClientRect();
        const e = ease(q);
        return { x: lerp(h.left, d.x, e), y: lerp(h.top, d.y, e), w: lerp(h.width, d.w, e), h: lerp(h.height, d.h, e) };
      };
      place(flyRef.current, rectAt(p));
      if (hero) hero.style.visibility = p > 0 ? "hidden" : "";
      if (flyRef.current) flyRef.current.style.visibility = hero && p <= 0 ? "hidden" : "";

      // after-images trail behind while moving
      let moving = false;
      ghostRefs.forEach((g, i) => {
        const k = i === 0 ? 0.28 : 0.14;
        ghostP.current[i] += (p - ghostP.current[i]) * k;
        if (Math.abs(p - ghostP.current[i]) < 0.002) ghostP.current[i] = p;
        else moving = true;
        const el = g.current;
        if (!el) return;
        // only while he is visibly shrinking, and faint — a hint of motion, not a second mascot
        const show = !reduced.current && hero && Math.abs(p - ghostP.current[i]) > 0.02 && p > 0.12 && p < 1;
        el.style.opacity = show ? (i === 0 ? "0.22" : "0.1") : "0";
        place(el, rectAt(ghostP.current[i]));
      });

      const isDocked = p >= 1;
      if (isDocked !== wasDocked) {
        wasDocked = isDocked;
        setDocked(isDocked);
        if (isDocked) setPoof((n) => n + 1);
        if (!isDocked) setOpen(false);
      }
      // follow-up frames only animate the after-images catching up
      raf.current = moving ? requestAnimationFrame(frame) : 0;
    };
    // Scroll events already arrive at most once per frame, so position synchronously; a pending
    // follow-up frame is replaced rather than waited on (rAF can be throttled in iframes/background).
    const kick = () => {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
      frame();
    };
    ghostP.current = [window.scrollY / SCROLL_RANGE, window.scrollY / SCROLL_RANGE].map((v) => Math.min(1, Math.max(0, heroRef.current ? v : 1)));
    kick();
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    // the hero lands with a CSS animation; keep the sprite in sync while it settles
    const settle = setInterval(kick, 250);
    const stop = setTimeout(() => clearInterval(settle), 5000);
    return () => {
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      clearInterval(settle);
      clearTimeout(stop);
      cancelAnimationFrame(raf.current);
      raf.current = 0;
      if (heroRef.current) heroRef.current.style.visibility = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run per page
  }, [path, hidden, dockRect]);

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
      {/* seal under the docked mascot */}
      <span
        aria-hidden
        className={clsx(
          "pointer-events-none fixed z-40 h-14 w-14 rounded-full bg-accent shadow-soft transition-all duration-300",
          docked ? "scale-100 opacity-100" : "scale-50 opacity-0",
        )}
        style={{ right: DOCK.right, bottom: DOCK.bottom + lift }}
      />

      {ghostRefs.map((g, i) => (
        <img
          key={i}
          ref={g}
          src="/mascot-sm-v3.webp"
          alt=""
          aria-hidden
          className="pointer-events-none fixed left-0 top-0 z-40 object-contain object-bottom opacity-0 blur-[2px]"
        />
      ))}

      <div ref={flyRef} className="fixed left-0 top-0 z-40 will-change-transform" style={{ width: 0, height: 0 }}>
        <button
          type="button"
          aria-label={t.hello}
          aria-expanded={open}
          onClick={() => {
            setOpen((o) => !o);
            setHop((n) => n + 1);
          }}
          className={clsx("relative block h-full w-full", !docked && "pointer-events-none")}
        >
          <img
            key={`img-${hop}`}
            src={docked ? "/mascot-sm-v3.webp" : "/mascot-v3.webp"}
            alt=""
            className={clsx("h-full w-full object-contain object-bottom drop-shadow-[0_6px_10px_rgba(23,22,20,0.25)]", hop > 0 && "pop")}
          />
          {docked && <span key={`smoke-${poof}`} className="absolute inset-0"><Smoke scale={0.7} className="top-[30%]" /></span>}
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
