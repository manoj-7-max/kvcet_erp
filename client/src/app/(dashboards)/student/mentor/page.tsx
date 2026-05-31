'use client';

import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Calendar, UserCheck, CheckCircle2 } from 'lucide-react';

export default function StudentMentorPage() {
  const { token } = useAuth();

  const { data: meetings = [] } = useQuery({
    queryKey: ['my-meetings'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/mentoring/meetings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    }
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/mentoring/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-white">Mentoring Hub</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-lg text-white">My Mentoring Sessions</h2>
          </div>
          
          <div className="flex flex-col gap-4">
            {meetings.map((m: any) => (
              <div key={m._id} className="bg-neutral-950 border border-white/5 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${m.status === 'Scheduled' ? 'bg-blue-500' : m.status === 'Completed' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <div className="flex justify-between items-start pl-2">
                  <h4 className="text-white font-medium">{m.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded-md ${m.status === 'Scheduled' ? 'bg-blue-500/20 text-blue-400' : m.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {m.status}
                  </span>
                </div>
                <div className="pl-2 flex justify-between items-center text-xs text-neutral-400 mt-2">
                  <div className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    {m.mentorId?.name}
                  </div>
                  <span>{new Date(m.scheduledDate).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {meetings.length === 0 && <div className="text-neutral-500 text-sm py-4">No mentoring sessions scheduled.</div>}
          </div>
        </div>

        <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <CheckCircle2 className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-lg text-white">Action Items</h2>
          </div>
          <div className="flex flex-col gap-4 pt-2">
            {tasks.map((t: any) => (
              <div key={t._id} className="bg-neutral-950 border border-white/5 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${t.status === 'Completed' ? 'bg-emerald-500' : t.status === 'Overdue' ? 'bg-red-500' : 'bg-amber-500'}`} />
                <div className="flex justify-between items-start pl-2">
                  <h4 className="text-white font-medium">{t.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded-md ${t.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' : t.status === 'Overdue' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {t.status || 'Pending'}
                  </span>
                </div>
                <p className="pl-2 text-xs text-neutral-400">{t.description}</p>
                <div className="pl-2 flex justify-between items-center text-xs text-neutral-500 mt-2">
                  <span>Due: {new Date(t.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="text-neutral-500 text-sm py-4">No tasks assigned currently.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
