'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Users, Calendar, ClipboardList, FileText, StickyNote,
  ChevronRight, X, Plus, CheckCircle2, Clock, AlertTriangle,
  Trash2, Edit3, Flag, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API_BASE_URL from '@/lib/apiConfig';

// ─── helpers ────────────────────────────────────────────────────────────────
const api = (path: string, token: string, opts: RequestInit = {}) =>
  fetch(`${API_BASE_URL}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  }).then(r => r.json());

const statusColor: Record<string, string> = {
  Scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  Pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'In Progress': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const statusBar: Record<string, string> = {
  Scheduled: 'bg-blue-500',
  Completed: 'bg-emerald-500',
  Cancelled: 'bg-red-500',
  Pending: 'bg-amber-500',
  'In Progress': 'bg-blue-500',
};

const TABS = [
  { id: 'mentees', label: 'My Mentees', icon: Users },
  { id: 'meetings', label: 'Meetings', icon: Calendar },
  { id: 'tasks', label: 'Tasks', icon: ClipboardList },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'reports', label: 'Reports', icon: FileText },
];

// ─── modal wrapper ────────────────────────────────────────────────────────────
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
            className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
          >
            <div className="p-5 border-b border-white/10 flex justify-between items-start bg-neutral-800/40">
              <div>
                <h2 className="text-lg font-bold text-white">{title}</h2>
                {subtitle && <p className="text-sm text-neutral-400 mt-0.5">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── input helper ────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-neutral-400">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none text-sm placeholder:text-neutral-600";
const btnPrimary = "bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50";
const btnDanger = "bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-red-500/20";
const btnGhost = "bg-white/5 hover:bg-white/10 text-neutral-300 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors";

// ────────────────────────────────────────────────────────────────────────────
export default function FacultyMentorPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('mentees');
  const [selectedMentee, setSelectedMentee] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<any>(null);

  // ── form states ────────────────────────────────────────────────
  const [meetingForm, setMeetingForm] = useState({ title: '', scheduledDate: '', menteeId: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', deadline: '', menteeId: '' });
  const [noteForm, setNoteForm] = useState({ note: '', menteeId: '', isPrivate: true });
  const [reportForm, setReportForm] = useState({ title: '', content: '', menteeId: '', flagged: false });

  // ── queries ────────────────────────────────────────────────────
  const fetch$ = (path: string) => api(path, token!);

  const { data: mentees = [] } = useQuery({ queryKey: ['mentees'], queryFn: () => fetch$('/api/mentoring/mentees') });
  const { data: meetings = [] } = useQuery({ queryKey: ['mentor-meetings'], queryFn: () => fetch$('/api/mentoring/meetings') });
  const { data: tasks = [] } = useQuery({ queryKey: ['mentor-tasks'], queryFn: () => fetch$('/api/mentoring/tasks') });
  const { data: reports = [] } = useQuery({ queryKey: ['mentor-reports'], queryFn: () => fetch$('/api/mentoring/reports') });
  const { data: menteeProfile } = useQuery({
    queryKey: ['mentee-profile', selectedMentee?._id],
    queryFn: () => fetch$(`/api/mentoring/mentee/${selectedMentee._id}/profile`),
    enabled: !!selectedMentee && showProfileModal,
  });
  const { data: notes = [] } = useQuery({
    queryKey: ['mentor-notes', selectedMentee?._id],
    queryFn: () => fetch$(`/api/mentoring/notes/${selectedMentee._id}`),
    enabled: !!selectedMentee && activeTab === 'notes',
  });

  // ── mutations ──────────────────────────────────────────────────
  const invalidate = (keys: string[][]) => keys.forEach(k => queryClient.invalidateQueries({ queryKey: k }));

  const scheduleMutation = useMutation({
    mutationFn: (data: any) => api('/api/mentoring/meetings', token!, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { toast.success('Meeting scheduled!'); invalidate([['mentor-meetings']]); setShowMeetingModal(false); setMeetingForm({ title: '', scheduledDate: '', menteeId: '' }); },
    onError: () => toast.error('Failed to schedule meeting'),
  });

  const updateMeetingMutation = useMutation({
    mutationFn: ({ id, data }: any) => api(`/api/mentoring/meetings/${id}`, token!, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { toast.success('Meeting updated'); invalidate([['mentor-meetings']]); setEditingMeeting(null); },
    onError: () => toast.error('Failed to update meeting'),
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: (id: string) => api(`/api/mentoring/meetings/${id}`, token!, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Meeting deleted'); invalidate([['mentor-meetings']]); },
    onError: () => toast.error('Failed to delete'),
  });

  const createTaskMutation = useMutation({
    mutationFn: (data: any) => api('/api/mentoring/tasks', token!, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { toast.success('Task assigned!'); invalidate([['mentor-tasks']]); setShowTaskModal(false); setTaskForm({ title: '', description: '', deadline: '', menteeId: '' }); },
    onError: () => toast.error('Failed to create task'),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => api(`/api/mentoring/tasks/${id}`, token!, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Task deleted'); invalidate([['mentor-tasks']]); },
  });

  const addNoteMutation = useMutation({
    mutationFn: (data: any) => api('/api/mentoring/notes', token!, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { toast.success('Note saved!'); invalidate([['mentor-notes', selectedMentee?._id]]); setShowNoteModal(false); setNoteForm({ note: '', menteeId: '', isPrivate: true }); },
    onError: () => toast.error('Failed to save note'),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/mentoring/notes/delete/${id}`, token!, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Note deleted'); invalidate([['mentor-notes', selectedMentee?._id]]); },
  });

  const createReportMutation = useMutation({
    mutationFn: (data: any) => api('/api/mentoring/reports', token!, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { toast.success('Report created!'); invalidate([['mentor-reports']]); setShowReportModal(false); setReportForm({ title: '', content: '', menteeId: '', flagged: false }); },
    onError: () => toast.error('Failed to create report'),
  });

  const deleteReportMutation = useMutation({
    mutationFn: (id: string) => api(`/api/mentoring/reports/${id}`, token!, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Report deleted'); invalidate([['mentor-reports']]); },
  });

  const currentMenteeNotes = selectedMentee ? notes : [];

  // ── render ─────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-200">
            Mentor Dashboard
          </h1>
          <p className="text-neutral-400 text-sm mt-0.5">
            {mentees.length} mentee{mentees.length !== 1 ? 's' : ''} assigned to you
          </p>
        </div>
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          {activeTab === 'meetings' && (
            <button onClick={() => setShowMeetingModal(true)} className={btnPrimary}>
              <Plus className="w-4 h-4" /> Schedule Meeting
            </button>
          )}
          {activeTab === 'tasks' && (
            <button onClick={() => setShowTaskModal(true)} className={btnPrimary}>
              <Plus className="w-4 h-4" /> Assign Task
            </button>
          )}
          {activeTab === 'notes' && selectedMentee && (
            <button onClick={() => { setNoteForm(f => ({ ...f, menteeId: selectedMentee._id })); setShowNoteModal(true); }} className={btnPrimary}>
              <Plus className="w-4 h-4" /> Add Note
            </button>
          )}
          {activeTab === 'reports' && (
            <button onClick={() => setShowReportModal(true)} className={btnPrimary}>
              <Plus className="w-4 h-4" /> Write Report
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-900/60 border border-white/10 rounded-2xl p-1.5 backdrop-blur-sm overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center ${
                isActive
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB: MY MENTEES ─────────────────────────────────────────── */}
      {activeTab === 'mentees' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mentees.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-neutral-500">
              <Users className="w-12 h-12 mb-3 opacity-40" />
              <p className="font-medium">No mentees assigned yet</p>
              <p className="text-sm mt-1">Contact HOD to get mentees assigned.</p>
            </div>
          ) : (
            mentees.map((m: any) => (
              <motion.div
                key={m._id}
                whileHover={{ y: -2 }}
                className="bg-neutral-900/50 border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:border-emerald-500/30 transition-all cursor-pointer group"
                onClick={() => { setSelectedMentee(m); setShowProfileModal(true); }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {m.name?.charAt(0)}
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-emerald-400 transition-colors" />
                </div>
                <h3 className="text-white font-semibold">{m.name}</h3>
                <p className="text-emerald-400 text-xs font-mono mt-0.5">{m.registerNumber}</p>
                <p className="text-neutral-500 text-xs mt-1">{m.email}</p>
                <div className="mt-4 pt-4 border-t border-white/5 flex gap-2 flex-wrap">
                  <span className="text-xs px-2 py-1 rounded-md bg-white/5 text-neutral-400">{m.department || 'CSE'}</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* ── TAB: MEETINGS ─────────────────────────────────────────────── */}
      {activeTab === 'meetings' && (
        <div className="flex flex-col gap-4">
          {meetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-500 bg-neutral-900/40 border border-white/10 rounded-2xl">
              <Calendar className="w-12 h-12 mb-3 opacity-40" />
              <p className="font-medium">No meetings scheduled</p>
              <button onClick={() => setShowMeetingModal(true)} className={`${btnPrimary} mt-4`}>
                <Plus className="w-4 h-4" /> Schedule First Meeting
              </button>
            </div>
          ) : (
            meetings.map((m: any) => (
              <div key={m._id} className="bg-neutral-900/50 border border-white/10 rounded-2xl p-5 backdrop-blur-sm flex flex-col sm:flex-row gap-4 hover:border-white/20 transition-all relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${statusBar[m.status] || 'bg-neutral-600'}`} />
                <div className="flex-1 pl-3">
                  <div className="flex flex-wrap items-start gap-2 mb-2">
                    <h3 className="text-white font-semibold">{m.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor[m.status]}`}>{m.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />{m.menteeId?.name} ({m.menteeId?.registerNumber})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />{new Date(m.scheduledDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                  {m.summary && <p className="text-sm text-neutral-400 mt-2 italic">"{m.summary}"</p>}
                </div>
                <div className="flex sm:flex-col gap-2 items-center sm:items-end justify-end flex-shrink-0">
                  <button
                    onClick={() => setEditingMeeting(m)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-emerald-500/10 text-neutral-400 hover:text-emerald-400 transition-colors"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { if (confirm('Delete this meeting?')) deleteMeetingMutation.mutate(m._id); }}
                    className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-neutral-400 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TAB: TASKS ─────────────────────────────────────────────────── */}
      {activeTab === 'tasks' && (
        <div className="flex flex-col gap-4">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-500 bg-neutral-900/40 border border-white/10 rounded-2xl">
              <ClipboardList className="w-12 h-12 mb-3 opacity-40" />
              <p className="font-medium">No tasks assigned yet</p>
              <button onClick={() => setShowTaskModal(true)} className={`${btnPrimary} mt-4`}>
                <Plus className="w-4 h-4" /> Assign First Task
              </button>
            </div>
          ) : (
            tasks.map((t: any) => (
              <div key={t._id} className="bg-neutral-900/50 border border-white/10 rounded-2xl p-5 backdrop-blur-sm flex flex-col sm:flex-row gap-4 hover:border-white/20 transition-all relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${statusBar[t.status] || 'bg-neutral-600'}`} />
                <div className="flex-1 pl-3">
                  <div className="flex flex-wrap items-start gap-2 mb-1">
                    <h3 className="text-white font-semibold">{t.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor[t.status]}`}>{t.status}</span>
                  </div>
                  {t.description && <p className="text-sm text-neutral-400">{t.description}</p>}
                  <div className="flex flex-wrap gap-4 text-sm text-neutral-500 mt-2">
                    <span>For: <span className="text-neutral-300">{t.menteeId?.name}</span></span>
                    {t.deadline && <span>Due: <span className="text-neutral-300">{new Date(t.deadline).toLocaleDateString('en-IN')}</span></span>}
                  </div>
                </div>
                <div className="flex items-center justify-end flex-shrink-0">
                  <button
                    onClick={() => { if (confirm('Delete this task?')) deleteTaskMutation.mutate(t._id); }}
                    className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-neutral-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TAB: NOTES ─────────────────────────────────────────────────── */}
      {activeTab === 'notes' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Mentee selector */}
          <div className="lg:col-span-1 bg-neutral-900/50 border border-white/10 rounded-2xl p-4 backdrop-blur-sm flex flex-col gap-2 h-fit">
            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-2">Select Mentee</h3>
            {mentees.map((m: any) => (
              <button
                key={m._id}
                onClick={() => setSelectedMentee(m)}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  selectedMentee?._id === m._id
                    ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400'
                    : 'bg-white/5 border border-transparent text-neutral-300 hover:border-white/10 hover:text-white'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {m.name?.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate">{m.name}</p>
                  <p className="text-xs opacity-60 font-mono">{m.registerNumber}</p>
                </div>
              </button>
            ))}
            {mentees.length === 0 && <p className="text-neutral-600 text-sm">No mentees</p>}
          </div>

          {/* Notes panel */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {!selectedMentee ? (
              <div className="flex flex-col items-center justify-center py-16 text-neutral-500 bg-neutral-900/40 border border-white/10 rounded-2xl">
                <StickyNote className="w-12 h-12 mb-3 opacity-40" />
                <p>Select a mentee to view/add notes</p>
              </div>
            ) : currentMenteeNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-neutral-500 bg-neutral-900/40 border border-white/10 rounded-2xl">
                <StickyNote className="w-12 h-12 mb-3 opacity-40" />
                <p>No notes for {selectedMentee.name} yet</p>
                <button onClick={() => { setNoteForm(f => ({ ...f, menteeId: selectedMentee._id })); setShowNoteModal(true); }} className={`${btnPrimary} mt-4`}>
                  <Plus className="w-4 h-4" /> Add First Note
                </button>
              </div>
            ) : (
              currentMenteeNotes.map((n: any) => (
                <div key={n._id} className="bg-neutral-900/50 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      {n.isPrivate ? (
                        <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <EyeOff className="w-3 h-3" /> Private
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Eye className="w-3 h-3" /> Shared
                        </span>
                      )}
                      <span className="text-xs text-neutral-500">{new Date(n.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                    </div>
                    <button
                      onClick={() => { if (confirm('Delete this note?')) deleteNoteMutation.mutate(n._id); }}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-neutral-300 text-sm leading-relaxed">{n.note}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── TAB: REPORTS ───────────────────────────────────────────────── */}
      {activeTab === 'reports' && (
        <div className="flex flex-col gap-4">
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-500 bg-neutral-900/40 border border-white/10 rounded-2xl">
              <FileText className="w-12 h-12 mb-3 opacity-40" />
              <p className="font-medium">No reports written yet</p>
              <button onClick={() => setShowReportModal(true)} className={`${btnPrimary} mt-4`}>
                <Plus className="w-4 h-4" /> Write First Report
              </button>
            </div>
          ) : (
            reports.map((r: any) => (
              <div key={r._id} className="bg-neutral-900/50 border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:border-white/20 transition-all">
                <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-white font-semibold">{r.title}</h3>
                    {r.flagged && (
                      <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                        <Flag className="w-3 h-3" /> Flagged
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => { if (confirm('Delete this report?')) deleteReportMutation.mutate(r._id); }}
                    className={btnDanger}
                  >
                    <Trash2 className="w-3 h-3 inline mr-1" /> Delete
                  </button>
                </div>
                <p className="text-sm text-neutral-400 mb-3 leading-relaxed">{r.content}</p>
                <div className="flex gap-4 text-xs text-neutral-500">
                  <span>Student: <span className="text-neutral-300">{r.menteeId?.name} ({r.menteeId?.registerNumber})</span></span>
                  <span>{new Date(r.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ══════════ MODALS ══════════ */}

      {/* Schedule Meeting Modal */}
      <Modal open={showMeetingModal} onClose={() => setShowMeetingModal(false)} title="Schedule Meeting">
        <div className="flex flex-col gap-4">
          <Field label="Select Mentee">
            <select value={meetingForm.menteeId} onChange={e => setMeetingForm(f => ({ ...f, menteeId: e.target.value }))} className={inputCls}>
              <option value="">-- Choose mentee --</option>
              {mentees.map((m: any) => <option key={m._id} value={m._id}>{m.name} ({m.registerNumber})</option>)}
            </select>
          </Field>
          <Field label="Meeting Title">
            <input type="text" placeholder="e.g. Mid-Semester Review" value={meetingForm.title} onChange={e => setMeetingForm(f => ({ ...f, title: e.target.value }))} className={inputCls} />
          </Field>
          <Field label="Date & Time">
            <input type="datetime-local" onClick={(e) => (e.target as any).showPicker?.()} value={meetingForm.scheduledDate} onChange={e => setMeetingForm(f => ({ ...f, scheduledDate: e.target.value }))} className={inputCls} />
          </Field>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setShowMeetingModal(false)} className={btnGhost}>Cancel</button>
            <button
              className={`${btnPrimary} flex-1 justify-center`}
              disabled={!meetingForm.menteeId || !meetingForm.title || !meetingForm.scheduledDate || scheduleMutation.isPending}
              onClick={() => scheduleMutation.mutate(meetingForm)}
            >
              <CheckCircle2 className="w-4 h-4" /> Confirm
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Meeting Modal */}
      <Modal open={!!editingMeeting} onClose={() => setEditingMeeting(null)} title="Update Meeting" subtitle={editingMeeting?.menteeId?.name}>
        {editingMeeting && (
          <div className="flex flex-col gap-4">
            <Field label="Title">
              <input type="text" defaultValue={editingMeeting.title} id="edit-title" className={inputCls} />
            </Field>
            <Field label="Status">
              <select defaultValue={editingMeeting.status} id="edit-status" className={inputCls}>
                {['Scheduled', 'Completed', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Summary / Notes">
              <textarea defaultValue={editingMeeting.summary || ''} id="edit-summary" rows={3} className={`${inputCls} resize-none`} placeholder="What was discussed..." />
            </Field>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setEditingMeeting(null)} className={btnGhost}>Cancel</button>
              <button
                className={`${btnPrimary} flex-1 justify-center`}
                disabled={updateMeetingMutation.isPending}
                onClick={() => updateMeetingMutation.mutate({
                  id: editingMeeting._id,
                  data: {
                    title: (document.getElementById('edit-title') as HTMLInputElement)?.value,
                    status: (document.getElementById('edit-status') as HTMLSelectElement)?.value,
                    summary: (document.getElementById('edit-summary') as HTMLTextAreaElement)?.value,
                  }
                })}
              >
                <CheckCircle2 className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Assign Task Modal */}
      <Modal open={showTaskModal} onClose={() => setShowTaskModal(false)} title="Assign Task">
        <div className="flex flex-col gap-4">
          <Field label="Select Mentee">
            <select value={taskForm.menteeId} onChange={e => setTaskForm(f => ({ ...f, menteeId: e.target.value }))} className={inputCls}>
              <option value="">-- Choose mentee --</option>
              {mentees.map((m: any) => <option key={m._id} value={m._id}>{m.name} ({m.registerNumber})</option>)}
            </select>
          </Field>
          <Field label="Task Title">
            <input type="text" placeholder="e.g. Complete NPTEL assignment" value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} className={inputCls} />
          </Field>
          <Field label="Description (optional)">
            <textarea rows={2} placeholder="Task details..." value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} className={`${inputCls} resize-none`} />
          </Field>
          <Field label="Deadline">
            <input type="date" onClick={(e) => (e.target as any).showPicker?.()} value={taskForm.deadline} onChange={e => setTaskForm(f => ({ ...f, deadline: e.target.value }))} className={inputCls} />
          </Field>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setShowTaskModal(false)} className={btnGhost}>Cancel</button>
            <button
              className={`${btnPrimary} flex-1 justify-center`}
              disabled={!taskForm.menteeId || !taskForm.title || createTaskMutation.isPending}
              onClick={() => createTaskMutation.mutate(taskForm)}
            >
              <CheckCircle2 className="w-4 h-4" /> Assign Task
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Note Modal */}
      <Modal open={showNoteModal} onClose={() => setShowNoteModal(false)} title="Add Note" subtitle={selectedMentee?.name}>
        <div className="flex flex-col gap-4">
          {!selectedMentee && (
            <Field label="Select Mentee">
              <select value={noteForm.menteeId} onChange={e => setNoteForm(f => ({ ...f, menteeId: e.target.value }))} className={inputCls}>
                <option value="">-- Choose mentee --</option>
                {mentees.map((m: any) => <option key={m._id} value={m._id}>{m.name} ({m.registerNumber})</option>)}
              </select>
            </Field>
          )}
          <Field label="Note">
            <textarea rows={4} placeholder="Write your observation..." value={noteForm.note} onChange={e => setNoteForm(f => ({ ...f, note: e.target.value }))} className={`${inputCls} resize-none`} />
          </Field>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setNoteForm(f => ({ ...f, isPrivate: !f.isPrivate }))}
              className={`w-10 h-6 rounded-full transition-colors relative ${noteForm.isPrivate ? 'bg-amber-500' : 'bg-emerald-500'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${noteForm.isPrivate ? 'left-1' : 'left-5'}`} />
            </div>
            <span className="text-sm text-neutral-300">
              {noteForm.isPrivate ? <span className="flex items-center gap-1.5"><EyeOff className="w-3.5 h-3.5 text-amber-400" /> Private (student cannot see)</span> : <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-emerald-400" /> Shared with student</span>}
            </span>
          </label>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setShowNoteModal(false)} className={btnGhost}>Cancel</button>
            <button
              className={`${btnPrimary} flex-1 justify-center`}
              disabled={!noteForm.note || addNoteMutation.isPending}
              onClick={() => addNoteMutation.mutate(noteForm)}
            >
              <CheckCircle2 className="w-4 h-4" /> Save Note
            </button>
          </div>
        </div>
      </Modal>

      {/* Write Report Modal */}
      <Modal open={showReportModal} onClose={() => setShowReportModal(false)} title="Write Mentoring Report">
        <div className="flex flex-col gap-4">
          <Field label="Select Mentee">
            <select value={reportForm.menteeId} onChange={e => setReportForm(f => ({ ...f, menteeId: e.target.value }))} className={inputCls}>
              <option value="">-- Choose mentee --</option>
              {mentees.map((m: any) => <option key={m._id} value={m._id}>{m.name} ({m.registerNumber})</option>)}
            </select>
          </Field>
          <Field label="Report Title">
            <input type="text" placeholder="e.g. Monthly Progress Report" value={reportForm.title} onChange={e => setReportForm(f => ({ ...f, title: e.target.value }))} className={inputCls} />
          </Field>
          <Field label="Content">
            <textarea rows={5} placeholder="Describe student's progress, concerns, achievements..." value={reportForm.content} onChange={e => setReportForm(f => ({ ...f, content: e.target.value }))} className={`${inputCls} resize-none`} />
          </Field>
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors">
            <input type="checkbox" checked={reportForm.flagged} onChange={e => setReportForm(f => ({ ...f, flagged: e.target.checked }))} className="w-4 h-4 accent-red-500" />
            <div>
              <span className="text-sm font-medium text-red-400 flex items-center gap-1.5"><Flag className="w-3.5 h-3.5" /> Flag as At-Risk</span>
              <p className="text-xs text-neutral-500 mt-0.5">Notifies HOD about student concern</p>
            </div>
          </label>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setShowReportModal(false)} className={btnGhost}>Cancel</button>
            <button
              className={`${btnPrimary} flex-1 justify-center`}
              disabled={!reportForm.menteeId || !reportForm.title || !reportForm.content || createReportMutation.isPending}
              onClick={() => createReportMutation.mutate(reportForm)}
            >
              <CheckCircle2 className="w-4 h-4" /> Submit Report
            </button>
          </div>
        </div>
      </Modal>

      {/* Mentee Profile Modal */}
      <Modal
        open={showProfileModal}
        onClose={() => { setShowProfileModal(false); }}
        title={selectedMentee?.name || ''}
        subtitle={selectedMentee?.registerNumber}
      >
        {menteeProfile ? (
          <div className="flex flex-col gap-5">
            {/* Attendance */}
            <div className="bg-neutral-950 rounded-xl p-4 border border-white/5">
              <h4 className="text-sm font-semibold text-neutral-400 mb-3">Attendance</h4>
              {menteeProfile.attendanceSummary?.percentage !== null ? (
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#ffffff10" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15" fill="none"
                        stroke={menteeProfile.attendanceSummary.percentage >= 75 ? '#10b981' : menteeProfile.attendanceSummary.percentage >= 60 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="3"
                        strokeDasharray={`${(menteeProfile.attendanceSummary.percentage / 100) * 94.2} 94.2`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{menteeProfile.attendanceSummary.percentage}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-300">{menteeProfile.attendanceSummary.present} / {menteeProfile.attendanceSummary.total} classes attended</p>
                    <p className={`text-xs mt-1 font-medium ${menteeProfile.attendanceSummary.percentage >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {menteeProfile.attendanceSummary.percentage >= 75 ? 'Good standing' : 'Below threshold'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-neutral-500">No attendance data</p>
              )}
            </div>

            {/* Goals */}
            {menteeProfile.goals?.length > 0 && (
              <div className="bg-neutral-950 rounded-xl p-4 border border-white/5">
                <h4 className="text-sm font-semibold text-neutral-400 mb-3">Student Goals ({menteeProfile.goals.length})</h4>
                <div className="flex flex-col gap-2">
                  {menteeProfile.goals.map((g: any) => (
                    <div key={g._id} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${g.status === 'Achieved' ? 'text-emerald-400' : 'text-neutral-600'}`} />
                      <span className="text-neutral-300">{g.title}</span>
                      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${statusColor[g.status] || 'bg-white/5 text-neutral-400'}`}>{g.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Meetings */}
            {menteeProfile.recentMeetings?.length > 0 && (
              <div className="bg-neutral-950 rounded-xl p-4 border border-white/5">
                <h4 className="text-sm font-semibold text-neutral-400 mb-3">Recent Meetings</h4>
                <div className="flex flex-col gap-2">
                  {menteeProfile.recentMeetings.map((m: any) => (
                    <div key={m._id} className="flex justify-between items-center text-sm">
                      <span className="text-neutral-300">{m.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor[m.status]}`}>{m.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => { setShowProfileModal(false); setActiveTab('notes'); setNoteForm(f => ({ ...f, menteeId: selectedMentee._id })); }} className={btnGhost}>View Notes</button>
              <button onClick={() => { setShowProfileModal(false); setMeetingForm(f => ({ ...f, menteeId: selectedMentee._id })); setShowMeetingModal(true); }} className={`${btnPrimary} flex-1 justify-center`}>
                <Calendar className="w-4 h-4" /> Schedule Meeting
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        )}
      </Modal>
    </div>
  );
}
