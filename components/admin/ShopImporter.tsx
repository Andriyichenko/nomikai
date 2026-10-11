"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Link2, Loader2 } from "lucide-react";
import { importShopAction } from "@/app/admin/actions";
import type { ShopDraft } from "@/lib/types";
import ShopEditor, { EMPTY_SHOP } from "./ShopEditor";

/**
 * Paste a 食べログ / ホットペッパー link → fields are filled in → check & save.
 * Pasting triggers the import immediately; "手動で入力" opens an empty form.
 */
export default function ShopImporter({ onSaved, compact }: { onSaved?: (id: string, name: string) => void; compact?: boolean }) {
  const [text, setText] = useState("");
  const [draft, setDraft] = useState<ShopDraft | null>(null);
  const [existing, setExisting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const [key, setKey] = useState(0);

  const read = (value: string) => {
    if (!value.trim()) return;
    setError("");
    setExisting(null);
    start(async () => {
      const r = await importShopAction(value);
      if (r.ok) {
        setDraft(r.data.draft);
        setExisting(r.data.existingId);
        setKey((k) => k + 1);
      } else setError(r.error);
    });
  };

  return (
    <div>
      <div className="card p-4 md:p-6">
        <label className="label" htmlFor="shop-url">食べログ・ホットペッパーのリンクを貼り付け</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Link2 size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              id="shop-url"
              className="field !pl-9"
              value={text}
              placeholder="https://tabelog.com/… / https://www.hotpepper.jp/strJ…"
              onChange={(e) => setText(e.target.value)}
              onPaste={(e) => {
                const v = e.clipboardData.getData("text");
                setTimeout(() => read(v), 0);
              }}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), read(text))}
            />
          </div>
          <button type="button" className="btn btn-primary" onClick={() => read(text)} disabled={pending || !text.trim()}>
            {pending ? <><Loader2 size={16} className="animate-spin" /> 読み取り中</> : "読み取る"}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setDraft({ ...EMPTY_SHOP });
              setExisting(null);
              setKey((k) => k + 1);
            }}
          >
            手動で入力
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">
          店名・写真・ロゴ・住所・予算・営業時間・評価・口コミ・メニューを自動で取り込みます。共有ボタンからコピーした文章をそのまま貼ってもOKです。
        </p>
        {error && <p className="mt-3 text-sm text-accent">{error}</p>}
        {existing && (
          <p className="mt-3 text-sm text-ink-2">
            このお店は登録済みです。{" "}
            {onSaved ? (
              <button type="button" className="underline" onClick={() => onSaved(existing, draft?.name ?? "")}>
                この会に追加する
              </button>
            ) : (
              <Link className="underline" href={`/admin/shops/${existing}`}>編集する</Link>
            )}
          </p>
        )}
      </div>

      {draft && !existing && (
        <div className="mt-8">
          <ShopEditor
            key={key}
            id={null}
            initial={draft}
            compact={compact}
            onSaved={(id, name) => {
              setDraft(null);
              setText("");
              onSaved?.(id, name);
            }}
          />
        </div>
      )}
    </div>
  );
}
