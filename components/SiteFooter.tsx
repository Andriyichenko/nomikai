import Link from "next/link";
import { getDict } from "@/lib/lang";
import { getSettings } from "@/lib/data";

export default async function SiteFooter() {
  const [{ t }, s] = await Promise.all([getDict(), getSettings()]);
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-xs text-muted md:flex-row md:items-center md:justify-between md:px-8">
        <p className="font-display text-sm italic tracking-wider">
          {s.brand} {s.brand_sub} — since 2025
        </p>
        <div className="flex gap-6">
          <Link href="/archive" className="hover:text-ink">{t.nav.archive}</Link>
          <a href={s.contact_url} target="_blank" rel="noreferrer" className="hover:text-ink">Contact</a>
        </div>
      </div>
    </footer>
  );
}
