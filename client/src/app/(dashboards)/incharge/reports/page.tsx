'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  FileBarChart, RefreshCw, AlertTriangle, CheckCircle2,
  Users, TrendingUp, Download, ArrowLeft, Calendar,
  Landmark, BarChart3, Activity, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Cell, PieChart, Pie, Legend
} from 'recharts';

const API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const COLORS = ['#10b981', '#f43f5e', '#f59e0b', '#6366f1'];

function InchargeReportsContent() {
  const { token } = useAuth();
  const searchParams = useSearchParams();

  const [classes, setClasses]       = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [analytics, setAnalytics]   = useState<any>(null);
  const [loading, setLoading]       = useState(false);

  // Fetch incharge's assigned classes
  const fetchClasses = async () => {
    try {
      const res  = await fetch(`${API}/api/incharge/classes`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok && data.success) {
        setClasses(data.data);
        const qId = searchParams.get('classId');
        const first = qId || (data.data[0]?._id ?? '');
        if (first) { setSelectedId(first); fetchAnalytics(first); }
      }
    } catch { toast.error('Failed to load classes'); }
  };

  const fetchAnalytics = async (classId: string) => {
    if (!classId) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/attendance/class/${classId}/analytics`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok && data.success) setAnalytics(data.data);
      else toast.error(data.message || 'Failed to load analytics');
    } catch { toast.error('Server error'); }
    finally   { setLoading(false); }
  };

  useEffect(() => { if (token) fetchClasses(); }, [token]);

  // Build pie data: Present / Shortage
  const pieData = analytics ? [
    { name: 'Above 75%', value: (analytics.studentAttendancePercentages || []).filter((s: any) => s.percentage >= 75).length },
    { name: 'Below 75%', value: (analytics.shortageList || []).length },
  ] : [];

  // Bar chart: top 15 students by attendance %
  const barData = (analytics?.studentAttendancePercentages || []).slice(0, 15).map((s: any) => ({
    name: s.registerNumber,
    pct:  s.percentage,
  }));

  // Export CSV of shortage list
  const exportShortage = () => {
    if (!analytics?.shortageList?.length) { toast.error('No shortage data to export'); return; }
    const header = 'Register No,Name,Present Days,Total Days,Attendance %\n';
    const rows   = analytics.shortageList.map((s: any) =>
      `${s.registerNumber},${s.name},${s.presentDays},${s.totalDays},${s.percentage}%`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `ShortageReport_${analytics.classRoom?.className || 'class'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export full student attendance CSV
  const exportFull = () => {
    if (!analytics?.studentAttendancePercentages?.length) { toast.error('No data to export'); return; }
    const header = 'Register No,Name,Roll No,Present Days,Total Days,Attendance %,Status\n';
    const rows   = analytics.studentAttendancePercentages.map((s: any) =>
      `${s.registerNumber},${s.name},${s.rollNumber || '—'},${s.presentDays},${s.totalDays},${s.percentage}%,${s.status}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `AttendanceReport_${analytics.classRoom?.className || 'class'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Link href="/incharge-dashboard" className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-teal-400 font-semibold uppercase tracking-wider transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Panel
        </Link>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileBarChart className="w-7 h-7 text-teal-400" />
              Class Attendance Reports
            </h1>
            <p className="text-neutral-400 text-sm mt-0.5">Detailed attendance analytics, shortage register, and export tools for your class.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportShortage} className="flex items-center gap-1.5 text-xs px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl font-semibold transition-all">
              <Download className="w-3.5 h-3.5" /> Shortage CSV
            </button>
            <button onClick={exportFull} className="flex items-center gap-1.5 text-xs px-3 py-2 bg-teal-500/10 border border-teal-500/20 text-teal-400 hover:bg-teal-500/20 rounded-xl font-semibold transition-all">
              <Download className="w-3.5 h-3.5" /> Full Report CSV
            </button>
          </div>
        </div>
      </div>

      {/* Class Selector */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 p-5 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">Select Classroom</label>
            <select
              value={selectedId}
              onChange={e => { setSelectedId(e.target.value); fetchAnalytics(e.target.value); }}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-teal-500 focus:outline-none text-sm"
            >
              <option value="">-- Select Class --</option>
              {classes.map(c => (
                <option key={c._id} value={c._id}>{c.className} ({c.department} • Sem {c.semester})</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => selectedId && fetchAnalytics(selectedId)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold transition-all justify-center"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
            Generate Report
          </button>
        </div>
      </div>

      {/* Analytics Section */}
      {loading && (
        <div className="flex justify-center py-20">
          <RefreshCw className="w-10 h-10 animate-spin text-teal-400" />
        </div>
      )}

      {!loading && analytics && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Class Attendance',
                value: `${analytics.classAttendancePercentage}%`,
                icon: <TrendingUp className="w-5 h-5 text-teal-400" />,
                color: 'from-teal-500/10 to-emerald-500/5',
                border: 'border-teal-500/20',
              },
              {
                label: 'Total Students',
                value: analytics.studentAttendancePercentages?.length || 0,
                icon: <Users className="w-5 h-5 text-blue-400" />,
                color: 'from-blue-500/10 to-blue-500/5',
                border: 'border-blue-500/20',
              },
              {
                label: 'Shortage (<75%)',
                value: analytics.shortageList?.length || 0,
                icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
                color: 'from-red-500/10 to-red-500/5',
                border: 'border-red-500/20',
              },
              {
                label: 'Above 75%',
                value: (analytics.studentAttendancePercentages || []).filter((s: any) => s.percentage >= 75).length,
                icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
                color: 'from-emerald-500/10 to-emerald-500/5',
                border: 'border-emerald-500/20',
              },
            ].map((kpi, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`backdrop-blur-md bg-gradient-to-br ${kpi.color} border ${kpi.border} p-5 rounded-2xl flex items-center gap-4`}
              >
                <div className="p-2.5 bg-neutral-950/40 rounded-xl border border-white/5">{kpi.icon}</div>
                <div>
                  <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider block">{kpi.label}</span>
                  <span className="text-2xl font-bold text-white">{kpi.value}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bar Chart: Top Students */}
            <div className="lg:col-span-2 backdrop-blur-md bg-white/5 border border-white/10 p-5 rounded-2xl">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-400" /> Student Attendance % (Top 15)
              </h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis dataKey="name" stroke="#888" fontSize={9} tick={{ fontSize: 8 }} />
                    <YAxis stroke="#888" fontSize={10} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#171717', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 11 }}
                      formatter={(v: any) => [`${v}%`, 'Attendance']}
                    />
                    <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                      {barData.map((entry: { name: string; pct: number }, index: number) => (
                        <Cell key={index} fill={entry.pct >= 75 ? '#10b981' : '#f43f5e'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 mt-3 text-[10px] text-neutral-400">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> ≥75% Regular</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> &lt;75% Shortage</span>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="backdrop-blur-md bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-teal-400" /> Class Overview
              </h3>
              <div className="flex-1 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={i === 0 ? '#10b981' : '#f43f5e'} />)}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#171717', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 pt-3 border-t border-white/5 flex flex-col gap-1">
                <p className="text-[10px] text-neutral-400 font-semibold uppercase">Class</p>
                <p className="text-sm font-bold text-white">{analytics.classRoom?.className}</p>
                <p className="text-[10px] text-neutral-500">Sem {analytics.classRoom?.semester} • {analytics.classRoom?.department}</p>
              </div>
            </div>
          </div>

          {/* Full Student Table */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-white/10">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-400" />
                Full Student Attendance Register
              </h3>
              <span className="text-xs text-neutral-500">{analytics.studentAttendancePercentages?.length} students</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-neutral-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3">Reg No</th>
                    <th className="p-3">Name</th>
                    <th className="p-3 text-center">Present</th>
                    <th className="p-3 text-center">Absent</th>
                    <th className="p-3 text-center">Total</th>
                    <th className="p-3 text-center">%</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {(analytics.studentAttendancePercentages || []).map((s: any, idx: number) => (
                    <tr key={s.studentId} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 text-center text-neutral-500">{idx + 1}</td>
                      <td className="p-3 font-mono text-neutral-300 font-semibold">{s.registerNumber}</td>
                      <td className="p-3 text-white font-medium">{s.name}</td>
                      <td className="p-3 text-center text-emerald-400 font-semibold">{s.presentDays}</td>
                      <td className="p-3 text-center text-red-400 font-semibold">{s.absentDays}</td>
                      <td className="p-3 text-center text-neutral-400">{s.totalDays}</td>
                      <td className="p-3 text-center">
                        <span className={`font-bold text-sm ${s.percentage >= 75 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {s.percentage}%
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          s.status === 'Shortage'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!analytics.studentAttendancePercentages || analytics.studentAttendancePercentages.length === 0) && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-neutral-500">No student data found for this class.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Shortage Register */}
          {analytics.shortageList && analytics.shortageList.length > 0 && (
            <div className="backdrop-blur-md bg-red-950/10 border border-red-500/20 rounded-2xl overflow-hidden">
              <div className="flex justify-between items-center p-5 border-b border-red-500/10">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
                  Shortage Register — Below 75%
                </h3>
                <span className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1 rounded-xl text-xs font-bold">
                  {analytics.shortageList.length} student(s)
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-red-500/10 text-neutral-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="p-3">Register No</th>
                      <th className="p-3">Name</th>
                      <th className="p-3 text-center">Present</th>
                      <th className="p-3 text-center">Total</th>
                      <th className="p-3 text-center">Attendance %</th>
                      <th className="p-3 text-center">Days Needed for 75%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-500/5 text-xs">
                    {analytics.shortageList.map((s: any) => {
                      const daysNeeded = Math.max(0, Math.ceil((0.75 * s.totalDays - s.presentDays) / 0.25));
                      return (
                        <tr key={s.studentId} className="hover:bg-red-500/5 transition-colors">
                          <td className="p-3 font-mono text-neutral-300 font-semibold">{s.registerNumber}</td>
                          <td className="p-3 text-white font-medium">{s.name}</td>
                          <td className="p-3 text-center text-neutral-300">{s.presentDays}</td>
                          <td className="p-3 text-center text-neutral-400">{s.totalDays}</td>
                          <td className="p-3 text-center">
                            <span className="text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                              {s.percentage}%
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-amber-400 font-bold">{daysNeeded} more days</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !analytics && (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-white/5 bg-white/5 rounded-2xl backdrop-blur-sm">
          <FileBarChart className="w-14 h-14 text-neutral-600 mb-3 opacity-30" />
          <p className="text-neutral-400 font-semibold">Select a class and click "Generate Report"</p>
          <p className="text-neutral-600 text-sm mt-1">Shortage list, attendance percentages, and export will appear here.</p>
        </div>
      )}
    </div>
  );
}

export default function InchargeReportsPage() {
  return (
    <ProtectedRoute allowedRoles={['class_incharge']}>
      <Suspense fallback={
        <div className="flex justify-center items-center py-20">
          <RefreshCw className="w-10 h-10 animate-spin text-teal-400" />
        </div>
      }>
        <InchargeReportsContent />
      </Suspense>
    </ProtectedRoute>
  );
}
