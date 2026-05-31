'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import StatusBadge from '@/components/StatusBadge';
import toast from 'react-hot-toast';
import { MessageSquare, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StudentFeedbackPage() {
  const { token } = useAuth();
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'academic',
    priority: 'medium',
  });

  const fetchFeedback = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/portal/complaints`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFeedbackList(Array.isArray(data) ? data : (data.data || data));
      }
    } catch (error) {
      toast.error('Failed to load feedback');
    }
  };

  useEffect(() => {
    if (token) fetchFeedback();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/portal/complaint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...formData, type: 'feedback' })
      });
      
      if (res.ok) {
        toast.success('Feedback submitted successfully');
        setShowModal(false);
        setFormData({ title: '', description: '', category: 'academic', priority: 'medium' });
        fetchFeedback();
      } else {
        toast.error('Failed to submit feedback');
      }
    } catch (error) {
      toast.error('Error submitting feedback');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-7 h-7 text-emerald-400" />
          My Feedback
        </h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl flex items-center transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Submit Feedback
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {feedbackList.map(item => (
          <div key={item._id} className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-lg text-white">{item.title}</h3>
              <StatusBadge status={item.status} />
            </div>
            <p className="text-neutral-400 text-sm line-clamp-2">{item.description}</p>
            <div className="text-xs text-neutral-500 flex justify-between mt-auto pt-4 border-t border-white/5">
              <span className="uppercase">{item.category} • {item.priority}</span>
              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
        {feedbackList.length === 0 && (
          <div className="col-span-full p-12 text-center border border-white/5 rounded-2xl bg-white/5">
            <p className="text-neutral-400">No feedback submitted yet.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="flex justify-between items-center p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                  Submit Feedback
                </h2>
                <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Category</label>
                    <select 
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="academic">Academic</option>
                      <option value="facility">Facility</option>
                      <option value="hostel">Hostel</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Priority</label>
                    <select 
                      value={formData.priority}
                      onChange={e => setFormData({...formData, priority: e.target.value})}
                      className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Title</label>
                  <input 
                    type="text" required
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="Brief subject of your feedback"
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Description</label>
                  <textarea 
                    rows={4} required
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Provide detailed feedback here..."
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none resize-none"
                  />
                </div>
                <div className="mt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors">
                    Submit
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
