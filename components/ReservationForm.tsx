"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, Calendar as CalendarIcon, Home, Check, ChevronDown, ChevronUp, X, BarChart3 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { format, parseISO, isBefore, startOfDay, isAfter, endOfDay } from "date-fns";
import { ja, zhCN } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import PublicStats from "./PublicStats";

const formSchema = z.object({
  name: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  availableDates: z.array(z.string()).min(1, "Required"),
  message: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ReservationItem {
    id: string;
    title: string;
    date: string;
    startDate: string;
    endDate: string;
    description?: string;
}

export default function ReservationForm() {
  const { t, lang } = useTranslation();
  const { data: session } = useSession();
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [currentStatsFilter, setCurrentStatsFilter] = useState<{start: string, end: string} | undefined>(undefined);
  
  const [items, setItems] = useState<ReservationItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, Date[]>>({});

  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { availableDates: [] }
  });

  const dateLocale = lang === 'cn' ? zhCN : ja;

  useEffect(() => {
      fetch('/api/reservation-items')
        .then(res => res.json())
        .then((data: ReservationItem[]) => {
            setItems(data);
            if (data.length > 0) {
              setExpandedItemId(data[0].id);
              setCalendarMonth(parseISO(data[0].startDate));
            }
        })
        .catch(console.error)
        .finally(() => setLoadingItems(false));
  }, []);

  useEffect(() => {
      const allDates: string[] = [];
      Object.values(selections).forEach(dates => {
          dates.forEach(d => allDates.push(format(d, 'yyyy-MM-dd')));
      });
      setValue("availableDates", allDates, { shouldValidate: true });
  }, [selections, setValue]);

  useEffect(() => {
    if (session?.user) {
        if (session.user.name) setValue("name", session.user.name);
        if (session.user.email) setValue("email", session.user.email);
        
        fetch('/api/reserve')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    const r = data[0];
                    setValue("name", r.name);
                    setValue("message", r.message);
                    
                    if (Array.isArray(r.availableDates) && items.length > 0) {
                        const newSelections: Record<string, Date[]> = {};
                        
                        r.availableDates.forEach((dateStr: string) => {
                            const date = new Date(dateStr);
                            const matchedItem = items.find(item => {
                                if (!item.startDate || !item.endDate) return false;
                                const start = parseISO(item.startDate);
                                const end = parseISO(item.endDate);
                                return (isAfter(date, start) || date.getTime() === start.getTime()) && 
                                       (isBefore(date, end) || date.getTime() === end.getTime());
                            });

                            if (matchedItem) {
                                if (!newSelections[matchedItem.id]) newSelections[matchedItem.id] = [];
                                newSelections[matchedItem.id].push(date);
                            }
                        });
                        setSelections(newSelections);
                    }
                }
            })
            .catch(console.error);
    }
  }, [session, setValue, items]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed");
      setIsSuccess(true);
    } catch (err) {
      setError(t.form.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProjectClick = (item: ReservationItem) => {
      if (expandedItemId === item.id) {
          setExpandedItemId(null);
      } else {
          setExpandedItemId(item.id);
          setCalendarMonth(parseISO(item.startDate));
      }
  };

  const openStats = (e: React.MouseEvent, item: ReservationItem) => {
      e.stopPropagation();
      setCurrentStatsFilter({ start: item.startDate, end: item.endDate });
      setShowStats(true);
  };

  const isDateDisabled = (date: Date, item: ReservationItem) => {
      const today = startOfDay(new Date());
      if (isBefore(date, today)) return true;

      const start = item.startDate ? parseISO(item.startDate) : null;
      const end = item.endDate ? parseISO(item.endDate) : null;
      
      if (start && isBefore(date, start)) return true;
      if (end && isAfter(date, end)) return true;
      
      return false;
  };

  const updateItemSelection = (itemId: string, dates: Date[]) => {
      setSelections(prev => ({
          ...prev,
          [itemId]: dates
      }));
  };

  const removeDateFromItem = (itemId: string, dateToRemove: Date) => {
      const current = selections[itemId] || [];
      updateItemSelection(itemId, current.filter(d => d.getTime() !== dateToRemove.getTime()));
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-green-50 rounded-xl border border-green-200 animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-green-800 mb-2">{t.form.successTitle}</h3>
        <p className="text-gray-600 mb-6">{t.form.successMsg}</p>
        <div className="flex flex-col md:flex-row gap-4 w-full max-w-sm">
            <button onClick={() => setIsSuccess(false)} className="flex-1 text-white bg-[#1e3820] px-6 py-3 rounded-lg hover:bg-[#152916] transition font-bold">{t.form.checkBtn}</button>
            <button onClick={() => router.push("/")} className="flex-1 flex items-center justify-center gap-2 text-[#1e3820] bg-white border border-[#1e3820] px-6 py-3 rounded-lg hover:bg-gray-50 transition font-bold"><Home className="w-4 h-4" />{t.form.homeBtn}</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Title */}
        <div className="border-b border-gray-200 pb-4 mb-6">
            <h2 className="text-xl font-black text-[#1e3820] flex items-center gap-2">
                <CalendarIcon className="w-6 h-6 text-[#ff0072]" />
                {lang === 'cn' ? '预约活动' : 'イベント予約'}
            </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">{t.form.name} <span className="text-[#ff0072]">*</span></label>
              <input {...register("name")} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1e3820] outline-none" />
              {errors.name && <p className="text-red-500 text-sm">{t.form.nameReq}</p>}
          </div>
          <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">{t.form.email}</label>
              <input {...register("email")} readOnly className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed" />
              {errors.email && <p className="text-red-500 text-sm">{t.form.emailReq}</p>}
          </div>
        </div>

        {/* ITEMS SELECTION & CALENDAR */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#ff0072]" />
                {lang === 'cn' ? '选择活动日期' : '日程を選択'} <span className="text-[#ff0072]">*</span>
            </label>
          </div>
          
          {loadingItems ? (
              <div className="p-8 text-center text-gray-400"><Loader2 className="animate-spin w-6 h-6 mx-auto" /> Loading...</div>
          ) : items.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-lg text-gray-500">No events available.</div>
          ) : (
              <div className="grid grid-cols-1 gap-4">
                  {items.map(item => {
                      const isExpanded = expandedItemId === item.id;
                      const currentSelections = selections[item.id] || [];
                      const hasSelection = currentSelections.length > 0;

                      return (
                          <div key={item.id} className={`border rounded-xl transition-all overflow-hidden ${isExpanded ? 'border-[#1e3820] ring-1 ring-[#1e3820]/20 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
                              {/* Header */}
                              <div 
                                  onClick={() => handleProjectClick(item)}
                                  className={`p-4 flex flex-col md:flex-row md:items-center justify-between bg-white gap-4 md:gap-0 cursor-pointer ${isExpanded ? 'bg-gray-50' : ''}`}
                              >
                                  {/* Left Info */}
                                  <div className="flex items-center gap-3 w-full md:w-auto">
                                      <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${hasSelection ? 'bg-[#ff0072] text-white' : 'bg-gray-100 text-gray-400'}`}>
                                          <CalendarIcon size={20} />
                                      </div>
                                      <div className="min-w-0">
                                          <h4 className="font-bold text-gray-800 truncate pr-2">{item.title}</h4>
                                          <p className="text-xs text-gray-500 font-mono mt-0.5">
                                              {item.startDate} ~ {item.endDate}
                                          </p>
                                      </div>
                                  </div>
                                  
                                  {/* Right Actions */}
                                  <div className="flex items-center justify-between w-full md:w-auto gap-4 pl-[52px] md:pl-0">
                                      {/* Stats Button */}
                                      <button 
                                          type="button" 
                                          onClick={(e) => openStats(e, item)}
                                          className="text-xs flex items-center gap-1.5 bg-gray-100 hover:bg-[#1e3820] hover:text-white text-gray-600 px-3 py-2 rounded-full transition-colors font-bold whitespace-nowrap active:scale-95"
                                      >
                                          <BarChart3 className="w-3.5 h-3.5" />
                                          {lang === 'cn' ? '查看参加状况' : '参加状況を見る'}
                                      </button>

                                      <div className="flex items-center gap-3 shrink-0">
                                          {hasSelection && (
                                              <span className="text-xs font-bold text-[#ff0072] bg-[#ff0072]/10 px-2 py-1 rounded-full whitespace-nowrap">
                                                  {currentSelections.length} days
                                              </span>
                                          )}
                                          {isExpanded ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                                      </div>
                                  </div>
                              </div>

                              {/* Calendar Expansion */}
                              {isExpanded && (
                                  <div className="p-4 border-t border-gray-200 bg-white flex flex-col md:flex-row gap-6 animate-in slide-in-from-top-2">
                                      {/* Left: Calendar */}
                                      <div className="mx-auto md:mx-0 border rounded-lg p-2 bg-white shadow-sm">
                                          <Calendar
                                              mode="multiple"
                                              selected={currentSelections}
                                              onSelect={(dates) => updateItemSelection(item.id, dates || [])}
                                              disabled={(date) => isDateDisabled(date, item)}
                                              locale={dateLocale}
                                              month={calendarMonth} // Controlled month
                                              onMonthChange={setCalendarMonth} // Allow user to navigate
                                              className="rounded-md"
                                          />
                                      </div>
                                      
                                      {/* Right: Info & Selection */}
                                      <div className="flex-1 bg-gray-50 p-4 rounded-lg text-sm text-gray-600 flex flex-col">
                                          
                                          {/* Selected Dates (Moved to Top) */}
                                          <div className="mb-4">
                                              <p className="mb-2 font-bold text-gray-800 flex justify-between items-center border-b border-gray-200 pb-1">
                                                  {lang === 'cn' ? '已选日期:' : '選択中:'}
                                                  <span className="text-xs font-normal text-gray-400 font-mono">{currentSelections.length} days</span>
                                              </p>
                                              {currentSelections.length > 0 ? (
                                                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                                      {currentSelections.sort((a,b) => a.getTime() - b.getTime()).map(date => (
                                                          <button 
                                                              type="button"
                                                              key={date.toISOString()} 
                                                              onClick={() => removeDateFromItem(item.id, date)}
                                                              className="group bg-[#1e3820] text-white px-2 py-1 rounded text-xs font-bold shadow-sm flex items-center gap-1 hover:bg-red-600 transition-colors"
                                                              title={lang === 'cn' ? '点击移除' : '削除'}
                                                          >
                                                              {format(date, "M/d (E)", { locale: dateLocale })}
                                                              <X className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                                                          </button>
                                                      ))}
                                                  </div>
                                              ) : (
                                                  <p className="text-gray-400 text-xs italic">{lang === 'cn' ? '请点击左侧日历选择' : '左のカレンダーから日付を選択してください'}</p>
                                              )}
                                          </div>

                                          {/* Description (Moved to Bottom) */}
                                          <div>
                                              <p className="mb-1 font-bold text-gray-800">{lang === 'cn' ? '活动详情' : '詳細'}</p>
                                              <p className="whitespace-pre-wrap text-xs text-gray-500">{item.description || "No description."}</p>
                                          </div>
                                      </div>
                                  </div>
                              )}
                          </div>
                      );
                  })}
              </div>
          )}
          {errors.availableDates && <p className="text-red-500 text-sm mt-2 font-bold">{t.form.datesReq}</p>}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">{t.form.message}</label>
          <textarea {...register("message")} rows={3} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1e3820] outline-none resize-none" placeholder={t.form.messagePlaceholder} />
        </div>

        {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>}

        <button type="submit" disabled={isSubmitting || items.length === 0} className="w-full py-4 bg-[#ff0072] text-white text-lg font-black rounded-lg hover:bg-[#d90061] transition-all flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
          {isSubmitting ? <Loader2 className="animate-spin" /> : t.form.submit}
        </button>
      </form>

      {/* Stats Modal */}
      {showStats && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 relative">
                <button 
                    onClick={() => setShowStats(false)} 
                    className="absolute right-4 top-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full z-10"
                >
                    <X className="w-5 h-5 text-gray-600" />
                </button>
                <div className="p-2">
                    <PublicStats filterRange={currentStatsFilter} />
                </div>
            </div>
        </div>
      )}
    </>
  );
}