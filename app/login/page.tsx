"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { Mail, ArrowRight, Loader2, KeyRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PasswordInput } from "@/components/ui/PasswordInput";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");

  const [method, setMethod] = useState<'password' | 'otp'>('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // --- Handlers ---

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
    });

    if (result?.error) {
        setError("メールアドレスまたはパスワードが間違っています。");
        setLoading(false);
    } else {
        router.push("/reserve");
        router.refresh();
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      try {
          const res = await fetch('/api/auth/otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email })
          });
          if (!res.ok) throw new Error("送信に失敗しました");
          setOtpSent(true);
      } catch (e) {
          setError("認証コードの送信に失敗しました。");
      } finally {
          setLoading(false);
      }
  };

  const handleOtpLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      const result = await signIn("credentials", {
          email,
          code,
          redirect: false,
      });
      if (result?.error) {
          setError("認証コードが無効です。");
          setLoading(false);
      } else {
          router.push("/reserve");
          router.refresh();
      }
  };

  return (
    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-[#1e3820] p-6 text-center text-white">
            <h1 className="text-2xl font-bold">ログイン</h1>
            <p className="text-sm opacity-80 mt-2">Welcome Back</p>
        </div>

        {registered && (
            <div className="bg-green-50 text-green-800 p-3 text-center text-sm font-bold border-b border-green-100">
                登録が完了しました。ログインしてください。
            </div>
        )}

        <div className="p-8 space-y-6">
            
            <button
                onClick={() => signIn("google", { callbackUrl: "/reserve" })}
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-all font-medium shadow-sm"
            >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                Googleでログイン
            </button>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200"></span>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">または</span>
                </div>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">{error}</div>}

            <div className="flex border-b border-gray-200 mb-4">
                <button 
                    onClick={() => { setMethod('password'); setError(null); }}
                    className={`flex-1 pb-2 text-sm font-bold transition-colors ${method === 'password' ? 'border-b-2 border-[#1e3820] text-[#1e3820]' : 'text-gray-400'}`}
                >
                    パスワード
                </button>
                <button 
                    onClick={() => { setMethod('otp'); setError(null); }}
                    className={`flex-1 pb-2 text-sm font-bold transition-colors ${method === 'otp' ? 'border-b-2 border-[#1e3820] text-[#1e3820]' : 'text-gray-400'}`}
                >
                    認証コード (OTP)
                </button>
            </div>

            {method === 'password' && (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">メールアドレス</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                required
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3820] outline-none"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-bold text-gray-700">パスワード</label>
                            <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">
                                パスワードを忘れた方
                            </Link>
                        </div>
                        <PasswordInput 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#1e3820] text-white py-3 rounded-lg hover:bg-[#152916] transition-all font-bold flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "ログイン"}
                    </button>
                </form>
            )}

            {/* OTP Section (Simplified) */}
            {method === 'otp' && (
                !otpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                        <p className="text-sm text-gray-500 text-center">パスワードを忘れた場合や、メール認証でログインしたい場合。</p>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">メールアドレス</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3820] outline-none"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#1e3820] text-white py-3 rounded-lg hover:bg-[#152916] transition-all font-bold flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "認証コードを送信"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleOtpLogin} className="space-y-4">
                        <p className="text-center text-sm font-bold mb-2">認証コードを送信しました: {email}</p>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">認証コード (6桁)</label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3820] outline-none tracking-widest text-lg"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#ff0072] text-white py-3 rounded-lg hover:bg-[#d90061] transition-all font-bold flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "認証してログイン"}
                        </button>
                        <button type="button" onClick={() => setOtpSent(false)} className="w-full text-sm text-gray-500 hover:underline">
                            戻る
                        </button>
                    </form>
                )
            )}

            <div className="mt-6 text-center text-sm text-gray-500 pt-4 border-t border-gray-100">
                アカウントをお持ちでない方は <Link href="/register" className="text-blue-600 font-bold hover:underline">新規登録</Link>
            </div>
        </div>
      </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f2f2f2] flex flex-col items-center justify-center p-4">
      <Suspense fallback={<Loader2 className="animate-spin" />}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
