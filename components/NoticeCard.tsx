"use client";

import { useRef } from "react";
import { ArrowUpRight, X } from "lucide-react";

/** Headline + two-line teaser on the home page; the full notice opens in a dialog. */
export default function NoticeCard({
  title,
  body,
  updatedAt,
  label,
  more,
}: {
  title: string;
  body: string;
  updatedAt: string | null;
  label: string;
  more: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const date = updatedAt ? updatedAt.slice(0, 10).replace(/-/g, ".") : "";
  const teaser = body.replace(/\s+/g, " ").trim();

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="group flex w-full items-center gap-4 rounded-2xl border border-line bg-card px-5 py-4 text-left transition-colors hover:border-ink md:gap-8 md:px-7 md:py-5"
      >
        <span className="hidden shrink-0 flex-col md:flex">
          <span className="eyebrow">Notice</span>
          {date && <span className="font-display text-sm text-muted">{date}</span>}
        </span>
        <span className="h-10 w-px shrink-0 bg-line max-md:hidden" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent md:hidden" />
            <span className="eyebrow md:hidden">{label}</span>
          </span>
          <span className="mt-1 block truncate font-serif text-base font-bold tracking-wide md:mt-0 md:text-lg">
            {title || teaser.slice(0, 40)}
          </span>
          {title && <span className="mt-0.5 line-clamp-1 text-xs text-muted md:text-sm">{teaser}</span>}
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-paper">
          <ArrowUpRight size={16} />
        </span>
        <span className="sr-only">{more}</span>
      </button>

      <dialog
        ref={ref}
        onClick={(e) => e.target === ref.current && ref.current?.close()}
        className="m-0 mt-auto max-h-[85dvh] w-full max-w-none rounded-t-3xl bg-card p-0 text-ink backdrop:bg-ink/40 backdrop:backdrop-blur-sm md:m-auto md:max-w-xl md:rounded-3xl"
      >
        <div className="flex max-h-[85dvh] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-line px-6 pb-4 pt-6 md:px-8">
            <div>
              <p className="eyebrow">Notice{date && ` — ${date}`}</p>
              <h2 className="mt-2 font-serif text-xl font-bold leading-snug tracking-wide">{title || label}</h2>
            </div>
            <button type="button" onClick={() => ref.current?.close()} aria-label="close" className="-mr-2 p-2 text-muted hover:text-ink">
              <X size={20} />
            </button>
          </div>
          <div className="overflow-y-auto overscroll-contain px-6 py-6 md:px-8">
            <p className="whitespace-pre-line text-[15px] leading-loose text-ink-2">{body}</p>
          </div>
        </div>
      </dialog>
    </>
  );
}
