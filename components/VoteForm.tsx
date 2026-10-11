"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Check, Star } from "lucide-react";
import { dictionaries, type Dict, type Lang } from "@/lib/i18n";
import type { Response, Shop } from "@/lib/types";
import { submitResponse, withdrawResponse } from "@/app/e/[slug]/actions";
import ShopSheet from "./ShopSheet";
import ShopLogo from "./ShopLogo";
import LoginPanel from "./LoginPanel";
import MonthCalendar from "./MonthCalendar";

type Props = {
  eventId: string;
  slug: string;
  shops: Shop[];
  dates: string[];
  shopCounts: Record<string, number>;
  dateCounts: Record<string, number>;
  mine: Response | null;
  loggedIn: boolean;
  isOpen: boolean;
  lang: Lang;
};

type Draft = { shops: string[]; dates: string[]; comment: string };

/**
 * One screen, three steps, one button: pick shops → pick dates → (optional) note → send.
 * Selections are kept in localStorage so signing in mid-way never loses them.
 */
export default function VoteForm(props: Props) {
  // Dictionaries contain functions, so they are looked up here rather than passed from the server.
  const p = { ...props, t: dictionaries[props.lang].event, tLogin: dictionaries[props.lang].login };
  const router = useRouter();
  const draftKey = `nomikai:draft:${p.eventId}`;
  const [shops, setShops] = useState<Set<string>>(() => new Set(p.mine?.shop_ids ?? []));
  const [dates, setDates] = useState<Set<string>>(() => new Set(p.mine?.dates ?? []));
  const [comment, setComment] = useState(p.mine?.comment ?? "");
  const [detail, setDetail] = useState<Shop | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const loginRef = useRef<HTMLDialogElement>(null);

  // Restore an unsent draft (e.g. after coming back from the login redirect).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const d = JSON.parse(raw) as Draft;
      setShops(new Set(d.shops));
      setDates(new Set(d.dates));
      setComment(d.comment);
    } catch {}
  }, [draftKey]);

  const saveDraft = (next: Partial<Draft> = {}) => {
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({ shops: [...shops], dates: [...dates], comment, ...next } satisfies Draft),
      );
    } catch {}
  };

  const toggle = (set: Set<string>, value: string, apply: (s: Set<string>) => void, key: "shops" | "dates") => {
    if (!p.isOpen) return;
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    apply(next);
    saveDraft({ [key]: [...next] });
    setMessage(null);
  };

  const dirty =
    !p.mine ||
    !sameSet(shops, p.mine.shop_ids) ||
    !sameSet(dates, p.mine.dates) ||
    comment.trim() !== (p.mine.comment ?? "");
  // order matters: shops first, then days (when the event has candidate shops)
  const needShop = p.shops.length > 0 && shops.size === 0;
  const canSubmit = p.isOpen && !needShop && dates.size > 0 && dirty && !pending;

  const submit = () => {
    if (!p.loggedIn) {
      saveDraft();
      loginRef.current?.showModal();
      return;
    }
    start(async () => {
      const res = await submitResponse({
        eventId: p.eventId,
        slug: p.slug,
        shopIds: [...shops],
        dates: [...dates].sort(),
        comment,
      });
      if (res.ok) {
        try {
          localStorage.removeItem(draftKey);
        } catch {}
        setMessage({ kind: "ok", text: p.t.saved });
        router.refresh();
      } else {
        setMessage({ kind: "error", text: res.error });
      }
    });
  };

  const withdraw = () => {
    start(async () => {
      const res = await withdrawResponse(p.eventId, p.slug);
      if (res.ok) {
        setShops(new Set());
        setDates(new Set());
        setComment("");
        try {
          localStorage.removeItem(draftKey);
        } catch {}
        router.refresh();
      } else setMessage({ kind: "error", text: res.error });
    });
  };

  return (
    <div>
      {/* 01 — shops */}
      <section id="step-shops" className="mx-auto max-w-6xl scroll-mt-24 px-4 md:px-8">
        <StepHeader n="01" title={p.t.step1} hint={p.t.step1Hint} count={shops.size} />
        {p.shops.length === 0 ? (
          <p className="py-8 text-ink-2">{p.t.noShops}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {p.shops.map((s) => (
              <ShopCard
                key={s.id}
                shop={s}
                selected={shops.has(s.id)}
                votes={p.shopCounts[s.id] ?? 0}
                disabled={!p.isOpen}
                t={p.t}
                onToggle={() => toggle(shops, s.id, setShops, "shops")}
                onDetails={() => setDetail(s)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 02 — dates */}
      <section className="mx-auto mt-16 max-w-6xl px-4 md:mt-20 md:px-8">
        <StepHeader n="02" title={p.t.step2} hint={p.dates.length ? p.t.step2Hint : p.t.step2HintFree} count={dates.size} />
        <div className="relative">
          <MonthCalendar
            candidates={p.dates}
            selected={dates}
            counts={p.dateCounts}
            disabled={!p.isOpen || needShop}
            zh={p.lang === "zh"}
            t={p.t}
            onToggle={(d) => toggle(dates, d, setDates, "dates")}
            onSetMonth={(list, on) => {
              if (!p.isOpen) return;
              const next = new Set(dates);
              list.forEach((d) => (on ? next.add(d) : next.delete(d)));
              setDates(next);
              saveDraft({ dates: [...next] });
              setMessage(null);
            }}
          />
          {needShop && p.isOpen && (
            <div className="absolute inset-0 flex items-center justify-center rounded-[1.25rem] bg-paper/75 backdrop-blur-[2px]">
              <a
                href="#step-shops"
                className="btn btn-primary shadow-soft"
                onClick={(e) => {
                  // scroll in JS: html has no global smooth scrolling (it fights history navigation)
                  e.preventDefault();
                  document.getElementById("step-shops")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                ↑ {p.t.pickShopFirst}
              </a>
            </div>
          )}
        </div>
      </section>

      {/* 03 — note */}
      <section className="mx-auto mt-16 max-w-6xl px-4 md:mt-20 md:px-8">
        <StepHeader n="03" title={p.t.step3} hint={p.t.step3Hint} />
        <textarea
          value={comment}
          onChange={(e) => {
            setComment(e.target.value);
            saveDraft({ comment: e.target.value });
          }}
          disabled={!p.isOpen}
          maxLength={500}
          rows={3}
          className="field max-w-2xl"
        />
        {p.mine && p.isOpen && (
          <button type="button" onClick={withdraw} disabled={pending} className="mt-4 block text-xs text-muted underline underline-offset-4 hover:text-accent">
            {p.t.withdraw}
          </button>
        )}
      </section>

      {/* Sticky action bar */}
      {p.isOpen && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/90 backdrop-blur-md [padding-bottom:env(safe-area-inset-bottom)]">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-8">
            <div className="min-w-0 text-sm">
              {message ? (
                <span className={message.kind === "ok" ? "text-ok" : "text-accent"}>{message.text}</span>
              ) : (
                <span className={needShop ? "text-accent" : "text-ink-2"}>
                  {needShop ? p.t.pickShopFirst : p.t.summary(shops.size, dates.size)}
                </span>
              )}
            </div>
            <button type="button" onClick={submit} disabled={!canSubmit} className="btn btn-primary shrink-0 px-6">
              {pending ? p.t.submitting : p.mine ? p.t.update : p.t.submit}
            </button>
          </div>
        </div>
      )}

      <ShopSheet
        shop={detail}
        t={p.t}
        onClose={() => setDetail(null)}
        footer={
          detail && p.isOpen ? (
            <button
              type="button"
              onClick={() => toggle(shops, detail.id, setShops, "shops")}
              className={clsx("btn w-full", shops.has(detail.id) ? "btn-accent" : "btn-primary")}
            >
              {shops.has(detail.id) ? <><Check size={16} /> {p.t.chosen}</> : p.t.choose}
            </button>
          ) : null
        }
      />

      <dialog
        ref={loginRef}
        onClick={(e) => e.target === loginRef.current && loginRef.current?.close()}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-3xl bg-card p-6 text-ink backdrop:bg-ink/40 backdrop:backdrop-blur-sm"
      >
        <p className="mb-6 text-sm text-ink-2">{p.t.loginToSubmit}</p>
        <LoginPanel t={p.tLogin} next={`/e/${p.slug}`} />
      </dialog>
    </div>
  );
}

function sameSet(a: Set<string>, b: string[]) {
  return a.size === b.length && b.every((x) => a.has(x));
}

function StepHeader({ n, title, hint, count }: { n: string; title: string; hint: string; count?: number }) {
  return (
    <header className="mb-6 flex items-end justify-between gap-4 border-t border-line pt-6">
      <div>
        <p className="eyebrow">{n}</p>
        <h2 className="mt-1 font-serif text-xl font-bold tracking-[0.1em] md:text-2xl">{title}</h2>
        <p className="mt-1 text-xs text-muted">{hint}</p>
      </div>
      {count ? <span className="font-display text-3xl text-accent tabular-nums">{count}</span> : null}
    </header>
  );
}

function ShopCard({
  shop,
  selected,
  votes,
  disabled,
  t,
  onToggle,
  onDetails,
}: {
  shop: Shop;
  selected: boolean;
  votes: number;
  disabled: boolean;
  t: Dict["event"];
  onToggle: () => void;
  onDetails: () => void;
}) {
  // Tabelog lists "dinner lunch" budgets together; the card shows the first (dinner) one.
  const meta = [shop.genre.split(/[、,]/)[0], shop.budget.split(/\s+/)[0]].filter(Boolean).join(" ・ ");
  return (
    <article
      className={clsx(
        "group relative overflow-hidden rounded-[1.25rem] border bg-card transition-all duration-300",
        // phone: compact horizontal row · ≥sm: vertical card
        "grid grid-cols-[6.5rem_1fr] sm:flex sm:flex-col",
        selected ? "border-ink shadow-soft" : "border-line sm:hover:-translate-y-0.5 sm:hover:shadow-soft",
      )}
    >
      <button type="button" onClick={onDetails} className="relative block h-full min-h-32 w-full overflow-hidden bg-paper-2 text-left sm:aspect-[4/3] sm:h-auto">
        {shop.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shop.cover_url}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
          />
        )}
        {shop.rating != null && (
          <span className="absolute right-2 top-2 hidden items-center gap-1 rounded-full bg-card/90 px-2.5 py-1 text-xs font-medium backdrop-blur sm:inline-flex">
            <Star size={12} className="fill-accent text-accent" /> {Number(shop.rating).toFixed(2)}
          </span>
        )}
        {selected && (
          <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-ink shadow sm:h-9 sm:w-9">
            <Check size={16} strokeWidth={3} />
          </span>
        )}
      </button>

      <div className="flex min-w-0 flex-1 flex-col p-3.5 sm:px-5 sm:pb-5 sm:pt-0">
        <div className="relative z-10 hidden items-end justify-between sm:-mt-6 sm:flex">
          <ShopLogo shop={shop} size={52} />
          {votes > 0 && <span className="text-xs text-muted">{t.votes(votes)}</span>}
        </div>
        <h3 className="line-clamp-2 font-serif text-[15px] font-bold leading-snug tracking-wide sm:mt-3 sm:text-lg">{shop.name}</h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-muted sm:text-xs">
          {shop.rating != null && (
            <span className="inline-flex items-center gap-0.5 text-ink-2 sm:hidden">
              <Star size={10} className="fill-accent text-accent" />
              {Number(shop.rating).toFixed(2)}
            </span>
          )}
          <span className="truncate">{meta}</span>
          {votes > 0 && <span className="text-accent sm:hidden">{t.votes(votes)}</span>}
        </p>
        {shop.summary && <p className="mt-3 hidden text-sm leading-relaxed text-ink-2 sm:line-clamp-2">{shop.summary.split("\n")[0]}</p>}

        <div className="mt-auto flex gap-2 pt-3 sm:pt-5">
          <button type="button" onClick={onDetails} className="btn btn-ghost !min-h-9 flex-1 !px-2 text-xs">
            {t.details}
          </button>
          <button
            type="button"
            onClick={onToggle}
            disabled={disabled}
            aria-pressed={selected}
            className={clsx("btn !min-h-9 flex-1 !px-2 text-xs", selected ? "btn-accent" : "btn-primary")}
          >
            {selected ? <><Check size={14} /> {t.chosen}</> : t.choose}
          </button>
        </div>
      </div>
    </article>
  );
}
