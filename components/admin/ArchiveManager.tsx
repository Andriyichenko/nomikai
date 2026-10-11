"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Plus, Trash2, X } from "lucide-react";
import { deleteArchive, saveArchive } from "@/app/admin/actions";
import type { ArchiveEntry } from "@/lib/types";
import { uploadImage } from "./ImageInput";
import { Msg, useAction } from "./useAction";

type Draft = Omit<ArchiveEntry, "id">;
const EMPTY: Draft = { title: "", held_on: null, place: "", body: "", images: [], position: 0 };

export default function ArchiveManager({ items }: { items: ArchiveEntry[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [d, setD] = useState<Draft>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { pending, msg, setMsg, run } = useAction();

  const open = (a: ArchiveEntry | null) => {
    setEditing(a ? a.id : "new");
    setD(a ? { ...a } : { ...EMPTY });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="eyebrow">アーカイブ（{items.length}）</h2>
        <button type="button" className="btn btn-primary" onClick={() => open(null)}><Plus size={16} /> 追加</button>
      </div>

      {editing && (
        <div className="card space-y-5 p-5 md:p-8">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block md:col-span-3">
              <span className="label">タイトル *</span>
              <input className="field" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} />
            </label>
            <label className="block">
              <span className="label">開催日</span>
              <input className="field" type="date" value={d.held_on ?? ""} onChange={(e) => setD({ ...d, held_on: e.target.value || null })} />
            </label>
            <label className="block md:col-span-2">
              <span className="label">場所</span>
              <input className="field" value={d.place} onChange={(e) => setD({ ...d, place: e.target.value })} />
            </label>
            <label className="block md:col-span-3">
              <span className="label">ひとこと</span>
              <textarea className="field" rows={3} value={d.body} onChange={(e) => setD({ ...d, body: e.target.value })} />
            </label>
          </div>
          <div>
            <span className="label">写真</span>
            <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
              {d.images.map((src) => (
                <div key={src} className="relative aspect-square overflow-hidden rounded-lg bg-paper-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setD({ ...d, images: d.images.filter((x) => x !== src) })} className="absolute right-1 top-1 rounded-full bg-card/90 p-1" aria-label="remove">
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => fileRef.current?.click()} className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-line text-muted hover:border-ink hover:text-ink" disabled={uploading}>
                {uploading ? "…" : <ImagePlus size={20} />}
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={async (e) => {
                const files = [...(e.target.files ?? [])];
                if (!files.length) return;
                setUploading(true);
                try {
                  const urls: string[] = [];
                  for (const f of files) urls.push(await uploadImage(f, "archive"));
                  setD((x) => ({ ...x, images: [...x.images, ...urls] }));
                } catch (x) {
                  setMsg({ kind: "error", text: (x as Error).message });
                } finally {
                  setUploading(false);
                  e.target.value = "";
                }
              }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn btn-primary"
              disabled={pending || uploading || !d.title.trim()}
              onClick={() =>
                run(() => saveArchive(editing === "new" ? null : editing, d), "保存しました", () => {
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
      )}

      <ul className="divide-y divide-line border-y border-line">
        {items.map((a) => (
          <li key={a.id} className="flex items-center gap-4 py-4">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-paper-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {a.images[0] && <img src={a.images[0]} alt="" className="h-full w-full object-cover" />}
            </div>
            <button type="button" onClick={() => open(a)} className="min-w-0 flex-1 text-left">
              <p className="truncate font-serif font-bold">{a.title}</p>
              <p className="text-xs text-muted">{a.held_on} ・ {a.place} ・ 写真{a.images.length}枚</p>
            </button>
            <button type="button" className="p-2 text-muted hover:text-accent" aria-label="delete" onClick={() => confirm(`「${a.title}」を削除しますか？`) && run(() => deleteArchive(a.id), undefined, () => router.refresh())}>
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
