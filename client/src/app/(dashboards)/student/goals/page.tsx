'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Target, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StudentGoalsPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', targetDate: '' });

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['student-goals'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/timeline/goals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Network response was not ok');
      const json = await res.json();
      return Array.isArray(json) ? json : (json.data || []);
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/timeline/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Goal created');
      setShowModal(false);
      setFormData({ title: '', description: '', targetDate: '' });
      queryClient.invalidateQueries({ queryKey: ['student-goals'] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Target className="w-6 h-6 text-emerald-400" /> My Goals
        </h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" /> Add Goal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal: any, idx: number) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={goal._id} 
            className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 flex flex-col gap-3 relative overflow-hidden group"
          >
            <div className={`absolute top-0 left-0 w-full h-1 ${goal.status === 'Achieved' ? 'bg-emerald-500' : goal.status === 'In Progress' ? 'bg-blue-500' : 'bg-neutral-500'}`} />
            <div className="flex justify-between items-start pt-2">
              <h3 className="text-white font-bold text-lg">{goal.title}</h3>
              <span className="text-xs px-2 py-1 rounded-md bg-white/5 border border-white/10 text-neutral-300">
                {goal.status}
              </span>
            </div>
            <p className="text-sm text-neutral-400 flex-1">{goal.description}</p>
            {goal.targetDate && (
              <div className="text-xs text-neutral-500 mt-2 pt-2 border-t border-white/5">
                Target: {new Date(goal.targetDate).toLocaleDateString()}
              </div>
            )}
          </motion.div>
        ))}
        {goals.length === 0 && !isLoading && (
          <div className="col-span-full p-12 text-center border border-white/5 rounded-2xl bg-neutral-900/50 text-neutral-400">
            No goals set. Create one to track your progress!
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-neutral-800/30">
              <h2 className="text-xl font-bold text-white">New Goal</h2>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Title</label>
                <input 
                  type="text" required
                  value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Description</label>
                <textarea 
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none h-24 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Target Date</label>
                <input 
                  type="date" 
                  onClick={(e) => (e.target as any).showPicker?.()}
                  value={formData.targetDate} onChange={e => setFormData({...formData, targetDate: e.target.value})}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <button type="submit" disabled={createMutation.isPending} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl mt-2 transition-colors font-medium">
                {createMutation.isPending ? 'Saving...' : 'Save Goal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
