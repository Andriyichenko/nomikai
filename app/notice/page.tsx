"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Bell, Search, Calendar, History } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";

interface Notice {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

export default function NoticePage() {
  const { lang } = useTranslation();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch('/api/notice')
      .then(res => res.json())
      .then(data => {
          if (Array.isArray(data)) {
              setNotices(data);
          } else {
              setNotices([data]); // Handle legacy single object response
          }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredNotices = notices.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-[#1e3820] text-white p-4 shadow-md sticky top-0 z-50 flex items-center gap-4">
        <Link href="/" className="hover:bg-white/10 p-2 rounded-full transition">
            <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-bold">{lang === 'cn' ? '活动公告' : 'お知らせ'}</h1>
      </header>

      <div className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-6 space-y-6">
        
        {/* Search Bar */}
        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400 ml-2" />
            <input 
                type="text"
                placeholder={lang === 'cn' ? '搜索公告...' : 'お知らせを検索...'}
                className="flex-1 p-2 outline-none text-gray-700 placeholder-gray-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>

        {loading ? (
            <div className="space-y-4">
                {[1,2,3].map(i => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-pulse">
                        <div className="h-6 bg-gray-200 w-3/4 rounded mb-4"></div>
                        <div className="h-4 bg-gray-200 w-full rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 w-1/2 rounded"></div>
                    </div>
                ))}
            </div>
        ) : filteredNotices.length > 0 ? (
            <div className="space-y-6">
                {/* Latest Notice Highlight */}
                {filteredNotices.map((notice, index) => (
                    <div 
                        key={notice.id || index} 
                        className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md ${index === 0 ? 'ring-2 ring-[#1e3820]/10' : 'opacity-90'}`}
                    >
                        <div className={`${index === 0 ? 'bg-green-50' : 'bg-gray-50'} p-4 border-b border-gray-100 flex items-start justify-between`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${index === 0 ? 'bg-white text-[#1e3820] shadow-sm' : 'bg-gray-200 text-gray-500'}`}>
                                    {index === 0 ? <Bell className="w-5 h-5" /> : <History className="w-4 h-4" />}
                                </div>
                                <div>
                                    <h2 className={`font-bold ${index === 0 ? 'text-lg text-[#1e3820]' : 'text-md text-gray-700'}`}>
                                        {notice.title}
                                    </h2>
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(notice.updatedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            {index === 0 && <span className="bg-[#ff0072] text-white text-[10px] font-bold px-2 py-1 rounded-full">NEW</span>}
                        </div>
                        <div className="p-6 text-gray-700 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                            {notice.content}
                        </div>
                        {index === 0 && (
                            <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                                <Link href="/reserve" className="text-[#ff0072] font-bold text-sm hover:underline flex items-center justify-center gap-1">
                                    {lang === 'cn' ? '立即预约 >' : '予約へ進む >'}
                                </Link>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-20 text-gray-400">
                <p>{lang === 'cn' ? '没有找到相关公告' : '該当するお知らせは見つかりませんでした'}</p>
            </div>
        )}
      </div>
    </div>
  );
}
