'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { 
  Plus, X, Search, RefreshCw, Users, Shield, 
  ArrowRight, GraduationCap, UserCheck, Trash2, 
  Settings, Landmark, BookOpen, ToggleLeft, ToggleRight,
  TrendingUp, Award, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HODClassesDashboard() {
  const { token } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [incharges, setIncharges] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);

  // Classroom Form
  const [formData, setFormData] = useState({
    className: '',
    department: 'CSE',
    year: 1,
    section: 'A',
    academicYear: '2025-2026',
    semester: 1
  });

  // Assign Incharge Form
  const [selectedInchargeId, setSelectedInchargeId] = useState('');

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/hod/classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setClasses(data.data);
      } else {
        toast.error(data.message || 'Failed to load classrooms');
      }
    } catch (err) {
      toast.error('Error connecting to backend server');
    } finally {
      setLoading(false);
    }
  };

  const fetchIncharges = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/hod/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Filter users to role 'class_incharge'
        const inchargeUsers = data.data.filter((u: any) => u.role === 'class_incharge' && u.isActive);
        setIncharges(inchargeUsers);
      }
    } catch (err) {
      console.error('Failed to load incharges', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchClasses();
      fetchIncharges();
    }
  }, [token]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/hod/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        toast.success(resData.message || 'Classroom created successfully');
        setShowAddModal(false);
        setFormData({
          className: '',
          department: 'CSE',
          year: 1,
          section: 'A',
          academicYear: '2025-2026',
          semester: 1
        });
        fetchClasses();
      } else {
        toast.error(resData.message || 'Failed to create classroom');
      }
    } catch (err) {
      toast.error('Server error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (classRoom: any) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/hod/classes/${classRoom._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !classRoom.isActive })
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        toast.success(resData.message || 'Class status updated');
        fetchClasses();
      } else {
        toast.error(resData.message || 'Failed to toggle status');
      }
    } catch (err) {
      toast.error('Error connecting to backend');
    }
  };

  const handleAssignIncharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !selectedInchargeId) return;
    setLoading(true);

    const isTransfer = !!selectedClass.inchargeId;
    const url = isTransfer 
      ? `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/hod/classes/${selectedClass._id}/transfer-incharge`
      : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/hod/classes/${selectedClass._id}/incharge`;

    const body = isTransfer 
      ? { oldInchargeId: selectedClass.inchargeId._id || selectedClass.inchargeId, newInchargeId: selectedInchargeId }
      : { inchargeId: selectedInchargeId };

    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Class Incharge assigned successfully');
        setShowAssignModal(false);
        setSelectedInchargeId('');
        fetchClasses();
      } else {
        toast.error(data.message || 'Failed to assign Incharge');
      }
    } catch (err) {
      toast.error('Error occurred during assignment');
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteClass = async (classRoom: any) => {
    const term = classRoom.semester >= 8 ? 'GRADUATE (Archive Class)' : `promote to Semester ${classRoom.semester + 1}`;
    if (!confirm(`Are you sure you want to ${term} for ${classRoom.className}? This updates all linked student records.`)) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/hod/classes/promote-class/${classRoom._id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Class promoted successfully');
        fetchClasses();
      } else {
        toast.error(data.message || 'Promotion failed');
      }
    } catch (err) {
      toast.error('Error promoting classroom');
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Are you absolutely sure you want to delete this class? This will unlink all students and is irreversible.')) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/hod/classes/${classId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Classroom deleted');
        fetchClasses();
      } else {
        toast.error(data.message || 'Failed to delete classroom');
      }
    } catch (err) {
      toast.error('Server connection error');
    }
  };

  const filteredClasses = classes.filter(c => {
    const matchesSearch = c.className.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.academicYear.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesYear = yearFilter === '' ? true : c.year === parseInt(yearFilter);
    return matchesSearch && matchesYear;
  });

  const totalStudents = classes.reduce((acc, c) => acc + (c.studentsCount || 0), 0);
  const totalClasses = classes.length;
  const assignedIncharges = classes.filter(c => c.inchargeId).length;

  return (
    <ProtectedRoute allowedRoles={['hod']}>
      <div className="flex flex-col gap-6">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Landmark className="w-7 h-7 text-teal-400" />
              Classrooms Control Center
            </h1>
            <p className="text-neutral-400 text-sm mt-0.5">Manage departmental semesters, classrooms, incharge assignments, and promotions.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2.5 rounded-xl flex items-center justify-center font-medium transition-all shadow-lg hover:shadow-teal-950/20"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Classroom
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: 'Total Classes', value: totalClasses, icon: <BookOpen className="w-6 h-6 text-teal-400" />, bg: 'from-teal-500/10 to-teal-500/2' },
            { label: 'Enrolled Students', value: totalStudents, icon: <Users className="w-6 h-6 text-emerald-400" />, bg: 'from-emerald-500/10 to-emerald-500/2' },
            { label: 'Assigned Incharges', value: `${assignedIncharges} / ${totalClasses}`, icon: <Shield className="w-6 h-6 text-amber-400" />, bg: 'from-amber-500/10 to-amber-500/2' }
          ].map((stat, i) => (
            <div key={i} className={`backdrop-blur-md bg-gradient-to-br ${stat.bg} border border-white/10 p-6 rounded-2xl flex items-center justify-between`}>
              <div>
                <span className="text-xs text-neutral-400 font-semibold uppercase">{stat.label}</span>
                <h3 className="text-2xl font-bold text-white mt-1">{stat.value}</h3>
              </div>
              <div className="p-3 bg-neutral-900/40 border border-white/5 rounded-xl">
                {stat.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-neutral-900/40 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3 backdrop-blur-sm focus-within:border-teal-500/50 transition-colors">
            <Search className="w-5 h-5 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search by class name, department, academic year..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-white placeholder-neutral-500 focus:outline-none text-sm"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              className="bg-neutral-900/40 border border-white/10 rounded-xl px-4 py-2.5 text-neutral-300 text-sm focus:outline-none focus:border-teal-500/50 backdrop-blur-sm cursor-pointer"
            >
              <option value="">All Years</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>
            <button 
              onClick={fetchClasses}
              className="p-2.5 bg-neutral-900/40 border border-white/10 hover:bg-white/5 rounded-xl text-neutral-400 hover:text-white transition-all backdrop-blur-sm flex items-center justify-center"
              title="Refresh Classes"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Class Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((item) => (
            <motion.div 
              layout
              key={item._id} 
              className={`backdrop-blur-md bg-white/5 border ${item.isActive ? 'border-white/10' : 'border-red-500/20 opacity-75'} p-6 rounded-2xl flex flex-col justify-between hover:border-teal-500/40 transition-all shadow-lg group`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white group-hover:text-teal-400 transition-colors">{item.className}</h2>
                    <span className="text-xs text-neutral-400 flex items-center gap-1.5 mt-1 font-semibold uppercase">
                      <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                      Academic: {item.academicYear}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border tracking-wide ${
                    item.isActive 
                      ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' 
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {item.isActive ? 'ACTIVE' : 'ARCHIVED'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-neutral-950/40 border border-white/5 rounded-xl p-3 mb-4">
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase font-semibold">Semester</span>
                    <p className="text-sm font-bold text-white mt-0.5">Sem {item.semester}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase font-semibold">Department</span>
                    <p className="text-sm font-bold text-white mt-0.5">{item.department}</p>
                  </div>
                </div>

                {/* Class Incharge Roster Detail */}
                <div className="border-t border-white/5 pt-4 mb-4 flex flex-col gap-3">
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase font-semibold">Class Incharge</span>
                    {item.inchargeId ? (
                      <div className="flex items-center gap-2.5 mt-1.5">
                        <div className="w-8 h-8 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs">
                          {item.inchargeId.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">{item.inchargeId.name}</p>
                          <p className="text-[10px] text-neutral-500 truncate max-w-[150px]">{item.inchargeId.email}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-amber-500 font-medium">
                        <Shield className="w-3.5 h-3.5" />
                        No Incharge Assigned
                      </div>
                    )}
                  </div>

                  {/* Student Strength Progress */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-[10px] text-neutral-500 uppercase font-semibold">Student Strength</span>
                      <span className="font-bold text-white">{item.studentsCount || 0} enrolled</span>
                    </div>
                    <div className="w-full bg-neutral-950 rounded-full h-1.5 border border-white/5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-teal-500 to-emerald-400 h-1.5 rounded-full" 
                        style={{ width: `${Math.min(100, ((item.studentsCount || 0) / 60) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Panel */}
              <div className="border-t border-white/5 pt-4 flex flex-col gap-2">
                <div className="flex gap-2">
                  <Link 
                    href={`/hod/classes/${item._id}`}
                    className="flex-1 bg-white/5 hover:bg-teal-500/10 border border-white/10 hover:border-teal-500/20 text-white hover:text-teal-400 py-2 rounded-xl text-xs font-semibold transition-all text-center flex items-center justify-center gap-1"
                  >
                    View Details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <button 
                    onClick={() => {
                      setSelectedClass(item);
                      setSelectedInchargeId(item.inchargeId?._id || item.inchargeId || '');
                      setShowAssignModal(true);
                    }}
                    className="p-2 bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/20 text-neutral-400 hover:text-amber-400 rounded-xl transition-all"
                    title="Assign/Transfer Incharge"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
                
                {item.isActive && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handlePromoteClass(item)}
                      className="flex-1 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-1"
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      {item.semester >= 8 ? 'Graduate Class' : 'Promote Semester'}
                    </button>
                    <button 
                      onClick={() => handleToggleStatus(item)}
                      className="p-1.5 bg-neutral-900 border border-white/10 hover:bg-red-500/10 rounded-xl hover:border-red-500/20 text-neutral-400 hover:text-red-400 transition-all"
                      title="Archive Classroom"
                    >
                      <ToggleLeft className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteClass(item._id)}
                      className="p-1.5 bg-neutral-900 border border-white/10 hover:bg-red-500/10 rounded-xl hover:border-red-500/20 text-neutral-400 hover:text-red-400 transition-all"
                      title="Delete Class"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {!item.isActive && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleToggleStatus(item)}
                      className="flex-1 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 text-teal-400 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1"
                    >
                      <ToggleRight className="w-4 h-4 mr-1" />
                      Activate Class
                    </button>
                    <button 
                      onClick={() => handleDeleteClass(item._id)}
                      className="p-1.5 bg-neutral-900 border border-white/10 hover:bg-red-500/10 rounded-xl hover:border-red-500/20 text-neutral-400 hover:text-red-400 transition-all"
                      title="Delete Class"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {filteredClasses.length === 0 && (
            <div className="col-span-full py-16 text-center text-neutral-500 bg-neutral-900/10 border border-white/5 rounded-2xl backdrop-blur-sm">
              <BookOpen className="w-12 h-12 text-neutral-600 mx-auto mb-2 opacity-30 animate-pulse" />
              No classrooms created. Get started by clicking Create Classroom.
            </div>
          )}
        </div>

        {/* Modal: Create Classroom */}
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
                    Create New Classroom
                  </h2>
                  <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <form onSubmit={handleCreateClass} className="p-6 flex flex-col gap-4">
                  {/* Class Name & Department */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Class Name (Unique)</label>
                      <input 
                        type="text" required
                        value={formData.className}
                        onChange={e => setFormData({...formData, className: e.target.value})}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-teal-500 focus:outline-none text-sm placeholder-neutral-700"
                        placeholder="e.g. III CSE A"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Department</label>
                      <input 
                        type="text" required
                        value={formData.department}
                        onChange={e => setFormData({...formData, department: e.target.value})}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-teal-500 focus:outline-none text-sm placeholder-neutral-700"
                        placeholder="e.g. CSE"
                      />
                    </div>
                  </div>

                  {/* Year & Semester */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Year of Study</label>
                      <select 
                        value={formData.year}
                        onChange={e => setFormData({...formData, year: parseInt(e.target.value)})}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-teal-500 focus:outline-none text-sm cursor-pointer"
                      >
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Section</label>
                      <input 
                        type="text" required
                        value={formData.section}
                        onChange={e => setFormData({...formData, section: e.target.value.toUpperCase()})}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-teal-500 focus:outline-none text-sm placeholder-neutral-700"
                        placeholder="e.g. A"
                      />
                    </div>
                  </div>

                  {/* Academic Year & Semester Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Academic Year</label>
                      <input 
                        type="text" required
                        value={formData.academicYear}
                        onChange={e => setFormData({...formData, academicYear: e.target.value})}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-teal-500 focus:outline-none text-sm placeholder-neutral-700"
                        placeholder="e.g. 2025-2026"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Starting Semester</label>
                      <input 
                        type="number" required min={1} max={8}
                        value={formData.semester}
                        onChange={e => setFormData({...formData, semester: parseInt(e.target.value)})}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-teal-500 focus:outline-none text-sm placeholder-neutral-700"
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
                      Create Classroom
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal: Assign / Transfer Incharge */}
        <AnimatePresence>
          {showAssignModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
              >
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-neutral-800/30">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-teal-400" />
                    {selectedClass?.inchargeId ? 'Transfer Class Incharge' : 'Assign Class Incharge'}
                  </h2>
                  <button onClick={() => setShowAssignModal(false)} className="text-neutral-400 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <form onSubmit={handleAssignIncharge} className="p-6 flex flex-col gap-4">
                  <p className="text-xs text-neutral-400">
                    Manage incharge configurations for <strong className="text-white">{selectedClass?.className}</strong> ({selectedClass?.department}).
                  </p>

                  {selectedClass?.inchargeId && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-400">
                      <strong>Current Assignment:</strong> {selectedClass.inchargeId.name} ({selectedClass.inchargeId.email}). Re-assigning will transfer responsibilities and trigger real-time system alerts.
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">Select Class Incharge</label>
                    <select 
                      value={selectedInchargeId}
                      onChange={e => setSelectedInchargeId(e.target.value)}
                      required
                      className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-teal-500 focus:outline-none text-sm cursor-pointer"
                    >
                      <option value="">-- Choose Active Faculty Incharge --</option>
                      {incharges.map(inc => (
                        <option key={inc._id} value={inc._id}>
                          {inc.name} ({inc.email})
                        </option>
                      ))}
                    </select>
                    {incharges.length === 0 && (
                      <p className="text-[10px] text-red-400 mt-1">No active users with role &apos;class_incharge&apos; found. Create one in the User Directory first.</p>
                    )}
                  </div>

                  <div className="mt-4 flex justify-end gap-3 border-t border-white/10 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setShowAssignModal(false)} 
                      className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading || !selectedInchargeId}
                      className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium transition-colors text-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {selectedClass?.inchargeId ? 'Transfer Assignment' : 'Confirm Assignment'}
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
