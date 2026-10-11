import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Noto_Sans_JP, Shippori_Mincho } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getLang } from "@/lib/lang";
import { getPublicEvents, getSettings, getViewer } from "@/lib/data";
import MascotDock, { type DockEvent } from "@/components/MascotDock";
import { effectiveStatus } from "@/components/StatusPill";

const sans = Noto_Sans_JP({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-noto-sans-jp", display: "swap" });
const serif = Shippori_Mincho({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-shippori", display: "swap" });
const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"], variable: "--font-cormorant", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: { default: `${s.brand} ${s.brand_sub}`, template: `%s — ${s.brand} ${s.brand_sub}` },
    description: "お店と日程をみんなで決める、飲み会の投票サイト。",
    icons: { icon: "/icon.png", apple: "/icon.png" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f2eb" },
    { media: "(prefers-color-scheme: dark)", color: "#12110f" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [lang, events, viewer] = await Promise.all([getLang(), getPublicEvents(), getViewer()]);
  const dockEvents: DockEvent[] = events
    .filter((e) => effectiveStatus(e.status, e.deadline) === "open")
    .map((e) => ({ slug: e.slug, title: e.title, deadline: e.deadline, shops: e.shops.map(({ id, name, cover_url }) => ({ id, name, cover_url })) }));
  return (
    <html
      lang={lang === "zh" ? "zh-CN" : "ja"}
      // the splash script adds `splash-seen` before hydration
      suppressHydrationWarning
      className={`${sans.variable} ${serif.variable} ${display.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <MascotDock lang={lang} events={dockEvents} loggedIn={Boolean(viewer)} />
      </body>
    </html>
  );
}
