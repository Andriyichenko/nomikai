"use client";


import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Loader2, LogOut, Edit2, Calendar, Bell, Check, X, ArrowLeft, Camera, User } from "lucide-react";
import Link from "next/link";
import { isBefore, parseISO, startOfDay, isAfter } from "date-fns";
import { format } from "date-fns/format";

interface Reservation {
    id: string;
    name: string;
    email: string;
    availableDates: string[];
    message: string;
    createdAt: string;
}

interface ReservationItem {
    id: string;
    title: string;
    date: string; 
    startDate: string;
    endDate: string;
    description?: string;
    isActive: boolean;
}

interface UserProjectReservation {
    projectId: string;
    projectTitle: string;
    projectStartDate: string; 
    selectedDates: string[];
    latestMessage: string; 
    latestSubmissionTime: string; 
}

export default function DashboardPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [userReservations, setUserReservations] = useState<UserProjectReservation[]>([]); 
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [updatingSub, setUpdatingSub] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
        router.push("/login");
    } else if (status === "authenticated") {
        fetchAggregatedReservationData();
        // @ts-ignore
        setIsSubscribed(session.user?.isSubscribed || false);
    }
  }, [status, router, session]);

  const fetchAggregatedReservationData = async () => {
      setLoading(true);
      try {
        const [resRes, resItems] = await Promise.all([
            fetch('/api/reserve'), 
            fetch('/api/reservation-items') 
        ]);

        const rawReservations: Reservation[] = resRes.ok ? await resRes.json() : [];
        const allProjects: ReservationItem[] = resItems.ok ? await resItems.json() : [];

        const aggregated: Record<string, UserProjectReservation> = {};
        const today = startOfDay(new Date());

        rawReservations.forEach(res => {
            res.availableDates.forEach(dateStr => {
                const date = parseISO(dateStr);
                if (isBefore(date, today)) return; 

                const matchedProject = allProjects.find(project => {
                    const projectStart = parseISO(project.startDate);
                    const projectEnd = parseISO(project.endDate);
                    return (isAfter(date, projectStart) || date.getTime() === projectStart.getTime()) && 
                           (isBefore(date, projectEnd) || date.getTime() === projectEnd.getTime());
                });

                if (matchedProject) {
                    if (!aggregated[matchedProject.id]) {
                        aggregated[matchedProject.id] = {
                            projectId: matchedProject.id,
                            projectTitle: matchedProject.title,
                            projectStartDate: matchedProject.startDate,
                            selectedDates: [],
                            latestMessage: '', 
                            latestSubmissionTime: '1970-01-01T00:00:00.000Z' 
                        };
                    }

                    if (!aggregated[matchedProject.id].selectedDates.includes(dateStr)) {
                        aggregated[matchedProject.id].selectedDates.push(dateStr);
                    }
                    
                    if (res.createdAt > aggregated[matchedProject.id].latestSubmissionTime) {
                        aggregated[matchedProject.id].latestMessage = res.message || '';
                        aggregated[matchedProject.id].latestSubmissionTime = res.createdAt;
                    }
                }
            });
        });

        const finalReservations = Object.values(aggregated).sort((a, b) => 
            a.projectStartDate.localeCompare(b.projectStartDate)
        );
        
        finalReservations.forEach(r => r.selectedDates.sort((a, b) => a.localeCompare(b)));

        setUserReservations(finalReservations);

      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  const toggleSubscription = async () => {
      if (!session?.user) return;
      setUpdatingSub(true);
      const newState = !isSubscribed;
      try {
          const res = await fetch('/api/users', {
              method: 'PUT',
              body: JSON.stringify({ 
                  // @ts-ignore
                  id: session.user.id, 
                  isSubscribed: newState 
              })
          });
          if (res.ok) {
              setIsSubscribed(newState);
              update({ ...session, user: { ...session.user, isSubscribed: newState } });
          }
      } catch (e) {
          alert("Error updating subscription");
      } finally {
          setUpdatingSub(false);
      }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('file', file);

      try {
          const res = await fetch('/api/users/avatar', {
              method: 'POST',
              body: formData
          });
          const data = await res.json();
          
          if (res.ok) {
              update({ 
                  ...session, 
                  user: { ...session?.user, image: data.imageUrl } 
              });
              alert("プロフィール画像を更新しました");
          } else {
              alert("画像のアップロードに失敗しました");
          }
      } catch (error) {
          console.error(error);
          alert("エラーが発生しました");
      } finally {
          setUploadingAvatar(false);
      }
  };

  if (status === "loading" || loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-[#1e3820] w-10 h-10" />
        </div>
      );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
       <header className="bg-white shadow px-6 py-4 flex justify-between items-center sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => router.push('/')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                    title="トップページへ戻る"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold text-[#1e3820]">マイページ (My Page)</h1>
            </div>
            
            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 hidden sm:inline">{session.user?.email}</span>
                <button 
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded transition"
                >
                    <LogOut size={16} /> ログアウト
                </button>
            </div>
       </header>

       <div className="max-w-3xl mx-auto p-6 mt-8 space-y-6">
            
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col sm:flex-row items-center gap-6">
                <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 shadow-inner bg-gray-50 flex items-center justify-center">
                        {session.user?.image ? (
                            <img 
                                src={session.user.image} 
                                alt="Profile" 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <User className="w-10 h-10 text-gray-400" />
                        )}
                        {uploadingAvatar && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 p-2 bg-[#ff0072] text-white rounded-full shadow-md hover:bg-[#d90061] transition-transform hover:scale-110"
                        title="画像を変更"
                    >
                        <Camera size={16} />
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleAvatarChange}
                    />
                </div>
                
                <div className="text-center sm:text-left flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">{session.user?.name || "No Name"}</h2>
                    <p className="text-gray-500">{session.user?.email}</p>
                    <div className="mt-2 flex gap-2 justify-center sm:justify-start">
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold">
                            {
                            // @ts-ignore
                            session.user?.role === 'admin' ? '管理者 (Admin)' : '一般ユーザー (User)'
                            }
                        </span>
                    </div>
                </div>
            </div>

            {/* Subscription Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Bell className="text-[#ff0072] w-5 h-5" />
                        メール通知設定
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">イベントや重要なお知らせをメールで受け取る</p>
                </div>
                <button
                    onClick={toggleSubscription}
                    disabled={updatingSub}
                    className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${
                        isSubscribed 
                        ? "bg-green-100 text-green-700 hover:bg-green-200" 
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                >
                    {updatingSub ? <Loader2 className="w-4 h-4 animate-spin" /> : isSubscribed ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {isSubscribed ? "受信中 (On)" : "オフ (Off)"}
                </button>
            </div>

            {/* Reservations Cards (Aggregated View) */}
            {userReservations.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                    <p className="text-gray-500 mb-4">まだ予約情報がありません。</p>
                    <Link 
                        href="/reserve" 
                        className="inline-block bg-[#ff0072] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#d90061] transition"
                    >
                        今すぐ予約する
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {userReservations.map((projectRes) => (
                        <div key={projectRes.projectId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="font-bold text-lg flex items-center gap-2">
                                    <Calendar className="text-[#ff0072]" /> 
                                    {projectRes.projectTitle}
                                </h2>
                                <Link 
                                    href="/reserve" // Consider passing project ID to pre-fill the form
                                    className="flex items-center gap-2 text-sm bg-[#1e3820] text-white px-4 py-2 rounded hover:bg-[#152916] transition"
                                >
                                    <Edit2 size={16} /> 編集する
                                </Link>
                            </div>
                            
                            <div className="p-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase tracking-wide">選択日程</label>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {projectRes.selectedDates.map((date: string) => (
                                                <span key={date} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                                    {date}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    {projectRes.latestMessage && (
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">メッセージ</label>
                                            <p className="text-gray-700 whitespace-pre-wrap">{projectRes.latestMessage}</p>
                                        </div>
                                    )}
                                    <div className="pt-4 mt-4 border-t border-gray-100 text-xs text-gray-400">
                                        最終更新: {new Date(projectRes.latestSubmissionTime).toLocaleString('ja-JP')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
       </div>
    </div>
  );
}