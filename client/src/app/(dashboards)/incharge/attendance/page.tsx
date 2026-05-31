'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Clock, AlertTriangle, Users, BookOpen, Calendar,
  TrendingUp, RefreshCw, Landmark, ArrowRight, Upload,
  Shield, CheckCircle2, ChevronRight, BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, CartesianGrid, Legend 
} from 'recharts';

function ClassInchargeAttendanceContent() {
  const { token } = useAuth();
  const searchParams = useSearchParams();

  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/incharge/classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setClasses(data.data);
        const queryClassId = searchParams.get('classId');
        if (queryClassId) {
          setSelectedClassId(queryClassId);
          fetchAnalytics(queryClassId);
        } else if (data.data.length > 0) {
          setSelectedClassId(data.data[0]._id);
          fetchAnalytics(data.data[0]._id);
        }
      }
    } catch (err) {
      toast.error('Failed to load assigned classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (classId: string) => {
    if (!classId) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/attendance/class/${classId}/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAnalytics(data.data);
      } else {
        toast.error(data.message || 'Failed to load attendance analytics');
      }
    } catch (err) {
      toast.error('Error fetching analytics from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchClasses();
    }
  }, [token]);

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    if (classId) {
      fetchAnalytics(classId);
    } else {
      setAnalytics(null);
    }
  };

  // Heatmap Color Calculator based on Present Ratio
  const getHeatmapColorClass = (presentCount: number, totalCount: number) => {
    if (totalCount === 0) return 'bg-neutral-900 border-white/5 text-neutral-600';
    const pct = (presentCount / totalCount) * 100;
    if (pct >= 85) return 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold';
    if (pct >= 75) return 'bg-amber-500/20 border-amber-500/40 text-amber-400 font-bold';
    return 'bg-red-500/20 border-red-500/40 text-red-400 font-bold';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Importer Redirect Block */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="w-7 h-7 text-teal-400 animate-pulse" />
            Class Attendance Portal
          </h1>
          <p className="text-neutral-400 text-sm mt-0.5">Monitor cohort attendance, view shortage registries, and analyze monthly trends.</p>
        </div>

        <div className="flex gap-2 self-start sm:self-auto">
          {selectedClassId && (
            <Link 
              href={`/incharge/attendance/import?classId=${selectedClassId}`}
              className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2.5 rounded-xl flex items-center font-medium transition-all shadow-lg text-sm"
            >
              <Upload className="w-4.5 h-4.5 mr-2" />
              Import Attendance CSV
            </Link>
          )}
          <button 
            onClick={() => fetchAnalytics(selectedClassId)}
            className="p-2.5 bg-neutral-900/40 border border-white/10 hover:bg-white/5 rounded-xl text-neutral-400 hover:text-white transition-all backdrop-blur-sm flex items-center justify-center"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Cohort Selector */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 p-5 rounded-2xl">
        <div className="max-w-md">
          <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">Select Supervising Roster</label>
          <select 
            value={selectedClassId}
            onChange={e => handleClassChange(e.target.value)}
            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-teal-500 focus:outline-none text-sm cursor-pointer"
          >
            <option value="">-- Choose Assigned Class --</option>
            {classes.map(c => (
              <option key={c._id} value={c._id}>
                {c.className} ({c.department} • Year {c.year})
              </option>
            ))}
          </select>
        </div>
      </div>

      {analytics ? (
        <div className="flex flex-col gap-6">
          {/* Stats Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: 'Class Attendance Average', value: `${analytics.classAttendancePercentage}%`, icon: <TrendingUp className="w-6 h-6 text-teal-400" />, desc: 'Attended aggregate' },
              { label: 'Supervised Roster Size', value: `${analytics.studentAttendancePercentages ? analytics.studentAttendancePercentages.length : 0} Students`, icon: <Users className="w-6 h-6 text-emerald-400" />, desc: 'Total enrolled strength' },
              { label: 'Critical Shortage Alerts', value: `${analytics.shortageList ? analytics.shortageList.length : 0} Defaulters`, icon: <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />, desc: 'Attendance below 75%' }
            ].map((stat, i) => (
              <div key={i} className="backdrop-blur-md bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between shadow-lg">
                <div>
                  <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">{stat.label}</span>
                  <h3 className="text-2xl font-bold text-white mt-1">{stat.value}</h3>
                  <span className="text-neutral-500 text-xs mt-0.5 block">{stat.desc}</span>
                </div>
                <div className="p-3 bg-neutral-900/40 border border-white/5 rounded-xl">
                  {stat.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Daily Trend & Heatmap Calendar Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Trend Chart (AreaChart) */}
            <div className="backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-2xl col-span-2 shadow-lg flex flex-col justify-between">
              <div>
                <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider mb-4 block">Daily Attendance Trends</span>
                {analytics.dailyReport && analytics.dailyReport.length > 0 ? (
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.dailyReport}>
                        <defs>
                          <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                        <XAxis dataKey="date" stroke="#888" fontSize={9} tickFormatter={v => v.split('-')[2]} />
                        <YAxis stroke="#888" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#171717', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 11 }} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Area type="monotone" dataKey="present" name="Present / OD" stroke="#14b8a6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPresent)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-neutral-500 text-xs">
                    No daily logs retrieved. Please import a CSV sheet for March 2026.
                  </div>
                )}
              </div>
            </div>

            {/* Daily Heatmap Grid representation */}
            <div className="backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-2xl shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Dynamic Monthly Heatmap</span>
                  <span className="text-[10px] text-neutral-400 font-semibold">March 2026</span>
                </div>
                
                {analytics.dailyReport && analytics.dailyReport.length > 0 ? (
                  <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <span key={d} className="text-neutral-500 mb-1">{d}</span>
                    ))}
                    
                    {/* Empty placeholder offset for March 1, 2026 (starts on Sunday, offset = 0) */}
                    {Array.from({ length: 31 }).map((_, dayIdx) => {
                      const dayStr = String(dayIdx + 1).padStart(2, '0');
                      const fullDateStr = `2026-03-${dayStr}`;
                      const report = analytics.dailyReport.find((r: any) => r.date === fullDateStr);
                      const present = report ? report.present : 0;
                      const total = report ? report.total : 0;

                      return (
                        <div 
                          key={dayIdx} 
                          className={`aspect-square rounded-lg border flex flex-col items-center justify-center transition-all ${
                            getHeatmapColorClass(present, total)
                          }`}
                          title={total > 0 ? `${dayIdx + 1} March: ${Math.round((present/total)*100)}% attendance (${present}/${total})` : `No records`}
                        >
                          <span>{dayIdx + 1}</span>
                          {total > 0 && (
                            <span className="text-[7px] opacity-75 mt-0.5">{Math.round((present/total)*100)}%</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-20 text-xs text-neutral-500">
                    No heatmap data available.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Roster & Shortage Lists Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weak Attendance shortage list */}
            <div className="backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-2xl col-span-1 shadow-lg flex flex-col justify-between">
              <div>
                <h3 className="text-md font-bold text-white mb-4 flex items-center gap-1.5">
                  <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
                  Roster Shortage Register
                </h3>

                <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2">
                  {analytics.shortageList && analytics.shortageList.map((st: any) => (
                    <div key={st.studentId} className="flex justify-between items-center bg-red-950/10 border border-red-500/10 p-3 rounded-xl">
                      <div>
                        <p className="text-xs font-semibold text-white">{st.name}</p>
                        <p className="text-[10px] text-neutral-500 mt-0.5 font-mono">{st.registerNumber}</p>
                      </div>
                      <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded border border-red-500/20">
                        {st.percentage}%
                      </span>
                    </div>
                  ))}
                  {(!analytics.shortageList || analytics.shortageList.length === 0) && (
                    <div className="text-center text-xs text-neutral-500 py-16">
                      Splendid! No shortage records.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Complete Student list table */}
            <div className="backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-2xl col-span-2 shadow-lg">
              <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-400" />
                Roster Record Directory
              </h3>

              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-neutral-400 uppercase tracking-wider font-semibold">
                      <th className="p-3">Register Number</th>
                      <th className="p-3">Name</th>
                      <th className="p-3 text-center">Attended / Total</th>
                      <th className="p-3 text-right">Roster %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {analytics.studentAttendancePercentages && analytics.studentAttendancePercentages.map((st: any) => (
                      <tr key={st.studentId} className="hover:bg-white/5 transition-colors">
                        <td className="p-3 font-mono text-neutral-300 font-semibold">{st.registerNumber}</td>
                        <td className="p-3 text-white font-medium">{st.name}</td>
                        <td className="p-3 text-center text-neutral-400">
                          <strong>{st.presentDays}</strong> / {st.totalDays} days
                        </td>
                        <td className="p-3 text-right">
                          <span className={`font-bold ${st.percentage < 75 ? 'text-red-400' : 'text-teal-400'}`}>
                            {st.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="backdrop-blur-md bg-white/5 border border-white/10 p-16 text-center text-neutral-500 rounded-2xl">
          <BookOpen className="w-12 h-12 text-neutral-600 mx-auto mb-2 opacity-30 animate-pulse" />
          Please select an assigned class roster from the dropdown above to load the visual attendance panel.
        </div>
      )}
    </div>
  );
}

export default function ClassInchargeAttendancePage() {
  return (
    <ProtectedRoute allowedRoles={['class_incharge']}>
      <Suspense fallback={
        <div className="flex justify-center items-center py-20">
          <RefreshCw className="w-10 h-10 animate-spin text-teal-400" />
        </div>
      }>
        <ClassInchargeAttendanceContent />
      </Suspense>
    </ProtectedRoute>
  );
}
