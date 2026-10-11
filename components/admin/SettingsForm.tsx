"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveSettings } from "@/app/admin/actions";
import type { SiteSettings } from "@/lib/types";
import { Msg, useAction } from "./useAction";

export default function SettingsForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter();
  const [s, setS] = useState(initial);
  const { pending, msg, run } = useAction();
  return (
    <div className="card grid gap-5 p-5 md:grid-cols-2 md:p-8">
      <label className="block">
        <span className="label">サイト名</span>
        <input className="field" value={s.brand} onChange={(e) => setS({ ...s, brand: e.target.value })} />
      </label>
      <label className="block">
        <span className="label">サブタイトル</span>
        <input className="field" value={s.brand_sub} onChange={(e) => setS({ ...s, brand_sub: e.target.value })} />
      </label>
      <label className="block md:col-span-2">
        <span className="label">お知らせ — タイトル（空欄で非表示）</span>
        <input className="field" value={s.notice_title} onChange={(e) => setS({ ...s, notice_title: e.target.value })} />
      </label>
      <label className="block md:col-span-2">
        <span className="label">お知らせ — 本文（空欄で非表示）</span>
        <textarea className="field" rows={5} value={s.notice_body} onChange={(e) => setS({ ...s, notice_body: e.target.value })} />
      </label>
      <label className="block md:col-span-2">
        <span className="label">お問い合わせURL</span>
        <input className="field" value={s.contact_url} onChange={(e) => setS({ ...s, contact_url: e.target.value })} />
      </label>
      <div className="flex items-center gap-3 md:col-span-2">
        <button
          type="button"
          className="btn btn-primary"
          disabled={pending}
          onClick={() =>
            run(
              () => saveSettings({ brand: s.brand, brand_sub: s.brand_sub, notice_title: s.notice_title, notice_body: s.notice_body, contact_url: s.contact_url }),
              "保存しました",
              () => router.refresh(),
            )
          }
        >
          保存
        </button>
        <Msg msg={msg} />
      </div>
    </div>
  );
}
