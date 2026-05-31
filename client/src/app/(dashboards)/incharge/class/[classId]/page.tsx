'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { 
  Users, ArrowLeft, Search, RefreshCw, Landmark, 
  Calendar, Shield, Mail, Award, BookOpen, Plus,
  Edit, Trash2, X, FileSpreadsheet, Upload, Download,
  CheckCircle, AlertTriangle, ChevronRight, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InchargeClassDetail({ params }: { params: Promise<{ classId: string }> }) {
  const { token } = useAuth();
  const { classId } = use(params);

  const [classRoom, setClassRoom] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Single Student Create/Edit Forms
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    registerNumber: '',
    rollNumber: '',
    batchYear: '',
    password: '',
  });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    registerNumber: '',
    rollNumber: '',
    batchYear: '',
    academicStatus: 'Regular'
  });

  // CSV Import States
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<any>(null);

  const fetchClassAndRoster = async () => {
    setLoading(true);
    try {
      // 1. Fetch Incharge Classes to find current one
      const classesRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/incharge/classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const classesData = await classesRes.json();
      if (classesRes.ok && classesData.success) {
        const current = classesData.data.find((c: any) => c._id === classId);
        setClassRoom(current);
        if (current) {
          setStudentForm(prev => ({ ...prev, batchYear: current.academicYear }));
        }
      }

      // 2. Fetch student roster
      const studentsRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/incharge/classes/${classId}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const studentsData = await studentsRes.json();
      if (studentsRes.ok && studentsData.success) {
        setStudents(studentsData.data);
      } else {
        toast.error(studentsData.message || 'Failed to load students');
      }
    } catch (err) {
      toast.error('Error connecting to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchClassAndRoster();
    }
  }, [token, classId]);

  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/incharge/classes/${classId}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...studentForm,
          department: classRoom?.department
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Student added successfully');
        setShowAddModal(false);
        setStudentForm({
          name: '',
          email: '',
          registerNumber: '',
          rollNumber: '',
          batchYear: classRoom?.academicYear || '',
          password: '',
        });
        fetchClassAndRoster();
      } else {
        toast.error(data.message || 'Failed to add student');
      }
    } catch (err) {
      toast.error('Server error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/incharge/students/${selectedStudent._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Student profile updated');
        setShowEditModal(false);
        fetchClassAndRoster();
      } else {
        toast.error(data.message || 'Failed to edit student');
      }
    } catch (err) {
      toast.error('Server error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you absolutely sure you want to delete this student profile and user account? This cannot be undone.')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/incharge/students/${studentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Student removed successfully');
        fetchClassAndRoster();
      } else {
        toast.error(data.message || 'Failed to delete student');
      }
    } catch (err) {
      toast.error('Error connecting to backend');
    }
  };

  // Pure HTML5 Client-side CSV Reader
  const handleCSVImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvText = event.target?.result as string;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/incharge/classes/${classId}/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ csvText })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          toast.success(data.message || 'CSV Import processing complete');
          setImportResult(data.data);
          fetchClassAndRoster();
        } else {
          toast.error(data.message || 'Failed to process CSV');
        }
      } catch (err) {
        toast.error('Server error during CSV uploading');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(csvFile);
  };

  const downloadSampleCSV = () => {
    const headers = 'name,email,registerNumber,rollNumber,password,batchYear\n';
    const row = 'Senthil Kumar,senthil@college.edu,CS2026101,CS-R-01,senthil123,2025-2026\n';
    const blob = new Blob([headers + row], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'sample_students_import.csv');
    a.click();
  };

  const filteredStudents = students.filter(st => 
    st.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    st.registerNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (st.rollNumber && st.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <ProtectedRoute allowedRoles={['class_incharge']}>
      <div className="flex flex-col gap-6">
        {/* Navigation & Header */}
        <div className="flex flex-col gap-3">
          <Link 
            href="/incharge-dashboard"
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-teal-400 font-semibold uppercase tracking-wider transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Users className="w-7 h-7 text-teal-400" />
                {classRoom ? `${classRoom.className} Roster Manager` : 'Student Roster Manager'}
              </h1>
              <p className="text-neutral-400 text-sm mt-0.5">
                {classRoom ? `Semester ${classRoom.semester} • Year ${classRoom.year} • Section ${classRoom.section} • Academic: ${classRoom.academicYear}` : 'Loading...'}
              </p>
            </div>

            <div className="flex gap-2 self-start sm:self-auto">
              <button 
                onClick={() => setShowImportModal(true)}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-white/10 px-4 py-2.5 rounded-xl flex items-center font-medium transition-all text-sm"
              >
                <FileSpreadsheet className="w-4.5 h-4.5 mr-2 text-teal-400" />
                Import CSV
              </button>
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2.5 rounded-xl flex items-center font-medium transition-all shadow-lg text-sm"
              >
                <Plus className="w-4.5 h-4.5 mr-1" />
                Add Student
              </button>
            </div>
          </div>
        </div>

        {/* Search & Roster Controls */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-neutral-900/40 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3 backdrop-blur-sm focus-within:border-teal-500/50 transition-colors">
            <Search className="w-5 h-5 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search students by name, register number, roll number..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-white placeholder-neutral-500 focus:outline-none text-sm"
            />
          </div>
          <button 
            onClick={fetchClassAndRoster}
            className="p-2.5 bg-neutral-900/40 border border-white/10 hover:bg-white/5 rounded-xl text-neutral-400 hover:text-white transition-all backdrop-blur-sm flex items-center justify-center self-end md:self-auto"
            title="Refresh Roster List"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
          </button>
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
                    {/* Student profile details */}
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
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            setSelectedStudent(student);
                            setEditForm({
                              name: student.name,
                              email: student.email,
                              registerNumber: student.registerNumber,
                              rollNumber: student.rollNumber || '',
                              batchYear: student.batchYear || '',
                              academicStatus: student.academicStatus || 'Regular'
                            });
                            setShowEditModal(true);
                          }}
                          className="p-1.5 bg-white/5 hover:bg-teal-500/10 border border-white/10 hover:border-teal-500/20 rounded-lg text-neutral-400 hover:text-teal-400 transition-colors"
                          title="Edit Student"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteStudent(student._id)}
                          className="p-1.5 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 rounded-lg text-neutral-400 hover:text-red-400 transition-colors"
                          title="Delete Student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-neutral-500">
                      <Users className="w-12 h-12 text-neutral-600 mx-auto mb-2 opacity-30 animate-pulse" />
                      No students enrolled inside this class roster.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Add Student */}
        <AnimatePresence>
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col"
              >
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-neutral-800/30">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Plus className="w-5 h-5 text-teal-400" />
                    Onboard New Student
                  </h2>
                  <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <form onSubmit={handleAddStudentSubmit} className="p-6 flex flex-col gap-4">
                  {/* Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Full Name</label>
                      <input 
                        type="text" required
                        value={studentForm.name}
                        onChange={e => setStudentForm({...studentForm, name: e.target.value})}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-teal-500 focus:outline-none text-sm placeholder-neutral-700"
                        placeholder="e.g. Senthil Kumar"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Email Address</label>
                      <input 
                        type="email" required
                        value={studentForm.email}
                        onChange={e => setStudentForm({...studentForm, email: e.target.value})}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-teal-500 focus:outline-none text-sm placeholder-neutral-700"
                        placeholder="e.g. senthil@college.edu"
                      />
                    </div>
                  </div>

                  {/* Register Number & Roll Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Register Number (Unique)</label>
                      <input 
                        type="text" required
                        value={studentForm.registerNumber}
                        onChange={e => setStudentForm({...studentForm, registerNumber: e.target.value})}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-teal-500 focus:outline-none text-sm placeholder-neutral-700"
                        placeholder="e.g. CS2026101"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Roll Number</label>
                      <input 
                        type="text"
                        value={studentForm.rollNumber}
                        onChange={e => setStudentForm({...studentForm, rollNumber: e.target.value})}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-teal-500 focus:outline-none text-sm placeholder-neutral-700"
                        placeholder="e.g. CS-R-01"
                      />
                    </div>
                  </div>

                  {/* Temp password & batch year */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Academic Batch Year</label>
                      <input 
                        type="text" required
                        value={studentForm.batchYear}
                        onChange={e => setStudentForm({...studentForm, batchYear: e.target.value})}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-teal-500 focus:outline-none text-sm placeholder-neutral-700"
                        placeholder="e.g. 2025-2026"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Temporary Password (Optional)</label>
                      <input 
                        type="password"
                        value={studentForm.password}
                        onChange={e => setStudentForm({...studentForm, password: e.target.value})}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-teal-500 focus:outline-none text-sm placeholder-neutral-700"
                        placeholder="Defaults to Register Number"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setShowAddModal(false)} 
                      className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium transition-colors text-sm flex items-center gap-1.5"
                    >
                      Onboard Student
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal: Edit Student */}
        <AnimatePresence>
          {showEditModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col"
              >
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-neutral-800/30">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Edit className="w-5 h-5 text-teal-400" />
                    Modify Student Profile
                  </h2>
                  <button onClick={() => setShowEditModal(false)} className="text-neutral-400 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <form onSubmit={handleEditStudentSubmit} className="p-6 flex flex-col gap-4">
                  {/* Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Full Name</label>
                      <input 
                        type="text" required
                        value={editForm.name}
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-teal-500 focus:outline-none text-sm placeholder-neutral-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Email Address</label>
                      <input 
                        type="email" required
                        value={editForm.email}
                        onChange={e => setEditForm({...editForm, email: e.target.value})}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-teal-500 focus:outline-none text-sm placeholder-neutral-700"
                      />
                    </div>
                  </div>

                  {/* Register Number & Roll Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Register Number</label>
                      <input 
                        type="text" required
                        value={editForm.registerNumber}
                        onChange={e => setEditForm({...editForm, registerNumber: e.target.value})}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-teal-500 focus:outline-none text-sm placeholder-neutral-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Roll Number</label>
                      <input 
                        type="text"
                        value={editForm.rollNumber}
                        onChange={e => setEditForm({...editForm, rollNumber: e.target.value})}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-teal-500 focus:outline-none text-sm placeholder-neutral-700"
                      />
                    </div>
                  </div>

                  {/* Batch Year & Academic Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Batch Year</label>
                      <input 
                        type="text" required
                        value={editForm.batchYear}
                        onChange={e => setEditForm({...editForm, batchYear: e.target.value})}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-teal-500 focus:outline-none text-sm placeholder-neutral-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Academic Status</label>
                      <select 
                        value={editForm.academicStatus}
                        onChange={e => setEditForm({...editForm, academicStatus: e.target.value})}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-teal-500 focus:outline-none text-sm cursor-pointer"
                      >
                        <option value="Regular">Regular</option>
                        <option value="Completed">Completed</option>
                        <option value="Discontinued">Discontinued</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setShowEditModal(false)} 
                      className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium transition-colors text-sm flex items-center gap-1.5"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal: Bulk CSV Import */}
        <AnimatePresence>
          {showImportModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col my-8"
              >
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-neutral-800/30">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-teal-400" />
                    Bulk Student Onboarding
                  </h2>
                  <button 
                    onClick={() => {
                      setShowImportModal(false);
                      setCsvFile(null);
                      setImportResult(null);
                    }} 
                    className="text-neutral-400 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <form onSubmit={handleCSVImportSubmit} className="p-6 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">
                  <div className="bg-neutral-950/40 border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Download Starter Template</h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Use the official headers mapping to ensure error-free record parsing.</p>
                    </div>
                    <button 
                      type="button"
                      onClick={downloadSampleCSV}
                      className="bg-teal-600/10 hover:bg-teal-600/20 border border-teal-500/20 text-teal-400 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors self-end sm:self-auto"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Get Sample CSV
                    </button>
                  </div>

                  {!importResult ? (
                    <div className="flex flex-col gap-4">
                      <div className="border-2 border-dashed border-white/15 hover:border-teal-500/50 rounded-2xl p-8 flex flex-col items-center justify-center bg-neutral-950/20 cursor-pointer transition-colors relative group">
                        <input 
                          type="file" 
                          accept=".csv"
                          required
                          onChange={e => setCsvFile(e.target.files?.[0] || null)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <Upload className="w-10 h-10 text-neutral-500 group-hover:text-teal-400 transition-colors mb-3" />
                        <p className="text-sm font-semibold text-white">
                          {csvFile ? csvFile.name : 'Select or Drop student CSV file'}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">Accepts only standard comma-separated .csv extensions</p>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button 
                          type="button" 
                          onClick={() => {
                            setShowImportModal(false);
                            setCsvFile(null);
                          }} 
                          className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          disabled={loading || !csvFile}
                          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium transition-colors text-sm flex items-center gap-1.5 disabled:opacity-50"
                        >
                          Upload & Process File
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {/* Success & Skip Statistics */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-3">
                          <CheckCircle className="w-7 h-7 text-emerald-400 flex-shrink-0" />
                          <div>
                            <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block">Imported Successfully</span>
                            <span className="text-2xl font-bold text-white leading-none mt-1 block">{importResult.successCount}</span>
                          </div>
                        </div>
                        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center gap-3">
                          <AlertTriangle className="w-7 h-7 text-amber-400 flex-shrink-0" />
                          <div>
                            <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider block">Skipped / Duplicates</span>
                            <span className="text-2xl font-bold text-white leading-none mt-1 block">{importResult.failedCount}</span>
                          </div>
                        </div>
                      </div>

                      {/* Skipped Details Log */}
                      {importResult.failedRows && importResult.failedRows.length > 0 && (
                        <div>
                          <label className="block text-xs font-semibold text-neutral-400 uppercase mb-2">Skipped / Error Log Summary</label>
                          <div className="bg-neutral-950 border border-white/5 rounded-xl overflow-hidden max-h-[200px] overflow-y-auto divide-y divide-white/5">
                            {importResult.failedRows.map((f: any, idx: number) => (
                              <div key={idx} className="p-3 text-[11px] flex justify-between gap-4">
                                <span className="text-neutral-400 font-mono">Row {f.row}</span>
                                <span className="text-amber-400 font-medium truncate max-w-[250px]">{f.data}</span>
                                <span className="text-red-400 font-semibold text-right flex-shrink-0">{f.reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex justify-end border-t border-white/10 pt-4">
                        <button 
                          type="button" 
                          onClick={() => {
                            setShowImportModal(false);
                            setCsvFile(null);
                            setImportResult(null);
                          }} 
                          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold transition-colors text-sm"
                        >
                          Done & Close
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}
