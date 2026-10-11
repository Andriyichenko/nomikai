"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { dateRange, pad2, todayJST } from "@/lib/format";

const WD = ["日", "月", "火", "水", "木", "金", "土"];

/**
 * Candidate-date picker: bulk-add a range filtered by weekday, then fine-tune by tapping
 * days on a month calendar.
 */
export default function DatesPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const selected = useMemo(() => new Set(value), [value]);
  const first = value[0] ?? todayJST();
  const [cursor, setCursor] = useState(first.slice(0, 7));
  const [from, setFrom] = useState(todayJST());
  const [to, setTo] = useState("");
  const [days, setDays] = useState<Set<number>>(new Set([5, 6]));

  const toggle = (d: string) => {
    const next = new Set(selected);
    if (next.has(d)) next.delete(d);
    else next.add(d);
    onChange([...next].sort());
  };

  const addRange = () => {
    if (!from || !to || to < from) return;
    const add = dateRange(from, to).filter((d) => days.has(new Date(`${d}T00:00:00Z`).getUTCDay()));
    onChange([...new Set([...value, ...add])].sort());
    setCursor(from.slice(0, 7));
  };

  const [y, m] = cursor.split("-").map(Number);
  const firstDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const shift = (delta: number) => {
    const d = new Date(Date.UTC(y, m - 1 + delta, 1));
    setCursor(`${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <button type="button" onClick={() => shift(-1)} className="p-2 text-muted hover:text-ink" aria-label="prev"><ChevronLeft size={18} /></button>
          <p className="font-display text-xl tracking-wider">{y}.{pad2(m)}</p>
          <button type="button" onClick={() => shift(1)} className="p-2 text-muted hover:text-ink" aria-label="next"><ChevronRight size={18} /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
          {WD.map((w, i) => <span key={w} className={clsx(i === 0 || i === 6 ? "text-accent" : "")}>{w}</span>)}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: firstDow }, (_, i) => <span key={`b${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const d = `${cursor}-${pad2(i + 1)}`;
            const on = selected.has(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggle(d)}
                className={clsx(
                  "aspect-square rounded-lg text-sm tabular-nums transition-colors",
                  on ? "bg-ink text-paper" : "hover:bg-paper-2",
                )}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="card space-y-3 p-4">
          <p className="text-sm font-medium">期間でまとめて追加</p>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" className="field text-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
            <input type="date" className="field text-sm" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1">
            {WD.map((w, i) => (
              <button
                key={w}
                type="button"
                onClick={() => {
                  const n = new Set(days);
                  if (n.has(i)) n.delete(i);
                  else n.add(i);
                  setDays(n);
                }}
                className={clsx("h-9 w-9 rounded-full border text-xs", days.has(i) ? "border-ink bg-ink text-paper" : "border-line")}
              >
                {w}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-ghost w-full" onClick={addRange} disabled={!to}>追加</button>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>選択中 <b className="font-display text-xl text-accent">{value.length}</b> 日</span>
          {value.length > 0 && (
            <button type="button" className="text-xs text-muted hover:text-accent" onClick={() => onChange([])}>すべてクリア</button>
          )}
        </div>
      </div>
    </div>
  );
}
