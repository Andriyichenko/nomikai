"use client";

import { Noto_Sans_JP, Yuji_Syuku } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import ThemeProvider from "@/components/ThemeProvider";
import SplashScreen from "@/components/SplashScreen";
import { useEffect, useState } from "react";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [showSplash, setShowSplash] = useState(true);

  // Splash will always show on initial load due to `showSplash` default true
  // It will then be hidden when onAnimationComplete is called
  const handleSplashComplete = () => {
    setShowSplash(false); // Hide splash and show content
  };

  return (
    <html lang="ja">
      <body className={`${notoSansJP.variable} ${yujiSyuku.variable} font-sans antialiased`}>
        <Providers>
            <ThemeProvider>
                {showSplash && <SplashScreen onAnimationComplete={handleSplashComplete} />}
                {/* Ensure children are only visible after splash is hidden */}
                <div style={{ visibility: showSplash ? 'hidden' : 'visible' }}>
                  {children}
                </div>
            </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
