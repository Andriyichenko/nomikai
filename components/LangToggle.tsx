"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Lang } from "@/lib/i18n";

export default function LangToggle({ lang }: { lang: Lang }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const set = (next: Lang) => {
    document.cookie = `lang=${next}; path=/; max-age=31536000; samesite=lax`;
    start(() => router.refresh());
  };
  return (
    <div className="flex items-center text-xs tracking-widest" aria-busy={pending}>
      {(["ja", "zh"] as const).map((l, i) => (
        <span key={l} className="flex items-center">
          {i > 0 && <span className="px-1 text-line">/</span>}
          <button
            type="button"
            onClick={() => set(l)}
            aria-pressed={lang === l}
            className={lang === l ? "text-ink" : "text-muted hover:text-ink"}
          >
            {l === "ja" ? "日" : "中"}
          </button>
        </span>
      ))}
    </div>
  );
}
