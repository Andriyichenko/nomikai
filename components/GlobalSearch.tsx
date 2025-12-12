"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, User, FileText, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
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
        if (query.length >= 2) {
            setLoading(true);
            setShow(true);
            fetch(`/api/search?q=${encodeURIComponent(query)}`)
                .then(res => res.json())
                .then(setResults)
                .catch(console.error)
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

  return (
    <div className="relative px-4 pb-4" ref={wrapperRef}>
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/50" />
        <input 
            className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:bg-black/30 focus:border-white/30 transition-all"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setShow(true)}
        />
        {loading && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 text-white/50 animate-spin" />}
      </div>

      {show && results.length > 0 && (
          <div className="absolute left-4 right-4 top-full mt-2 bg-white rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95">
              <div className="max-h-64 overflow-y-auto">
                  {results.map((item: any) => (
                      <button
                        key={`${item.type}-${item.id}`}
                        onClick={() => handleSelect(item.href)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 flex items-start gap-3 transition-colors"
                      >
                          <div className="mt-0.5 text-gray-400">
                              {item.type === 'user' && <User size={16} />}
                              {item.type === 'notice' && <FileText size={16} />}
                              {item.type === 'reservation' && <Calendar size={16} />}
                          </div>
                          <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-800 truncate">{item.title}</p>
                              <p className="text-xs text-gray-500 truncate">{item.sub}</p>
                          </div>
                      </button>
                  ))}
              </div>
          </div>
      )}
      
      {show && !loading && results.length === 0 && query.length >= 2 && (
          <div className="absolute left-4 right-4 top-full mt-2 bg-white p-4 rounded-xl shadow-xl text-center text-sm text-gray-500 z-50">
              No results found
          </div>
      )}
    </div>
  );
}
