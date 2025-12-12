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
    // Preserve sub-paths if we were implementing deeper routing, 
    // but for now simple switch is fine as structure is / and /cn
    router.push(path);
    setIsOpen(false);
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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-black/30 backdrop-blur-md hover:bg-black/50 text-white rounded-full transition-all border border-white/20 hover:border-white/40 group"
      >
        <Globe className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" />
        <span className="text-sm font-medium tracking-wide">{currentLangLabel?.label}</span>
        <ChevronDown className={cn("w-3 h-3 text-white/60 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right border border-gray-100 ring-1 ring-black/5">
          <div className="p-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.path)}
                className={cn(
                  "flex items-center w-full px-3 py-2.5 text-sm rounded-lg transition-colors",
                  currentLang === lang.code 
                    ? "bg-gray-50 text-[#1e3820] font-bold" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <span className="mr-2 text-lg">{lang.flag}</span>
                <span className="flex-1 text-left">{lang.label}</span>
                {currentLang === lang.code && <Check className="w-4 h-4 text-[#ff0072]" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}