"use client";

import { useState } from "react";
import { 
  Menu, X, ExternalLink, LogOut, LayoutDashboard, LogIn, ShieldCheck, 
  Bell, ChevronRight, User as UserIcon, Archive, ChevronDown 
} from "lucide-react";
import Link from "next/link";
import Image from "next/image"; 
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";
import { useTranslation } from "@/hooks/useTranslation";
import { GlobalSearch } from "./GlobalSearch";
import { useTheme } from "./ThemeProvider"; // Import

interface NavigationProps {
  lang?: "ja" | "cn";
}

export default function Navigation({ lang: propLang }: NavigationProps) {
  const { t, lang: hookLang } = useTranslation();
  const { mainTitle, subTitle } = useTheme(); // Use Theme Context
  const lang = propLang || hookLang;
  
  const [isOpen, setIsOpen] = useState(false);
  const [showArchive, setShowArchive] = useState(false); 
  const { data: session, status } = useSession();

  const toggleMenu = () => setIsOpen(!isOpen);

  // @ts-ignore
  const isAdmin = session?.user?.role === 'admin';

  const menuItems = {
    ja: [
      { href: "/notice", label: t.nav.notice, icon: Bell },
      { href: "https://www.andreyis.com", label: t.nav.contact, icon: ExternalLink },
    ],
    cn: [
      { href: "/notice", label: t.nav.notice, icon: Bell },
      { href: "https://www.andreyis.com", label: t.nav.contact, icon: ExternalLink },
    ],
  };

  const archiveItems = [
      { href: "/archive/2025-01", label: "2025年1月 新年会" },
      { href: "/archive/2025-03", label: "2025年3月 春飲み" },
  ];

  const currentItems = lang === 'cn' ? menuItems.cn : menuItems.ja;

  return (
    <>
      <button
        onClick={toggleMenu}
        className={cn(
            "fixed top-6 left-6 z-50 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 text-[#1e3820] border border-gray-100",
            isOpen && "opacity-0 pointer-events-none"
        )}
        aria-label="Open Menu"
      >
        <Menu size={24} />
      </button>

      <div 
        className={cn(
            "fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300",
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      <div
        className={cn(
          "fixed top-0 left-0 h-full w-[280px] bg-[#1e3820] text-white z-50 transform transition-transform duration-300 ease-out flex flex-col shadow-2xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-6 flex flex-col items-center justify-center border-b border-white/10 relative">
            <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
            >
                <X size={20} />
            </button>

            <div className="relative h-32 w-48 mb-4">
                <Image 
                    src="/my_logo.png"
                    alt="Logo"
                    fill
                    className="object-contain"
                    priority
                />
            </div>

            <div className="text-center font-yuji-syuku leading-tight">
                <div className="text-2xl font-bold tracking-widest text-white">{mainTitle}</div>
                <div className="text-xl font-medium tracking-wide text-white/80 mt-1">{subTitle}</div>
            </div>
        </div>

        {/* Global Search */}
        <div className="pt-4">
            <GlobalSearch />
        </div>
          
        <nav className="flex-1 px-3 overflow-y-auto space-y-1">
            <p className="px-3 text-xs font-bold text-white/40 uppercase tracking-wider mb-2 mt-2">Menu</p>
            {currentItems.map((item, index) => (
            <Link
                key={index}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-all group"
            >
                <item.icon className="w-5 h-5 text-white/70 group-hover:text-[#ff0072] transition-colors" />
                <span className="font-medium flex-1">{item.label}</span>
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-white/50" />
            </Link>
            ))}

            {/* Archive Section */}
            <div>
                <button 
                    onClick={() => setShowArchive(!showArchive)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-all group"
                >
                    <Archive className="w-5 h-5 text-white/70 group-hover:text-[#ff0072] transition-colors" />
                    <span className="font-medium flex-1 text-left">{lang === 'cn' ? '往期活动' : '過去のイベント'}</span>
                    <ChevronDown className={cn("w-4 h-4 text-white/50 transition-transform", showArchive && "rotate-180")} />
                </button>
                
                {showArchive && (
                    <div className="pl-11 space-y-1 animate-in slide-in-from-top-2">
                        {archiveItems.map((item, i) => (
                            <Link 
                                key={i} 
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className="block py-2 text-sm text-white/60 hover:text-white transition-colors"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </nav>

        <div className="p-4 border-t border-white/10 bg-[#152916]">
            {status === "loading" ? (
                <div className="animate-pulse flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-3 bg-white/10 rounded w-20"></div>
                        <div className="h-2 bg-white/10 rounded w-28"></div>
                    </div>
                </div>
            ) : session ? (
                <div className="space-y-3">
                    <div className="flex items-center gap-3 mb-2">
                        {session.user?.image ? (
                            <img 
                                src={session.user.image} 
                                alt="Avatar" 
                                className="w-10 h-10 rounded-full border-2 border-white/20 object-cover" 
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80">
                                <UserIcon size={20} />
                            </div>
                        )}
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-white truncate">{session.user?.name || "User"}</p>
                            <p className="text-[10px] text-white/50 truncate">{session.user?.email}</p>
                        </div>
                    </div>

                    <div className="grid gap-1">
                        <Link 
                            href="/dashboard"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 text-sm transition-colors text-white/80 hover:text-white"
                        >
                            <LayoutDashboard size={16} />
                            {t.nav.myPage}
                        </Link>

                        {isAdmin && (
                            <Link 
                                href="/admin"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#ff0072]/20 text-[#ff0072] hover:bg-[#ff0072]/30 text-sm transition-colors font-bold"
                            >
                                <ShieldCheck size={16} />
                                {t.nav.admin}
                            </Link>
                        )}

                        <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-red-500/20 text-red-300 hover:text-red-200 text-sm transition-colors w-full text-left mt-1"
                        >
                            <LogOut size={16} />
                            {t.nav.logout}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-3 text-center">
                    <p className="text-xs text-white/50">{t.nav.loginMsg}</p>
                    <Link
                        href="/login"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#ff0072] text-white rounded-lg hover:bg-[#d90061] transition-all font-bold shadow-lg"
                    >
                        <LogIn size={18} />
                        {t.nav.login}
                    </Link>
                </div>
            )}
        </div>
      </div>
    </>
  );
}