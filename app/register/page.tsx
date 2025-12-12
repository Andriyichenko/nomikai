"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, AlertCircle, ArrowRight, KeyRound, Check, BellRing } from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { cn } from "@/lib/utils";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
      email: '',
      password: '',
      confirmPassword: '',
      code: '',
      isSubscribed: false // New
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSendCode = async () => {
      if (!formData.email || !formData.email.includes('@')) {
          setError("有効なメールアドレスを入力してください");
          return;
      }
      setOtpLoading(true);
      setError(null);
      try {
          const res = await fetch('/api/auth/otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: formData.email })
          });
          if (!res.ok) throw new Error("送信に失敗しました");
          setOtpSent(true);
      } catch (e: any) {
          setError("認証コードの送信に失敗しました。");
      } finally {
          setOtpLoading(false);
      }
  };

  // Password Validation Logic
  const isValidLength = formData.password.length >= 8 && formData.password.length <= 16;
  const hasNumber = /\d/.test(formData.password);
  const hasLetter = /[a-zA-Z]/.test(formData.password);
  const isPasswordValid = isValidLength && hasNumber && hasLetter;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
        setError("パスワードの要件を満たしていません");
        return;
    }
    if (formData.password !== formData.confirmPassword) {
        setError("パスワードが一致しません");
        return;
    }
    if (formData.code.length !== 6) {
        setError("認証コードは6桁です");
        return;
    }

    setLoading(true);

    try {
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: formData.email, 
                password: formData.password,
                code: formData.code,
                isSubscribed: formData.isSubscribed
            })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Registration failed");
        }

        const loginRes = await signIn("credentials", {
            email: formData.email,
            password: formData.password,
            redirect: false
        });

        if (loginRes?.error) {
            router.push('/login');
        } else {
            router.push('/reserve');
            router.refresh();
        }

    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f2f2] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-[#1e3820] p-6 text-center text-white">
            <h1 className="text-2xl font-bold">新規アカウント登録</h1>
            <p className="text-sm opacity-80 mt-2">Create New Account</p>
        </div>

        <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">メールアドレス</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                            <input
                                name="email"
                                type="email"
                                required
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3820] outline-none disabled:bg-gray-100"
                                placeholder="your@email.com"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={otpSent} 
                            />
                        </div>
                        <button 
                            type="button"
                            onClick={handleSendCode}
                            disabled={otpLoading || otpSent || !formData.email}
                            className="bg-[#1e3820] text-white px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap hover:bg-[#152916] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {otpLoading ? <Loader2 className="animate-spin w-4 h-4" /> : otpSent ? "送信済み" : "コード送信"}
                        </button>
                    </div>
                    {otpSent && <p className="text-xs text-green-600 mt-1">認証コードを送信しました</p>}
                </div>

                {otpSent && (
                    <div className="animate-in fade-in slide-in-from-top-4 space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">認証コード (6桁)</label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                <input
                                    name="code"
                                    type="text"
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3820] outline-none tracking-widest text-lg"
                                    placeholder="123456"
                                    value={formData.code}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <PasswordInput 
                            label="パスワード"
                            name="password"
                            placeholder="8-16桁の英数字"
                            required
                            value={formData.password}
                            onChange={handleChange}
                        />
                        
                        <div className="space-y-1 mt-1">
                            <div className={cn("text-xs flex items-center gap-1", isValidLength ? "text-green-600" : "text-gray-400")}>
                                {isValidLength ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-gray-300" />}
                                8文字以上16文字以内
                            </div>
                            <div className={cn("text-xs flex items-center gap-1", hasLetter && hasNumber ? "text-green-600" : "text-gray-400")}>
                                {hasLetter && hasNumber ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-gray-300" />}
                                半角英字と数字の組み合わせ
                            </div>
                        </div>

                        <PasswordInput 
                            label="パスワード (確認)"
                            name="confirmPassword"
                            required
                            placeholder="Confirm Password"
                            error={!!(formData.confirmPassword && formData.password !== formData.confirmPassword)}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />

                        {/* Subscription Checkbox */}
                        <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                            <div className="relative flex items-center">
                                <input 
                                    type="checkbox" 
                                    name="isSubscribed"
                                    checked={formData.isSubscribed}
                                    onChange={handleChange}
                                    className="w-5 h-5 border-gray-300 rounded text-[#1e3820] focus:ring-[#1e3820]"
                                />
                            </div>
                            <div className="text-sm">
                                <span className="font-bold text-gray-800 flex items-center gap-1">
                                    <BellRing className="w-3 h-3" />
                                    お知らせを受け取る
                                </span>
                                <p className="text-gray-500 text-xs mt-0.5">イベント情報や更新通知をメールで受信します。</p>
                            </div>
                        </label>

                        <button
                            type="submit"
                            disabled={loading || !isPasswordValid}
                            className="w-full bg-[#ff0072] text-white py-3 rounded-lg hover:bg-[#d90061] transition-all font-bold flex items-center justify-center gap-2 mt-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "登録してログイン"}
                            {!loading && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </div>
                )}
            </form>

            <div className="mt-6 text-center text-sm text-gray-500 border-t pt-4">
                すでにアカウントをお持ちの方は <Link href="/login" className="text-blue-600 font-bold hover:underline">ログイン</Link>
            </div>
        </div>
      </div>
    </div>
  );
}