'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Calendar, Users, FileText, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FacultyMentorPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [selectedMentee, setSelectedMentee] = useState<any>(null);

  const { data: mentees = [] } = useQuery({
    queryKey: ['mentees'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/mentoring/mentees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    }
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ['mentoring-meetings'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/mentoring/meetings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    }
  });

  const scheduleMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/mentoring/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to schedule');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Meeting scheduled');
      queryClient.invalidateQueries({ queryKey: ['mentoring-meetings'] });
      setSelectedMentee(null);
    },
    onError: () => toast.error('Error scheduling meeting')
  });

  const [scheduleData, setScheduleData] = useState({ title: '', scheduledDate: '' });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-white">Mentor Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mentees List */}
        <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex flex-col gap-4 lg:col-span-1">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <Users className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-lg text-white">My Mentees</h2>
          </div>
          {mentees.length === 0 ? (
            <div className="text-neutral-500 text-sm text-center py-4">No mentees assigned.</div>
          ) : (
            mentees.map((mentee: any) => (
              <div 
                key={mentee._id}
                onClick={() => setSelectedMentee(mentee)}
                className="bg-neutral-950 border border-white/5 rounded-xl p-4 cursor-pointer hover:border-emerald-500/50 transition-colors"
              >
                <h3 className="text-white font-medium">{mentee.name}</h3>
                <p className="text-emerald-400 text-xs font-mono">{mentee.registerNumber}</p>
              </div>
            ))
          )}
        </div>

        {/* Schedule & Meetings */}
        <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex flex-col gap-4 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-lg text-white">Upcoming Meetings</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {meetings.map((m: any) => (
              <div key={m._id} className="bg-neutral-950 border border-white/5 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${m.status === 'Scheduled' ? 'bg-blue-500' : m.status === 'Completed' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <h4 className="text-white font-medium pl-2">{m.title}</h4>
                <div className="pl-2 flex justify-between items-center text-xs text-neutral-400">
                  <span>{m.menteeId?.name}</span>
                  <span>{new Date(m.scheduledDate).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {meetings.length === 0 && <div className="text-neutral-500 text-sm py-4">No upcoming meetings.</div>}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedMentee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-neutral-800/30">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Schedule Meeting
                  </h2>
                  <p className="text-sm text-neutral-400">With {selectedMentee.name}</p>
                </div>
                <button onClick={() => setSelectedMentee(null)} className="text-neutral-400 hover:text-white">✕</button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Title</label>
                  <input 
                    type="text" 
                    value={scheduleData.title}
                    onChange={e => setScheduleData({...scheduleData, title: e.target.value})}
                    placeholder="e.g. End of Semester Review"
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Date & Time</label>
                  <input 
                    type="datetime-local" 
                    value={scheduleData.scheduledDate}
                    onChange={e => setScheduleData({...scheduleData, scheduledDate: e.target.value})}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <button 
                  onClick={() => scheduleMutation.mutate({ menteeId: selectedMentee._id, ...scheduleData })}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl mt-2 transition-colors font-medium"
                >
                  Confirm Schedule
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
