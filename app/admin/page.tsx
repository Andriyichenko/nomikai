"use client";

import AdminDashboard from "@/components/AdminDashboard";
import { useSession } from "next-auth/react";
import { Loader2, ShieldAlert, LogIn } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const { data: session, status } = useSession();

  // 1. Loading State
  if (status === "loading") {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#1e3820] mx-auto mb-4" />
                <p className="text-gray-500">Loading admin session...</p>
            </div>
        </div>
      );
  }

  // 2. Unauthenticated State
  if (status === "unauthenticated") {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-gray-50">
              <ShieldAlert className="w-16 h-16 text-gray-400 mb-4" />
              <h1 className="text-2xl font-bold text-gray-800">ログインが必要です</h1>
              <p className="text-gray-600 mt-2 mb-6">管理画面にアクセスするにはログインしてください。</p>
              <Link 
                href="/login?callbackUrl=/admin"
                className="flex items-center gap-2 bg-[#1e3820] text-white px-6 py-3 rounded-lg hover:bg-[#152916] transition font-bold"
              >
                  <LogIn className="w-5 h-5" />
                  ログイン画面へ
              </Link>
          </div>
      );
  }

  // 3. Unauthorized State (Logged in but not Admin)
  // @ts-ignore
  if (session?.user?.role !== 'admin') {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-gray-50">
              <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
              <h1 className="text-2xl font-bold text-gray-800">アクセス権限がありません</h1>
              <p className="text-gray-600 mt-2 mb-6">
                  このアカウント ({session?.user?.email}) は管理者権限を持っていません。
              </p>
              
              <div className="text-xs bg-gray-200 p-4 rounded text-left mb-6 font-mono text-gray-600 max-w-sm mx-auto overflow-auto">
                  <p><strong>Debug Info:</strong></p>
                  <p>Status: {status}</p>
                  <p>Email: {session?.user?.email}</p>
                  {/* @ts-ignore */}
                  <p>Role: "{session?.user?.role || 'undefined'}"</p>
              </div>

              <Link 
                href="/"
                className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition"
              >
                  トップページへ戻る
              </Link>
          </div>
      );
  }

  // 4. Authorized (Admin)
  return <AdminDashboard />;
}
