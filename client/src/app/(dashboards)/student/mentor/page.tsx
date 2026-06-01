'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  UserCheck, Calendar, CheckCircle2, Target, ChevronDown,
  Plus, X, Clock, StickyNote, Flag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API_BASE_URL from '@/lib/apiConfig';

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
  Achieved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Not Started': 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30',
  Abandoned: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const GOAL_STATUSES = ['Not Started', 'In Progress', 'Achieved', 'Abandoned'];
const TASK_STATUSES = ['Pending', 'In Progress', 'Completed'];

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

export default function StudentMentorPage() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [goalForm, setGoalForm] = useState({ title: '', description: '', targetDate: '', status: 'Not Started' });
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const fetch$ = (path: string) => api(path, token!);

  // ── queries ────────────────────────────────────────────────────
  const { data: mentor } = useQuery({ queryKey: ['my-mentor'], queryFn: () => fetch$('/api/mentoring/my-mentor') });
  const { data: meetings = [] } = useQuery({ queryKey: ['my-meetings'], queryFn: () => fetch$('/api/mentoring/meetings') });
  const { data: tasks = [] } = useQuery({ queryKey: ['my-tasks'], queryFn: () => fetch$('/api/mentoring/tasks') });
  const { data: goals = [] } = useQuery({ queryKey: ['my-goals'], queryFn: () => fetch$('/api/mentoring/goals') });
  const { data: sharedNotes = [] } = useQuery({
    queryKey: ['shared-notes', user?._id],
    queryFn: () => fetch$(`/api/mentoring/notes/${user?._id}`),
    enabled: !!user?._id,
  });

  // ── mutations ──────────────────────────────────────────────────
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, status }: any) => api(`/api/mentoring/tasks/${id}`, token!, { method: 'PUT', body: JSON.stringify({ status }) }),
    onSuccess: () => { toast.success('Task updated!'); queryClient.invalidateQueries({ queryKey: ['my-tasks'] }); },
    onError: () => toast.error('Failed to update task'),
  });

  const createGoalMutation = useMutation({
    mutationFn: (data: any) => api('/api/mentoring/goals', token!, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { toast.success('Goal added!'); queryClient.invalidateQueries({ queryKey: ['my-goals'] }); setShowGoalModal(false); setGoalForm({ title: '', description: '', targetDate: '', status: 'Not Started' }); },
    onError: () => toast.error('Failed to add goal'),
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }: any) => api(`/api/mentoring/goals/${id}`, token!, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { toast.success('Goal updated!'); queryClient.invalidateQueries({ queryKey: ['my-goals'] }); setEditingGoal(null); },
    onError: () => toast.error('Failed to update goal'),
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id: string) => api(`/api/mentoring/goals/${id}`, token!, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Goal removed'); queryClient.invalidateQueries({ queryKey: ['my-goals'] }); },
  });

  const upcomingMeetings = meetings.filter((m: any) => m.status === 'Scheduled');
  const pastMeetings = meetings.filter((m: any) => m.status !== 'Scheduled');

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-200">
          Mentoring Hub
        </h1>
        <p className="text-neutral-400 text-sm mt-0.5">Track your mentoring sessions, tasks, and personal goals</p>
      </div>

      {/* ── Mentor Info Card ──────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/20 border border-emerald-500/20 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 ring-4 ring-emerald-500/20">
            {mentor?.name?.charAt(0) || '?'}
          </div>
          <div className="flex-1">
            <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-1">Your Mentor</p>
            {mentor ? (
              <>
                <h2 className="text-xl font-bold text-white">{mentor.name}</h2>
                <div className="flex flex-wrap gap-3 mt-1 text-sm text-neutral-400">
                  {mentor.email && <span>{mentor.email}</span>}
                  {mentor.phone && <span>• {mentor.phone}</span>}
                  {mentor.department && <span>• {mentor.department}</span>}
                </div>
              </>
            ) : (
              <div>
                <h2 className="text-lg text-neutral-400">No mentor assigned yet</h2>
                <p className="text-sm text-neutral-500 mt-0.5">Contact your class incharge or HOD.</p>
              </div>
            )}
          </div>
          {mentor && (
            <div className="hidden sm:flex flex-col items-end gap-1">
              <span className="flex items-center gap-1.5 text-sm text-emerald-400 font-medium">
                <UserCheck className="w-4 h-4" /> Active Mentor
              </span>
              <span className="text-xs text-neutral-500">{upcomingMeetings.length} upcoming session{upcomingMeetings.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats Row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Upcoming Sessions', value: upcomingMeetings.length, color: 'text-blue-400', icon: Calendar },
          { label: 'Completed Sessions', value: pastMeetings.filter((m: any) => m.status === 'Completed').length, color: 'text-emerald-400', icon: CheckCircle2 },
          { label: 'Pending Tasks', value: tasks.filter((t: any) => t.status !== 'Completed').length, color: 'text-amber-400', icon: Clock },
          { label: 'Goals Set', value: goals.length, color: 'text-purple-400', icon: Target },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-neutral-900/50 border border-white/10 rounded-2xl p-4 backdrop-blur-sm flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-neutral-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* ── Main Content Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Upcoming Sessions */}
        <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-5 backdrop-blur-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-white">Upcoming Sessions</h2>
            {upcomingMeetings.length > 0 && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {upcomingMeetings.length}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {upcomingMeetings.length === 0 ? (
              <div className="text-center py-8 text-neutral-600">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No upcoming sessions</p>
              </div>
            ) : (
              upcomingMeetings.map((m: any) => (
                <div key={m._id} className="bg-neutral-950 border border-white/5 rounded-xl p-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                  <div className="pl-3">
                    <h4 className="text-white font-medium text-sm">{m.title}</h4>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(m.scheduledDate).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      with {m.mentorId?.name || mentor?.name}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {pastMeetings.length > 0 && (
            <div className="flex flex-col gap-3 mt-2">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Past Sessions</p>
              {pastMeetings.slice(0, 3).map((m: any) => (
                <div key={m._id} className="bg-neutral-950/60 border border-white/5 rounded-xl p-3 relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1 h-full ${m.status === 'Completed' ? 'bg-emerald-500' : 'bg-neutral-600'}`} />
                  <div className="pl-3 flex justify-between items-start">
                    <div>
                      <h4 className="text-neutral-300 text-sm font-medium">{m.title}</h4>
                      <p className="text-xs text-neutral-600 mt-0.5">{new Date(m.scheduledDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
                      {m.summary && <p className="text-xs text-neutral-500 mt-1 italic">"{m.summary}"</p>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor[m.status]}`}>{m.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Tasks */}
        <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-5 backdrop-blur-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <CheckCircle2 className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-white">Action Items</h2>
            {tasks.filter((t: any) => t.status !== 'Completed').length > 0 && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {tasks.filter((t: any) => t.status !== 'Completed').length} pending
              </span>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-neutral-600">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No tasks assigned</p>
              </div>
            ) : (
              tasks.map((t: any) => (
                <div key={t._id} className="bg-neutral-950 border border-white/5 rounded-xl p-4 relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1 h-full ${t.status === 'Completed' ? 'bg-emerald-500' : t.status === 'In Progress' ? 'bg-blue-500' : 'bg-amber-500'}`} />
                  <div className="pl-3">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h4 className="text-white font-medium text-sm">{t.title}</h4>
                      <button
                        onClick={() => setOpenTaskId(openTaskId === t._id ? null : t._id)}
                        className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusColor[t.status]} cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0`}
                      >
                        {t.status} <ChevronDown className={`w-3 h-3 transition-transform ${openTaskId === t._id ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    {t.description && <p className="text-xs text-neutral-400">{t.description}</p>}
                    {t.deadline && (
                      <p className="text-xs text-neutral-500 mt-1">
                        Due: {new Date(t.deadline).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </p>
                    )}
                    <AnimatePresence>
                      {openTaskId === t._id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 flex gap-1 flex-wrap overflow-hidden"
                        >
                          {TASK_STATUSES.map(s => (
                            <button
                              key={s}
                              onClick={() => { updateTaskMutation.mutate({ id: t._id, status: s }); setOpenTaskId(null); }}
                              disabled={t.status === s}
                              className={`text-xs px-3 py-1 rounded-lg border transition-all ${t.status === s ? `${statusColor[s]} opacity-60 cursor-default` : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white'}`}
                            >
                              {s}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Shared Notes */}
        <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-5 backdrop-blur-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <StickyNote className="w-5 h-5 text-teal-400" />
            <h2 className="font-bold text-white">Mentor Notes</h2>
            <span className="text-xs text-neutral-600 ml-auto">Shared with you</span>
          </div>
          <div className="flex flex-col gap-3">
            {sharedNotes.length === 0 ? (
              <div className="text-center py-8 text-neutral-600">
                <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No notes shared by your mentor yet</p>
              </div>
            ) : (
              sharedNotes.map((n: any) => (
                <div key={n._id} className="bg-neutral-950 border border-teal-500/10 rounded-xl p-4">
                  <p className="text-neutral-300 text-sm leading-relaxed">{n.note}</p>
                  <p className="text-xs text-neutral-600 mt-2">{new Date(n.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Goals */}
        <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-5 backdrop-blur-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <Target className="w-5 h-5 text-purple-400" />
            <h2 className="font-bold text-white">My Goals</h2>
            <button onClick={() => setShowGoalModal(true)} className="ml-auto p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {goals.length === 0 ? (
              <div className="text-center py-8 text-neutral-600">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Set your first goal</p>
                <button onClick={() => setShowGoalModal(true)} className="mt-3 text-xs px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors">
                  + Add Goal
                </button>
              </div>
            ) : (
              goals.map((g: any) => (
                <div key={g._id} className="bg-neutral-950 border border-white/5 rounded-xl p-4 flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${g.status === 'Achieved' ? 'bg-emerald-400' : g.status === 'In Progress' ? 'bg-blue-400' : g.status === 'Abandoned' ? 'bg-red-400' : 'bg-neutral-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{g.title}</p>
                    {g.description && <p className="text-xs text-neutral-500 mt-0.5">{g.description}</p>}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {g.targetDate && <span className="text-xs text-neutral-600">by {new Date(g.targetDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>}
                      <button
                        onClick={() => setEditingGoal(g)}
                        className={`text-xs px-2 py-0.5 rounded-full border ${statusColor[g.status] || 'bg-white/5 text-neutral-400 border-white/10'}`}
                      >
                        {g.status}
                      </button>
                    </div>
                  </div>
                  <button onClick={() => { if (confirm('Remove this goal?')) deleteGoalMutation.mutate(g._id); }} className="p-1 rounded-lg hover:bg-red-500/10 text-neutral-600 hover:text-red-400 transition-colors flex-shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ══ Modals ══ */}

      {/* Add Goal Modal */}
      <Modal open={showGoalModal} onClose={() => setShowGoalModal(false)} title="Add New Goal">
        <div className="flex flex-col gap-4">
          <Field label="Goal Title">
            <input type="text" placeholder="e.g. Complete DSA course by July" value={goalForm.title} onChange={e => setGoalForm(f => ({ ...f, title: e.target.value }))} className={inputCls} />
          </Field>
          <Field label="Description (optional)">
            <textarea rows={2} placeholder="What does achieving this look like?" value={goalForm.description} onChange={e => setGoalForm(f => ({ ...f, description: e.target.value }))} className={`${inputCls} resize-none`} />
          </Field>
          <Field label="Target Date">
            <input type="date" value={goalForm.targetDate} onChange={e => setGoalForm(f => ({ ...f, targetDate: e.target.value }))} className={inputCls} />
          </Field>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setShowGoalModal(false)} className={btnGhost}>Cancel</button>
            <button
              className={`${btnPrimary} flex-1 justify-center`}
              disabled={!goalForm.title || createGoalMutation.isPending}
              onClick={() => createGoalMutation.mutate(goalForm)}
            >
              <Target className="w-4 h-4" /> Set Goal
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Goal Modal */}
      <Modal open={!!editingGoal} onClose={() => setEditingGoal(null)} title="Update Goal" subtitle={editingGoal?.title}>
        {editingGoal && (
          <div className="flex flex-col gap-4">
            <Field label="Status">
              <div className="flex flex-wrap gap-2">
                {GOAL_STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => setEditingGoal((g: any) => ({ ...g, status: s }))}
                    className={`flex-1 text-sm px-3 py-2 rounded-xl border transition-all ${editingGoal.status === s ? `${statusColor[s]} font-medium` : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white hover:bg-white/10'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Target Date">
              <input type="date" defaultValue={editingGoal.targetDate ? editingGoal.targetDate.split('T')[0] : ''} id="edit-goal-date" className={inputCls} />
            </Field>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setEditingGoal(null)} className={btnGhost}>Cancel</button>
              <button
                className={`${btnPrimary} flex-1 justify-center`}
                disabled={updateGoalMutation.isPending}
                onClick={() => updateGoalMutation.mutate({
                  id: editingGoal._id,
                  data: { status: editingGoal.status, targetDate: (document.getElementById('edit-goal-date') as HTMLInputElement)?.value }
                })}
              >
                <CheckCircle2 className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
