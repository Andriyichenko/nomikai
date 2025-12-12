"use client";

import Link from "next/link";
import { ArrowRight, Globe } from "lucide-react";
import Navigation from "./Navigation";
import LanguageSelector from "./LanguageSelector";
import { useTheme } from "./ThemeProvider"; // Import useTheme
import { useTranslation } from "@/hooks/useTranslation"; // To get current lang

interface HeroSectionProps {
  lang: "ja" | "cn"; // This prop is used for rendering LanguageSelector, but not directly for content here anymore
}

export default function HeroSection({ lang: propLang }: HeroSectionProps) {
  const { lang: currentLang } = useTranslation(); // Get language from hook
  const { heroTitle, heroSubtitle, heroText, heroTitleCn, heroSubtitleCn, heroTextCn } = useTheme(); 

  // Select content based on currentLang
  const displayTitle = currentLang === 'cn' ? heroTitleCn : heroTitle;
  const displaySubtitle = currentLang === 'cn' ? heroSubtitleCn : heroSubtitle;
  const displayText = currentLang === 'cn' ? heroTextCn : heroText;

  const content = {
    ja: {
      topBar: "ユニクロのバース人材，集合！",
      reserveBtn: "予約",
      otherLang: "🇨🇳 中国語", // Updated to match previous example or correct terminology
      otherLangLink: "/cn",
    },
    cn: {
      topBar: "青春不散场,有你就够了",
      reserveBtn: "预约",
      otherLang: "🇯🇵 日本語",
      otherLangLink: "/",
    },
  };

  const t = content[currentLang]; // Use currentLang for other hardcoded elements like topBar

  const subTextLines = displayText ? displayText.split('\n') : [];

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center text-white">
      <Navigation lang={currentLang} />
      
      {/* Top Bar (still hardcoded per lang, could be moved to config too) */}
      <div className="absolute top-0 w-full bg-[#1e3820] text-white py-3 px-4 text-center font-bold tracking-wide shadow-md z-20">
        {t.topBar}
      </div>

      {/* Main Content */}
      <div className="z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center gap-8 mt-20">
        
        {/* Dynamic Hero Title Area */}
        <div className="bg-black/30 backdrop-blur-sm p-8 rounded-2xl border border-white/10 shadow-2xl transform hover:scale-105 transition-transform duration-500">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter drop-shadow-lg mb-2 font-yuji-syuku">
                {displayTitle}
            </h1>
            <div className="text-5xl md:text-7xl font-black text-[#ff0072] drop-shadow-xl mt-4 animate-pulse">
                {displaySubtitle}
            </div>
        </div>

        {/* Dynamic Hero Text */}
        <div className="space-y-2 font-medium text-lg md:text-2xl text-shadow-md">
          {subTextLines.map((line, i) => (
            <p key={i} className="leading-relaxed drop-shadow-md">{line}</p>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-6 items-center mt-8">
            <Link 
                href="/reserve" 
                className="group relative inline-flex items-center gap-3 px-12 py-4 bg-white text-[#ff0072] text-xl font-black uppercase tracking-widest border-4 border-[#ff0072] hover:bg-[#ff0072] hover:text-white transition-all duration-300 shadow-[0_0_20px_rgba(255,0,114,0.3)] hover:shadow-[0_0_40px_rgba(255,0,114,0.6)] rounded-sm"
            >
                {t.reserveBtn}
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>

            <LanguageSelector />
        </div>
      </div>
    </div>
  );
}