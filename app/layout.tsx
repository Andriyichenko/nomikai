import type { Metadata } from "next";
import { Noto_Sans_JP, Yuji_Syuku } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto-sans-jp",
});

const yujiSyuku = Yuji_Syuku({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-yuji-syuku",
});

export const metadata: Metadata = {
  title: "バース人材 飲み会予約",
  description: "25年3月29日に飲み会",
  icons: {
    icon: "/homelogo1.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.variable} ${yujiSyuku.variable} font-sans antialiased`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}