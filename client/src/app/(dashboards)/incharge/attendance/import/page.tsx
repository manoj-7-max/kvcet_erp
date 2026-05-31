'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Upload, FileSpreadsheet, Download, RefreshCw, Landmark,
  ArrowLeft, CheckCircle2, AlertTriangle, AlertCircle, Users,
  BarChart3, Activity, ListFilter, HelpCircle, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  Tooltip, CartesianGrid, Legend 
} from 'recharts';

function AttendanceImportContent() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [month, setMonth] = useState('March 2026');
  const [year, setYear] = useState('2026');
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  
  // Preview State
  const [previewData, setPreviewData] = useState<any>(null);

  // Import Result State
  const [importResult, setImportResult] = useState<any>(null);

  // Analytics State
  const [analytics, setAnalytics] = useState<any>(null);

  const fetchClassesAndPreset = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/incharge/classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data_raw = await res.json();
        const data = Array.isArray(data_raw) ? data_raw : (data_raw.data || data_raw);
      if (res.ok && data.success) {
        setClasses(data.data);
        
        // Check query param
        const queryClassId = searchParams.get('classId');
        if (queryClassId) {
          setSelectedClassId(queryClassId);
          fetchClassAnalytics(queryClassId);
        } else if (data.data.length > 0) {
          setSelectedClassId(data.data[0]._id);
          fetchClassAnalytics(data.data[0]._id);
        }
      }
    } catch (err) {
      toast.error('Failed to load assigned classes');
    }
  };

  const fetchClassAnalytics = async (classId: string) => {
    if (!classId) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/attendance/class/${classId}/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data_raw = await res.json();
        const data = Array.isArray(data_raw) ? data_raw : (data_raw.data || data_raw);
      if (res.ok && data.success) {
        setAnalytics(data.data);
      }
    } catch (err) {
      console.error('Failed to load class analytics', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchClassesAndPreset();
    }
  }, [token, searchParams]);

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setImportResult(null);
    setPreviewData(null);
    setCsvFile(null);
    fetchClassAnalytics(classId);
  };

  // Client-side CSV Preview Reader
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCsvFile(file);
    setImportResult(null);

    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) {
          toast.error('CSV appears to be empty');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const rows = lines.slice(1, 6).map(row => {
          return row.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
        });

        setPreviewData({
          headers,
          rowCount: lines.length - 1,
          previewRows: rows
        });
      };
      reader.readAsText(file);
    } else {
      setPreviewData(null);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile || !selectedClassId) {
      toast.error('Please select a class and upload a CSV file');
      return;
    }
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvText = event.target?.result as string;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/attendance/class/${selectedClassId}/import-attendance`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            csvText,
            month,
            year: parseInt(year)
          })
        });
        const data_raw = await res.json();
        const data = Array.isArray(data_raw) ? data_raw : (data_raw.data || data_raw);
        if (res.ok && data.success) {
          toast.success(data.message || 'CSV attendance imported successfully!');
          setImportResult(data.data);
          fetchClassAnalytics(selectedClassId);
        } else {
          toast.error(data.message || 'Import failed');
        }
      } catch (err) {
        toast.error('Server error during import');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(csvFile);
  };

  const downloadTemplate = () => {
    // Basic CSV Template structure
    const headers = 'RegNo,Name,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31\n';
    const row = 'CS2023001,Abhishek R,1,1,1,0,1,1,1,1,0,1,1,1,1,0,1,1,1,1,0,1,1,1,1,0,1,1,1,1,0,1\n';
    const blob = new Blob([headers + row], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `Attendance_Template_${month.replace(' ', '_')}.csv`);
    a.click();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Back Buttons */}
      <div className="flex flex-col gap-3">
        <Link 
          href="/incharge-dashboard"
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-teal-400 font-semibold uppercase tracking-wider transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Panel
        </Link>
        
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-7 h-7 text-teal-400" />
              Attendance CSV Importer
            </h1>
            <p className="text-neutral-400 text-sm mt-0.5">Upload a monthly attendance grid, convert values, and populate standard records.</p>
          </div>
        </div>
      </div>

      {/* Select Cohort & Month Block */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">Select Class/Section</label>
            <select
              value={selectedClassId}
              onChange={e => handleClassChange(e.target.value)}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-teal-500 focus:outline-none text-sm cursor-pointer"
            >
              <option value="">-- Select Active Class --</option>
              {classes.map(c => (
                <option key={c._id} value={c._id}>
                  {c.className} ({c.department} • Year {c.year})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">Month</label>
            <input 
              type="text"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-teal-500 focus:outline-none text-sm"
              placeholder="e.g. March 2026"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">Year Parameter</label>
            <input 
              type="number"
              value={year}
              onChange={e => setYear(e.target.value)}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-teal-500 focus:outline-none text-sm"
              placeholder="e.g. 2026"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Upload & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Container */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-teal-400" />
                Upload Attendance CSV
              </h2>
              <button 
                onClick={downloadTemplate}
                className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download Template
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="flex flex-col gap-4">
              <div className="border-2 border-dashed border-white/15 hover:border-teal-500/50 rounded-2xl p-10 flex flex-col items-center justify-center bg-neutral-950/20 cursor-pointer transition-colors relative group">
                <input 
                  type="file" 
                  accept=".csv"
                  required
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <FileSpreadsheet className="w-12 h-12 text-neutral-500 group-hover:text-teal-400 transition-colors mb-3" />
                <p className="text-sm font-semibold text-white">
                  {csvFile ? csvFile.name : 'Choose or drop March 2026 Attendance CSV'}
                </p>
                <p className="text-xs text-neutral-500 mt-1">Accepts standard daily grid columns (0/1 values)</p>
              </div>

              {previewData && (
                <div className="bg-neutral-950/50 border border-white/5 rounded-xl p-4 text-xs text-neutral-300">
                  <div className="flex justify-between font-semibold border-b border-white/5 pb-2 mb-2 text-white">
                    <span>File Analysis Preview</span>
                    <span className="text-teal-400">{previewData.rowCount} Student Records Detected</span>
                  </div>
                  <p><strong>Detected Headers:</strong> {previewData.headers.slice(0, 8).join(', ')} ... ({previewData.headers.length} columns)</p>
                  <p className="mt-1 text-neutral-400">Headers index representing days (e.g. 1 to 31) will map into UTC Date objects automatically.</p>
                </div>
              )}

              <button 
                type="submit"
                disabled={loading || !csvFile || !selectedClassId}
                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Convert & Import Attendance'}
              </button>
            </form>
          </div>
        </div>

        {/* Live Preview / Import Log Output */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-teal-400" />
              Import Execution Reports
            </h2>

            {!importResult ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-neutral-500 border border-white/5 bg-neutral-950/20 rounded-2xl">
                <AlertCircle className="w-12 h-12 text-neutral-600 mb-2 opacity-30 animate-pulse" />
                Upload and submit a CSV file to view processing results and skipped duplicate rows.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block">Imported Successfully</span>
                      <span className="text-2xl font-bold text-white leading-none mt-1 block">{importResult.importedCount}</span>
                    </div>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center gap-3">
                    <AlertTriangle className="w-8 h-8 text-amber-400 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider block">Skipped / Duplicates</span>
                      <span className="text-2xl font-bold text-white leading-none mt-1 block">{importResult.skippedCount}</span>
                    </div>
                  </div>
                </div>

                {importResult.failedRows && importResult.failedRows.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase mb-2">Skipped / Invalid Register Records</label>
                    <div className="bg-neutral-950 border border-white/5 rounded-xl overflow-hidden max-h-[180px] overflow-y-auto divide-y divide-white/5">
                      {importResult.failedRows.map((f: any, idx: number) => (
                        <div key={idx} className="p-3 text-[11px] flex justify-between gap-4">
                          <span className="text-neutral-400 font-mono">Row {f.row}</span>
                          <span className="text-amber-400 font-medium truncate max-w-[200px]">{f.studentName || 'Unknown'}</span>
                          <span className="text-red-400 font-semibold text-right flex-shrink-0">{f.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analytics & Recharts Section */}
      {analytics && (
        <div className="flex flex-col gap-6">
          <div className="border-t border-white/10 pt-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-400" />
              March 2026 Attendance Metrics
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Overall Attendance Percentage */}
            <div className="backdrop-blur-md bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Overall Class Attendance</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-bold text-white">{analytics.classAttendancePercentage}%</span>
                  <span className="text-xs text-neutral-400">aggregate Pass</span>
                </div>
                <div className="w-full bg-neutral-950 rounded-full h-2 border border-white/5 overflow-hidden mt-4">
                  <div 
                    className="bg-gradient-to-r from-teal-500 to-emerald-400 h-2 rounded-full" 
                    style={{ width: `${analytics.classAttendancePercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Attendance Trend Chart */}
            <div className="backdrop-blur-md bg-white/5 border border-white/10 p-5 rounded-2xl col-span-2">
              <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider mb-3 block">Daily Attendance Trends</span>
              {analytics.dailyReport && analytics.dailyReport.length > 0 ? (
                <div className="w-full h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.dailyReport}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                      <XAxis dataKey="date" stroke="#888" fontSize={10} tickFormatter={v => v.split('-')[2]} />
                      <YAxis stroke="#888" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#171717', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 11 }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Line type="monotone" dataKey="present" name="Present Count" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
                      <Line type="monotone" dataKey="absent" name="Absent Count" stroke="#f43f5e" strokeWidth={1} dot={{ r: 1 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center text-xs text-neutral-500 py-10">No daily logs compiled yet.</div>
              )}
            </div>
          </div>

          {/* Shortage Register / Defaulters Roster */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-md font-bold text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
                  Shortage Register (<strong className="text-red-400">Below 75%</strong>)
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">List of cohort students requiring immediate HOD/Parent notification.</p>
              </div>
              <span className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1 rounded-xl text-xs font-bold">
                {analytics.shortageList ? analytics.shortageList.length : 0} student(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-neutral-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="p-3">Register Number</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Attended</th>
                    <th className="p-3">Total Days</th>
                    <th className="p-3">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {analytics.shortageList && analytics.shortageList.map((st: any) => (
                    <tr key={st.studentId} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-mono text-neutral-300 font-semibold">{st.registerNumber}</td>
                      <td className="p-3 text-white font-medium">{st.name}</td>
                      <td className="p-3 text-neutral-400 font-semibold">{st.presentDays} days</td>
                      <td className="p-3 text-neutral-400">{st.totalDays} days</td>
                      <td className="p-3">
                        <span className="text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                          {st.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!analytics.shortageList || analytics.shortageList.length === 0) && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-neutral-500">
                        🎉 Splendid! No students in this classroom fall below the 75% shortage threshold.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AttendanceImportPage() {
  return (
    <ProtectedRoute allowedRoles={['class_incharge']}>
      <Suspense fallback={
        <div className="flex justify-center items-center py-20">
          <RefreshCw className="w-10 h-10 animate-spin text-teal-400" />
        </div>
      }>
        <AttendanceImportContent />
      </Suspense>
    </ProtectedRoute>
  );
}
