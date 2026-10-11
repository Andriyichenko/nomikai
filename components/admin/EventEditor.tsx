"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ArrowDown, ArrowUp, ExternalLink, Plus, X } from "lucide-react";
import { deleteEvent, saveEvent, type EventInput } from "@/app/admin/actions";
import type { Shop } from "@/lib/types";
import ShopLogo from "../ShopLogo";
import DatesPicker from "./DatesPicker";
import ShopImporter from "./ShopImporter";
import { Msg, useAction } from "./useAction";

type LiteShop = Pick<Shop, "id" | "name" | "genre" | "logo_url">;

const STATUS: { value: EventInput["status"]; label: string; hint: string }[] = [
  { value: "draft", label: "下書き", hint: "管理者だけに表示" },
  { value: "open", label: "受付中", hint: "トップに表示・投票可" },
  { value: "closed", label: "締切", hint: "投票不可・結果は表示" },
];

/** datetime-local value (JST wall clock) ⇄ ISO timestamp. */
function toLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 9 * 3600_000);
  return d.toISOString().slice(0, 16);
}
function fromLocal(v: string) {
  return v ? new Date(`${v}:00+09:00`).toISOString() : null;
}

export default function EventEditor({
  id,
  initial,
  initialShopIds,
  library,
}: {
  id: string | null;
  initial: EventInput;
  initialShopIds: string[];
  library: LiteShop[];
}) {
  const router = useRouter();
  const [ev, setEv] = useState<EventInput>(initial);
  const [shopIds, setShopIds] = useState<string[]>(initialShopIds);
  const [shops, setShops] = useState<LiteShop[]>(library);
  const [adding, setAdding] = useState<"none" | "library" | "link">("none");
  const [q, setQ] = useState("");
  const { pending, msg, run } = useAction();
  const set = <K extends keyof EventInput>(k: K, v: EventInput[K]) => setEv((x) => ({ ...x, [k]: v }));

  const byId = useMemo(() => new Map(shops.map((s) => [s.id, s])), [shops]);
  const candidates = shops.filter((s) => !shopIds.includes(s.id) && (!q || s.name.includes(q) || s.genre.includes(q)));

  const save = () =>
    run(() => saveEvent(id, ev, shopIds), "保存しました", (r) => {
      if (!r.ok) return;
      if (!id) router.replace(`/admin/events/${(r.data as { id: string }).id}`);
      router.refresh();
    });

  return (
    <div className="space-y-14">
      <Section n="01" title="基本情報">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="label">タイトル *</span>
            <input className="field font-serif text-lg" value={ev.title} onChange={(e) => set("title", e.target.value)} placeholder="2026 夏の飲み会" />
          </label>
          <label className="block">
            <span className="label">URL</span>
            <div className="flex items-center gap-1 text-sm text-muted">
              /e/
              <input className="field" value={ev.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} />
            </div>
          </label>
          <label className="block">
            <span className="label">エリア</span>
            <input className="field" value={ev.area} onChange={(e) => set("area", e.target.value)} placeholder="大阪 梅田（都道府県 + 地域）" />
          </label>
          <label className="block">
            <span className="label">開始時間</span>
            <input className="field" type="time" value={ev.start_time} onChange={(e) => set("start_time", e.target.value)} />
          </label>
          <label className="block">
            <span className="label">予算の目安</span>
            <input className="field" value={ev.budget_note} onChange={(e) => set("budget_note", e.target.value)} placeholder="3,000円前後（飲み放題）" />
          </label>
          <label className="block md:col-span-2">
            <span className="label">説明</span>
            <textarea className="field" rows={5} value={ev.description} onChange={(e) => set("description", e.target.value)} placeholder="人数・内容・注意事項など" />
          </label>
        </div>
      </Section>

      <Section n="02" title="候補のお店" aside={`${shopIds.length}店`}>
        <ul className="space-y-2">
          {shopIds.map((sid, i) => {
            const s = byId.get(sid);
            if (!s) return null;
            return (
              <li key={sid} className="card flex items-center gap-3 p-3">
                <ShopLogo shop={s} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif font-bold">{s.name}</p>
                  <p className="truncate text-xs text-muted">{s.genre}</p>
                </div>
                <a href={`/admin/shops/${sid}`} target="_blank" className="p-1.5 text-muted hover:text-ink" aria-label="edit"><ExternalLink size={14} /></a>
                <button type="button" className="p-1.5 text-muted hover:text-ink" onClick={() => setShopIds(swap(shopIds, i, -1))} aria-label="up"><ArrowUp size={14} /></button>
                <button type="button" className="p-1.5 text-muted hover:text-ink" onClick={() => setShopIds(swap(shopIds, i, 1))} aria-label="down"><ArrowDown size={14} /></button>
                <button type="button" className="p-1.5 text-muted hover:text-accent" onClick={() => setShopIds(shopIds.filter((x) => x !== sid))} aria-label="remove"><X size={16} /></button>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className={clsx("btn", adding === "link" ? "btn-primary" : "btn-ghost")} onClick={() => setAdding(adding === "link" ? "none" : "link")}>
            <Plus size={16} /> リンクから追加
          </button>
          <button type="button" className={clsx("btn", adding === "library" ? "btn-primary" : "btn-ghost")} onClick={() => setAdding(adding === "library" ? "none" : "library")}>
            登録済みから選ぶ
          </button>
        </div>
        {adding === "link" && (
          <div className="mt-6">
            <ShopImporter
              compact
              onSaved={(sid, name) => {
                if (!byId.has(sid)) setShops((x) => [{ id: sid, name, genre: "", logo_url: null }, ...x]);
                setShopIds((x) => (x.includes(sid) ? x : [...x, sid]));
                setAdding("none");
                router.refresh();
              }}
            />
          </div>
        )}
        {adding === "library" && (
          <div className="card mt-6 p-4">
            <input className="field mb-3" placeholder="店名・ジャンルで検索" value={q} onChange={(e) => setQ(e.target.value)} />
            <ul className="max-h-72 space-y-1 overflow-y-auto">
              {candidates.map((s) => (
                <li key={s.id}>
                  <button type="button" onClick={() => setShopIds([...shopIds, s.id])} className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-paper-2">
                    <ShopLogo shop={s} size={32} />
                    <span className="min-w-0 flex-1 truncate">{s.name}</span>
                    <Plus size={14} className="text-muted" />
                  </button>
                </li>
              ))}
              {!candidates.length && <li className="p-2 text-sm text-muted">該当なし</li>}
            </ul>
          </div>
        )}
      </Section>

      <Section n="03" title="候補日（任意）" aside={ev.dates.length ? `${ev.dates.length}日に限定` : "自由に選択"}>
        <p className="mb-4 text-sm text-muted">
          空のままにすると、メンバーはカレンダーから行ける日を自由に選べます（おすすめ）。日にちを絞りたいときだけ追加してください。
        </p>
        <DatesPicker value={ev.dates} onChange={(d) => set("dates", d)} />
      </Section>

      <Section n="04" title="締切と公開">
        <div className="grid gap-6 md:grid-cols-2">
          <label className="block">
            <span className="label">回答締切（日本時間）</span>
            <input className="field" type="datetime-local" value={toLocal(ev.deadline)} onChange={(e) => set("deadline", fromLocal(e.target.value))} />
          </label>
          <div>
            <span className="label">状態</span>
            <div className="grid grid-cols-3 gap-2">
              {STATUS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => set("status", s.value)}
                  className={clsx("rounded-xl border p-3 text-left transition-colors", ev.status === s.value ? "border-ink bg-ink text-paper" : "border-line hover:border-ink-2")}
                >
                  <span className="block text-sm font-medium">{s.label}</span>
                  <span className={clsx("block text-[11px]", ev.status === s.value ? "text-paper/70" : "text-muted")}>{s.hint}</span>
                </button>
              ))}
            </div>
            {ev.status === "decided" && <p className="mt-2 text-xs text-muted">決定済みです。状態を変えると決定は保持されたまま表示が変わります。</p>}
          </div>
        </div>
      </Section>

      <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur md:mx-0 md:rounded-2xl md:border md:px-5">
        <button type="button" className="btn btn-primary" onClick={save} disabled={pending || !ev.title.trim()}>
          {pending ? "保存中…" : id ? "保存" : "作成する"}
        </button>
        {id && (
          <a href={`/e/${ev.slug}`} target="_blank" className="btn btn-ghost">
            ページを見る <ExternalLink size={14} />
          </a>
        )}
        <Msg msg={msg} />
        {id && (
          <button
            type="button"
            className="ml-auto text-xs text-muted hover:text-accent"
            onClick={() => {
              if (confirm(`「${ev.title}」を削除しますか？回答もすべて削除されます。`))
                run(() => deleteEvent(id), undefined, () => router.push("/admin/events"));
            }}
          >
            削除
          </button>
        )}
      </div>
    </div>
  );
}

function swap<T>(list: T[], i: number, dir: -1 | 1) {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const n = [...list];
  [n[i], n[j]] = [n[j], n[i]];
  return n;
}

function Section({ n, title, aside, children }: { n: string; title: string; aside?: string; children: React.ReactNode }) {
  return (
    <section>
      <header className="mb-6 flex items-end justify-between border-t border-line pt-5">
        <div>
          <p className="eyebrow">{n}</p>
          <h2 className="mt-1 font-serif text-lg font-bold tracking-[0.1em]">{title}</h2>
        </div>
        {aside && <span className="text-sm text-muted">{aside}</span>}
      </header>
      {children}
    </section>
  );
}
