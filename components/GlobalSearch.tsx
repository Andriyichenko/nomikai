"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, User, FileText, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";

export function GlobalSearch() {
  const { lang } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShow(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
        if (query.trim().length >= 1) {
            setLoading(true);
            setShow(true);
            setError(false);
            fetch(`/api/search?q=${encodeURIComponent(query)}`)
                .then(async res => {
                    if (!res.ok) throw new Error("Search failed");
                    return res.json();
                })
                .then(data => {
                    setResults(Array.isArray(data) ? data : []);
                })
                .catch(err => {
                    console.error(err);
                    setError(true);
                    setResults([]);
                })
                .finally(() => setLoading(false));
        } else {
            setResults([]);
            setShow(false);
        }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (href: string) => {
      router.push(href);
      setShow(false);
      setQuery("");
  };

  // Get input position for dropdown
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  useEffect(() => {
      if (show && wrapperRef.current) {
          const rect = wrapperRef.current.getBoundingClientRect();
          setDropdownPos({
              top: rect.bottom,
              left: rect.left,
              width: rect.width
          });
      }
  }, [show, query, results]);

  return (
    <div className="relative px-4 pb-4" ref={wrapperRef}>
      <div className="relative z-[60]">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/50" />
        <input 
            className="w-full bg-white/10 border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:bg-white/20 focus:border-[#ff0072]/50 transition-all shadow-inner"
            placeholder={lang === 'cn' ? "搜索活动、公告..." : "Search events, notices..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 1 && setShow(true)}
        />
        {loading && (
            <div className="absolute right-3 top-2.5 flex items-center h-5">
                <Loader2 className="w-4 h-4 text-[#ff0072] animate-spin" />
            </div>
        )}
      </div>

      {show && query.length >= 1 && (
          <div 
            className="fixed mt-2 bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden z-[9999] animate-in slide-in-from-top-2 duration-200"
            style={{ 
                top: `${dropdownPos.top}px`, 
                left: `${dropdownPos.left}px`, 
                width: `${dropdownPos.width}px` 
            }}
          >
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {loading ? (
                      <div className="p-8 text-center">
                          <Loader2 className="w-8 h-8 text-[#ff0072]/20 animate-spin mx-auto mb-2" />
                          <p className="text-xs text-gray-400 font-medium">Searching...</p>
                      </div>
                  ) : error ? (
                      <div className="p-6 text-center text-red-500">
                          <p className="text-xs font-bold">Search temporarily unavailable</p>
                      </div>
                  ) : results.length > 0 ? (
                      <>
                        <div className="p-2 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center px-4">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Found {results.length} results</span>
                        </div>
                        {results.map((item: any) => (
                            <button
                                key={`${item.type}-${item.id}`}
                                onClick={() => handleSelect(item.href)}
                                className="w-full text-left px-4 py-3 hover:bg-[#ff0072]/5 border-b border-gray-50 last:border-0 flex items-start gap-3 transition-all group"
                            >
                                <div className="mt-1 p-1.5 rounded-lg bg-gray-100 text-gray-400 group-hover:bg-[#ff0072]/10 group-hover:text-[#ff0072] transition-colors shrink-0">
                                    {item.type === 'user' && <User size={14} />}
                                    {item.type === 'notice' && <FileText size={14} />}
                                    {item.type === 'reservation' && <Calendar size={14} />}
                                    {item.type === 'event' && <Calendar size={14} />}
                                </div>
                                <div className="min-w-0 py-0.5">
                                    <p className="text-sm font-bold text-gray-800 truncate group-hover:text-[#ff0072] transition-colors">{item.title}</p>
                                    <p className="text-[10px] text-gray-400 truncate mt-0.5">{item.sub}</p>
                                </div>
                            </button>
                        ))}
                      </>
                  ) : (
                      <div className="p-8 text-center">
                          <div className="text-[#ff0072]/20 mb-2 flex justify-center">
                              <Search size={32} />
                          </div>
                          <p className="text-xs font-bold text-gray-500">No results for "{query}"</p>
                          <p className="text-[10px] text-gray-400 mt-1">Try a different keyword</p>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
}