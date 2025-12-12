import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";

export function generateStaticParams() {
  return [
    { slug: 'april' },
    { slug: 'may' },
    { slug: 'june' },
  ];
}

export default function EventPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  
  const monthMap: Record<string, string> = {
    april: "4月",
    may: "5月",
    june: "6月",
  };

  const month = monthMap[slug] || slug;

  return (
    <div className="min-h-screen bg-[#f2f2f2] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
        <div className="w-16 h-16 bg-[#1e3820] rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="text-white w-8 h-8" />
        </div>
        
        <h1 className="text-2xl font-bold text-[#1e3820] mb-2">
            {month}の飲み会
        </h1>
        <p className="text-gray-500 mb-8">
            詳細は近日公開予定です。お楽しみに！
        </p>

        <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-[#1e3820] hover:underline font-medium"
        >
            <ArrowLeft className="w-4 h-4" />
            トップに戻る
        </Link>
      </div>
    </div>
  );
}