"use client";

import Link from "next/link";
import { ArrowLeft, LogIn } from "lucide-react";
import ReservationForm from "@/components/ReservationForm";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ReservePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
        router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
      return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) return null; // Prevent flash

  return (
    <div className="min-h-screen bg-[#f8f9fa] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] flex flex-col">
      <div className="bg-[#1e3820] text-white p-4 flex items-center justify-between shadow-md sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
        <Link href="/" className="flex items-center gap-2 hover:text-gray-300 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold">TOP</span>
        </Link>
        <h1 className="font-bold text-lg hidden md:block">25年3月飲み会 予約</h1>
        <Link href="/dashboard" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition text-sm font-bold active:scale-95">
            <span className="hidden md:inline">My Page</span>
            <LogIn className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="flex-1 w-full max-w-2xl mx-auto p-4 md:p-8 md:my-8">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-[#ff0072] to-[#d90061] p-6 md:p-8 text-white text-center">
                <h2 className="text-2xl md:text-3xl font-black mb-2 tracking-tight">参加予約フォーム</h2>
                <p className="opacity-90 text-sm md:text-base font-medium">ようこそ、{session.user?.name || session.user?.email} さん</p>
            </div>
            <div className="p-5 md:p-10">
                <ReservationForm />
            </div>
        </div>
      </div>
    </div>
  );
}
