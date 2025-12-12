"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface ThemeConfig {
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  layout: string;
  mainTitle: string;
  subTitle: string;
  heroTitle: string;
  heroSubtitle: string;
  heroText: string;
  heroTitleCn: string;
  heroSubtitleCn: string;
  heroTextCn: string;
}

const ThemeContext = createContext<ThemeConfig>({
  primaryColor: "#1e3820",
  accentColor: "#ff0072",
  fontFamily: "sans",
  layout: "sidebar",
  mainTitle: "バース人材",
  subTitle: "飲み会",
  heroTitle: "25年3月29日に飲み会",
  heroSubtitle: "決定",
  heroText: "一緒に素敵な思い出作りませんか？\n25年3月29日にお待ちしております",
  heroTitleCn: "25年3月干饭大事预约",
  heroSubtitleCn: "开搞",
  heroTextCn: "青春不散场,有你就够了\n25年3月29日不见不散"
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ThemeConfig>({
    primaryColor: "#1e3820",
    accentColor: "#ff0072",
    fontFamily: "sans",
    layout: "sidebar",
    mainTitle: "バース人材",
    subTitle: "飲み会",
    heroTitle: "25年3月29日に飲み会",
    heroSubtitle: "決定",
    heroText: "一緒に素敵な思い出作りませんか？\n25年3月29日にお待ちしております",
    heroTitleCn: "25年3月干饭大事预约",
    heroSubtitleCn: "开搞",
    heroTextCn: "青春不散场,有你就够了\n25年3月29日不见不散"
  });

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
          if (data) setConfig(data);
          
          document.documentElement.style.setProperty('--primary-color', data.primaryColor || '#1e3820');
          document.documentElement.style.setProperty('--accent-color', data.accentColor || '#ff0072');
          
          if (data.fontFamily === 'serif') {
              document.documentElement.style.setProperty('--font-current', 'var(--font-yuji-syuku)');
          } else {
              document.documentElement.style.setProperty('--font-current', 'var(--font-noto-sans-jp)');
          }
      })
      .catch(console.error);
  }, []);

  return (
    <ThemeContext.Provider value={config}>
      {children}
    </ThemeContext.Provider>
  );
}
