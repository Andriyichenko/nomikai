"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Bell } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";

interface Notice {
  title: string;
  content: string;
  updatedAt?: string;
}

export default function NoticePage() {
  const { lang } = useTranslation();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/notice')
      .then(res => res.json())
      .then(setNotice)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-[#1e3820] text-white p-4 shadow-md sticky top-0 z-50 flex items-center gap-4">
        <Link href="/" className="hover:bg-white/10 p-2 rounded-full transition">
            <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-bold">{lang === 'cn' ? '活动公告' : 'お知らせ'}</h1>
      </header>

      <div className="flex-1 max-w-3xl mx-auto w-full p-6">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <div className="animate-pulse w-12 h-12 bg-gray-200 rounded-full mb-4"></div>
                <div className="animate-pulse w-48 h-4 bg-gray-200 rounded"></div>
            </div>
        ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-green-50 p-6 border-b border-green-100 flex items-start gap-4">
                    <div className="bg-white p-3 rounded-full shadow-sm text-[#1e3820]">
                        <Bell className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#1e3820] mb-1">{notice?.title}</h2>
                        {notice?.updatedAt && (
                            <p className="text-xs text-gray-500">
                                {new Date(notice.updatedAt).toLocaleDateString()} 更新
                            </p>
                        )}
                    </div>
                </div>
                <div className="p-8 text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {notice?.content}
                </div>
                
                <div className="p-6 border-t border-gray-100 bg-gray-50 text-center">
                    <Link 
                        href="/reserve"
                        className="inline-block bg-[#ff0072] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#d90061] transition shadow-lg hover:shadow-xl active:scale-[0.98]"
                    >
                        {lang === 'cn' ? '立即预约' : '予約へ進む'}
                    </Link>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
