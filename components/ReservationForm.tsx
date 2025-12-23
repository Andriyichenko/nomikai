"use client";

import { useState, useEffect } from "react";
import { 
    Loader2, CheckCircle2, Calendar as CalendarIcon, Home, Check, 
    ChevronDown, ChevronUp, X, BarChart3, Save, Trash2, MapPin, Clock, Timer,
    MessageSquare, Send
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { format, parseISO, isBefore, startOfDay, isAfter } from "date-fns";
import { ja, zhCN } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import PublicStats from "./PublicStats";
import toast from "react-hot-toast";

interface ReservationItem {
    id: string;
    title: string;
    date: string;
    startDate: string;
    endDate: string;
    deadline: string;
    startTime: string;
    location: string;
    shopName: string;
    description?: string;
}

interface UserReservation {
    id: string;
    reservationItemId: string;
    availableDates: string[];
    message: string;
}

interface ReservationFormProps {
    onNameLoaded?: (name: string) => void;
}

export default function ReservationForm({ onNameLoaded }: ReservationFormProps) {
  const { t, lang } = useTranslation();
  const { data: session } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isNameMissing, setIsNameMissing] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [items, setItems] = useState<ReservationItem[]>([]);
  const [reservations, setReservations] = useState<Record<string, UserReservation>>({});
  const [remainingUpdates, setRemainingUpdates] = useState(5);
  
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [currentStatsFilter, setCurrentStatsFilter] = useState<{start: string, end: string} | undefined>(undefined);
  const [isSuccess, setIsSuccess] = useState(false);

  const [localSelections, setLocalSelections] = useState<Record<string, Date[]>>({});
  const [localMessages, setLocalMessages] = useState<Record<string, string>>({});
  const [submittingItemId, setSubmittingItemId] = useState<string | null>(null);

  const dateLocale = lang === 'cn' ? zhCN : ja;

  useEffect(() => {
      fetchData();
  }, []);

  const fetchData = async () => {
      setLoading(true);
      try {
          const [itemsRes, reserveRes] = await Promise.all([
              fetch('/api/reservation-items'),
              fetch('/api/reserve')
          ]);

          const itemsData: ReservationItem[] = await itemsRes.json();
          const reserveData = await reserveRes.json();

          setItems(itemsData);
          const user = reserveData.user;
          const currentName = user?.name || "";
          setUserName(currentName);
          setUserEmail(user?.email || "");
          setRemainingUpdates(reserveData.remainingUpdates ?? 5);
          
          if (onNameLoaded) onNameLoaded(currentName);
          
          if (!user?.firstName || !user?.lastName) {
              setIsNameMissing(true);
          } else {
              setFirstName(user.firstName);
              setLastName(user.lastName);
              setIsNameMissing(false);
          }

          const resMap: Record<string, UserReservation> = {};
          const selMap: Record<string, Date[]> = {};
          const msgMap: Record<string, string> = {};

          if (Array.isArray(reserveData.reservations)) {
              reserveData.reservations.forEach((r: UserReservation) => {
                  resMap[r.reservationItemId] = r;
                  selMap[r.reservationItemId] = r.availableDates.map(d => parseISO(d));
                  msgMap[r.reservationItemId] = r.message || "";
              });
          }

          setReservations(resMap);
          setLocalSelections(selMap);
          setLocalMessages(msgMap);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  const handleSave = async (itemId: string) => {
      if (isNameMissing && (!firstName.trim() || !lastName.trim())) {
          toast.error(lang === 'cn' ? "请输入您的姓和名" : "姓と名を入力してください");
          return;
      }

      const dates = localSelections[itemId] || [];
      if (dates.length === 0) {
          toast.error(lang === 'cn' ? "请选择日期" : "日程を選択してください");
          return;
      }

      setSubmittingItemId(itemId);
      try {
          const res = await fetch('/api/reserve', {
              method: 'POST',
              body: JSON.stringify({
                  reservationItemId: itemId,
                  availableDates: dates.map(d => format(d, 'yyyy-MM-dd')),
                  message: localMessages[itemId] || "",
                  firstName: isNameMissing ? firstName : undefined,
                  lastName: isNameMissing ? lastName : undefined
              })
          });

          if (res.ok) {
              setIsSuccess(true);
              fetchData();
          } else {
              toast.error("Error saving reservation");
          }
      } catch (e) {
          toast.error("Server error");
      } finally {
          setSubmittingItemId(null);
      }
  };

  const handleCancel = async (itemId: string) => {
      if (!confirm(lang === 'cn' ? "确定取消该活动的预约吗？" : "このイベントの予約をキャンセルしますか？")) return;
      
      setSubmittingItemId(itemId);
      try {
          const res = await fetch(`/api/reserve?itemId=${itemId}`, { method: 'DELETE' });
          if (res.ok) {
              toast.success("Cancelled");
              fetchData();
          }
      } catch (e) {
          toast.error("Error cancelling");
      } finally {
          setSubmittingItemId(null);
      }
  };

  const handleLocationClick = (location: string) => {
      if (!location) return;
      const encoded = encodeURIComponent(location);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      window.open(isIOS ? `maps://?q=${encoded}` : `https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank');
  };

  if (loading) return <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto w-10 h-10 text-[#1e3820]" /></div>;

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-green-50 rounded-2xl border border-green-200 animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-green-800 mb-2">送信完了</h3>
        <p className="text-gray-600 mb-2">予約内容を保存しました。</p>
        <p className="text-gray-600 mb-4">確認メールをお送りしましたのでご確認ください。</p>
        <p className="text-sm text-[#ff0072] font-bold mb-6">
            {lang === 'cn' ? '在这个活动的截止日期之后会送出最终确定的邮箱，请查收。' : 'イベントの締め切り日以降に最終確定メールをお送りしますので、ご確認ください。'}
        </p>
        <div className="flex flex-col md:flex-row gap-4 w-full max-w-sm">
            <button onClick={() => setIsSuccess(false)} className="flex-1 text-white bg-[#1e3820] px-6 py-3 rounded-lg hover:bg-[#152916] transition font-bold">戻る</button>
            <button onClick={() => router.push("/")} className="flex-1 flex items-center justify-center gap-2 text-[#1e3820] bg-white border border-[#1e3820] px-6 py-3 rounded-lg hover:bg-gray-50 transition font-bold"><Home className="w-4 h-4" />TOPへ</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        {/* Real-time Name Display / Name Entry for OAuth Users */}
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-inner space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">
                        {isNameMissing ? (lang === 'cn' ? '姓 (必填)' : '姓 (必須)') : '姓名 (Name)'}
                    </label>
                    {isNameMissing ? (
                        <input 
                            type="text" 
                            value={firstName} 
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Surname"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-4 focus:ring-[#ff0072]/5 focus:border-[#ff0072]/30 outline-none transition-all font-bold text-[#1e3820]"
                        />
                    ) : (
                        <div className="text-lg font-bold text-[#1e3820]">{userName || "---"}</div>
                    )}
                </div>
                <div className="space-y-1">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">
                        {isNameMissing ? (lang === 'cn' ? '名 (必填)' : '名 (必須)') : 'メールアドレス (Email)'}
                    </label>
                    {isNameMissing ? (
                        <input 
                            type="text" 
                            value={lastName} 
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Given Name"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-4 focus:ring-[#ff0072]/5 focus:border-[#ff0072]/30 outline-none transition-all font-bold text-[#1e3820]"
                        />
                    ) : (
                        <div className="text-sm font-medium text-gray-500">{userEmail || "---"}</div>
                    )}
                </div>
            </div>
            {isNameMissing && (
                <div className="bg-[#ff0072]/5 p-4 rounded-xl border border-[#ff0072]/10 flex items-start gap-3">
                    <div className="bg-[#ff0072] p-1 rounded-full text-white mt-0.5"><Check size={10} /></div>
                    <p className="text-[10px] md:text-xs text-[#ff0072] font-bold leading-relaxed">
                        {lang === 'cn' 
                            ? '为了方便统计和确认，请填写您的真实姓名。提交预约后，您的姓名将被保存且无法由您自行修改。' 
                            : '統計と確認のため、本名を入力してください。一度保存されると、ご自身での変更はできません。'}
                    </p>
                </div>
            )}
        </div>

        <div className="space-y-4">
            <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#ff0072]" />
                日程を選択してください
            </label>

            <div className="grid grid-cols-1 gap-4">
                {items.map(item => {
                    const isExpanded = expandedItemId === item.id;
                    const isReserved = !!reservations[item.id];
                    const currentSels = localSelections[item.id] || [];

                    return (
                        <div key={item.id} className={`border rounded-2xl transition-all overflow-hidden bg-white ${isExpanded ? 'border-[#1e3820] ring-4 ring-[#1e3820]/5 shadow-lg' : 'border-gray-200 hover:border-gray-300 shadow-sm'}`}>
                            <div onClick={() => setExpandedItemId(isExpanded ? null : item.id)} className={`p-4 md:p-5 cursor-pointer flex flex-col gap-4 ${isExpanded ? 'bg-gray-50' : ''}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                                        <div className={`w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-xl flex items-center justify-center transition-colors ${isReserved ? 'bg-[#ff0072] text-white' : 'bg-gray-100 text-gray-400'}`}>
                                            <CalendarIcon size={20} className="md:w-6 md:h-6" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-black text-gray-800 text-base md:text-lg leading-tight truncate">{item.title}</h4>
                                            <p className="text-[10px] md:text-xs text-gray-400 font-mono mt-1 flex items-center gap-1.5">
                                                <span className="hidden md:inline">期間:</span>
                                                {item.startDate} ~ {item.endDate}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 md:hidden">
                                        <div className={isExpanded ? 'rotate-180 transition-transform' : 'transition-transform'}>
                                            <ChevronDown size={18} className="text-gray-400" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-1 md:pt-0">
                                    <div className="flex items-center gap-3">
                                        <button 
                                            type="button" 
                                            onClick={(e) => { e.stopPropagation(); setCurrentStatsFilter({ start: item.startDate, end: item.endDate }); setShowStats(true); }}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ff0072]/5 text-[#ff0072] rounded-full hover:bg-[#ff0072] hover:text-white transition-all duration-300 border border-[#ff0072]/10 active:scale-95"
                                        >
                                            <BarChart3 className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold whitespace-nowrap">
                                                {lang === 'cn' ? '确认状况' : '予約確認'}
                                            </span>
                                        </button>

                                        {/* Mobile Reserved Badge moved here */}
                                        {isReserved && (
                                            <div className="md:hidden flex items-center gap-1 bg-green-50 text-green-600 px-2 py-1 rounded-lg border border-green-100">
                                                <Check size={10} strokeWidth={3} />
                                                <span className="text-[9px] font-black uppercase tracking-wider">Reserved</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="hidden md:flex items-center gap-4">
                                        {isReserved && <span className="bg-green-100 text-green-700 text-[10px] font-black px-3 py-1 rounded-full uppercase">Reserved</span>}
                                        {isExpanded ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                                    </div>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="p-6 border-t border-gray-100 space-y-8 animate-in slide-in-from-top-4 duration-300">
                                    {/* Project Details */}
                                    <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-200">
                                            <div className="bg-gray-50 p-4 flex items-center gap-3">
                                                <div className="bg-white p-2 rounded-lg shadow-sm"><Timer className="w-4 h-4 text-[#ff0072]" /></div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">締め切り (Deadline)</span>
                                                    <span className="font-bold text-sm text-[#1e3820]">{item.deadline || '-'}</span>
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 p-4 flex items-center gap-3">
                                                <div className="bg-white p-2 rounded-lg shadow-sm"><Clock className="w-4 h-4 text-[#ff0072]" /></div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{lang === 'cn' ? '活动开始时间' : 'イベント開始時間'}</span>
                                                    <span className="font-bold text-sm text-[#1e3820]">{item.startTime || '-'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white p-4 border-t border-gray-100 space-y-3">
                                            <div className="flex items-start gap-3">
                                                <div className="bg-gray-50 p-2 rounded-lg"><Home className="w-4 h-4 text-[#ff0072]" /></div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{lang === 'cn' ? '店名' : '店名'}</span>
                                                    <span className="font-black text-base text-[#1e3820] leading-tight">{item.shopName || '-'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="bg-gray-50 p-2 rounded-lg"><MapPin className="w-4 h-4 text-[#ff0072]" /></div>
                                                <div className="flex flex-col flex-1">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{lang === 'cn' ? '地点' : '場所'}</span>
                                                    <button 
                                                        onClick={() => handleLocationClick(item.location)} 
                                                        className="text-blue-600 font-bold text-sm text-left hover:underline break-all leading-relaxed"
                                                    >
                                                        {item.location || '-'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col lg:flex-row gap-8">
                                        <div className="mx-auto lg:mx-0 bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                                            <Calendar
                                                mode="multiple"
                                                selected={currentSels}
                                                onSelect={(dates) => setLocalSelections({...localSelections, [item.id]: dates || []})}
                                                disabled={(date) => {
                                                    const today = startOfDay(new Date());
                                                    if (isBefore(date, today)) return true;
                                                    const start = parseISO(item.startDate);
                                                    const end = parseISO(item.endDate);
                                                    return isBefore(date, start) || isAfter(date, end);
                                                }}
                                                locale={dateLocale}
                                                className="rounded-md"
                                            />
                                        </div>

                                        <div className="flex-1 flex flex-col space-y-6">
                                            {/* Modern Message Area */}
                                            <div className="relative group">
                                                <label className="flex items-center gap-2 text-sm font-bold text-[#1e3820] mb-2 px-1">
                                                    <div className="w-5 h-5 rounded-md bg-[#ff0072]/10 flex items-center justify-center">
                                                        <MessageSquare className="w-3.5 h-3.5 text-[#ff0072]" />
                                                    </div>
                                                    <span>{lang === 'cn' ? '留言 (可选)' : 'メッセージ (任意)'}</span>
                                                </label>
                                                <div className="relative">
                                                    <textarea 
                                                        value={localMessages[item.id] || ""}
                                                        onChange={(e) => setLocalMessages({...localMessages, [item.id]: e.target.value})}
                                                        rows={4}
                                                        placeholder={lang === 'cn' ? "有什么要求或问题请写在这里..." : "アレルギーの有無や質問などあれば入力してください"}
                                                        className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-white focus:border-[#ff0072]/30 focus:ring-4 focus:ring-[#ff0072]/5 outline-none transition-all duration-300 resize-none text-sm leading-relaxed shadow-sm group-hover:border-gray-200"
                                                    />
                                                    <div className="absolute bottom-3 right-4 text-[10px] text-gray-400 font-mono">
                                                        {(localMessages[item.id] || "").length} chars
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons Group */}
                                            <div className="flex flex-col gap-3">
                                                {/* Remaining Count Indicator */}
                                                <div className="flex items-center justify-end gap-2 px-1">
                                                    <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">{lang === 'cn' ? '今日剩余修改次数' : '本日の残り修正回数'}</span>
                                                    <span className={`text-[10px] md:text-xs font-black px-2 py-0.5 rounded-md ${remainingUpdates > 0 ? 'bg-[#ff0072]/10 text-[#ff0072]' : 'bg-red-100 text-red-600'}`}>
                                                        {remainingUpdates} / 5
                                                    </span>
                                                </div>

                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => handleSave(item.id)}
                                                        disabled={submittingItemId === item.id || (isReserved && remainingUpdates <= 0)}
                                                        className="flex-1 py-3 bg-gradient-to-r from-[#ff0072] to-[#d90061] text-white text-sm font-black rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:grayscale"
                                                    >
                                                        {submittingItemId === item.id ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                                        {isReserved ? (lang === 'cn' ? '内容更新' : '更新する') : (lang === 'cn' ? '予約する' : '予約する')}
                                                    </button>
                                                    
                                                    {isReserved && (
                                                        <button
                                                            onClick={() => handleCancel(item.id)}
                                                            disabled={submittingItemId === item.id}
                                                            className="flex-1 py-3 bg-white text-red-500 text-sm font-bold rounded-xl border border-red-100 hover:bg-red-50 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            {lang === 'cn' ? '取消预约' : '予約取消'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Stats Modal */}
        {showStats && (
            <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 relative">
                    <button onClick={() => setShowStats(false)} className="absolute right-4 top-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full z-10 transition-colors"><X className="w-5 h-5 text-gray-600" /></button>
                    <div className="p-4 md:p-8"><PublicStats projectId={expandedItemId || undefined} filterRange={currentStatsFilter} /></div>
                </div>
            </div>
        )}
    </div>
  );
}
