"use client";

import { useMemo } from "react";
import clsx from "clsx";
import type { Dict } from "@/lib/i18n";
import { pad2, todayJST } from "@/lib/format";

const WD_JA = ["月", "火", "水", "木", "金", "土", "日"];
const WD_ZH = ["一", "二", "三", "四", "五", "六", "日"];

/**
 * Month-view picker (Monday first). With candidate dates only those are tappable; without
 * them ("free" mode) any day from today on is, across this month and the next two. Each day
 * shows how many people can already make it, so members naturally converge on popular days.
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
    // free mode: this month + the next two, plus any month someone already picked
    const [y, m] = today.split("-").map(Number);
    const keys = new Set([0, 1, 2].map((k) => {
      const d = new Date(Date.UTC(y, m - 1 + k, 1));
      return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`;
    }));
    [...selected, ...Object.keys(counts)].forEach((d) => d >= today && keys.add(d.slice(0, 7)));
    return [...keys].sort();
  }, [free, candidates, today, selected, counts]);
  const max = Math.max(1, ...Object.values(counts));
  const wd = zh ? WD_ZH : WD_JA;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {months.map((key) => {
        const [y, m] = key.split("-").map(Number);
        const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(); // 0 = Sun
        const lead = (first + 6) % 7; // Monday-first offset
        const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
        const inMonth = candidates.filter((d) => d.startsWith(key));
        const allOn = inMonth.every((d) => selected.has(d));
        const picked = [...selected].filter((d) => d.startsWith(key)).length;

        return (
          <div key={key} className="card p-3 sm:p-5">
            <div className="mb-3 flex items-baseline justify-between px-1">
              <p className="font-display text-2xl tracking-wider">
                {y}.<span className="text-3xl">{pad2(m)}</span>
              </p>
              {free ? (
                picked > 0 && <span className="font-display text-base text-accent">✓ {picked}</span>
              ) : !disabled && (
                <button
                  type="button"
                  onClick={() => onSetMonth(inMonth, !allOn)}
                  className="text-xs text-muted underline-offset-4 hover:text-ink hover:underline"
                >
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
                const isCand = free ? d >= today : cand.has(d);
                const on = selected.has(d);
                const c = counts[d] ?? 0;
                if (!isCand) {
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
                      disabled && !on && "opacity-60",
                    )}
                  >
                    <span
                      className={clsx(
                        "font-display text-lg leading-none sm:text-xl",
                        !on && col === 5 && "text-[#3b6aa8]",
                        !on && col === 6 && "text-accent",
                      )}
                    >
                      {i + 1}
                    </span>
                    {c > 0 && (
                      <span
                        className={clsx("mt-0.5 text-[10px] leading-none tabular-nums", on ? "text-paper/70" : "text-muted")}
                        title={t.people(c)}
                      >
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
        );
      })}
    </div>
  );
}
