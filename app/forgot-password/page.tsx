"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, KeyRound, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
      email: '',
      code: '',
      newPassword: '',
      confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendCode = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      try {
          const res = await fetch('/api/auth/otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: formData.email })
          });
          if (!res.ok) throw new Error("送信に失敗しました。メールアドレスを確認してください。");
          setStep('reset');
      } catch (e: any) {
          setError(e.message);
      } finally {
          setLoading(false);
      }
  };

  const handleReset = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (formData.newPassword !== formData.confirmPassword) {
          setError("パスワードが一致しません");
          return;
      }

      setLoading(true);
      try {
          const res = await fetch('/api/auth/reset-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  email: formData.email,
                  code: formData.code,
                  newPassword: formData.newPassword
              })
          });
          
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Reset failed");

          setSuccess(true);
      } catch (e: any) {
          setError(e.message);
      } finally {
          setLoading(false);
      }
  };

  if (success) {
      return (
        <div className="min-h-screen bg-[#f2f2f2] flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">パスワード再設定完了</h2>
                <p className="text-gray-600 mb-8">パスワードが新しく設定されました。<br/>新しいパスワードでログインしてください。</p>
                <Link href="/login" className="bg-[#1e3820] text-white px-6 py-3 rounded-lg hover:bg-[#152916] font-bold block w-full">
                    ログイン画面へ
                </Link>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#f2f2f2] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-[#1e3820] p-6 text-center text-white">
            <h1 className="text-2xl font-bold">パスワード再設定</h1>
            <p className="text-sm opacity-80 mt-2">Reset Password</p>
        </div>

        <div className="p-8">
            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            {step === 'email' ? (
                <form onSubmit={handleSendCode} className="space-y-6">
                    <p className="text-sm text-gray-600">
                        登録したメールアドレスを入力してください。<br/>
                        認証コードを送信します。
                    </p>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">メールアドレス</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                            <input
                                name="email"
                                type="email"
                                required
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3820] outline-none"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#1e3820] text-white py-3 rounded-lg hover:bg-[#152916] transition-all font-bold flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "認証コードを送信"}
                        {!loading && <ArrowRight className="w-4 h-4" />}
                    </button>
                    <div className="text-center">
                        <Link href="/login" className="text-sm text-gray-500 hover:underline">戻る</Link>
                    </div>
                </form>
            ) : (
                <form onSubmit={handleReset} className="space-y-5">
                    <p className="text-sm font-bold text-[#1e3820]">認証コードを送信しました: {formData.email}</p>
                    
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
                        label="新しいパスワード"
                        name="newPassword"
                        required
                        placeholder="8-16桁の英数字"
                        value={formData.newPassword}
                        onChange={handleChange}
                    />

                    <PasswordInput 
                        label="新しいパスワード (確認)"
                        name="confirmPassword"
                        required
                        placeholder="Confirm Password"
                        error={!!(formData.confirmPassword && formData.newPassword !== formData.confirmPassword)}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#ff0072] text-white py-3 rounded-lg hover:bg-[#d90061] transition-all font-bold flex items-center justify-center gap-2 shadow-lg"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "パスワードを変更する"}
                    </button>
                </form>
            )}
        </div>
      </div>
    </div>
  );
}