'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  Users, Calendar, Flag, UserPlus, ChevronDown, ChevronRight,
  X, Plus, Trash2, CheckCircle2, AlertTriangle, BarChart3,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API_BASE_URL from '@/lib/apiConfig';

const api = async (path: string, token: string, opts: RequestInit = {}) => {
  const r = await fetch(`${API_BASE_URL}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
  if (!r.ok) {
    throw new Error(`API Error: ${r.status}`);
  }
  return r.json();
};

function Modal({ open, onClose, title, subtitle, children }: any) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.93 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.93 }}
            transition={{ duration: 0.18 }}
            className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-5 border-b border-white/10 flex justify-between items-start bg-neutral-800/40 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white">{title}</h2>
                {subtitle && <p className="text-sm text-neutral-400 mt-0.5">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

const inputCls = "w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none text-sm placeholder:text-neutral-600";
const btnPrimary = "bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50";
const btnGhost = "bg-white/5 hover:bg-white/10 text-neutral-300 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-neutral-400">{label}</label>
      {children}
    </div>
  );
}

export default function HODMentoringPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [expandedMentor, setExpandedMentor] = useState<string | null>(null);
  const [assignForm, setAssignForm] = useState({
    facultyId: '',
    menteeIds: [] as string[],
    academicYear: `${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(-2)}`,
  });
  const [menteeSearch, setMenteeSearch] = useState('');

  const fetch$ = (path: string) => api(path, token!);

  // ── queries ────────────────────────────────────────────────────
  const { data: overview } = useQuery({ queryKey: ['hod-mentoring-overview'], queryFn: () => fetch$('/api/mentoring/hod/overview') });
  const { data: assignments = [] } = useQuery({ queryKey: ['hod-assignments'], queryFn: () => fetch$('/api/mentoring/hod/assignments') });
  const { data: flaggedReports = [] } = useQuery({ queryKey: ['flagged-reports'], queryFn: () => fetch$('/api/mentoring/hod/flagged-reports') });

  // For assignment modal — get all faculty and students
  const { data: allUsers = [] } = useQuery({
    queryKey: ['hod-users-for-mentor'],
    queryFn: () => fetch$('/api/hod/users').then((d: any) => d.data || []),
    enabled: showAssignModal,
  });
  const allFaculty = allUsers.filter((u: any) => u.role === 'faculty');
  const allStudents = allUsers.filter((u: any) => u.role === 'student');
  const filteredStudents = allStudents.filter((s: any) =>
    !menteeSearch || s.name.toLowerCase().includes(menteeSearch.toLowerCase()) || s.registerNumber?.includes(menteeSearch)
  );

  // ── mutations ──────────────────────────────────────────────────
  const assignMutation = useMutation({
    mutationFn: (data: any) => api('/api/mentoring/hod/assign', token!, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success('Mentees assigned successfully!');
      queryClient.invalidateQueries({ queryKey: ['hod-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['hod-mentoring-overview'] });
      setShowAssignModal(false);
      setAssignForm(f => ({ ...f, facultyId: '', menteeIds: [] }));
    },
    onError: () => toast.error('Failed to assign'),
  });

  const removeMenteeMutation = useMutation({
    mutationFn: ({ mentorRecordId, menteeId }: any) =>
      api('/api/mentoring/hod/assign', token!, { method: 'DELETE', body: JSON.stringify({ mentorRecordId, menteeId }) }),
    onSuccess: () => {
      toast.success('Mentee removed');
      queryClient.invalidateQueries({ queryKey: ['hod-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['hod-mentoring-overview'] });
    },
    onError: () => toast.error('Failed to remove mentee'),
  });

  const toggleMentee = (id: string) => {
    setAssignForm(f => ({
      ...f,
      menteeIds: f.menteeIds.includes(id) ? f.menteeIds.filter(m => m !== id) : [...f.menteeIds, id],
    }));
  };

  const STATS = [
    { label: 'Active Mentors', value: overview?.totalMentors ?? '—', icon: UserCheck, color: 'from-emerald-500/20 to-teal-500/10', iconColor: 'text-emerald-400', borderColor: 'border-emerald-500/20' },
    { label: 'Total Mentees', value: overview?.totalMentees ?? '—', icon: Users, color: 'from-blue-500/20 to-indigo-500/10', iconColor: 'text-blue-400', borderColor: 'border-blue-500/20' },
    { label: 'Meetings This Month', value: overview?.meetingsThisMonth ?? '—', icon: Calendar, color: 'from-purple-500/20 to-violet-500/10', iconColor: 'text-purple-400', borderColor: 'border-purple-500/20' },
    { label: 'Flagged Reports', value: overview?.flaggedReports ?? '—', icon: Flag, color: 'from-red-500/20 to-rose-500/10', iconColor: 'text-red-400', borderColor: 'border-red-500/20' },
    { label: 'Pending Tasks', value: overview?.pendingTasks ?? '—', icon: AlertTriangle, color: 'from-amber-500/20 to-yellow-500/10', iconColor: 'text-amber-400', borderColor: 'border-amber-500/20' },
    { label: 'Completed Meetings', value: overview?.completedMeetings ?? '—', icon: CheckCircle2, color: 'from-emerald-500/10 to-emerald-500/5', iconColor: 'text-emerald-400', borderColor: 'border-white/10' },
  ];

  return (
    <ProtectedRoute allowedRoles={['hod']}>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-200">
              Mentoring Overview
            </h1>
            <p className="text-neutral-400 text-sm mt-0.5">Manage mentor assignments and track department-wide mentoring</p>
          </div>
          <button onClick={() => setShowAssignModal(true)} className={btnPrimary}>
            <UserPlus className="w-4 h-4" /> Assign Mentor
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {STATS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className={`bg-gradient-to-br ${s.color} border ${s.borderColor} rounded-2xl p-4 backdrop-blur-sm flex flex-col gap-2`}>
                <Icon className={`w-5 h-5 ${s.iconColor}`} />
                <p className={`text-2xl font-bold ${s.iconColor}`}>{s.value}</p>
                <p className="text-xs text-neutral-500 leading-tight">{s.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mentor Assignments Table */}
          <div className="lg:col-span-2 bg-neutral-900/50 border border-white/10 rounded-2xl p-5 backdrop-blur-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <h2 className="font-bold text-white">Mentor Assignments</h2>
              <span className="text-xs text-neutral-600 ml-auto">{assignments.length} mentor{assignments.length !== 1 ? 's' : ''}</span>
            </div>

            {assignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
                <Users className="w-10 h-10 mb-3 opacity-40" />
                <p className="font-medium">No mentor assignments yet</p>
                <button onClick={() => setShowAssignModal(true)} className={`${btnPrimary} mt-4`}>
                  <Plus className="w-4 h-4" /> Assign First Mentor
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {assignments.map((a: any) => (
                  <div key={a._id} className="bg-neutral-950 border border-white/5 rounded-xl overflow-hidden">
                    <button
                      className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left"
                      onClick={() => setExpandedMentor(expandedMentor === a._id ? null : a._id)}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {a.facultyId?.name?.charAt(0) || 'F'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm">{a.facultyId?.name}</p>
                        <div className="flex gap-3 text-xs text-neutral-500 mt-0.5">
                          <span>{a.facultyId?.employeeId}</span>
                          <span>{a.mentees?.length || 0} mentee{a.mentees?.length !== 1 ? 's' : ''}</span>
                          <span className="text-emerald-500/80">{a.academicYear}</span>
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${expandedMentor === a._id ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {expandedMentor === a._id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-white/5 p-4 flex flex-col gap-2">
                            <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-2">Mentees</p>
                            {!a.mentees || a.mentees.length === 0 ? (
                              <p className="text-sm text-neutral-600">No mentees assigned</p>
                            ) : (
                              a.mentees.map((mentee: any) => (
                                <div key={mentee._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group">
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                    {mentee.name?.charAt(0)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-neutral-200">{mentee.name}</p>
                                    <p className="text-xs text-neutral-600 font-mono">{mentee.registerNumber}</p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Remove ${mentee.name} from ${a.facultyId?.name}'s mentees?`)) {
                                        removeMenteeMutation.mutate({ mentorRecordId: a._id, menteeId: mentee._id });
                                      }
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-500 hover:text-red-400 transition-all"
                                    title="Remove mentee"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Flagged Reports */}
          <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-5 backdrop-blur-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <Flag className="w-5 h-5 text-red-400" />
              <h2 className="font-bold text-white">Flagged Students</h2>
              {flaggedReports.length > 0 && (
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                  {flaggedReports.length}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {flaggedReports.length === 0 ? (
                <div className="text-center py-12 text-neutral-600">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-40 text-emerald-400" />
                  <p className="font-medium text-emerald-400/60">No flagged students</p>
                  <p className="text-sm mt-1">All students are in good standing</p>
                </div>
              ) : (
                flaggedReports.map((r: any) => (
                  <div key={r._id} className="bg-red-950/20 border border-red-500/20 rounded-xl p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-red-300">{r.menteeId?.name}</p>
                        <p className="text-xs text-neutral-500 font-mono">{r.menteeId?.registerNumber}</p>
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-neutral-400 mb-1">{r.title}</p>
                    <p className="text-xs text-neutral-500 line-clamp-2">{r.content}</p>
                    <div className="flex justify-between items-center mt-3 text-xs text-neutral-600">
                      <span>By: {r.mentorId?.name}</span>
                      <span>{new Date(r.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ══ Assign Mentor Modal ══ */}
        <Modal open={showAssignModal} onClose={() => { setShowAssignModal(false); setAssignForm(f => ({ ...f, facultyId: '', menteeIds: [] })); }} title="Assign Mentor to Students">
          <div className="flex flex-col gap-4">
            <Field label="Academic Year">
              <input
                type="text"
                value={assignForm.academicYear}
                onChange={e => setAssignForm(f => ({ ...f, academicYear: e.target.value }))}
                placeholder="e.g. 2025-26"
                className={inputCls}
              />
            </Field>

            <Field label="Select Faculty (Mentor)">
              <select
                value={assignForm.facultyId}
                onChange={e => setAssignForm(f => ({ ...f, facultyId: e.target.value }))}
                className={inputCls}
              >
                <option value="">-- Choose faculty --</option>
                {allFaculty.map((f: any) => (
                  <option key={f._id} value={f._id}>{f.name} ({f.employeeId || f.email})</option>
                ))}
              </select>
            </Field>

            <Field label={`Select Students (${assignForm.menteeIds.length} selected)`}>
              <input
                type="text"
                placeholder="Search by name or register number..."
                value={menteeSearch}
                onChange={e => setMenteeSearch(e.target.value)}
                className={`${inputCls} mb-2`}
              />
              <div className="max-h-52 overflow-y-auto flex flex-col gap-1 rounded-xl bg-neutral-950 border border-white/10 p-2">
                {filteredStudents.length === 0 ? (
                  <p className="text-sm text-neutral-600 text-center py-4">No students found</p>
                ) : (
                  filteredStudents.map((s: any) => {
                    const selected = assignForm.menteeIds.includes(s._id);
                    return (
                      <button
                        key={s._id}
                        onClick={() => toggleMentee(s._id)}
                        className={`flex items-center gap-3 p-2.5 rounded-lg transition-all text-left ${
                          selected ? 'bg-emerald-600/20 border border-emerald-500/30' : 'hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border ${selected ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 bg-transparent'}`}>
                          {selected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${selected ? 'text-emerald-400' : 'text-neutral-200'}`}>{s.name}</p>
                          <p className="text-xs text-neutral-600 font-mono">{s.registerNumber}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </Field>

            {assignForm.menteeIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {assignForm.menteeIds.map(id => {
                  const s = allStudents.find((u: any) => u._id === id);
                  return s ? (
                    <span key={id} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {s.name}
                      <button onClick={() => toggleMentee(id)} className="hover:text-red-400 transition-colors"><X className="w-3 h-3" /></button>
                    </span>
                  ) : null;
                })}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button onClick={() => { setShowAssignModal(false); setAssignForm(f => ({ ...f, facultyId: '', menteeIds: [] })); }} className={btnGhost}>Cancel</button>
              <button
                className={`${btnPrimary} flex-1 justify-center`}
                disabled={!assignForm.facultyId || assignForm.menteeIds.length === 0 || assignMutation.isPending}
                onClick={() => assignMutation.mutate(assignForm)}
              >
                <UserPlus className="w-4 h-4" /> Assign {assignForm.menteeIds.length > 0 ? `(${assignForm.menteeIds.length})` : ''}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </ProtectedRoute>
  );
}
