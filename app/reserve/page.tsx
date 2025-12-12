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
    <div className="min-h-screen bg-[#f2f2f2] flex flex-col">
      <div className="bg-[#1e3820] text-white p-4 flex items-center justify-between shadow-md sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 hover:text-gray-300 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold">TOP</span>
        </Link>
        <h1 className="font-bold text-lg">25年3月飲み会 予約</h1>
        <div className="w-16"></div> 
      </div>
      
      <div className="flex-1 w-full max-w-2xl mx-auto p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-[#ff0072] p-6 text-white text-center">
                <h2 className="text-2xl font-black mb-1">参加予約フォーム</h2>
                <p className="opacity-90 text-sm">ようこそ、{session.user?.name || session.user?.email} さん</p>
            </div>
            <div className="p-6 md:p-8">
                <ReservationForm />
            </div>
        </div>
      </div>
    </div>
  );
}
