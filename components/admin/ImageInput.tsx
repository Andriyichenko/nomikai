"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/** Upload one image to the public `media` bucket and return its URL. */
export async function uploadImage(file: File, folder: string) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const supabase = createClient();
  const { error } = await supabase.storage.from("media").upload(path, file, { cacheControl: "31536000", contentType: file.type });
  if (error) throw error;
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}

/** URL field + upload button + preview. */
export default function ImageInput({
  label,
  value,
  onChange,
  folder,
  round,
}: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  round?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex items-center gap-3">
        <div className={`relative h-16 w-16 shrink-0 overflow-hidden border border-line bg-paper-2 ${round ? "rounded-full" : "rounded-xl"}`}>
          {value && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 gap-2">
          <input
            className="field min-w-0 text-xs"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
            placeholder="https://…"
          />
          <button type="button" className="btn btn-ghost shrink-0 !px-3" onClick={() => fileRef.current?.click()} disabled={busy} aria-label="upload">
            <ImagePlus size={16} />
          </button>
          {value && (
            <button type="button" className="btn btn-ghost shrink-0 !px-3" onClick={() => onChange(null)} aria-label="clear">
              <X size={16} />
            </button>
          )}
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          setErr("");
          try {
            onChange(await uploadImage(f, folder));
          } catch (x) {
            setErr((x as Error).message);
          } finally {
            setBusy(false);
            e.target.value = "";
          }
        }}
      />
      {busy && <p className="mt-1 text-xs text-muted">アップロード中…</p>}
      {err && <p className="mt-1 text-xs text-accent">{err}</p>}
    </div>
  );
}
