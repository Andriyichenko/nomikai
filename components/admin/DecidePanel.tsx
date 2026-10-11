"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { decideEvent, setEventStatus } from "@/app/admin/actions";
import { shortDate } from "@/lib/format";
import type { EventResults, EventStatus, Shop } from "@/lib/types";
import { Msg, useAction } from "./useAction";

/** Pick the final shop + date (pre-selected from the votes) and notify respondents. */
export default function DecidePanel({
  eventId,
  status,
  shops,
  dates,
  results,
  decidedShopId,
  decidedDate,
  mailReady,
}: {
  eventId: string;
  status: EventStatus;
  shops: Pick<Shop, "id" | "name">[];
  dates: string[];
  results: EventResults | null;
  decidedShopId: string | null;
  decidedDate: string | null;
  mailReady: boolean;
}) {
  const router = useRouter();
  const shopVotes = new Map((results?.shops ?? []).map((s) => [s.shop_id, s.count]));
  const dateVotes = new Map((results?.dates ?? []).map((d) => [d.date, d.count]));
  const rankedShops = [...shops].sort((a, b) => (shopVotes.get(b.id) ?? 0) - (shopVotes.get(a.id) ?? 0));
  const dateList = dates.length ? dates : [...dateVotes.keys()];
  const rankedDates = [...dateList].sort((a, b) => (dateVotes.get(b) ?? 0) - (dateVotes.get(a) ?? 0) || a.localeCompare(b));

  const [shopId, setShopId] = useState(decidedShopId ?? rankedShops[0]?.id ?? "");
  const [date, setDate] = useState(decidedDate ?? rankedDates[0] ?? "");
  const [notify, setNotify] = useState(mailReady);
  const [note, setNote] = useState("");
  const { pending, msg, setMsg, run } = useAction();
  const n = results?.respondents ?? 0;

  return (
    <div className="card space-y-6 p-5 md:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-lg font-bold tracking-[0.1em]">決定する</h2>
        <span className="text-sm text-muted">{n}人が回答</span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <fieldset>
          <legend className="label">お店</legend>
          <div className="max-h-64 space-y-1.5 overflow-y-auto">
            {rankedShops.map((s) => (
              <Choice key={s.id} on={shopId === s.id} onClick={() => setShopId(s.id)} label={s.name} count={shopVotes.get(s.id) ?? 0} total={n} />
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="label">日程</legend>
          <div className="max-h-64 space-y-1.5 overflow-y-auto">
            {rankedDates.map((d) => (
              <Choice key={d} on={date === d} onClick={() => setDate(d)} label={shortDate(d, "ja")} count={dateVotes.get(d) ?? 0} total={n} />
            ))}
          </div>
        </fieldset>
      </div>

      <div>
        <label className="label" htmlFor="decide-note">お知らせに添えるメッセージ（任意）</label>
        <textarea id="decide-note" className="field" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="会費は当日現金で集めます、など" />
        <label className={clsx("mt-3 flex items-center gap-2 text-sm", !mailReady && "opacity-50")}>
          <input type="checkbox" checked={notify} disabled={!mailReady} onChange={(e) => setNotify(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
          回答者にメールする（行ける人へ「決定」・それ以外へ「お誘い」）
          {!mailReady && <span className="text-xs text-muted">（メール未設定）</span>}
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn btn-accent"
          disabled={pending || !shopId || !date}
          onClick={() =>
            run(
              () => decideEvent(eventId, shopId, date, notify, note),
              undefined,
              (r) => {
                const d = r.ok ? (r.data as { going: number; invited: number; mailed: number }) : null;
                setMsg({
                  kind: "ok",
                  text: d
                    ? `決定しました — 参加 ${d.going}人・お誘い ${d.invited}人${notify ? `（${d.mailed}通送信）` : ""}`
                    : "決定しました",
                });
                router.refresh();
              },
            )
          }
        >
          {pending ? "処理中…" : status === "decided" ? "決定内容を更新" : "この内容で決定"}
        </button>
        {status !== "open" && (
          <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => run(() => setEventStatus(eventId, "open"), "受付を再開しました", () => router.refresh())}>
            受付を再開
          </button>
        )}
        {status === "open" && (
          <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => run(() => setEventStatus(eventId, "closed"), "締め切りました", () => router.refresh())}>
            今すぐ締め切る
          </button>
        )}
        <Msg msg={msg} />
      </div>
    </div>
  );
}

function Choice({ on, onClick, label, count, total }: { on: boolean; onClick: () => void; label: string; count: number; total: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx("relative flex w-full items-center justify-between overflow-hidden rounded-xl border px-3 py-2.5 text-left text-sm", on ? "border-ink" : "border-line hover:border-ink-2")}
    >
      <span className="absolute inset-y-0 left-0 bg-paper-2" style={{ width: total ? `${(count / total) * 100}%` : 0 }} />
      <span className="relative flex items-center gap-2">
        <span className={clsx("h-3 w-3 rounded-full border", on ? "border-accent bg-accent" : "border-muted")} />
        {label}
      </span>
      <span className="relative tabular-nums text-muted">{count}</span>
    </button>
  );
}
