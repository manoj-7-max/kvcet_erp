'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { 
  Users, ArrowLeft, Search, RefreshCw, Landmark, 
  Calendar, Shield, Mail, Award, BookOpen, GraduationCap,
  ArrowRightLeft, Settings, CheckCircle, Info, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HODClassDetail({ params }: { params: Promise<{ classId: string }> }) {
  const { token } = useAuth();
  const { classId } = use(params);

  const [classRoom, setClassRoom] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Transfer Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [targetClassId, setTargetClassId] = useState('');

  const fetchClassDetails = async () => {
    setLoading(true);
    try {
      // 1. Fetch all classes to find this specific classroom and populate the transfer list
      const classesRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/hod/classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const classesData = await classesRes.json();
      if (classesRes.ok && classesData.success) {
        setAllClasses(classesData.data);
        const current = classesData.data.find((c: any) => c._id === classId);
        setClassRoom(current);
      }

      // 2. Fetch student roster inside this class
      const studentsRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/incharge/classes/${classId}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const studentsData = await studentsRes.json();
      if (studentsRes.ok && studentsData.success) {
        setStudents(studentsData.data);
      } else {
        toast.error(studentsData.message || 'Failed to load student roster');
      }
    } catch (err) {
      toast.error('Error fetching details from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchClassDetails();
    }
  }, [token, classId]);

  const handleTransferStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !targetClassId) return;
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/hod/classes/student-transfer/${selectedStudent._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fromClassId: classId,
          toClassId: targetClassId
        })
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        toast.success(resData.message || 'Student transferred successfully');
        setShowTransferModal(false);
        setTargetClassId('');
        fetchClassDetails();
      } else {
        toast.error(resData.message || 'Transfer failed');
      }
    } catch (err) {
      toast.error('Error executing student transfer');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(st => 
    st.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    st.registerNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (st.rollNumber && st.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <ProtectedRoute allowedRoles={['hod']}>
      <div className="flex flex-col gap-6">
        {/* Back and Title Navigation */}
        <div className="flex flex-col gap-3">
          <Link 
            href="/hod/classes"
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-teal-400 font-semibold uppercase tracking-wider transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Classrooms
          </Link>
          
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Landmark className="w-7 h-7 text-teal-400" />
                {classRoom ? `${classRoom.className} Classroom Roster` : 'Classroom Roster Details'}
              </h1>
              <p className="text-neutral-400 text-sm mt-0.5">
                {classRoom ? `Semester ${classRoom.semester} • Department of ${classRoom.department} • Academic Year ${classRoom.academicYear}` : 'Loading details...'}
              </p>
            </div>
            
            <button 
              onClick={fetchClassDetails}
              className="p-2.5 bg-neutral-900/40 border border-white/10 hover:bg-white/5 rounded-xl text-neutral-400 hover:text-white transition-all backdrop-blur-sm flex items-center justify-center self-start sm:self-auto"
              title="Refresh Roster List"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Info Grid */}
        {classRoom && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Class Incharge Profile */}
            <div className="backdrop-blur-md bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Class Incharge Faculty</span>
                {classRoom.inchargeId ? (
                  <div className="flex items-center gap-3 mt-3">
                    <div className="w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-lg">
                      {classRoom.inchargeId.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{classRoom.inchargeId.name}</h4>
                      <p className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3.5 h-3.5 text-neutral-500" />
                        {classRoom.inchargeId.email}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-4 text-sm text-amber-400 font-semibold">
                    <Shield className="w-5 h-5 text-amber-500" />
                    Unassigned Class Incharge
                  </div>
                )}
              </div>
            </div>

            {/* Quick Statistics */}
            <div className="backdrop-blur-md bg-white/5 border border-white/10 p-5 rounded-2xl">
              <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Class Strength</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold text-white">{students.length}</span>
                <span className="text-sm text-neutral-400">students enrolled</span>
              </div>
              <div className="w-full bg-neutral-950 rounded-full h-2 border border-white/5 overflow-hidden mt-4">
                <div 
                  className="bg-gradient-to-r from-teal-500 to-emerald-400 h-2 rounded-full" 
                  style={{ width: `${Math.min(100, (students.length / 60) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Academic details */}
            <div className="backdrop-blur-md bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Year & Section Info</span>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="bg-neutral-950/40 border border-white/5 rounded-xl p-2.5">
                    <span className="text-[9px] text-neutral-500 uppercase font-semibold">Year Group</span>
                    <p className="text-xs font-bold text-white mt-0.5">{classRoom.year} Year</p>
                  </div>
                  <div className="bg-neutral-950/40 border border-white/5 rounded-xl p-2.5">
                    <span className="text-[9px] text-neutral-500 uppercase font-semibold">Section Unit</span>
                    <p className="text-xs font-bold text-white mt-0.5">Section &apos;{classRoom.section}&apos;</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-neutral-900/40 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3 backdrop-blur-sm focus-within:border-teal-500/50 transition-colors">
          <Search className="w-5 h-5 text-neutral-400" />
          <input 
            type="text" 
            placeholder="Search students by name, register number, roll number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-white placeholder-neutral-500 focus:outline-none text-sm"
          />
        </div>

        {/* Student Directory Table */}
        <div className="bg-neutral-900/30 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-neutral-800/30 text-neutral-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Student Profile</th>
                  <th className="p-4">Register Number</th>
                  <th className="p-4">Roll Number</th>
                  <th className="p-4">Batch / Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStudents.map(student => (
                  <tr key={student._id} className="hover:bg-white/5 transition-colors">
                    {/* User profile details */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-sm">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{student.name}</div>
                          <span className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3.5 h-3.5 text-neutral-500" />
                            {student.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Register Number */}
                    <td className="p-4">
                      <span className="text-sm font-mono text-neutral-300">{student.registerNumber}</span>
                    </td>

                    {/* Roll Number */}
                    <td className="p-4">
                      <span className="text-sm text-neutral-300 font-semibold">{student.rollNumber || '—'}</span>
                    </td>

                    {/* Batch & Status */}
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-neutral-300 font-semibold flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-neutral-500" />
                          Batch: {student.batchYear || 'N/A'}
                        </span>
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md border w-fit mt-1 tracking-wider uppercase ${
                          student.academicStatus === 'Regular' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' :
                          student.academicStatus === 'Completed' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                          'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {student.academicStatus}
                        </span>
                      </div>
                    </td>

                    {/* Actions Panel */}
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowTransferModal(true);
                        }}
                        className="px-3 py-1.5 bg-white/5 hover:bg-teal-500/10 border border-white/10 hover:border-teal-500/20 rounded-xl text-xs font-semibold text-neutral-300 hover:text-teal-400 transition-colors inline-flex items-center gap-1.5"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        Transfer Class
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-neutral-500">
                      <Users className="w-12 h-12 text-neutral-600 mx-auto mb-2 opacity-30 animate-pulse" />
                      No students enrolled inside this classroom roster.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Transfer Student */}
        <AnimatePresence>
          {showTransferModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
              >
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-neutral-800/30">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <ArrowRightLeft className="w-5 h-5 text-teal-400" />
                    Transfer Student Class
                  </h2>
                  <button onClick={() => setShowTransferModal(false)} className="text-neutral-400 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <form onSubmit={handleTransferStudent} className="p-6 flex flex-col gap-4">
                  <p className="text-xs text-neutral-400">
                    Re-locate student <strong className="text-white">{selectedStudent?.name}</strong> ({selectedStudent?.registerNumber}) to another classroom.
                  </p>

                  <div className="bg-neutral-950/50 border border-white/5 rounded-xl p-3 text-xs text-neutral-300">
                    <strong>Current Roster:</strong> {classRoom?.className} (Sem {classRoom?.semester})
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">Select Target Classroom</label>
                    <select 
                      value={targetClassId}
                      onChange={e => setTargetClassId(e.target.value)}
                      required
                      className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-teal-500 focus:outline-none text-sm cursor-pointer"
                    >
                      <option value="">-- Choose Target Classroom --</option>
                      {allClasses.filter(c => c._id !== classId && c.isActive).map(c => (
                        <option key={c._id} value={c._id}>
                          {c.className} (Sem {c.semester} • {c.academicYear})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4 flex justify-end gap-3 border-t border-white/10 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setShowTransferModal(false)} 
                      className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading || !targetClassId}
                      className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium transition-colors text-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                      Confirm Transfer
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}
