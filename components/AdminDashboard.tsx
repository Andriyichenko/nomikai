"use client";

import { useState, useEffect } from "react";
import { 
  Users, Calendar, Trash2, Plus, Edit2, LogOut, 
  BarChart3, Loader2, Check, X, ArrowLeft, Bell, Save, Mail, Search, Palette, List, Eye, EyeOff, History, Code, FileText, ChevronRight 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { parseISO, format, isAfter, isBefore, startOfDay } from 'date-fns';
import toast from "react-hot-toast";
import { emailTemplates } from "@/lib/email-templates/templates";

interface User { id: string; username: string; firstName: string; lastName: string; email: string; role: string; isSubscribed: boolean; createdAt: string; }
interface RawReservation { id: string; name: string; email: string; availableDates: string[]; message: string; createdAt: string; userId: string; reservationItemId: string; }
interface Event { id: string; title: string; date: string; location: string; description: string; images: string[]; status: string; }
interface ReservationItem { id: string; title: string; date: string; startDate: string; endDate: string; deadline: string; startTime: string; location: string; shopName: string; description?: string; isActive: boolean; }
interface Notice { id?: string; title: string; content: string; updatedAt?: string; }
interface SiteConfig { 
    primaryColor: string; accentColor: string; fontFamily: string; layout: string; 
    mainTitle: string; subTitle: string; heroTitle: string; heroSubtitle: string; heroText: string;
    heroTitleCn: string; heroSubtitleCn: string; heroTextCn: string; 
}

interface AdminAggregatedReservation {
    projectId: string;
    projectTitle: string;
    users: {
        id: string; // userId
        name: string;
        email: string;
        selectedDates: string[];
        message: string;
        lastUpdated: string;
    }[];
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'reservations' | 'users' | 'projects' | 'archive' | 'notice' | 'email' | 'design'>('reservations');
  const [rawReservations, setRawReservations] = useState<RawReservation[]>([]); 
  const [users, setUsers] = useState<User[]>([]);
  const [archiveEvents, setArchiveEvents] = useState<Event[]>([]);
  const [reservationItems, setReservationItems] = useState<ReservationItem[]>([]); 
  const [notices, setNotices] = useState<Notice[]>([]); 
  const [config, setConfig] = useState<SiteConfig>({ 
      primaryColor: "#1e3820", accentColor: "#ff0072", fontFamily: "sans", layout: "sidebar", 
      mainTitle: "", subTitle: "", heroTitle: "", heroSubtitle: "", heroText: "",
      heroTitleCn: "", heroSubtitleCn: "", heroTextCn: ""
  });
  const [loading, setLoading] = useState(true);
  
  const [resSearch, setResSearch] = useState("");
  const [aggregatedReservations, setAggregatedReservations] = useState<AdminAggregatedReservation[]>([]);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedDateReservations, setSelectedDateReservations] = useState<RawReservation[]>([]);

  // Archive State
  const [isEditingArchive, setIsEditingArchive] = useState(false);
  const [currentArchive, setCurrentArchive] = useState<Partial<Event>>({ images: [] });
  const [archiveSearch, setArchiveSearch] = useState(""); // Search for Archive
  
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [currentProject, setCurrentProject] = useState<Partial<ReservationItem>>({ isActive: true, startDate: '', endDate: '', deadline: '', startTime: '', location: '', shopName: '' });

  // Notice State
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [savingNotice, setSavingNotice] = useState(false);
  
  // Email State
  const [emailTarget, setEmailTarget] = useState<'all' | 'subscribed' | 'specific'>('subscribed');
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [specificEmail, setSpecificEmail] = useState(""); 
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSearchQuery, setEmailSearchQuery] = useState("");
  const [emailSearchResults, setEmailSearchResults] = useState<User[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState(""); // Template Selection
  
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<User>>({});
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
      
      const noticeData = resNotice.ok ? await resNotice.json() : [];
      const noticeList = Array.isArray(noticeData) ? noticeData : [noticeData];
      setNotices(noticeList);
      if (noticeList.length > 0) {
          setNoticeTitle(noticeList[0].title);
          setNoticeContent(noticeList[0].content);
      }

      const configData = resConfig.ok ? await resConfig.json() : {};

      setRawReservations(rawResData);
      setUsers(usersData);
      setArchiveEvents(archiveEventsData);
      setReservationItems(reservationItemsData);
      setConfig(configData);

      const today = startOfDay(new Date());
      const aggregatedResult: Record<string, AdminAggregatedReservation> = {}; 

      rawResData.forEach(reservationRecord => {
        const projectId = reservationRecord.reservationItemId;
        if (!projectId) return;

        const matchedProject = reservationItemsData.find(p => p.id === projectId);
        if (!matchedProject) return;

        if (!aggregatedResult[projectId]) {
            aggregatedResult[projectId] = { projectId: projectId, projectTitle: matchedProject.title, users: [] };
        }

        const userId = reservationRecord.userId;
        const userName = reservationRecord.name;
        const userEmail = reservationRecord.email;

        let userEntry = aggregatedResult[projectId].users.find(u => u.id === userId);
        if (!userEntry) {
            userEntry = { 
                id: userId, 
                name: userName, 
                email: userEmail, 
                selectedDates: reservationRecord.availableDates || [], 
                message: reservationRecord.message || '', 
                lastUpdated: reservationRecord.createdAt 
            };
            aggregatedResult[projectId].users.push(userEntry);
        } else {
            // If duplicate user records exist for the same project, take the newest message
            if (reservationRecord.createdAt > userEntry.lastUpdated) {
                userEntry.message = reservationRecord.message || '';
                userEntry.lastUpdated = reservationRecord.createdAt;
                userEntry.name = userName;
            }
            // Merge dates
            reservationRecord.availableDates?.forEach(d => {
                if (!userEntry!.selectedDates.includes(d)) userEntry!.selectedDates.push(d);
            });
        }
      });

      const finalAggregatedReservations = Object.values(aggregatedResult).sort((a, b) => a.projectTitle.localeCompare(b.projectTitle));
      finalAggregatedReservations.forEach(project => {
          project.users.forEach(user => user.selectedDates.sort((a, b) => a.localeCompare(b))); 
          project.users.sort((a, b) => a.name.localeCompare(b.name)); 
      });
      setAggregatedReservations(finalAggregatedReservations);

    } catch (e) { toast.error("データの取得に失敗しました"); console.error(e); } finally { setLoading(false); }
  };

  const handleAddUser = async (e: React.FormEvent) => { e.preventDefault(); try { const res = await fetch('/api/users', { method: 'POST', body: JSON.stringify(newUser) }); if (!res.ok) throw new Error("Failed to add user"); toast.success("ユーザーが追加されました"); setIsAddingUser(false); setNewUser({ username: '', password: '', role: 'user' }); fetchData(); } catch (e: any) { toast.error(e.message || "ユーザーの追加に失敗しました"); console.error(e); } };
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const res = await fetch('/api/users', {
            method: 'PUT',
            body: JSON.stringify(currentUser)
        });
        if (!res.ok) throw new Error("Failed to update user");
        toast.success("ユーザー情報を更新しました");
        setIsEditingUser(false);
        fetchData();
    } catch (e: any) {
        toast.error(e.message || "更新に失敗しました");
    }
  };
  const handleDeleteUser = async (id: string) => { if (!confirm('本当に削除しますか？')) return; try { const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' }); if (!res.ok) throw new Error("Failed to delete user"); toast.success("ユーザーが削除されました"); fetchData(); } catch (e: any) { toast.error(e.message || "ユーザーの削除に失敗しました"); console.error(e); } };
  const handleSaveNotice = async () => { setSavingNotice(true); try { const res = await fetch('/api/notice', { method: 'POST', body: JSON.stringify({ title: noticeTitle, content: noticeContent }) }); if (!res.ok) throw new Error("Failed to save notice"); toast.success("お知らせを更新しました"); fetchData(); } catch (e: any) { toast.error(e.message || "お知らせの保存に失敗しました"); console.error(e); } finally { setSavingNotice(false); } };
  
  const handleSendEmail = async () => { 
    if (!confirm("メールを送信しますか？")) return; 
    setSendingEmail(true); 
    try { 
        const res = await fetch('/api/admin/send-email', { method: 'POST', body: JSON.stringify({ target: emailTarget, subject: emailSubject, content: emailBody, specificEmails: emailTarget === 'specific' ? [specificEmail] : [] }) }); 
        if (!res.ok) throw new Error("Failed to send email");
        toast.success(`メールが${(await res.json()).count || 0}件送信されました`); setEmailSubject(""); setEmailBody(""); setSpecificEmail(""); 
    } catch (e: any) { toast.error(e.message || "メールの送信に失敗しました"); console.error(e); } finally { setSendingEmail(false); } 
  };
  
  const openEmailToUser = (email: string) => { setSpecificEmail(email); setEmailTarget('specific'); setActiveTab('email'); };
  const handleSaveConfig = async () => { setSavingConfig(true); try { const res = await fetch('/api/config', { method: 'POST', body: JSON.stringify(config) }); if (!res.ok) throw new Error("Failed to save config"); toast.success("設定を保存しました。"); window.location.reload(); } catch (e: any) { toast.error(e.message || "設定の保存に失敗しました"); console.error(e); } finally { setSavingConfig(false); } };

  // Archive Handlers
  const handleSaveArchive = async (e: React.FormEvent) => { e.preventDefault(); try { const method = currentArchive.id ? 'PUT' : 'POST'; const url = currentArchive.id ? `/api/events/${currentArchive.id}` : '/api/events'; const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(currentArchive) }); if (!res.ok) throw new Error("Failed to save event"); toast.success("イベントを保存しました"); setIsEditingArchive(false); setCurrentArchive({ images: [] }); fetchData(); } catch (e: any) { toast.error(e.message || "イベントの保存に失敗しました"); console.error(e); } };
  const handleDeleteArchive = async (id: string) => { if (!confirm("本当に削除しますか？")) return; try { const res = await fetch(`/api/events/${id}`, { method: 'DELETE' }); if (!res.ok) throw new Error("Failed to delete event"); toast.success("イベントが削除されました"); fetchData(); } catch (e: any) { toast.error(e.message || "イベントの削除に失敗しました"); console.error(e); } };
  
  const handleSaveProject = async (e: React.FormEvent) => { e.preventDefault(); try { const method = currentProject.id ? 'PUT' : 'POST'; const url = '/api/reservation-items'; const body = method === 'PUT' ? { ...currentProject } : currentProject; const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); if (!res.ok) throw new Error("Failed to save project"); toast.success("予約プロジェクトを保存しました"); setIsEditingProject(false); setCurrentProject({ isActive: true }); fetchData(); } catch (e: any) { toast.error(e.message || "予約プロジェクトの保存に失敗しました"); console.error(e); } };
  const handleDeleteProject = async (id: string) => { if (!confirm("本当に削除しますか？")) return; try { const res = await fetch(`/api/reservation-items?id=${id}`, { method: 'DELETE' }); if (!res.ok) throw new Error("Failed to delete project"); toast.success("予約プロジェクトが削除されました"); fetchData(); } catch (e: any) { toast.error(e.message || "予約プロジェクトの削除に失敗しました"); console.error(e); } };
  const toggleProjectStatus = async (item: ReservationItem) => { try { const res = await fetch('/api/reservation-items', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id, isActive: !item.isActive }) }); if (!res.ok) throw new Error("Failed to update status"); toast.success("ステータスを更新しました"); fetchData(); } catch (e: any) { toast.error(e.message || "ステータスの更新に失敗しました"); console.error(e); } };

  // Handlers for Template
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const tId = e.target.value;
      setSelectedTemplate(tId);
      const t = emailTemplates.find(tpl => tpl.id === tId);
      if (t) {
          setEmailSubject(t.subject);
          setEmailBody(t.body);
      }
  };

  // Search Logic for Email
  useEffect(() => {
      if (emailSearchQuery && emailTarget === 'specific') {
          const lowerQ = emailSearchQuery.toLowerCase();
          const results = users.filter(u => u.username.toLowerCase().includes(lowerQ) || u.email.toLowerCase().includes(lowerQ));
          setEmailSearchResults(results.slice(0, 5));
      } else {
          setEmailSearchResults([]);
      }
  }, [emailSearchQuery, users, emailTarget]);

  // Archive Filter
  const filteredArchives = archiveEvents.filter(e => 
      e.title.toLowerCase().includes(archiveSearch.toLowerCase()) || 
      e.location.toLowerCase().includes(archiveSearch.toLowerCase())
  );

  // Viz Logic
  const dateCounts: Record<string, number> = {};
  rawReservations.forEach(r => { if (Array.isArray(r.availableDates)) { r.availableDates.forEach(date => { dateCounts[date] = (dateCounts[date] || 0) + 1; }); } }); 
  const chartData = Object.entries(dateCounts).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));

    const handleDateBarClick = (entry: any) => {
            const date = entry?.payload?.date;
            if (!date) return;
            const matches = rawReservations.filter(r => Array.isArray(r.availableDates) && r.availableDates.includes(date));
            setSelectedDate(date);
            setSelectedDateReservations(matches);
    };

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

        {/* RESERVATIONS TAB */}
        {activeTab === 'reservations' && (
            <div className="space-y-8 animate-in fade-in">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-2">
                    <Search className="text-gray-400 w-5 h-5" />
                    <input className="flex-1 outline-none text-gray-700" placeholder="プロジェクト名、ユーザー名、または日付で検索..." value={resSearch} onChange={(e) => setResSearch(e.target.value)} />
                </div>
                {aggregatedReservations.length === 0 ? (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center text-gray-500">まだ予約がありません。</div>
                ) : (
                    <div className="grid gap-6">
                        {aggregatedReservations.map(projectAgg => (
                            <div key={projectAgg.projectId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center"><h3 className="font-bold text-gray-800 flex items-center gap-2"><Calendar className="w-4 h-4 text-[#ff0072]" />{projectAgg.projectTitle} ({projectAgg.users.length}名)</h3></div>
                                <div className="overflow-x-auto"><table className="w-full text-sm text-left text-gray-600"><thead className="bg-gray-50/50 text-xs uppercase text-gray-400"><tr><th className="px-6 py-3">ユーザー名</th><th className="px-6 py-3">選択日程</th><th className="px-6 py-3">メッセージ</th><th className="px-6 py-3">最終更新</th><th className="px-6 py-3 text-right">連絡</th></tr></thead><tbody>{projectAgg.users.map(userEntry => (<tr key={userEntry.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors"><td className="px-6 py-4 font-bold text-gray-900">{userEntry.name}<br/><span className="text-xs font-normal text-gray-400">{userEntry.email}</span></td><td className="px-6 py-4"><div className="flex flex-wrap gap-1">{userEntry.selectedDates.map(date => (<span key={date} className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">{date}</span>))}</div></td><td className="px-6 py-4 max-w-xs truncate">{userEntry.message}</td><td className="px-6 py-4 text-xs text-gray-400">{new Date(userEntry.lastUpdated).toLocaleString('ja-JP')}</td><td className="px-6 py-4 text-right"><button onClick={() => openEmailToUser(userEntry.email)} className="text-gray-400 hover:text-[#1e3820]"><Mail size={16}/></button></td></tr>))}</tbody></table></div></div>
                        ))}
                    </div>
                )}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <BarChart3 className="text-[#ff0072]" /> 日程別 参加者統計
                                    </h2>
                                    <p className="text-sm text-gray-500 mb-4">バーをクリックして該当日の予約者を表示</p>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData}>
                                                <XAxis dataKey="date" />
                                                <YAxis allowDecimals={false} />
                                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                                                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#1e3820" onClick={handleDateBarClick} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {selectedDate && (
                                        <div className="mt-6 border-t pt-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <div className="text-xs text-gray-400">選択日</div>
                                                    <div className="text-lg font-bold text-gray-800">{selectedDate}</div>
                                                    <div className="text-sm text-gray-500">{selectedDateReservations.length} 件の予約</div>
                                                </div>
                                                <button onClick={() => { setSelectedDate(null); setSelectedDateReservations([]); }} className="text-gray-400 hover:text-gray-600 transition">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                            {selectedDateReservations.length === 0 ? (
                                                <div className="text-sm text-gray-500">該当データがありません。</div>
                                            ) : (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm text-left text-gray-700">
                                                        <thead className="bg-gray-50 text-xs uppercase text-gray-400">
                                                            <tr>
                                                                <th className="px-4 py-2">ユーザー</th>
                                                                <th className="px-4 py-2">メール</th>
                                                                <th className="px-4 py-2">メッセージ</th>
                                                                <th className="px-4 py-2">登録日時</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {selectedDateReservations.map(r => (
                                                                <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                                                                    <td className="px-4 py-2 font-bold text-gray-900">{r.name}</td>
                                                                    <td className="px-4 py-2 text-gray-600">{r.email}</td>
                                                                    <td className="px-4 py-2 text-gray-600 max-w-xs truncate">{r.message || '-'}</td>
                                                                    <td className="px-4 py-2 text-xs text-gray-400">{new Date(r.createdAt).toLocaleString('ja-JP')}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
            </div>
        )}

        {/* PROJECTS TAB */}
        {activeTab === 'projects' && (
            <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center"><h2 className="text-lg font-bold">予約可能プロジェクト管理</h2><button onClick={() => { setIsEditingProject(true); setCurrentProject({ isActive: true, startDate: '', endDate: '' }); }} className="bg-[#1e3820] text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={16} /> New Project</button></div>{isEditingProject && (<form onSubmit={handleSaveProject} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-in slide-in-from-top-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
    <input className="border p-2 rounded" placeholder="タイトル (Title)" value={currentProject.title || ''} onChange={e => setCurrentProject({...currentProject, title: e.target.value})} required />
    <div className="flex gap-2">
        <input type="date" className="border p-2 rounded w-full" placeholder="開始日" value={currentProject.startDate || ''} onChange={e => setCurrentProject({...currentProject, startDate: e.target.value})} required />
        <span className="flex items-center text-gray-400">~</span>
        <input type="date" className="border p-2 rounded w-full" placeholder="終了日" value={currentProject.endDate || ''} onChange={e => setCurrentProject({...currentProject, endDate: e.target.value})} required />
    </div>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
    <div>
        <label className="block text-xs font-bold text-gray-500 mb-1">締め切り日 (Deadline)</label>
        <input type="date" className="border p-2 rounded w-full" value={currentProject.deadline || ''} onChange={e => setCurrentProject({...currentProject, deadline: e.target.value})} required />
    </div>
    <div>
        <label className="block text-xs font-bold text-gray-500 mb-1">開始時間 (Start Time)</label>
        <input type="time" className="border p-2 rounded w-full" value={currentProject.startTime || ''} onChange={e => setCurrentProject({...currentProject, startTime: e.target.value})} required />
    </div>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
    <div>
        <label className="block text-xs font-bold text-gray-500 mb-1">店名 (Shop Name)</label>
        <input className="border p-2 rounded w-full" placeholder="店名" value={currentProject.shopName || ''} onChange={e => setCurrentProject({...currentProject, shopName: e.target.value})} required />
    </div>
    <div>
        <label className="block text-xs font-bold text-gray-500 mb-1">地点 (Location Address)</label>
        <input className="border p-2 rounded w-full" placeholder="住所" value={currentProject.location || ''} onChange={e => setCurrentProject({...currentProject, location: e.target.value})} required />
    </div>
</div><textarea className="w-full border p-2 rounded mb-4 h-24" placeholder="詳細 (Description)" value={currentProject.description || ''} onChange={e => setCurrentProject({...currentProject, description: e.target.value})} /><label className="flex items-center gap-2 mb-4 cursor-pointer"><input type="checkbox" checked={currentProject.isActive} onChange={e => setCurrentProject({...currentProject, isActive: e.target.checked})} className="w-5 h-5 accent-[#ff0072]" /><span>予約受付中 (Active)</span></label><div className="flex gap-2 justify-end"><button type="button" onClick={() => setIsEditingProject(false)} className="text-gray-500 px-4 py-2">Cancel</button><button type="submit" className="bg-[#ff0072] text-white px-6 py-2 rounded font-bold">Save</button></div></form>)}<div className="grid gap-4">{reservationItems.map(item => (<div key={item.id} className={`bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center ${!item.isActive && 'opacity-60 bg-gray-50'}`}><div><h3 className="font-bold text-lg flex items-center gap-2">{item.title}{item.isActive ? <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">Active</span> : <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded">Closed</span>}</h3><div className="text-sm text-gray-500 flex gap-2"><span className="font-mono">{item.startDate}</span><span>~</span><span className="font-mono">{item.endDate}</span></div></div><div className="flex gap-2"><button onClick={() => toggleProjectStatus(item)} className="p-2 text-gray-500 hover:text-gray-700" title={item.isActive ? "Close" : "Open"}>{item.isActive ? <EyeOff size={18} /> : <Eye size={18} />}</button><button onClick={() => { setCurrentProject(item); setIsEditingProject(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={18}/></button><button onClick={() => handleDeleteProject(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={18}/></button></div></div>))}</div>
            </div>
        )}

        {/* ARCHIVE - UPDATED */}
        {activeTab === 'archive' && (
            <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center gap-4">
                    <h2 className="text-lg font-bold text-gray-800">過去ログ (Archive)</h2>
                    <div className="flex-1 flex gap-2 justify-end">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input 
                                className="pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1e3820] outline-none text-sm" 
                                placeholder="タイトルや場所で検索..."
                                value={archiveSearch}
                                onChange={(e) => setArchiveSearch(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={() => { setIsEditingArchive(true); setCurrentArchive({ images: [], status: 'published' }); }} 
                            className="bg-[#1e3820] text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm hover:bg-[#152916] transition"
                        >
                            <Plus size={16} /> New Archive
                        </button>
                    </div>
                </div>

                {/* Archive List Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="px-6 py-3">日付</th>
                                <th className="px-6 py-3">タイトル</th>
                                <th className="px-6 py-3">場所</th>
                                <th className="px-6 py-3 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredArchives.length === 0 ? (
                                <tr><td colSpan={4} className="text-center py-10 text-gray-400">データがありません</td></tr>
                            ) : (
                                filteredArchives.map(event => (
                                    <tr key={event.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-gray-500">{event.date}</td>
                                        <td className="px-6 py-4 font-bold text-gray-800">{event.title}</td>
                                        <td className="px-6 py-4 text-gray-600">{event.location}</td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <button onClick={() => { setCurrentArchive(event); setIsEditingArchive(true); }} className="text-blue-600 hover:bg-blue-50 p-2 rounded transition"><Edit2 size={16}/></button>
                                            <button onClick={() => handleDeleteArchive(event.id)} className="text-red-600 hover:bg-red-50 p-2 rounded transition"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Edit Modal (Overlay) */}
                {isEditingArchive && (
                    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-gray-800">イベント編集</h3>
                                <button onClick={() => setIsEditingArchive(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                            </div>
                            <form onSubmit={handleSaveArchive} className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">タイトル</label><input className="w-full border p-2 rounded" placeholder="例: 3月飲み会" value={currentArchive.title || ''} onChange={e => setCurrentArchive({...currentArchive, title: e.target.value})} required /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">日付 (YYYY-MM-DD)</label><input className="w-full border p-2 rounded" placeholder="2025-03-29" value={currentArchive.date || ''} onChange={e => setCurrentArchive({...currentArchive, date: e.target.value})} required /></div>
                                </div>
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">場所</label><input className="w-full border p-2 rounded" placeholder="例: 渋谷" value={currentArchive.location || ''} onChange={e => setCurrentArchive({...currentArchive, location: e.target.value})} /></div>
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">詳細</label><textarea className="w-full border p-2 rounded h-32" placeholder="詳細な説明..." value={currentArchive.description || ''} onChange={e => setCurrentArchive({...currentArchive, description: e.target.value})} /></div>
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">画像URL (カンマ区切り)</label><input className="w-full border p-2 rounded" placeholder="/img1.jpg, /img2.jpg" value={currentArchive.images?.join(', ') || ''} onChange={e => setCurrentArchive({...currentArchive, images: e.target.value.split(',').map(s => s.trim())})} /></div>
                                <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
                                    <button type="button" onClick={() => setIsEditingArchive(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">キャンセル</button>
                                    <button type="submit" className="bg-[#1e3820] text-white px-6 py-2 rounded font-bold shadow-md hover:shadow-lg">保存</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* USERS - EXISTING (Simplified for brevity) */}
        {activeTab === 'users' && (
            <div className="space-y-6 animate-in fade-in">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3">氏名 (Name)</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Sub</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} className="border-b hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-bold">{u.firstName} {u.lastName}</div>
                                        <div className="text-xs text-gray-400">{u.username || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4">{u.email}</td>
                                    <td className="px-6 py-4">{u.role}</td>
                                    <td className="px-6 py-4">{u.isSubscribed ? <Check size={14} className="text-green-600"/> : "-"}</td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button onClick={() => { setCurrentUser(u); setIsEditingUser(true); }} className="text-blue-500 p-1 hover:bg-blue-50 rounded"><Edit2 size={16}/></button>
                                        <button onClick={() => openEmailToUser(u.email)} className="text-blue-500 p-1"><Mail size={16}/></button>
                                        <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 p-1"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* User Edit Modal */}
                {isEditingUser && (
                    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in zoom-in-95">
                            <div className="p-6 border-b flex justify-between items-center">
                                <h3 className="font-bold text-lg">ユーザー情報編集</h3>
                                <button onClick={() => setIsEditingUser(false)}><X size={20}/></button>
                            </div>
                            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">姓 (Surname)</label>
                                        <input 
                                            className="w-full border p-2 rounded" 
                                            value={currentUser.firstName || ''} 
                                            onChange={e => setCurrentUser({...currentUser, firstName: e.target.value})} 
                                            required 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">名 (Given Name)</label>
                                        <input 
                                            className="w-full border p-2 rounded" 
                                            value={currentUser.lastName || ''} 
                                            onChange={e => setCurrentUser({...currentUser, lastName: e.target.value})} 
                                            required 
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Role</label>
                                    <select 
                                        className="w-full border p-2 rounded"
                                        value={currentUser.role || 'user'}
                                        onChange={e => setCurrentUser({...currentUser, role: e.target.value})}
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="flex gap-2 justify-end pt-4">
                                    <button type="button" onClick={() => setIsEditingUser(false)} className="px-4 py-2 text-gray-500">キャンセル</button>
                                    <button type="submit" className="bg-[#1e3820] text-white px-6 py-2 rounded font-bold">保存</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        )}
        
        {/* NOTICE - IMPROVED */}
        {activeTab === 'notice' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
                {/* Editor */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col h-[600px]">
                    <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                        <Edit2 className="w-4 h-4 text-[#ff0072]" /> お知らせ編集
                    </h3>
                    <div className="space-y-4 flex-1 flex flex-col">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">タイトル</label>
                            <input 
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1e3820] outline-none font-bold" 
                                placeholder="お知らせのタイトル"
                                value={noticeTitle} 
                                onChange={e => setNoticeTitle(e.target.value)} 
                            />
                        </div>
                        <div className="flex-1 flex flex-col">
                            <label className="block text-xs font-bold text-gray-500 mb-1">本文</label>
                            <textarea 
                                className="w-full flex-1 p-4 border rounded-lg focus:ring-2 focus:ring-[#1e3820] outline-none resize-none font-mono text-sm leading-relaxed" 
                                placeholder="ここにお知らせの内容を入力..."
                                value={noticeContent} 
                                onChange={e => setNoticeContent(e.target.value)} 
                            />
                        </div>
                        <div className="flex justify-end pt-2">
                            <button 
                                onClick={handleSaveNotice} 
                                disabled={savingNotice} 
                                className="bg-[#1e3820] text-white px-8 py-3 rounded-lg flex items-center gap-2 font-bold shadow-md hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {savingNotice ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                                保存して公開
                            </button>
                        </div>
                    </div>
                </div>

                {/* History */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-[600px] flex flex-col">
                    <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                        <History className="w-4 h-4 text-gray-500" /> 配信履歴
                    </h3>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                        {notices.length === 0 ? (
                            <p className="text-gray-400 text-center py-10">履歴はありません</p>
                        ) : (
                            notices.map((notice, i) => (
                                <div 
                                    key={i} 
                                    className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition group"
                                    onClick={() => { setNoticeTitle(notice.title); setNoticeContent(notice.content); }}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-gray-800 group-hover:text-[#1e3820] transition">{notice.title}</h4>
                                        <span className="text-xs text-gray-400 whitespace-nowrap">
                                            {notice.updatedAt ? new Date(notice.updatedAt).toLocaleDateString() : '-'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-2">{notice.content}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}
        
        {/* EMAIL - UPDATED WITH TEMPLATES */}
        {activeTab === 'email' && (
            <div className="space-y-6 animate-in fade-in">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-2xl mx-auto">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Mail className="text-[#ff0072]" /> メール配信
                    </h2>
                    <div className="space-y-5">
                        
                        {/* Template Selection */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <label className="block text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> テンプレートを選択
                            </label>
                            <select 
                                className="w-full p-2 border border-blue-200 rounded bg-white text-sm"
                                value={selectedTemplate}
                                onChange={handleTemplateChange}
                            >
                                <option value="">選択してください (Select Template)</option>
                                {emailTemplates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Target Selection (Kept simplified logic) */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">送信先</label>
                            <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="target" value="subscribed" checked={emailTarget === 'subscribed'} onChange={() => setEmailTarget('subscribed')} className="accent-[#1e3820]" /> <span className="text-sm font-medium">購読者のみ</span></label>
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="target" value="all" checked={emailTarget === 'all'} onChange={() => setEmailTarget('all')} className="accent-[#1e3820]" /> <span className="text-sm font-medium">全ユーザー</span></label>
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="target" value="specific" checked={emailTarget === 'specific'} onChange={() => setEmailTarget('specific')} className="accent-[#1e3820]" /> <span className="text-sm font-medium">特定ユーザー</span></label>
                                </div>
                                {emailTarget === 'specific' && (
                                    <div className="relative animate-in slide-in-from-top-2">
                                        <div className="relative"><Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" /><input className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1e3820] outline-none text-sm" value={emailSearchQuery} onChange={(e) => { setEmailSearchQuery(e.target.value); if (e.target.value !== specificEmail) setSpecificEmail(e.target.value); }} placeholder="名前またはメールで検索..." /></div>
                                        {emailSearchResults.length > 0 && (<div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-20 overflow-hidden">{emailSearchResults.map(u => (<button key={u.id} onClick={() => { setSpecificEmail(u.email); setEmailSearchQuery(u.email); setEmailSearchResults([]); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm flex justify-between items-center transition-colors border-b border-gray-50 last:border-0"><span className="font-bold text-gray-800">{u.username}</span><span className="text-gray-500 text-xs">{u.email}</span></button>))}</div>)}
                                    </div>
                                )}
                            </div>
                        </div>

                        <input className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1e3820] outline-none" placeholder="件名 (Subject)" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} />
                        
                        <div className="relative">
                            <div className="absolute right-2 top-2"><span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded border flex items-center gap-1"><Code className="w-3 h-3" /> HTML対応</span></div>
                            <textarea className="w-full px-4 py-3 border rounded-lg h-48 focus:ring-2 focus:ring-[#1e3820] outline-none font-mono text-sm leading-relaxed" placeholder="メール本文 (HTMLタグも使用可能です)" value={emailBody} onChange={e => setEmailBody(e.target.value)} />
                        </div>

                        <div className="flex justify-end">
                            <button onClick={handleSendEmail} disabled={sendingEmail || !emailSubject || !emailBody} className="bg-[#1e3820] text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 shadow-md hover:shadow-lg transition-all active:scale-[0.98]">{sendingEmail ? <Loader2 className="animate-spin" /> : <Mail className="w-5 h-5" />} 送信 (Send)</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        
        {/* DESIGN CONFIG (Existing) */}
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