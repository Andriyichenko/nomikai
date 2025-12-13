"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { Mail, ArrowRight, Loader2, KeyRound, ArrowLeft, Home } from "lucide-react";
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
    <div className="w-full max-w-md relative">
        {/* Back Button */}
        <Link 
            href="/" 
            className="absolute -top-12 left-0 text-gray-500 hover:text-[#1e3820] transition-colors flex items-center gap-2 font-medium"
        >
            <div className="bg-white p-2 rounded-full shadow-sm border border-gray-200">
                <ArrowLeft size={18} />
            </div>
            <span>ホームに戻る</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-[#1e3820] p-8 text-center text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('/noise.png')]"></div>
                <h1 className="text-3xl font-bold relative z-10">ログイン</h1>
                <p className="text-sm opacity-80 mt-2 relative z-10">Welcome Back</p>
            </div>

            {registered && (
                <div className="bg-green-50 text-green-800 p-4 text-center text-sm font-bold border-b border-green-100 flex flex-col items-center animate-in slide-in-from-top-2">
                    <span className="text-2xl mb-1">🎉</span>
                    登録が完了しました。<br/>以下よりログインしてください。
                </div>
            )}

            <div className="p-8 space-y-6">
                
                <button
                    onClick={() => signIn("google", { callbackUrl: "/reserve" })}
                    className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition-all font-bold shadow-sm hover:shadow-md active:scale-[0.98]"
                >
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                    Googleでログイン
                </button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200"></span>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-gray-400 font-medium">または</span>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl text-center border border-red-100 animate-pulse">
                        {error}
                    </div>
                )}

                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button 
                        onClick={() => { setMethod('password'); setError(null); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${method === 'password' ? 'bg-white text-[#1e3820] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        パスワード
                    </button>
                    <button 
                        onClick={() => { setMethod('otp'); setError(null); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${method === 'otp' ? 'bg-white text-[#1e3820] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        認証コード
                    </button>
                </div>

                {method === 'password' && (
                    <form onSubmit={handlePasswordLogin} className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">メールアドレス</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3820] focus:border-transparent outline-none transition-all"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-sm font-bold text-gray-700">パスワード</label>
                                <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline font-medium">
                                    パスワードを忘れた方
                                </Link>
                            </div>
                            <PasswordInput 
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className=""
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#1e3820] text-white py-3.5 rounded-xl hover:bg-[#152916] transition-all font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "ログイン"}
                            {!loading && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </form>
                )}

                {/* OTP Section */}
                {method === 'otp' && (
                    !otpSent ? (
                        <form onSubmit={handleSendOtp} className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
                            <div className="bg-blue-50 p-4 rounded-xl text-blue-800 text-sm">
                                <p>メールアドレスに6桁の認証コードを送信します。<br/>パスワードをお忘れの場合もこちら。</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">メールアドレス</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3820] focus:border-transparent outline-none transition-all"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#1e3820] text-white py-3.5 rounded-xl hover:bg-[#152916] transition-all font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : "認証コードを送信"}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleOtpLogin} className="space-y-5 animate-in fade-in slide-in-from-right-4">
                            <div className="text-center">
                                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-green-700">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-gray-800">認証コードを送信しました</h3>
                                <p className="text-sm text-gray-500 mt-1">{email}</p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">認証コード (6桁)</label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3820] focus:border-transparent outline-none tracking-[0.5em] text-lg font-mono text-center"
                                        placeholder="000000"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#ff0072] text-white py-3.5 rounded-xl hover:bg-[#d90061] transition-all font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : "認証してログイン"}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setOtpSent(false)} 
                                className="w-full text-sm text-gray-500 hover:text-gray-800 font-medium py-2"
                            >
                                メールアドレスを再入力
                            </button>
                        </form>
                    )
                )}

                <div className="mt-6 text-center text-sm text-gray-500 pt-6 border-t border-gray-100">
                    アカウントをお持ちでない方は<br/>
                    <Link href="/register" className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1 mt-1">
                        新規アカウント登録 <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>
        </div>
      </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f2f2f2] flex flex-col items-center justify-center p-4">
      <Suspense fallback={<div className="flex justify-center"><Loader2 className="animate-spin text-[#1e3820]" /></div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
