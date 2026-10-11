"use client";

import { ArrowDown, Users } from "lucide-react";

/**
 * Small pill under the event facts that scrolls smoothly to the "みんなの回答" board (#results).
 */
export default function JumpToResults({ label, count }: { label: string; count?: number }) {
  const body = (
    <>
      <Users size={13} className="text-muted transition-colors group-hover:text-accent" />
      {label}
      {count !== undefined && count > 0 && (
        <span className="rounded-full bg-paper-2 px-1.5 font-display text-[13px] leading-5 text-ink-2">{count}</span>
      )}
      <ArrowDown size={13} className="transition-transform group-hover:translate-y-0.5" />
    </>
  );
  const cls =
    "group inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-card px-3.5 text-xs font-medium tracking-wide text-ink-2 transition-colors hover:border-ink hover:text-ink";

  return (
    <a
      href="#results"
      className={cls}
      onClick={(e) => {
        const el = document.getElementById("results");
        if (!el) return;
        e.preventDefault();
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        history.replaceState(history.state, "", "#results");
      }}
    >
      {body}
    </a>
  );
}
