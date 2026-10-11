"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Plus, Trash2 } from "lucide-react";
import { activateOnlyTagline, deleteTagline, saveTagline } from "@/app/admin/actions";
import type { Tagline as TL } from "@/lib/types";
import Tagline from "../Tagline";
import { Msg, useAction } from "./useAction";

type Draft = Omit<TL, "id">;
const EMPTY: Draft = { line_ja: "", line_zh: "", caption_ja: "", caption_zh: "", is_active: true, position: 0 };

/**
 * Slogans for the splash screen / home hero. Only the words are editable — the look is fixed
 * by <Tagline>, so every slogan shares one style. Active ones rotate per visit.
 */
export default function TaglineManager({ items }: { items: TL[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | "new" | null>(items.length ? null : "new");
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [previewLang, setPreviewLang] = useState<"ja" | "zh">("ja");
  const { pending, msg, run } = useAction();

  const open = (t: TL | null) => {
    setEditing(t ? t.id : "new");
    setDraft(t ? { ...t } : { ...EMPTY, position: items.length });
  };

  const line = previewLang === "zh" ? draft.line_zh || draft.line_ja : draft.line_ja;
  const caption = previewLang === "zh" ? draft.caption_zh || draft.caption_ja : draft.caption_ja;

  return (
    <div className="space-y-6">
      <ul className="space-y-3">
        {items.map((t) => (
          <li key={t.id} className={clsx("card flex flex-col gap-4 p-5 md:flex-row md:items-center", editing === t.id && "border-ink")}>
            <button type="button" onClick={() => open(t)} className="min-w-0 flex-1 text-left">
              <Tagline line={t.line_ja} caption={t.caption_ja} size="preview" />
            </button>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => saveTagline(t.id, { ...t, is_active: !t.is_active }), undefined, () => router.refresh())}
                className={clsx("chip", t.is_active ? "border-accent text-accent" : "")}
              >
                {t.is_active ? "表示中" : "非表示"}
              </button>
              {!(t.is_active && items.filter((x) => x.is_active).length === 1) && (
                <button type="button" disabled={pending} className="chip hover:border-ink" onClick={() => run(() => activateOnlyTagline(t.id), "この標語だけを表示します", () => router.refresh())}>
                  これだけ表示
                </button>
              )}
              <button
                type="button"
                className="p-2 text-muted hover:text-accent"
                aria-label="delete"
                onClick={() => confirm("この標語を削除しますか？") && run(() => deleteTagline(t.id), undefined, () => router.refresh())}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {editing === null ? (
        <button type="button" className="btn btn-ghost" onClick={() => open(null)}>
          <Plus size={16} /> 標語を追加
        </button>
      ) : (
        <div className="card grid gap-8 p-5 md:grid-cols-2 md:p-8">
          <div className="space-y-4">
            <label className="block">
              <span className="label">標語（日本語）* — 改行で行を分けられます</span>
              <textarea className="field font-serif" rows={2} value={draft.line_ja} onChange={(e) => setDraft({ ...draft, line_ja: e.target.value })} />
            </label>
            <label className="block">
              <span className="label">添え書き（日本語）</span>
              <textarea className="field" rows={2} value={draft.caption_ja} onChange={(e) => setDraft({ ...draft, caption_ja: e.target.value })} />
            </label>
            <label className="block">
              <span className="label">标语（中文）</span>
              <textarea className="field font-serif" rows={2} value={draft.line_zh} onChange={(e) => setDraft({ ...draft, line_zh: e.target.value })} />
            </label>
            <label className="block">
              <span className="label">副标题（中文）</span>
              <textarea className="field" rows={2} value={draft.caption_zh} onChange={(e) => setDraft({ ...draft, caption_zh: e.target.value })} />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="btn btn-primary"
                disabled={pending || !draft.line_ja.trim()}
                onClick={() =>
                  run(() => saveTagline(editing === "new" ? null : editing, draft), "保存しました", () => {
                    setEditing(null);
                    router.refresh();
                  })
                }
              >
                保存
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>キャンセル</button>
              <Msg msg={msg} />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="mb-3 flex items-center justify-between">
              <span className="eyebrow">Preview</span>
              <div className="flex gap-1 text-xs">
                {(["ja", "zh"] as const).map((l) => (
                  <button key={l} type="button" onClick={() => setPreviewLang(l)} className={clsx("rounded-full px-3 py-1", previewLang === l ? "bg-ink text-paper" : "text-muted")}>
                    {l === "ja" ? "日本語" : "中文"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex min-h-64 flex-1 items-center rounded-2xl border border-line bg-paper p-6 md:p-10">
              {line ? <Tagline line={line} caption={caption} size="hero" className="[&>p:first-of-type]:!text-[clamp(1.5rem,3vw,2.5rem)]" /> : <p className="text-sm text-muted">入力するとここに表示されます</p>}
            </div>
          </div>
        </div>
      )}
      {editing === null && <Msg msg={msg} />}
    </div>
  );
}
