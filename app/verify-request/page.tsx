import { Mail } from "lucide-react";
import Link from "next/link";

export default function VerifyRequest() {
  return (
    <div className="min-h-screen bg-[#f2f2f2] flex flex-col items-center justify-center p-4">
       <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#1e3820] mb-4">メールを確認してください</h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
                ログイン用のリンクをあなたのメールアドレスに送信しました。<br />
                メール内のリンクをクリックしてログインを完了してください。
            </p>
            <Link href="/login" className="text-sm text-gray-500 hover:underline">
                ログイン画面に戻る
            </Link>
       </div>
    </div>
  );
}
