import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Quote } from "lucide-react";
import { ImageGallery } from "@/components/ImageGallery";

// Event Data
  const events = [
    {
      id: "2025-01",
      title: "2025年 新年会",
      date: "2025-01-18",
      location: "新宿 某居酒屋",
      description: "2025年の幕開けを祝う新年会を開催しました。久しぶりの再会で話が尽きず、あっという間の3時間でした.",
      images: ["/25_1.jpg"]
    },
    {
      id: "2025-03",
      title: "2025年 3月飲み会",
      date: "2025-03-29",
      location: "渋谷",
      description: "春の飲み会！桜の季節に合わせて開催.",
      images: ["/25_3_1.JPG", "/25_3_2.JPG", "/25_3_3.JPG", "/25_3_4.JPG"]
    }
  ];

export function generateStaticParams() {
  return Object.keys(events).map((eventId) => ({ eventId }));
}

export default async function ArchiveEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = events[eventId];

  if (!event) return notFound();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md text-[#1e3820] p-4 shadow-sm sticky top-0 z-50 flex items-center gap-4 border-b border-gray-100">
        <Link href="/" className="hover:bg-gray-100 p-2 rounded-full transition">
            <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-bold font-yuji-syuku tracking-wide">{event.title}</h1>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full p-6 lg:p-10 space-y-10">
        
        {/* Intro Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <h2 className="text-3xl md:text-4xl font-black text-[#1e3820] tracking-tight leading-tight">
                    {event.title}
                </h2>
                
                <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-600">
                    <span className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                        <Calendar className="w-4 h-4 text-[#ff0072]" /> {event.date}
                    </span>
                    <span className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                        <MapPin className="w-4 h-4 text-[#ff0072]" /> {event.location}
                    </span>
                </div>

                <div className="relative pl-6 border-l-4 border-[#ff0072]/30 py-2">
                    <Quote className="absolute -top-2 -left-2 w-6 h-6 text-[#ff0072] bg-gray-50 p-1" />
                    <p className="text-lg text-gray-700 leading-relaxed font-yuji-syuku whitespace-pre-wrap">
                        {event.description}
                    </p>
                </div>
            </div>
            
            {/* Decorative or Map Placeholder */}
            <div className="hidden lg:flex items-center justify-center bg-[#1e3820]/5 rounded-2xl p-8">
                <div className="text-center space-y-2 text-[#1e3820]/60">
                    <p className="text-4xl font-black font-yuji-syuku">思い出</p>
                    <p className="text-sm font-bold tracking-widest uppercase">Memories</p>
                </div>
            </div>
        </div>

        {/* Gallery Section */}
        <div>
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="w-2 h-8 bg-[#1e3820] rounded-full"></span>
                Gallery
            </h3>
            <ImageGallery images={event.images} />
        </div>

      </div>
    </div>
  );
}