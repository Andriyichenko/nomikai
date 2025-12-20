"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, Users, Calendar, X, User as UserIcon } from "lucide-react";
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

interface PublicReservation {
    name: string;
    availableDates: string[];
}

interface PublicStatsProps {
    filterRange?: {
        start: string;
        end: string;
    };
}

export default function PublicStats({ filterRange }: PublicStatsProps) {
    const [stats, setStats] = useState<PublicReservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Process data for chart
    const dateCounts: Record<string, number> = {};
    stats.forEach(r => {
        if (Array.isArray(r.availableDates)) {
            r.availableDates.forEach(date => {
                if (filterRange) {
                    const d = parseISO(date);
                    const start = parseISO(filterRange.start);
                    const end = parseISO(filterRange.end);
                    if (d < start || d > end) return;
                }
                dateCounts[date] = (dateCounts[date] || 0) + 1;
            });
        }
    });

    const chartData = Object.entries(dateCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

    const handleBarClick = (data: any) => {
        if (!data || !data.activePayload) return;
        const date = data.activePayload[0].payload.date;
        
        setSelectedDate(date);
        const users = stats
            .filter(r => r.availableDates.includes(date))
            .map(r => r.name);
        setSelectedUsers(users);
        
        // Smooth scroll to details
        document.getElementById('stats-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (loading) return (
        <div className="flex justify-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 mt-8">
            <Loader2 className="animate-spin text-[#1e3820]" />
        </div>
    );

    if (chartData.length === 0) return null;

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-lg text-sm">
                    <p className="font-bold text-[#1e3820] mb-1">{label}</p>
                    <p className="text-gray-600 flex items-center gap-2">
                        <Users size={14} />
                        参加者: <span className="font-bold">{payload[0].value}名</span>
                    </p>
                    <p className="text-xs text-[#ff0072] mt-1">タップして詳細を見る</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-[#1e3820]/5 p-6 border-b border-[#1e3820]/10">
                <h3 className="text-xl font-bold text-[#1e3820] flex items-center gap-2">
                    <Calendar className="text-[#ff0072]" />
                    日程別 参加状況
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                    グラフをタップすると、その日に参加予定のメンバーが表示されます。
                </p>
            </div>

            <div className="p-6">
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} onClick={handleBarClick} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: 11, fill: '#666' }} 
                                tickFormatter={(str) => {
                                    try {
                                        return format(parseISO(str), 'M/d(EE)', { locale: ja });
                                    } catch {
                                        return str;
                                    }
                                }}
                            />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#666' }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(30, 56, 32, 0.05)' }} />
                            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={selectedDate === entry.date ? '#ff0072' : '#1e3820'} 
                                        className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div id="stats-details" className="mt-2 transition-all duration-500 ease-in-out">
                    {selectedDate ? (
                        <div className="animate-in fade-in zoom-in-95 duration-300 bg-gray-50 rounded-xl p-5 border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">SELECTED DATE</div>
                                    <h4 className="text-lg font-bold text-[#1e3820] flex items-center gap-2">
                                        {format(parseISO(selectedDate), 'yyyy年 M月 d日 (EEEE)', { locale: ja })}
                                    </h4>
                                </div>
                                <button 
                                    onClick={() => setSelectedDate(null)} 
                                    className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {selectedUsers.map((user, idx) => (
                                    <div 
                                        key={idx} 
                                        className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex items-center gap-3 animate-in slide-in-from-bottom-2 fill-mode-backwards"
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1e3820] to-[#2e5030] flex items-center justify-center text-white text-xs font-bold shrink-0">
                                            {user.slice(0, 1).toUpperCase()}
                                        </div>
                                        <span className="font-medium text-sm text-gray-700 truncate">{user}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-4 text-center">
                                <span className="inline-block bg-[#ff0072]/10 text-[#ff0072] text-xs px-3 py-1 rounded-full font-medium">
                                    計 {selectedUsers.length} 名が参加予定
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <p className="text-sm">グラフの棒グラフをタップして<br/>参加者一覧を表示します</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
