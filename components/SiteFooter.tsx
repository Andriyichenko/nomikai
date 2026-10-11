import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getDict } from "@/lib/lang";
import { getSettings, getViewer } from "@/lib/data";

/**
 * Closing band: ink background like the "Confirmed" card, the brand with its vermilion seal,
 * the slogan, and a short link list. Extra bottom padding keeps the last row clear of the
 * mascot dock and the sticky submit bar on event pages.
 */
export default async function SiteFooter() {
  const [{ t }, s, viewer] = await Promise.all([getDict(), getSettings(), getViewer()]);
  const links = [
    { href: "/", label: t.footer.home },
    { href: "/archive", label: t.nav.archive },
    viewer ? { href: "/me", label: t.nav.me } : { href: "/login", label: t.nav.login },
  ];

  return (
    <footer className="mt-24 overflow-hidden bg-ink text-paper">
      <div className="relative mx-auto max-w-6xl px-4 pb-32 pt-14 md:px-8 md:pt-20">
        <p
          aria-hidden
          className="pointer-events-none absolute -right-2 top-4 select-none font-display text-[clamp(4.5rem,16vw,11rem)] italic leading-none text-paper/[0.06] md:right-6"
        >
          Kanpai.
        </p>

        <div className="relative grid gap-12 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="h-3 w-3 shrink-0 bg-accent" />
              <span className="font-serif text-2xl font-bold tracking-[0.14em] md:text-3xl">{s.brand}</span>
              <span className="font-serif text-sm font-medium tracking-[0.12em] text-paper/60">{s.brand_sub}</span>
            </Link>
            <p className="mt-5 max-w-md font-serif text-lg leading-relaxed tracking-[0.1em] text-paper/80 md:text-xl">
              {t.footer.lead}
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm sm:flex sm:gap-x-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="-mx-2 rounded-full px-2 py-2 text-paper/75 transition-colors hover:text-paper sm:px-3"
              >
                {l.label}
              </Link>
            ))}
            <a
              href={s.contact_url}
              target="_blank"
              rel="noreferrer"
              className="-mx-2 inline-flex items-center gap-1 rounded-full px-2 py-2 text-paper/75 transition-colors hover:text-accent sm:px-3"
            >
              {t.footer.contact} <ArrowUpRight size={14} />
            </a>
          </nav>
        </div>

        <div className="relative mt-12 flex flex-col gap-1 border-t border-paper/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-sm italic tracking-wider text-paper/50">
            © {new Date().getFullYear()} {s.brand} {s.brand_sub}
          </p>
          <p className="font-display text-xs uppercase tracking-[0.3em] text-paper/40">since 2025</p>
        </div>
      </div>
    </footer>
  );
}
