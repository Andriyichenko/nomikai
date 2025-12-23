"use client";

import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, Users, Calendar, Info, X } from "lucide-react";
import { format, parseISO } from 'date-fns';

interface PublicReservation {
    name: string;
    image?: string | null;
    firstName?: string;
    availableDates: string[];
    reservationItemId: string;
}

interface PublicStatsProps {
    projectId?: string;
    filterRange?: {
        start: string;
        end: string;
    };
}

export default function PublicStats({ projectId, filterRange }: PublicStatsProps) {
    const [stats, setStats] = useState<PublicReservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

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

    // 1. 数据聚合：按用户名汇总日期，去重
    const aggregatedData = useMemo(() => {
        const userMap: Record<string, { name: string, image?: string | null, firstName?: string, dates: Set<string>, reservationItemId: string }> = {};
        
        stats.forEach(r => {
            // Filter by projectId if provided
            if (projectId && r.reservationItemId !== projectId) return;

            if (!userMap[r.name]) {
                userMap[r.name] = { 
                    name: r.name, 
                    image: r.image, 
                    firstName: r.firstName, 
                    dates: new Set(),
                    reservationItemId: r.reservationItemId
                };
            }
            r.availableDates.forEach(date => {
                if (filterRange) {
                    const d = parseISO(date);
                    const start = parseISO(filterRange.start);
                    const end = parseISO(filterRange.end);
                    if (d < start || d > end) return;
                }
                userMap[r.name].dates.add(date);
            });
        });

        return Object.values(userMap).map(user => ({
            ...user,
            dates: Array.from(user.dates).sort()
        })).sort((a, b) => a.name.localeCompare(b.name));
    }, [stats, filterRange, projectId]);

    // 2. 图表数据计算
    const chartData = useMemo(() => {
        const dateCounts: Record<string, number> = {};
        aggregatedData.forEach(user => {
            user.dates.forEach(date => {
                dateCounts[date] = (dateCounts[date] || 0) + 1;
            });
        });

        return Object.entries(dateCounts)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [aggregatedData]);

    // 自动选中第一个日期
    useEffect(() => {
        if (!selectedDate && chartData.length > 0) {
            setSelectedDate(chartData[0].date);
        }
    }, [chartData, selectedDate]);

    // 3. Filter displayed data based on selected date
    const displayData = useMemo(() => {
        if (!selectedDate) return aggregatedData;
        return aggregatedData.filter(user => user.dates.includes(selectedDate));
    }, [aggregatedData, selectedDate]);

    if (loading) return (
        <div className="flex justify-center p-12 min-h-[300px] items-center"><Loader2 className="animate-spin text-[#1e3820]" /></div>
    );

    if (aggregatedData.length === 0) {
        return (
            <div className="p-12 text-center text-gray-400">
                <Info className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p>まだ予約データがありません</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-full overflow-hidden text-[#1e3820]">
            {/* 顶部统计图表 */}
            <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h3 className="text-sm md:text-lg font-bold text-[#1e3820] flex items-center gap-2">
                        <Calendar className="w-4 h-4 md:w-5 md:h-5 text-[#ff0072]" />
                        日程別 参加者統計
                    </h3>
                    
                    {/* 图例说明 */}
                    <div className="flex flex-wrap items-center gap-4 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm bg-[#ff0072]"></div>
                            <span className="text-[10px] md:text-xs font-bold text-gray-600">表示中の日</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm bg-[#1e3820]"></div>
                            <span className="text-[10px] md:text-xs font-bold text-gray-600">その他の日</span>
                        </div>
                        <div className="hidden md:block w-px h-3 bg-gray-300 mx-1"></div>
                        <div className="text-[10px] md:text-xs text-gray-400 italic">
                            ※ 棒をタップすると下のリストが切り替わります
                        </div>
                    </div>
                </div>

                <div className="h-[180px] md:h-[220px] w-full min-h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} onClick={(data) => {
                            if (data?.activeLabel) {
                                setSelectedDate(String(data.activeLabel));
                            }
                        }}>
                            <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: 10 }} 
                                tickFormatter={(str) => {
                                    const d = parseISO(String(str));
                                    return `${d.getMonth() + 1}/${d.getDate()}`;
                                }}
                            />
                            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                            <Tooltip 
                                cursor={{ fill: '#f3f4f6' }}
                                content={({ active, payload }) => (
                                    active && payload && (
                                        <div className="bg-white p-2 border rounded shadow-lg text-xs">
                                            <p className="font-bold">{payload[0].payload.date}</p>
                                            <p className="text-[#ff0072] font-bold">{payload[0].value} 名参加予定</p>
                                        </div>
                                    )
                                )}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={selectedDate === entry.date ? '#ff0072' : '#1e3820'} 
                                        className="cursor-pointer transition-all"
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 参与者预约状态表 */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-[#1e3820] text-sm md:text-base flex items-center gap-2">
                        <Users className="w-4 h-4 md:w-5 md:h-5 text-[#ff0072]" />
                        {selectedDate ? (
                            <span>{format(parseISO(selectedDate), 'M/d')} の参加者</span>
                        ) : (
                            <span>参加者リスト (全体)</span>
                        )}
                    </h3>
                    <span className="text-[10px] md:text-xs font-bold bg-[#1e3820] text-white px-2 py-1 rounded-full">
                        {displayData.length} 名
                    </span>
                </div>
                
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    {displayData.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-xs">
                            この日の参加予定者はまだいません。
                        </div>
                    ) : (
                        <table className="w-full text-left text-xs md:text-sm border-collapse">
                            <thead className="bg-gray-50/50 text-gray-400 text-[10px] uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm">
                                <tr>
                                    <th className="px-4 md:px-6 py-3 font-bold border-b">ユーザー名</th>
                                    <th className="px-4 md:px-6 py-3 font-bold border-b">選択日程</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {displayData.map((user, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 md:px-6 py-4">
                                            <div className="flex items-center gap-2 md:gap-3">
                                                <div className="w-7 h-7 md:w-8 md:h-8 shrink-0 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex items-center justify-center text-[10px] font-bold text-[#1e3820] shadow-sm border border-white">
                                                    {user.image ? (
                                                        <img src={user.image} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span>{(user.firstName || user.name).charAt(0).toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <span className="font-bold text-gray-700 truncate max-w-[100px] md:max-w-none">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4">
                                            <div className="flex flex-wrap gap-1 md:gap-1.5">
                                                {user.dates.map(d => {
                                                    const dateObj = parseISO(d);
                                                    const isSelected = d === selectedDate;
                                                    return (
                                                        <span 
                                                            key={d} 
                                                            className={`text-[9px] md:text-[10px] px-1.5 md:px-2 py-0.5 rounded-md font-bold border ${isSelected ? 'bg-[#ff0072]/10 text-[#ff0072] border-[#ff0072]/30' : 'bg-blue-50/50 text-blue-600 border-blue-100'}`}
                                                        >
                                                            {dateObj.getMonth() + 1}/{dateObj.getDate()}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            
            <p className="text-[9px] md:text-[10px] text-gray-400 text-center italic pb-2">
                ※ プライバシー保護のため、メールアドレスは表示されません。
            </p>
        </div>
    );
}
