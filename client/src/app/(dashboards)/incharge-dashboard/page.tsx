'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { 
  Users, RefreshCw, Landmark, Calendar, Shield, 
  ArrowRight, BookOpen, Clock, CheckSquare, Plus, AlertCircle, FileSpreadsheet
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function InchargeDashboard() {
  const { token, user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAssignedClasses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/incharge/classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data_raw = await res.json();
        const data = Array.isArray(data_raw) ? data_raw : (data_raw.data || data_raw);
      if (res.ok && data.success) {
        setClasses(data.data);
      } else {
        toast.error(data.message || 'Failed to load assigned classrooms');
      }
    } catch (err) {
      toast.error('Error connecting to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAssignedClasses();
    }
  }, [token]);

  const totalClassStrength = classes.reduce((acc, c) => acc + (c.studentsCount || 0), 0);

  return (
    <ProtectedRoute allowedRoles={['class_incharge']}>
      <div className="flex flex-col gap-6">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-200">
              Class Incharge Control Panel
            </h1>
            <p className="text-neutral-400 text-sm mt-0.5">Welcome back, {user?.name}. Manage your assigned student lists, marks, and attendance metrics.</p>
          </div>
          
          <button 
            onClick={fetchAssignedClasses}
            className="p-2.5 bg-neutral-900/40 border border-white/10 hover:bg-white/5 rounded-xl text-neutral-400 hover:text-white transition-all backdrop-blur-sm flex items-center justify-center self-start sm:self-auto"
            title="Refresh Dashboard"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
          </button>
        </div>

        {/* Global Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: 'Assigned Classes', value: classes.length, icon: <Landmark className="w-6 h-6 text-teal-400" />, desc: 'Active cohorts' },
            { label: 'Total Supervised Students', value: totalClassStrength, icon: <Users className="w-6 h-6 text-emerald-400" />, desc: 'Roster enrollment' },
            { label: 'Duties & Portals', value: 'Active', icon: <Shield className="w-6 h-6 text-amber-400" />, desc: 'Incharge access' }
          ].map((stat, i) => (
            <div key={i} className="backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center justify-between shadow-lg">
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

        {/* Assigned Classes Grid Section */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-400" />
            Your Assigned Classroom Cohorts
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((c) => (
              <motion.div 
                layout
                key={c._id}
                className="backdrop-blur-md bg-gradient-to-br from-teal-950/20 to-neutral-900/50 border border-white/10 hover:border-teal-500/40 p-6 rounded-2xl flex flex-col justify-between hover:shadow-xl transition-all shadow-lg group"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-teal-400 transition-colors">{c.className}</h3>
                      <span className="text-xs text-neutral-400 flex items-center gap-1.5 mt-1 font-semibold uppercase">
                        <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                        Academic: {c.academicYear}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full border bg-teal-500/10 text-teal-400 border-teal-500/20">
                      Sem {c.semester}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-neutral-950/40 border border-white/5 rounded-xl p-3 mb-4">
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase font-semibold">Year Group</span>
                      <p className="text-xs font-bold text-white mt-0.5">Year {c.year}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase font-semibold">Department</span>
                      <p className="text-xs font-bold text-white mt-0.5">{c.department}</p>
                    </div>
                  </div>

                  {/* Student count slider */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-[10px] text-neutral-500 uppercase font-semibold">Supervised Roster</span>
                      <span className="font-bold text-white">{c.studentsCount || 0} students</span>
                    </div>
                    <div className="w-full bg-neutral-950 rounded-full h-1.5 border border-white/5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-teal-500 to-emerald-400 h-1.5 rounded-full" 
                        style={{ width: `${Math.min(100, ((c.studentsCount || 0) / 60) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Quick actions panel */}
                <div className="border-t border-white/5 pt-4 flex flex-col gap-2">
                  <Link 
                    href={`/incharge/class/${c._id}`}
                    className="w-full bg-teal-600 hover:bg-teal-500 text-white py-2 rounded-xl text-xs font-semibold transition-all text-center flex items-center justify-center gap-1.5 shadow-md shadow-teal-950/20"
                  >
                    <Users className="w-4 h-4" />
                    Manage Student Roster & CSV
                  </Link>

                  <div className="grid grid-cols-2 gap-2">
                    <Link 
                      href={`/incharge/attendance?classId=${c._id}`}
                      className="bg-white/5 hover:bg-teal-500/10 border border-white/10 hover:border-teal-500/20 text-neutral-300 hover:text-teal-400 py-1.5 rounded-xl text-[10px] font-bold text-center tracking-wider uppercase transition-all flex items-center justify-center gap-1"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      Attendance
                    </Link>
                    <Link 
                      href={`/incharge/internal-marks?classId=${c._id}`}
                      className="bg-white/5 hover:bg-teal-500/10 border border-white/10 hover:border-teal-500/20 text-neutral-300 hover:text-teal-400 py-1.5 rounded-xl text-[10px] font-bold text-center tracking-wider uppercase transition-all flex items-center justify-center gap-1"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Marksheet
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
            {classes.length === 0 && !loading && (
              <div className="col-span-full py-16 text-center text-neutral-500 bg-neutral-900/10 border border-white/5 rounded-2xl backdrop-blur-sm">
                <AlertCircle className="w-12 h-12 text-neutral-600 mx-auto mb-2 opacity-30" />
                No classrooms have been assigned to your profile by the HOD yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
