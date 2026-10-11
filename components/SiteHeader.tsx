import Link from "next/link";
import Image from "next/image";
import { getDict } from "@/lib/lang";
import { getSettings, getViewer } from "@/lib/data";
import LangToggle from "./LangToggle";
import Avatar from "./Avatar";

export default async function SiteHeader() {
  const [{ lang, t }, settings, viewer] = await Promise.all([getDict(), getSettings(), getViewer()]);
  const profile = viewer?.profile;

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <Image src="/mark.png" alt="" width={35} height={28} priority />
          <span className="flex items-baseline gap-2 font-serif text-[15px] font-bold tracking-[0.12em]">
            {settings.brand}
            <span className="font-medium text-muted transition-colors group-hover:text-accent">{settings.brand_sub}</span>
          </span>
        </Link>

        <nav className="flex items-center gap-4 text-sm md:gap-7">
          <Link href="/archive" className="hidden text-ink-2 hover:text-ink sm:inline">
            {t.nav.archive}
          </Link>
          {profile?.is_admin && (
            <Link href="/admin" className="text-ink-2 hover:text-ink">
              {t.nav.admin}
            </Link>
          )}
          <LangToggle lang={lang} />
          {viewer ? (
            <Link href="/me" aria-label={t.nav.me} className="flex items-center">
              <Avatar name={profile?.display_name ?? "?"} src={profile?.avatar_url} size={32} />
            </Link>
          ) : (
            <Link href="/login" className="btn btn-ghost !min-h-9 !px-4 text-xs">
              {t.nav.login}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
