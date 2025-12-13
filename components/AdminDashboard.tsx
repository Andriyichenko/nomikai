"use client";

import { useState, useEffect } from "react";
import { 
  Users, Calendar, Trash2, Plus, Edit2, LogOut, 
  BarChart3, Loader2, Check, X, ArrowLeft, Bell, Save, Mail, Search, Palette, List, Eye, EyeOff 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { isBefore, parseISO, startOfDay, isAfter } from "date-fns";
import toast from "react-hot-toast"; // Import toast

interface User { id: string; username: string; email: string; role: string; isSubscribed: boolean; createdAt: string; }
interface RawReservation { id: string; name: string; email: string; availableDates: string[]; message: string; createdAt: string; userId: string; } // Raw reservation from DB
interface Event { id: string; title: string; date: string; location: string; description: string; images: string[]; status: string; }
interface ReservationItem { id: string; title: string; date: string; startDate: string; endDate: string; description?: string; isActive: boolean; }
interface SiteConfig { 
    primaryColor: string; accentColor: string; fontFamily: string; layout: string; 
    mainTitle: string; subTitle: string; heroTitle: string; heroSubtitle: string; heroText: string;
    heroTitleCn: string; heroSubtitleCn: string; heroTextCn: string; 
}

// Aggregated Reservation for Admin View
interface AdminAggregatedReservation {
    projectId: string;
    projectTitle: string;
    users: {
        id: string; // userId
        name: string;
        email: string;
        selectedDates: string[]; // Dates selected by this user for this project
        message: string; // Latest message from this user for this project
        lastUpdated: string; // Latest submission time
    }[];
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'reservations' | 'users' | 'projects' | 'archive' | 'notice' | 'email' | 'design'>('reservations');
  const [rawReservations, setRawReservations] = useState<RawReservation[]>([]); 
  const [users, setUsers] = useState<User[]>([]);
  const [archiveEvents, setArchiveEvents] = useState<Event[]>([]);
  const [reservationItems, setReservationItems] = useState<ReservationItem[]>([]); 
  const [config, setConfig] = useState<SiteConfig>({ 
      primaryColor: "#1e3820", accentColor: "#ff0072", fontFamily: "sans", layout: "sidebar", 
      mainTitle: "", subTitle: "", heroTitle: "", heroSubtitle: "", heroText: "",
      heroTitleCn: "", heroSubtitleCn: "", heroTextCn: ""
  });
  const [loading, setLoading] = useState(true);
  
  const [resSearch, setResSearch] = useState("");
  const [aggregatedReservations, setAggregatedReservations] = useState<AdminAggregatedReservation[]>([]);

  const [isEditingArchive, setIsEditingArchive] = useState(false);
  const [currentArchive, setCurrentArchive] = useState<Partial<Event>>({ images: [] });
  
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [currentProject, setCurrentProject] = useState<Partial<ReservationItem>>({ isActive: true, startDate: '', endDate: '' });

  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [savingNotice, setSavingNotice] = useState(false);
  
  const [emailTarget, setEmailTarget] = useState<'all' | 'subscribed' | 'specific'>('subscribed');
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [specificEmail, setSpecificEmail] = useState(""); 
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSearchQuery, setEmailSearchQuery] = useState("");
  const [emailSearchResults, setEmailSearchResults] = useState<User[]>([]);
  
  const [selectedDate, setSelectedDate] = useState<string | null>(null); 
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });
  const [savingConfig, setSavingConfig] = useState(false);

  const router = useRouter();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resRes, resUsers, resNotice, resArchive, resProjects, resConfig] = await Promise.all([
        fetch('/api/reserve?admin=true'), 
        fetch('/api/users'),
        fetch('/api/notice'),
        fetch('/api/events'), 
        fetch('/api/reservation-items'), 
        fetch('/api/config')
      ]);

      const rawResData: RawReservation[] = resRes.ok ? await resRes.json() : [];
      const usersData: User[] = resUsers.ok ? await resUsers.json() : [];
      const archiveEventsData: Event[] = resArchive.ok ? await resArchive.json() : [];
      const reservationItemsData: ReservationItem[] = resProjects.ok ? await resProjects.json() : [];
      const noticeData = resNotice.ok ? await resNotice.json() : { title: '', content: '' };
      const configData = resConfig.ok ? await resConfig.json() : {};

      setRawReservations(rawResData);
      setUsers(usersData);
      setArchiveEvents(archiveEventsData);
      setReservationItems(reservationItemsData);
      setNoticeTitle(noticeData.title);
      setNoticeContent(noticeData.content);
      setConfig(configData);

      const today = startOfDay(new Date());
      const aggregatedResult: Record<string, AdminAggregatedReservation> = {}; 

      rawResData.forEach(reservationRecord => {
        const userId = reservationRecord.userId;
        const userName = reservationRecord.name;
        const userEmail = reservationRecord.email;

        reservationRecord.availableDates.forEach(dateStr => {
            const date = parseISO(dateStr);
            if (isBefore(date, today)) return; 

            const matchedProject = reservationItemsData.find(project => {
                const projectStart = parseISO(project.startDate);
                const projectEnd = parseISO(project.endDate);
                return (isAfter(date, projectStart) || date.getTime() === projectStart.getTime()) && 
                       (isBefore(date, projectEnd) || date.getTime() === projectEnd.getTime());
            });

            if (matchedProject) {
                const projectId = matchedProject.id;
                
                if (!aggregatedResult[projectId]) {
                    aggregatedResult[projectId] = {
                        projectId: projectId,
                        projectTitle: matchedProject.title,
                        users: []
                    };
                }

                let userEntry = aggregatedResult[projectId].users.find(u => u.id === userId);

                if (!userEntry) {
                    userEntry = {
                        id: userId,
                        name: userName,
                        email: userEmail,
                        selectedDates: [],
                        message: '',
                        lastUpdated: '1970-01-01T00:00:00.000Z'
                    };
                    aggregatedResult[projectId].users.push(userEntry);
                }

                if (reservationRecord.createdAt > userEntry.lastUpdated) {
                    userEntry.message = reservationRecord.message || '';
                    userEntry.lastUpdated = reservationRecord.createdAt;
                }
                
                if (!userEntry.selectedDates.includes(dateStr)) {
                    userEntry.selectedDates.push(dateStr);
                }
            }
        });
      });

      const finalAggregatedReservations = Object.values(aggregatedResult).sort((a, b) => 
          a.projectTitle.localeCompare(b.projectTitle) 
      );

      finalAggregatedReservations.forEach(project => {
          project.users.forEach(user => user.selectedDates.sort((a, b) => a.localeCompare(b))); 
          project.users.sort((a, b) => a.name.localeCompare(b.name)); 
      });
      
      setAggregatedReservations(finalAggregatedReservations);


    } catch (e) { toast.error("データの取得に失敗しました"); console.error(e); } finally { setLoading(false); }
  };

  const handleAddUser = async (e: React.FormEvent) => { e.preventDefault(); 
    try {
        const res = await fetch('/api/users', { method: 'POST', body: JSON.stringify(newUser) }); 
        if (!res.ok) throw new Error("Failed to add user");
        toast.success("ユーザーが追加されました");
        setIsAddingUser(false); setNewUser({ username: '', password: '', role: 'user' }); fetchData(); 
    } catch (e: any) { toast.error(e.message || "ユーザーの追加に失敗しました"); console.error(e); }
  };
  const handleDeleteUser = async (id: string) => { 
    if (!confirm('本当に削除しますか？')) return; 
    try {
        const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' }); 
        if (!res.ok) throw new Error("Failed to delete user");
        toast.success("ユーザーが削除されました");
        fetchData(); 
    } catch (e: any) { toast.error(e.message || "ユーザーの削除に失敗しました"); console.error(e); }
  };
  const handleSaveNotice = async () => { setSavingNotice(true); 
    try { 
        const res = await fetch('/api/notice', { method: 'POST', body: JSON.stringify({ title: noticeTitle, content: noticeContent }) }); 
        if (!res.ok) throw new Error("Failed to save notice");
        toast.success("お知らせを保存しました"); 
    } catch (e: any) { toast.error(e.message || "お知らせの保存に失敗しました"); console.error(e); } finally { setSavingNotice(false); } 
  };
  const handleSendEmail = async () => { 
    if (!confirm("メールを送信しますか？この操作は取り消せません。")) return; 
    setSendingEmail(true); 
    try { 
        const res = await fetch('/api/admin/send-email', { method: 'POST', body: JSON.stringify({ target: emailTarget, subject: emailSubject, content: emailBody, specificEmails: emailTarget === 'specific' ? [specificEmail] : [] }) }); 
        if (!res.ok) throw new Error("Failed to send email");
        toast.success(`メールが${(await res.json()).count || 0}件送信されました`); setEmailSubject(""); setEmailBody(""); setSpecificEmail(""); 
    } catch (e: any) { toast.error(e.message || "メールの送信に失敗しました"); console.error(e); } finally { setSendingEmail(false); } 
  };
  const openEmailToUser = (email: string) => { setSpecificEmail(email); setEmailTarget('specific'); setActiveTab('email'); };
  const handleSaveConfig = async () => { setSavingConfig(true); 
    try { 
        const res = await fetch('/api/config', { method: 'POST', body: JSON.stringify(config) }); 
        if (!res.ok) throw new Error("Failed to save config");
        toast.success("設定を保存しました。リロードすると反映されます。"); 
        window.location.reload(); 
    } catch (e: any) { toast.error(e.message || "設定の保存に失敗しました"); console.error(e); } finally { setSavingConfig(false); } 
  };

  const handleSaveArchive = async (e: React.FormEvent) => { e.preventDefault(); 
    try {
        const method = currentArchive.id ? 'PUT' : 'POST';
        const url = currentArchive.id ? `/api/events/${currentArchive.id}` : '/api/events';
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(currentArchive) }); 
        if (!res.ok) throw new Error("Failed to save event");
        toast.success("イベントを保存しました");
        setIsEditingArchive(false); setCurrentArchive({ images: [] }); fetchData(); 
    } catch (e: any) { toast.error(e.message || "イベントの保存に失敗しました"); console.error(e); }
  };
  const handleDeleteArchive = async (id: string) => { 
    if (!confirm("本当に削除しますか？")) return; 
    try {
        const res = await fetch(`/api/events/${id}`, { method: 'DELETE' }); 
        if (!res.ok) throw new Error("Failed to delete event");
        toast.success("イベントが削除されました");
        fetchData(); 
    } catch (e: any) { toast.error(e.message || "イベントの削除に失敗しました"); console.error(e); }
  };

  const handleSaveProject = async (e: React.FormEvent) => { e.preventDefault(); 
    try {
        const method = currentProject.id ? 'PUT' : 'POST';
        const url = '/api/reservation-items';
        const body = method === 'PUT' ? { ...currentProject } : currentProject;
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); 
        if (!res.ok) throw new Error("Failed to save project");
        toast.success("予約プロジェクトを保存しました");
        setIsEditingProject(false); setCurrentProject({ isActive: true }); fetchData(); 
    } catch (e: any) { toast.error(e.message || "予約プロジェクトの保存に失敗しました"); console.error(e); }
  };
  const handleDeleteProject = async (id: string) => { 
    if (!confirm("本当に削除しますか？")) return; 
    try {
        const res = await fetch(`/api/reservation-items?id=${id}`, { method: 'DELETE' }); 
        if (!res.ok) throw new Error("Failed to delete project");
        toast.success("予約プロジェクトが削除されました");
        fetchData(); 
    } catch (e: any) { toast.error(e.message || "予約プロジェクトの削除に失敗しました"); console.error(e); }
  };
  const toggleProjectStatus = async (item: ReservationItem) => { 
    try {
        const res = await fetch('/api/reservation-items', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id, isActive: !item.isActive }) }); 
        if (!res.ok) throw new Error("Failed to update status");
        toast.success("ステータスを更新しました");
        fetchData(); 
    } catch (e: any) { toast.error(e.message || "ステータスの更新に失敗しました"); console.error(e); }
  };

  // Viz Logic
  const dateCounts: Record<string, number> = {};
  rawReservations.forEach(r => { if (Array.isArray(r.availableDates)) { r.availableDates.forEach(date => { dateCounts[date] = (dateCounts[date] || 0) + 1; }); } }); 
  const chartData = Object.entries(dateCounts).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));
  const maxCount = Math.max(...chartData.map(d => d.count), 0);
  const handleBarClick = (data: any) => { if (data && data.date) { setSelectedDate(data.date === selectedDate ? null : data.date); } };
  const filteredReservationsForChart = selectedDate ? rawReservations.filter(r => r.availableDates.includes(selectedDate)) : [];


  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#1e3820]" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-[#1e3820] text-white px-6 py-4 shadow-md flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4"><button onClick={() => router.push('/')} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ArrowLeft size={20} /></button><h1 className="font-bold text-xl">管理画面 (Admin)</h1></div>
        <button onClick={() => router.push('/')} className="flex items-center gap-2 text-sm hover:text-gray-300 transition-colors"><LogOut size={16} /> Home</button>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full p-6">
        <div className="flex gap-4 mb-8 border-b border-gray-200 overflow-x-auto">
            {['reservations', 'projects', 'archive', 'users', 'notice', 'email', 'design'].map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`pb-3 px-4 flex items-center gap-2 font-medium transition-colors border-b-2 whitespace-nowrap capitalize ${activeTab === tab ? 'border-[#ff0072] text-[#ff0072]' : 'border-transparent text-gray-500'}`}
                >
                    {tab === 'reservations' && <BarChart3 size={20} />}
                    {tab === 'projects' && <Calendar size={20} />}
                    {tab === 'archive' && <List size={20} />}
                    {tab === 'users' && <Users size={20} />}
                    {tab === 'notice' && <Bell size={20} />}
                    {tab === 'email' && <Mail size={20} />}
                    {tab === 'design' && <Palette size={20} />}
                    {tab === 'reservations' ? '予約統計' : tab === 'projects' ? '予約プロジェクト' : tab === 'archive' ? '過去ログ' : tab}
                </button>
            ))}
        </div>

        {/* RESERVATIONS TAB (Now shows aggregated view per project) */}
        {activeTab === 'reservations' && (
            <div className="space-y-8 animate-in fade-in">
                {/* Search Bar (Optional, can be applied to aggregated lists too) */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-2">
                    <Search className="text-gray-400 w-5 h-5" />
                    <input 
                        className="flex-1 outline-none text-gray-700" 
                        placeholder="プロジェクト名、ユーザー名、または日付で検索..." 
                        value={resSearch}
                        onChange={(e) => setResSearch(e.target.value)}
                    />
                </div>

                {/* Aggregated Reservations List */}
                {aggregatedReservations.length === 0 ? (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center text-gray-500">
                        まだ予約がありません。
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {aggregatedReservations.map(projectAgg => (
                            <div key={projectAgg.projectId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-[#ff0072]" />
                                        {projectAgg.projectTitle} ({projectAgg.users.length}名)
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left text-gray-600">
                                        <thead className="bg-gray-50/50 text-xs uppercase text-gray-400">
                                            <tr>
                                                <th className="px-6 py-3">ユーザー名</th>
                                                <th className="px-6 py-3">選択日程</th>
                                                <th className="px-6 py-3">メッセージ</th>
                                                <th className="px-6 py-3">最終更新</th>
                                                <th className="px-6 py-3 text-right">連絡</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {projectAgg.users.map(userEntry => (
                                                <tr key={userEntry.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-gray-900">{userEntry.name}<br/><span className="text-xs font-normal text-gray-400">{userEntry.email}</span></td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-wrap gap-1">
                                                            {userEntry.selectedDates.map(date => (
                                                                <span key={date} className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">{date}</span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 max-w-xs truncate">{userEntry.message}</td>
                                                    <td className="px-6 py-4 text-xs text-gray-400">{new Date(userEntry.lastUpdated).toLocaleString('ja-JP')}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button onClick={() => openEmailToUser(userEntry.email)} className="text-gray-400 hover:text-[#1e3820]"><Mail size={16}/></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Overall Stats Chart (Optional - can be moved to its own tab if needed) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <BarChart3 className="text-[#ff0072]" /> 日程別 参加者統計
                    </h2>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <XAxis dataKey="date" />
                                <YAxis allowDecimals={false} />
                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#1e3820" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        )}

        {/* PROJECTS (Active Reservations Items) */}
        {activeTab === 'projects' && (
            <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold">予約可能プロジェクト管理</h2>
                    <button onClick={() => { setIsEditingProject(true); setCurrentProject({ isActive: true, startDate: '', endDate: '' }); }} className="bg-[#1e3820] text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={16} /> New Project</button>
                </div>
                {isEditingProject && (
                    <form onSubmit={handleSaveProject} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-in slide-in-from-top-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <input className="border p-2 rounded" placeholder="タイトル (Title)" value={currentProject.title || ''} onChange={e => setCurrentProject({...currentProject, title: e.target.value})} required />
                            <div className="flex gap-2">
                                <input type="date" className="border p-2 rounded w-full" placeholder="開始日" value={currentProject.startDate || ''} onChange={e => setCurrentProject({...currentProject, startDate: e.target.value})} required />
                                <span className="flex items-center text-gray-400">~</span>
                                <input type="date" className="border p-2 rounded w-full" placeholder="終了日" value={currentProject.endDate || ''} onChange={e => setCurrentProject({...currentProject, endDate: e.target.value})} required />
                            </div>
                        </div>
                        <textarea className="w-full border p-2 rounded mb-4 h-24" placeholder="詳細 (Description)" value={currentProject.description || ''} onChange={e => setCurrentProject({...currentProject, description: e.target.value})} />
                        <label className="flex items-center gap-2 mb-4 cursor-pointer">
                            <input type="checkbox" checked={currentProject.isActive} onChange={e => setCurrentProject({...currentProject, isActive: e.target.checked})} className="w-5 h-5 accent-[#ff0072]" />
                            <span>予約受付中 (Active)</span>
                        </label>
                        <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setIsEditingProject(false)} className="text-gray-500 px-4 py-2">Cancel</button>
                            <button type="submit" className="bg-[#ff0072] text-white px-6 py-2 rounded font-bold">Save</button>
                        </div>
                    </form>
                )}
                <div className="grid gap-4">
                    {reservationItems.map(item => (
                        <div key={item.id} className={`bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center ${!item.isActive && 'opacity-60 bg-gray-50'}`}>
                            <div>
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    {item.title}
                                    {item.isActive ? <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">Active</span> : <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded">Closed</span>}
                                </h3>
                                <div className="text-sm text-gray-500 flex gap-2">
                                    <span className="font-mono">{item.startDate}</span>
                                    <span>~</span>
                                    <span className="font-mono">{item.endDate}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => toggleProjectStatus(item)} className="p-2 text-gray-500 hover:text-gray-700" title={item.isActive ? "Close" : "Open"}>
                                    {item.isActive ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                                <button onClick={() => { setCurrentProject(item); setIsEditingProject(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={18}/></button>
                                <button onClick={() => handleDeleteProject(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={18}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* ARCHIVE (Past Events) */}
        {activeTab === 'archive' && (
            <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold">過去ログ (Archive)</h2>
                    <button onClick={() => { setIsEditingArchive(true); setCurrentArchive({ images: [], status: 'published' }); }} className="bg-[#1e3820] text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={16} /> New Archive</button>
                </div>
                {isEditingArchive && (
                    <form onSubmit={handleSaveArchive} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-in slide-in-from-top-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <input className="border p-2 rounded" placeholder="タイトル" value={currentArchive.title || ''} onChange={e => setCurrentArchive({...currentArchive, title: e.target.value})} />
                            <input className="border p-2 rounded" placeholder="日付" value={currentArchive.date || ''} onChange={e => setCurrentArchive({...currentArchive, date: e.target.value})} />
                            <input className="border p-2 rounded" placeholder="場所" value={currentArchive.location || ''} onChange={e => setCurrentArchive({...currentArchive, location: e.target.value})} />
                        </div>
                        <textarea className="w-full border p-2 rounded mb-4 h-24" placeholder="詳細" value={currentArchive.description || ''} onChange={e => setCurrentArchive({...currentArchive, description: e.target.value})} />
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-500 mb-1">画像URL (カンマ区切り)</label>
                            <input className="w-full border p-2 rounded" placeholder="/image1.jpg, /image2.jpg" value={currentArchive.images?.join(', ') || ''} onChange={e => setCurrentArchive({...currentArchive, images: e.target.value.split(',').map(s => s.trim())})} />
                        </div>
                        <div className="flex gap-2 justify-end"><button type="button" onClick={() => setIsEditingArchive(false)} className="text-gray-500 px-4 py-2">Cancel</button><button className="bg-[#ff0072] text-white px-6 py-2 rounded font-bold">Save</button></div>
                    </form>
                )}
                <div className="grid gap-4">{archiveEvents.map(event => (<div key={event.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center"><div><h3 className="font-bold text-lg">{event.title}</h3><p className="text-sm text-gray-500">{event.date}</p></div><div className="flex gap-2"><button onClick={() => { setCurrentArchive(event); setIsEditingArchive(true); }} className="p-2 text-blue-600"><Edit2 size={18}/></button><button onClick={() => handleDeleteArchive(event.id)} className="p-2 text-red-600"><Trash2 size={18}/></button></div></div>))}</div>
            </div>
        )}

        {/* USERS */}
        {activeTab === 'users' && (
            <div className="space-y-6 animate-in fade-in">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b"><tr><th className="px-6 py-3">Username</th><th className="px-6 py-3">Role</th><th className="px-6 py-3">Sub</th><th className="px-6 py-3 text-right">Actions</th></tr></thead>
                        <tbody>{users.map(u => (<tr key={u.id} className="border-b hover:bg-gray-50"><td className="px-6 py-4">{u.username}</td><td className="px-6 py-4">{u.role}</td><td className="px-6 py-4">{u.isSubscribed ? <Check size={14} className="text-green-600"/> : "-"}</td><td className="px-6 py-4 text-right flex justify-end gap-2"><button onClick={() => openEmailToUser(u.email)} className="text-blue-500 p-1"><Mail size={16}/></button><button onClick={() => handleDeleteUser(u.id)} className="text-red-500 p-1"><Trash2 size={16}/></button></td></tr>))}</tbody></table></div></div>)}
        
        {/* NOTICE */}
        {activeTab === 'notice' && (
            <div className="space-y-6 animate-in fade-in">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"><div className="space-y-4"><input className="w-full px-4 py-2 border rounded-lg" value={noticeTitle} onChange={e => setNoticeTitle(e.target.value)} /><textarea className="w-full px-4 py-2 border rounded-lg h-64" value={noticeContent} onChange={e => setNoticeContent(e.target.value)} /><button onClick={handleSaveNotice} disabled={savingNotice} className="bg-[#1e3820] text-white px-6 py-2 rounded-lg">Save</button></div></div></div>)}
        
        {/* EMAIL */}
        {activeTab === 'email' && (
            <div className="space-y-6 animate-in fade-in">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-2xl mx-auto"><h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2"><Mail className="text-[#ff0072]" /> メール配信</h2><div className="space-y-4"><div><label className="block text-sm font-bold text-gray-700 mb-2">送信先</label><div className="flex flex-col gap-3"><div className="flex gap-4"><label className="flex items-center gap-2"><input type="radio" name="target" value="subscribed" checked={emailTarget === 'subscribed'} onChange={() => setEmailTarget('subscribed')} /> 購読者のみ</label><label className="flex items-center gap-2"><input type="radio" name="target" value="all" checked={emailTarget === 'all'} onChange={() => setEmailTarget('all')} /> 全ユーザー</label><label className="flex items-center gap-2"><input type="radio" name="target" value="specific" checked={emailTarget === 'specific'} onChange={() => setEmailTarget('specific')} /> 特定ユーザー</label></div>{emailTarget === 'specific' && (<div className="relative"><div className="relative"><Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" /><input className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1e3820] outline-none" value={emailSearchQuery} onChange={(e) => { setEmailSearchQuery(e.target.value); setSpecificEmail(e.target.value); }} placeholder="名前またはメールで検索..." /></div>{emailSearchResults.length > 0 && (<div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">{emailSearchResults.map(u => (<button key={u.id} onClick={() => { setSpecificEmail(u.email); setEmailSearchQuery(u.email); setEmailSearchResults([]); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex justify-between"><span className="font-bold">{u.username}</span><span className="text-gray-500">{u.email}</span></button>))}</div>)}</div>)}</div></div><input className="w-full px-4 py-2 border rounded-lg" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="件名" /><textarea className="w-full px-4 py-2 border rounded-lg h-48" value={emailBody} onChange={e => setEmailBody(e.target.value)} placeholder="本文" /><div className="flex justify-end pt-4"><button onClick={handleSendEmail} disabled={sendingEmail} className="bg-[#ff0072] text-white px-8 py-3 rounded-lg flex items-center gap-2">{sendingEmail ? <Loader2 className="animate-spin" /> : <Mail size={18} />} 送信</button></div></div></div></div>)}
        
        {/* DESIGN CONFIG */}
        {activeTab === 'design' && (
            <div className="space-y-6 animate-in fade-in">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-2xl mx-auto">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Palette className="text-[#ff0072]" /> 
                        デザイン設定
                    </h2>
                    
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><label className="block text-sm font-bold text-gray-700 mb-2">メインカラー</label><div className="flex gap-2 items-center"><input type="color" value={config.primaryColor} onChange={(e) => setConfig({...config, primaryColor: e.target.value})} className="h-10 w-10 border-0 p-0 rounded-lg cursor-pointer" /><span className="text-sm text-gray-500 font-mono">{config.primaryColor}</span></div></div>
                            <div><label className="block text-sm font-bold text-gray-700 mb-2">アクセントカラー</label><div className="flex gap-2 items-center"><input type="color" value={config.accentColor} onChange={(e) => setConfig({...config, accentColor: e.target.value})} className="h-10 w-10 border-0 p-0 rounded-lg cursor-pointer" /><span className="text-sm text-gray-500 font-mono">{config.accentColor}</span></div></div>
                        </div>
                        <div><label className="block text-sm font-bold text-gray-700 mb-2">フォント</label><div className="flex gap-4"><label className="flex items-center gap-2 border p-3 rounded-lg w-full"><input type="radio" name="font" value="sans" checked={config.fontFamily === 'sans'} onChange={() => setConfig({...config, fontFamily: 'sans'})} /> Sans</label><label className="flex items-center gap-2 border p-3 rounded-lg w-full"><input type="radio" name="font" value="serif" checked={config.fontFamily === 'serif'} onChange={() => setConfig({...config, fontFamily: 'serif'})} /> Serif</label></div></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-bold text-gray-700 mb-2">サイドバー: メインタイトル</label><input className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1e3820] outline-none" value={config.mainTitle} onChange={(e) => setConfig({...config, mainTitle: e.target.value})} /></div>
                            <div><label className="block text-sm font-bold text-gray-700 mb-2">サイドバー: サブタイトル</label><input className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1e3820] outline-none" value={config.subTitle} onChange={(e) => setConfig({...config, subTitle: e.target.value})} /></div>
                        </div>
                        <div className="border-t border-gray-100 pt-4 mt-2">
                            <h3 className="text-md font-bold text-gray-800 mb-4">トップページ (Hero Section)</h3>
                            <div className="space-y-4">
                                <div><label className="block text-sm font-bold text-gray-700 mb-2">メインキャッチコピー (Hero Title)</label><input className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1e3820] outline-none" value={config.heroTitle} onChange={(e) => setConfig({...config, heroTitle: e.target.value})} /></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-2">サブキャッチコピー (Hero Subtitle)</label><input className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1e3820] outline-none" value={config.heroSubtitle} onChange={(e) => setConfig({...config, heroSubtitle: e.target.value})} /></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-2">詳細テキスト (Hero Text)</label><textarea className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1e3820] outline-none h-24" value={config.heroText} onChange={(e) => setConfig({...config, heroText: e.target.value})} placeholder="改行も反映されます" /></div>
                            </div>
                        </div>
                        <div className="border-t border-gray-100 pt-4 mt-2">
                            <h3 className="text-md font-bold text-gray-800 mb-4">トップページ (Hero Section) - 中国語</h3>
                            <div className="space-y-4">
                                <div><label className="block text-sm font-bold text-gray-700 mb-2">メインキャッチコピー (Hero Title CN)</label><input className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1e3820] outline-none" value={config.heroTitleCn} onChange={(e) => setConfig({...config, heroTitleCn: e.target.value})} /></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-2">サブキャッチコピー (Hero Subtitle CN)</label><input className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1e3820] outline-none" value={config.heroSubtitleCn} onChange={(e) => setConfig({...config, heroSubtitleCn: e.target.value})} /></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-2">詳細テキスト (Hero Text CN)</label><textarea className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1e3820] outline-none h-24" value={config.heroTextCn} onChange={(e) => setConfig({...config, heroTextCn: e.target.value})} placeholder="换行符也会生效" /></div>
                            </div>
                        </div>
                        <div className="flex justify-end pt-4 border-t border-gray-100"><button onClick={handleSaveConfig} disabled={savingConfig} className="bg-[#1e3820] text-white px-8 py-3 rounded-lg flex items-center gap-2 disabled:opacity-50 font-bold shadow-md">{savingConfig ? <Loader2 className="animate-spin" /> : <Save size={18} />} 設定を保存 (Save Config)</button></div>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}
