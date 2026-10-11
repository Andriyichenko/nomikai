"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, ImagePlus, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { deleteShop, importShopAction, saveShop } from "@/app/admin/actions";
import { dictionaries } from "@/lib/i18n";
import type { MenuItem, Review, Shop, ShopDraft } from "@/lib/types";
import ShopSheet from "../ShopSheet";
import ImageInput, { uploadImage } from "./ImageInput";
import { Msg, useAction } from "./useAction";

export const EMPTY_SHOP: ShopDraft = {
  name: "", genre: "", summary: "", logo_url: null, cover_url: null, budget: "", address: "", access: "",
  hours: "", phone: "", lat: null, lng: null, rating: null, review_count: null, reviews: [], menu: [], photos: [],
  source: "manual", source_url: null,
};

export default function ShopEditor({
  id,
  initial,
  onSaved,
  compact,
}: {
  id: string | null;
  initial: ShopDraft;
  onSaved?: (id: string, name: string) => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const [d, setD] = useState<ShopDraft>({ ...initial, photos: initial.photos ?? [] });
  const [preview, setPreview] = useState(false);
  const { pending, msg, setMsg, run } = useAction();
  const set = <K extends keyof ShopDraft>(k: K, v: ShopDraft[K]) => setD((x) => ({ ...x, [k]: v }));

  const save = () =>
    run(() => saveShop(id, d), "保存しました", (r) => {
      if (!r.ok) return;
      const newId = (r.data as { id: string }).id;
      if (onSaved) onSaved(newId, d.name);
      else if (!id) router.replace(`/admin/shops/${newId}`);
      router.refresh();
    });

  return (
    <div className="space-y-8">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="店名 *"><input className="field" value={d.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="ジャンル"><input className="field" value={d.genre} onChange={(e) => set("genre", e.target.value)} placeholder="居酒屋、焼鳥" /></Field>
        <Field label="予算"><input className="field" value={d.budget} onChange={(e) => set("budget", e.target.value)} placeholder="3,000〜3,999円" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="評価（0〜5）">
            <input className="field" type="number" step="0.01" min={0} max={5} value={d.rating ?? ""} onChange={(e) => set("rating", e.target.value === "" ? null : Number(e.target.value))} />
          </Field>
          <Field label="口コミ件数">
            <input className="field" type="number" min={0} value={d.review_count ?? ""} onChange={(e) => set("review_count", e.target.value === "" ? null : Number(e.target.value))} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="概要（1行目がカードに表示されます）">
            <textarea className="field" rows={3} value={d.summary} onChange={(e) => set("summary", e.target.value)} />
          </Field>
        </div>
        <ImageInput label="ロゴ" value={d.logo_url} onChange={(v) => set("logo_url", v)} folder="logos" round />
        <ImageInput label="メイン写真" value={d.cover_url} onChange={(v) => set("cover_url", v)} folder="covers" />
        <Field label="住所"><input className="field" value={d.address} onChange={(e) => set("address", e.target.value)} /></Field>
        <Field label="アクセス"><input className="field" value={d.access} onChange={(e) => set("access", e.target.value)} /></Field>
        <Field label="営業時間"><textarea className="field" rows={2} value={d.hours} onChange={(e) => set("hours", e.target.value)} /></Field>
        <Field label="電話"><input className="field" value={d.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
        {!compact && (
          <div className="md:col-span-2">
            <Field label="掲載元URL">
              <input className="field" value={d.source_url ?? ""} onChange={(e) => set("source_url", e.target.value || null)} />
            </Field>
          </div>
        )}
      </div>

      <PhotosEditor items={d.photos} onChange={(p) => set("photos", p)} onError={(e) => setMsg({ kind: "error", text: e })} />
      <MenuEditor items={d.menu} onChange={(m) => set("menu", m)} />
      <ReviewEditor items={d.reviews} onChange={(r) => set("reviews", r)} />

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur md:mx-0 md:rounded-2xl md:border md:px-5">
        <button type="button" className="btn btn-primary" onClick={save} disabled={pending || !d.name.trim()}>
          {pending ? "保存中…" : id ? "保存" : "登録する"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setPreview(true)}>
          <Eye size={16} /> プレビュー
        </button>
        {d.source_url && (d.source === "tabelog" || d.source === "hotpepper") && (
          <button
            type="button"
            className="btn btn-ghost"
            disabled={pending}
            title="写真・評価・口コミ・メニューを掲載元の最新に更新（店名や概要の編集は残ります）"
            onClick={() =>
              run(() => importShopAction(d.source_url!), "掲載元から再取得しました（保存で確定）", (r) => {
                if (!r.ok) return;
                const fresh = (r.data as { draft: ShopDraft }).draft;
                setD((x) => ({
                  ...x,
                  photos: fresh.photos,
                  rating: fresh.rating,
                  review_count: fresh.review_count,
                  reviews: fresh.reviews,
                  menu: fresh.menu,
                  cover_url: x.cover_url || fresh.cover_url,
                  logo_url: x.logo_url || fresh.logo_url,
                }));
              })
            }
          >
            <RefreshCw size={16} /> 掲載元から再取得
          </button>
        )}
        <Msg msg={msg} />
        {id && !compact && (
          <button
            type="button"
            className="ml-auto text-xs text-muted hover:text-accent"
            onClick={() => {
              if (confirm(`「${d.name}」を削除しますか？投票からも外れます。`))
                run(() => deleteShop(id), undefined, () => router.push("/admin/shops"));
            }}
          >
            削除
          </button>
        )}
      </div>

      <ShopSheet
        shop={preview ? ({ ...d, id: id ?? "preview" } as Shop) : null}
        t={dictionaries.ja.event}
        onClose={() => setPreview(false)}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function move<T>(list: T[], i: number, dir: -1 | 1) {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

function PhotosEditor({ items, onChange, onError }: { items: string[]; onChange: (p: string[]) => void; onError: (e: string) => void }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="eyebrow">Photos — 写真（{items.length}）</h3>
        <label className="btn btn-ghost !min-h-8 cursor-pointer !px-3 text-xs">
          <ImagePlus size={14} /> {busy ? "…" : "アップロード"}
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={async (e) => {
              const files = [...(e.target.files ?? [])];
              if (!files.length) return;
              setBusy(true);
              try {
                const urls: string[] = [];
                for (const f of files) urls.push(await uploadImage(f, "shops"));
                onChange([...items, ...urls]);
              } catch (x) {
                onError((x as Error).message);
              } finally {
                setBusy(false);
                e.target.value = "";
              }
            }}
          />
        </label>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {items.map((src, i) => (
          <div key={src} className="group relative aspect-square overflow-hidden rounded-lg bg-paper-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-ink/50 p-0.5 text-paper opacity-0 transition group-hover:opacity-100">
              <button type="button" onClick={() => onChange(move(items, i, -1))} className="p-1" aria-label="left"><ArrowUp size={12} className="-rotate-90" /></button>
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="p-1" aria-label="remove"><X size={12} /></button>
              <button type="button" onClick={() => onChange(move(items, i, 1))} className="p-1" aria-label="right"><ArrowDown size={12} className="-rotate-90" /></button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input className="field !min-h-10 text-xs" placeholder="画像URLを追加" value={url} onChange={(e) => setUrl(e.target.value)} />
        <button type="button" className="btn btn-ghost !min-h-10 shrink-0 !px-3 text-xs" disabled={!url.trim()} onClick={() => { onChange([...items, url.trim()]); setUrl(""); }}>
          <Plus size={14} /> 追加
        </button>
      </div>
    </section>
  );
}

function MenuEditor({ items, onChange }: { items: MenuItem[]; onChange: (m: MenuItem[]) => void }) {
  const update = (i: number, patch: Partial<MenuItem>) => onChange(items.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="eyebrow">Menu — メニュー（{items.length}）</h3>
        <button type="button" className="btn btn-ghost !min-h-8 !px-3 text-xs" onClick={() => onChange([...items, { name: "", price: "", note: "" }])}>
          <Plus size={14} /> 追加
        </button>
      </div>
      <ul className="space-y-2">
        {items.map((m, i) => (
          <li key={i} className="grid grid-cols-[1fr_6.5rem_auto] gap-2 md:grid-cols-[1fr_7rem_1fr_auto]">
            <input className="field !min-h-10 text-sm" value={m.name} placeholder="品名" onChange={(e) => update(i, { name: e.target.value })} />
            <input className="field !min-h-10 text-sm" value={m.price} placeholder="価格" onChange={(e) => update(i, { price: e.target.value })} />
            <input className="field !min-h-10 hidden text-sm md:block" value={m.note ?? ""} placeholder="メモ（コース 等）" onChange={(e) => update(i, { note: e.target.value })} />
            <RowTools onUp={() => onChange(move(items, i, -1))} onDown={() => onChange(move(items, i, 1))} onDelete={() => onChange(items.filter((_, j) => j !== i))} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ReviewEditor({ items, onChange }: { items: Review[]; onChange: (r: Review[]) => void }) {
  const update = (i: number, patch: Partial<Review>) => onChange(items.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="eyebrow">Voices — 口コミ（{items.length}）</h3>
        <button type="button" className="btn btn-ghost !min-h-8 !px-3 text-xs" onClick={() => onChange([...items, { author: "", rating: null, body: "" }])}>
          <Plus size={14} /> 追加
        </button>
      </div>
      <ul className="space-y-3">
        {items.map((r, i) => (
          <li key={i} className="card space-y-2 p-3">
            <div className="grid grid-cols-[1fr_5rem_auto] gap-2">
              <input className="field !min-h-10 text-sm" value={r.author} placeholder="投稿者" onChange={(e) => update(i, { author: e.target.value })} />
              <input className="field !min-h-10 text-sm" type="number" step="0.1" min={0} max={5} value={r.rating ?? ""} placeholder="★" onChange={(e) => update(i, { rating: e.target.value === "" ? null : Number(e.target.value) })} />
              <RowTools onUp={() => onChange(move(items, i, -1))} onDown={() => onChange(move(items, i, 1))} onDelete={() => onChange(items.filter((_, j) => j !== i))} />
            </div>
            <textarea className="field text-sm" rows={2} value={r.body} placeholder="本文（短めの抜粋）" onChange={(e) => update(i, { body: e.target.value })} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function RowTools({ onUp, onDown, onDelete }: { onUp: () => void; onDown: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center text-muted">
      <button type="button" onClick={onUp} className="p-1.5 hover:text-ink" aria-label="up"><ArrowUp size={14} /></button>
      <button type="button" onClick={onDown} className="p-1.5 hover:text-ink" aria-label="down"><ArrowDown size={14} /></button>
      <button type="button" onClick={onDelete} className="p-1.5 hover:text-accent" aria-label="delete"><Trash2 size={14} /></button>
    </div>
  );
}
