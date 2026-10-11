"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { ChevronDown, Crown } from "lucide-react";
import { dictionaries, type Lang } from "@/lib/i18n";
import type { EventResults, Shop } from "@/lib/types";
import { shortDate, weekday } from "@/lib/format";
import Avatar from "./Avatar";
import ShopLogo from "./ShopLogo";

type LiteShop = Pick<Shop, "id" | "name" | "logo_url">;
type Person = EventResults["people"][number];
type Tab = "combo" | "shops" | "dates" | "people";

/**
 * Who chose what. Everything is derived from the per-person answers, so a shop × date cell
 * means "people who picked this shop AND can come on this day" — the number that actually
 * decides the party.
 */
export default function ResultsBoard({
  people,
  shops,
  dates,
  lang,
  heading,
}: {
  people: Person[];
  shops: LiteShop[];
  dates: string[];
  lang: Lang;
  heading?: string;
}) {
  const t = dictionaries[lang].event;
  const [tab, setTab] = useState<Tab>("combo");
  const n = people.length;

  const shopName = (id: string) => shops.find((s) => s.id === id)?.name ?? "—";

  const model = useMemo(() => {
    const byShop = new Map<string, Person[]>();
    const byDate = new Map<string, Person[]>();
    for (const p of people) {
      p.shops.forEach((s) => byShop.set(s, [...(byShop.get(s) ?? []), p]));
      p.dates.forEach((d) => byDate.set(d, [...(byDate.get(d) ?? []), p]));
    }
    const shopOrder = [...shops].sort((a, b) => (byShop.get(b.id)?.length ?? 0) - (byShop.get(a.id)?.length ?? 0));
    // without candidate dates, columns are simply the days people picked
    const dateCols = (dates.length ? dates : [...byDate.keys()].sort()).filter((d) => byDate.has(d));
    const combos: { shop: string; date: string; who: Person[] }[] = [];
    for (const s of shopOrder)
      for (const d of dateCols) {
        const who = people.filter((p) => p.shops.includes(s.id) && p.dates.includes(d));
        if (who.length) combos.push({ shop: s.id, date: d, who });
      }
    combos.sort((a, b) => b.who.length - a.who.length || a.date.localeCompare(b.date));
    return { byShop, byDate, shopOrder, dateCols, combos };
  }, [people, shops, dates]);

  const best = model.combos[0];
  const comboMax = Math.max(1, ...model.combos.map((c) => c.who.length));

  return (
    <section id="results" className="mx-auto mt-16 max-w-6xl scroll-mt-20 px-4 md:px-8">
      <header className="mb-6 flex items-end justify-between gap-4 border-t border-line pt-6">
        <div>
          <p className="eyebrow">Tally</p>
          <h2 className="mt-1 font-serif text-xl font-bold tracking-[0.1em] md:text-2xl">{heading ?? t.results}</h2>
        </div>
        <span className="text-sm text-muted">{t.respondents(n)}</span>
      </header>

      {n === 0 ? (
        <p className="text-ink-2">{t.noResponses}</p>
      ) : (
        <>
          {best && (
            <div className="mb-8 flex flex-col gap-4 rounded-2xl bg-ink p-5 text-paper md:flex-row md:items-center md:justify-between md:p-7">
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink">
                  <Crown size={20} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] tracking-wider text-paper/60">{t.best} — {t.bestHint}</p>
                  <p className="mt-0.5 font-serif text-lg font-bold leading-snug tracking-wide md:text-xl">
                    {shortDate(best.date, lang)} × {shopName(best.shop)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 md:justify-end">
                <Faces people={best.who} dark />
                <span className="font-display text-3xl">
                  {best.who.length}
                  <span className="text-base text-paper/60"> / {n}</span>
                </span>
              </div>
            </div>
          )}

          <div role="tablist" className="mb-6 grid grid-cols-4 rounded-full border border-line bg-card p-1 text-xs sm:inline-grid sm:text-sm">
            {(["combo", "shops", "dates", "people"] as const).map((k) => (
              <button
                key={k}
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={clsx("rounded-full px-2 py-2 transition-colors sm:px-5", tab === k ? "bg-ink text-paper" : "text-ink-2 hover:text-ink")}
              >
                {t.tabs[k]}
              </button>
            ))}
          </div>

          {tab === "combo" && <ComboMatrix model={model} max={comboMax} shopName={shopName} lang={lang} />}

          {tab === "shops" && (
            <ul className="divide-y divide-line border-y border-line">
              {model.shopOrder.map((s, i) => {
                const who = model.byShop.get(s.id) ?? [];
                return (
                  <Row
                    key={s.id}
                    lead={<ShopLogo shop={s} size={32} />}
                    title={s.name}
                    rank={i}
                    count={who.length}
                    total={n}
                  >
                    {who.length === 0 ? (
                      <p className="text-sm text-muted">{t.nobody}</p>
                    ) : (
                      <ul className="space-y-2.5">
                        {who.map((p, j) => (
                          <li key={j} className="flex items-start gap-3">
                            <Avatar name={p.name} src={p.avatar} size={26} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{p.name}</p>
                              <p className="mt-0.5 flex flex-wrap gap-1">
                                {p.dates.map((d) => (
                                  <span key={d} className="chip !px-2 !py-0 text-[11px]">{shortDate(d, lang)}</span>
                                ))}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Row>
                );
              })}
            </ul>
          )}

          {tab === "dates" && (
            <ul className="divide-y divide-line border-y border-line">
              {model.dateCols.map((d) => {
                const who = model.byDate.get(d) ?? [];
                const top = Math.max(...model.dateCols.map((x) => model.byDate.get(x)?.length ?? 0));
                return (
                  <Row key={d} title={shortDate(d, lang)} count={who.length} total={n} rank={who.length === top ? 0 : 1}>
                    <ul className="space-y-2.5">
                      {who.map((p, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <Avatar name={p.name} src={p.avatar} size={26} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{p.name}</p>
                            <p className="mt-0.5 text-xs text-muted">{p.shops.map(shopName).join("、") || "—"}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </Row>
                );
              })}
            </ul>
          )}

          {tab === "people" && (
            <ul className="grid gap-3 sm:grid-cols-2">
              {people.map((p, i) => (
                <li key={i} className="card p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={p.name} src={p.avatar} size={32} />
                    <p className="font-medium">{p.name}</p>
                  </div>
                  <dl className="mt-3 space-y-2 text-xs">
                    <div className="flex gap-3">
                      <dt className="w-16 shrink-0 text-muted">{t.likes}</dt>
                      <dd className="text-ink-2">{p.shops.map(shopName).join("、") || "—"}</dd>
                    </div>
                    <div className="flex gap-3">
                      <dt className="w-16 shrink-0 text-muted">{t.canGo}</dt>
                      <dd className="flex flex-wrap gap-1">
                        {p.dates.length ? p.dates.map((d) => <span key={d} className="chip !px-2 !py-0 text-[11px]">{shortDate(d, lang)}</span>) : "—"}
                      </dd>
                    </div>
                  </dl>
                  {p.comment && <p className="mt-3 border-l-2 border-accent pl-3 text-sm text-ink-2">{p.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

function ComboMatrix({
  model,
  max,
  shopName,
  lang,
}: {
  model: { shopOrder: LiteShop[]; dateCols: string[]; combos: { shop: string; date: string; who: Person[] }[] };
  max: number;
  shopName: (id: string) => string;
  lang: Lang;
}) {
  const t = dictionaries[lang].event;
  const first = model.combos[0];
  const [sel, setSel] = useState<{ shop: string; date: string } | null>(first ? { shop: first.shop, date: first.date } : null);
  const cell = (shop: string, date: string) => model.combos.find((c) => c.shop === shop && c.date === date);
  const picked = sel ? cell(sel.shop, sel.date) : undefined;

  if (!model.dateCols.length || !model.shopOrder.length) return <p className="text-sm text-muted">{t.nobody}</p>;

  return (
    <div>
      <p className="mb-3 text-xs text-muted">{t.comboHint}</p>
      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <table className="w-full border-separate border-spacing-1 text-center text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-paper" />
              {model.dateCols.map((d) => (
                <th key={d} className="min-w-12 whitespace-nowrap px-1 pb-1 font-normal text-muted">
                  <span className="block font-display text-base leading-none text-ink">{Number(d.slice(8))}</span>
                  {weekday(d, lang)}
                  <span className="block text-[10px]">{Number(d.slice(5, 7))}月</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {model.shopOrder.map((s) => (
              <tr key={s.id}>
                <th className="sticky left-0 z-10 max-w-28 bg-paper pr-2 text-left font-normal sm:max-w-48">
                  <span className="line-clamp-2 text-xs leading-snug text-ink">{s.name}</span>
                </th>
                {model.dateCols.map((d) => {
                  const c = cell(s.id, d);
                  const k = c?.who.length ?? 0;
                  const on = sel?.shop === s.id && sel?.date === d;
                  return (
                    <td key={d} className="p-0">
                      <button
                        type="button"
                        disabled={!k}
                        onClick={() => setSel({ shop: s.id, date: d })}
                        className={clsx(
                          "flex h-11 w-full min-w-11 items-center justify-center rounded-lg font-display text-base transition-all",
                          k ? "text-ink" : "text-line",
                          on && "ring-2 ring-ink ring-offset-1 ring-offset-paper",
                        )}
                        style={k ? { background: `color-mix(in srgb, var(--accent) ${Math.round(12 + (k / max) * 70)}%, var(--card))`, color: k / max > 0.6 ? "var(--accent-ink)" : undefined } : { background: "var(--paper-2)" }}
                      >
                        {k || "·"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {picked && (
        <div className="card mt-4 p-4 md:p-5">
          <p className="font-serif font-bold tracking-wide">
            {shortDate(picked.date, lang)} × {shopName(picked.shop)}
            <span className="ml-2 font-display text-lg font-normal text-accent">{t.people(picked.who.length)}</span>
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {picked.who.map((p, i) => (
              <li key={i} className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3 text-sm">
                <Avatar name={p.name} src={p.avatar} size={24} />
                {p.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Row({
  lead,
  title,
  count,
  total,
  rank,
  children,
}: {
  lead?: React.ReactNode;
  title: string;
  count: number;
  total: number;
  rank: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <li>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-3 py-4 text-left">
        {lead}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate font-serif font-bold">{title}</span>
            <span className="shrink-0 text-sm tabular-nums">
              {count}
              <span className="text-muted"> / {total}</span>
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-2">
            <div className={clsx("h-full rounded-full", rank === 0 ? "bg-accent" : "bg-ink-2")} style={{ width: `${total ? Math.max(3, (count / total) * 100) : 0}%` }} />
          </div>
        </div>
        <ChevronDown size={16} className={clsx("shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="pb-5 pl-1">{children}</div>}
    </li>
  );
}

function Faces({ people, dark }: { people: Person[]; dark?: boolean }) {
  return (
    <div className="flex -space-x-2">
      {people.slice(0, 6).map((p, i) => (
        <Avatar key={i} name={p.name} src={p.avatar} size={28} className={dark ? "!ring-ink" : ""} />
      ))}
    </div>
  );
}
