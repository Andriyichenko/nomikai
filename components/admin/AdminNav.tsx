"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const TABS = [
  { href: "/admin/events", label: "会" },
  { href: "/admin/shops", label: "お店" },
  { href: "/admin/settings", label: "標語・お知らせ" },
  { href: "/admin/members", label: "メンバー" },
  { href: "/admin/archive", label: "アーカイブ" },
];

export default function AdminNav() {
  const path = usePathname();
  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:px-0">
      {TABS.map((t) => {
        const on = path.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={clsx(
              "shrink-0 rounded-full px-4 py-2 text-sm transition-colors",
              on ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
