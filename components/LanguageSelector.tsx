"use client";

import { usePathname, useRouter } from "next/navigation";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function LanguageSelector() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = pathname.startsWith("/cn") ? "cn" : "ja";

  const languages = [
    { code: "ja", label: "日本語", flag: "🇯🇵", path: "/" },
    { code: "cn", label: "中文", flag: "🇨🇳", path: "/cn" },
  ];

  const handleSelect = (path: string) => {
    setIsOpen(false);
    setTimeout(() => {
        router.push(path);
    }, 150);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const currentLangLabel = languages.find(l => l.code === currentLang);

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
            "flex items-center gap-2 px-5 py-3 md:px-4 md:py-2.5 rounded-full transition-all duration-300 group select-none tap-highlight-transparent",
            "bg-black/40 backdrop-blur-xl border border-white/20 shadow-lg",
            "hover:bg-black/60 hover:border-white/40 active:scale-95",
            isOpen && "bg-black/70 border-white/50 ring-2 ring-white/10"
        )}
        aria-label="Select Language"
      >
        <Globe className="w-5 h-5 md:w-4 md:h-4 text-white/90 group-hover:text-white transition-colors" />
        <span className="text-base md:text-sm font-bold tracking-wide text-white">{currentLangLabel?.label}</span>
        <ChevronDown className={cn("w-4 h-4 md:w-3.5 md:h-3.5 text-white/70 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown Menu */}
      <div 
        className={cn(
            "absolute right-0 mt-3 w-56 md:w-48 rounded-2xl overflow-hidden shadow-2xl transition-all duration-200 origin-top-right",
            "bg-white/95 backdrop-blur-2xl border border-white/40 ring-1 ring-black/5",
            isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
        )}
      >
        <div className="p-2 space-y-1">
            <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-1">
                Language / 言語
            </div>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.path)}
                className={cn(
                  "flex items-center w-full px-4 py-3.5 md:py-3 text-sm rounded-xl transition-all duration-200 group active:scale-[0.98]",
                  currentLang === lang.code 
                    ? "bg-[#1e3820]/5 text-[#1e3820] font-bold shadow-inner" 
                    : "text-gray-600 hover:bg-black/5 hover:text-gray-900"
                )}
              >
                <span className="mr-3 text-2xl md:text-xl filter drop-shadow-sm group-hover:scale-110 transition-transform">{lang.flag}</span>
                <span className="flex-1 text-left text-base md:text-sm">{lang.label}</span>
                {currentLang === lang.code && (
                    <div className="bg-[#ff0072] rounded-full p-1 animate-in zoom-in spin-in-90">
                        <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                )}
              </button>
            ))}
        </div>
      </div>
      
      {/* Mobile Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-[-1]" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}