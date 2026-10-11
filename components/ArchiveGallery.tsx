import Image from "next/image";
import Link from "next/link";
import type { ArchiveEntry } from "@/lib/types";
import { paletteAt } from "@/lib/palette";

const dot = (d: string | null) => (d ? d.replace(/-/g, ".") : "");

/**
 * Home-page archive: a sideways-scrolling wall of prints. Each gathering gets its own
 * traditional colour — an offset mat behind the photo and a vertical caption tab.
 */
export default function ArchiveGallery({
  entries,
  title,
  lead,
  viewAll,
}: {
  entries: ArchiveEntry[];
  title: string;
  lead: string;
  viewAll: string;
}) {
  return (
    <section className="relative mt-28 overflow-hidden bg-[#efe6d6] py-16 text-[#1b1a17] md:py-24 dark:bg-[#1d1b17] dark:text-[#efebe3]">
      {/* soft colour washes */}
      <span aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#e0a526]/25 blur-3xl" />
      <span aria-hidden className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-[#c23a2b]/15 blur-3xl" />
      <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 rounded-full bg-[#2b4c7e]/10 blur-3xl" />

      <div className="relative mx-auto flex max-w-6xl items-end justify-between gap-6 px-4 md:px-8">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.35em] text-[#c23a2b]">Archive</p>
          <h2 className="mt-3 font-serif text-3xl font-bold tracking-[0.14em] md:text-5xl">{title}</h2>
          <p className="mt-3 font-display text-lg italic opacity-60">{lead}</p>
        </div>
        <Link
          href="/archive"
          className="shrink-0 border-b border-current pb-1 text-xs tracking-[0.2em] opacity-70 transition hover:text-[#c23a2b] hover:opacity-100"
        >
          {viewAll} →
        </Link>
      </div>

      <div className="relative mt-12 flex snap-x snap-mandatory gap-8 overflow-x-auto overscroll-x-contain px-6 pb-10 pt-4 [scrollbar-width:none] md:gap-12 md:px-[max(2.5rem,calc((100vw-72rem)/2+2.5rem))] [&::-webkit-scrollbar]:hidden">
        {entries.map((a, i) => {
          const c = paletteAt(i);
          const tilt = i % 3 === 0 ? "-rotate-[1.2deg]" : i % 3 === 1 ? "rotate-[1deg]" : "-rotate-[0.4deg]";
          return (
            <Link key={a.id} href={`/archive#${a.id}`} className={`group relative block w-[66vw] shrink-0 snap-start sm:w-72 ${i % 2 ? "md:mt-14" : ""}`}>
              <div className={`relative transition-transform duration-500 group-hover:rotate-0 ${tilt}`}>
                {/* coloured mat */}
                <span
                  aria-hidden
                  className="absolute inset-0 translate-x-3 translate-y-3 rounded-sm transition-transform duration-500 group-hover:translate-x-4 group-hover:translate-y-4"
                  style={{ background: c.bg }}
                />
                <figure className="relative aspect-[3/4] overflow-hidden rounded-sm bg-white shadow-[0_18px_40px_-20px_rgba(27,26,23,0.5)]">
                  {a.images[0] ? (
                    <Image
                      src={a.images[0]}
                      alt={a.title}
                      fill
                      sizes="(min-width: 640px) 18rem, 66vw"
                      className="object-cover saturate-[1.08] transition duration-700 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="absolute inset-0 flex items-center justify-center font-serif text-[9rem] font-bold leading-none"
                      style={{ background: c.bg, color: c.ink, opacity: 0.9 }}
                    >
                      {a.title.trim().slice(0, 1)}
                    </span>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-white/85 px-2.5 py-0.5 font-display text-xs tracking-widest text-[#1b1a17] backdrop-blur">
                    No.{String(entries.length - i).padStart(2, "0")}
                  </span>
                </figure>
                {/* vertical caption tab */}
                <figcaption
                  className="absolute -right-3 top-6 px-1.5 py-3 font-serif text-sm font-bold tracking-[0.3em] shadow-md [writing-mode:vertical-rl]"
                  style={{ background: c.bg, color: c.ink }}
                >
                  {a.title}
                </figcaption>
              </div>
              <div className="mt-7 flex items-baseline justify-between gap-3">
                <span className="font-display text-2xl tracking-wider" style={{ color: c.bg }}>
                  {dot(a.held_on)}
                </span>
                <span className="truncate text-xs opacity-60">{a.place}</span>
              </div>
            </Link>
          );
        })}
        <span className="w-1 shrink-0" aria-hidden />
      </div>
    </section>
  );
}
