"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import { pad2, todayJST } from "@/lib/format";

const WD_JA = ["月", "火", "水", "木", "金", "土", "日"];
const WD_ZH = ["一", "二", "三", "四", "五", "六", "日"];

/**
 * One calendar block, one month at a time (Monday first). Month tabs on top switch the view
 * and show how many days are picked in each. With candidate dates only those are tappable;
 * without them ("free" mode) any day from today on is, across this month and the next two.
 * Each day shows how many people can already make it.
 */
export default function MonthCalendar({
  candidates,
  selected,
  counts,
  disabled,
  zh,
  t,
  onToggle,
  onSetMonth,
}: {
  candidates: string[];
  selected: Set<string>;
  counts: Record<string, number>;
  disabled: boolean;
  zh: boolean;
  t: Dict["event"];
  onToggle: (d: string) => void;
  onSetMonth: (dates: string[], on: boolean) => void;
}) {
  const free = candidates.length === 0;
  const today = todayJST();
  const cand = useMemo(() => new Set(candidates), [candidates]);
  const months = useMemo(() => {
    if (!free) return [...new Set(candidates.map((d) => d.slice(0, 7)))].sort();
    const [y, m] = today.split("-").map(Number);
    const keys = new Set(
      [0, 1, 2].map((k) => {
        const d = new Date(Date.UTC(y, m - 1 + k, 1));
        return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`;
      }),
    );
    [...selected, ...Object.keys(counts)].forEach((d) => d >= today && keys.add(d.slice(0, 7)));
    return [...keys].sort();
  }, [free, candidates, today, selected, counts]);

  const firstPicked = [...selected].sort()[0]?.slice(0, 7);
  const [idx, setIdx] = useState(() => Math.max(0, months.indexOf(firstPicked ?? months[0])));
  const key = months[Math.min(idx, months.length - 1)] ?? today.slice(0, 7);
  const max = Math.max(1, ...Object.values(counts));
  const wd = zh ? WD_ZH : WD_JA;

  const [y, m] = key.split("-").map(Number);
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // Monday-first offset
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const inMonth = candidates.filter((d) => d.startsWith(key));
  const allOn = inMonth.length > 0 && inMonth.every((d) => selected.has(d));
  const pickedIn = (k: string) => [...selected].filter((d) => d.startsWith(k)).length;

  return (
    <div className="card overflow-hidden">
      {/* month switcher */}
      <div className="flex items-center gap-2 border-b border-line px-2 py-2 sm:px-4">
        <button
          type="button"
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-paper-2 disabled:opacity-25"
          aria-label="prev"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex min-w-0 flex-1 justify-center gap-1 overflow-x-auto overscroll-x-contain">
          {months.map((k, i) => {
            const n = pickedIn(k);
            return (
              <button
                key={k}
                type="button"
                onClick={() => setIdx(i)}
                className={clsx(
                  "relative shrink-0 rounded-full px-3.5 py-1.5 text-sm transition-colors",
                  i === idx ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2",
                )}
              >
                <span className="font-display text-base">{Number(k.slice(5))}</span>
                月
                {n > 0 && (
                  <span className={clsx("ml-1.5 rounded-full px-1.5 text-[10px] tabular-nums", i === idx ? "bg-accent text-accent-ink" : "bg-accent/15 text-accent")}>
                    {n}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setIdx((i) => Math.min(months.length - 1, i + 1))}
          disabled={idx >= months.length - 1}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-paper-2 disabled:opacity-25"
          aria-label="next"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="p-3 sm:p-5">
        <div className="mb-2 flex items-baseline justify-between px-1">
          <p className="font-display text-xl tracking-wider text-ink-2">
            {y}.{pad2(m)}
          </p>
          {!free && !disabled && inMonth.length > 0 && (
            <button type="button" onClick={() => onSetMonth(inMonth, !allOn)} className="text-xs text-muted underline-offset-4 hover:text-ink hover:underline">
              {allOn ? t.clearMonth : t.selectMonth}
            </button>
          )}
        </div>

        <div className="grid grid-cols-7 text-center text-[11px] text-muted">
          {wd.map((w, i) => (
            <span key={w} className={clsx("pb-2", i === 5 && "text-[#3b6aa8]", i === 6 && "text-accent")}>
              {w}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {Array.from({ length: lead }, (_, i) => (
            <span key={`b${i}`} />
          ))}
          {Array.from({ length: days }, (_, i) => {
            const d = `${key}-${pad2(i + 1)}`;
            const col = (lead + i) % 7;
            const ok = free ? d >= today : cand.has(d);
            const on = selected.has(d);
            const c = counts[d] ?? 0;
            if (!ok) {
              return (
                <span key={d} className="flex aspect-square items-center justify-center text-xs text-line" aria-label={t.notCandidate}>
                  {i + 1}
                </span>
              );
            }
            return (
              <button
                key={d}
                type="button"
                disabled={disabled}
                onClick={() => onToggle(d)}
                aria-pressed={on}
                className={clsx(
                  "relative flex aspect-square flex-col items-center justify-center rounded-xl border transition-all active:scale-95",
                  on
                    ? "border-ink bg-ink text-paper shadow-soft"
                    : free
                      ? "border-transparent bg-paper-2/60 hover:border-ink-2"
                      : "border-line bg-paper hover:border-ink-2",
                )}
              >
                <span className={clsx("font-display text-lg leading-none sm:text-xl", !on && col === 5 && "text-[#3b6aa8]", !on && col === 6 && "text-accent")}>
                  {i + 1}
                </span>
                {c > 0 && (
                  <span className={clsx("mt-0.5 text-[10px] leading-none tabular-nums", on ? "text-paper/70" : "text-muted")} title={t.people(c)}>
                    {c}人
                  </span>
                )}
                {c > 0 && (
                  <span
                    aria-hidden
                    className={clsx("absolute inset-x-1.5 bottom-1 h-[2px] origin-left rounded-full", on ? "bg-accent" : "bg-accent/70")}
                    style={{ transform: `scaleX(${c / max})` }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
