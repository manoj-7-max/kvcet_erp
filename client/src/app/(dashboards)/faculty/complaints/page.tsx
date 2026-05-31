'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import StatusBadge from '@/components/StatusBadge';
import toast from 'react-hot-toast';
import { AlertCircle, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MyComplaintsPage() {
  const { token, user } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'facility',
    priority: 'medium',
    location: '',
  });

  const fetchComplaints = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/portal/complaints`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data_raw = await res.json();
        setComplaints(Array.isArray(data_raw) ? data_raw : (data_raw.data || data_raw));
      }
    } catch (error) {
      toast.error('Failed to load complaints');
    }
  };

  useEffect(() => {
    if (token) fetchComplaints();
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
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        toast.success('Complaint submitted successfully');
        setShowModal(false);
        setFormData({ title: '', description: '', category: 'facility', priority: 'medium', location: '' });
        fetchComplaints();
      } else {
        toast.error('Failed to submit complaint');
      }
    } catch (error) {
      toast.error('Error submitting complaint');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">My Complaints</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl flex items-center transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Complaint
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {complaints.map(complaint => (
          <div key={complaint._id} className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-lg text-white">{complaint.title}</h3>
              <StatusBadge status={complaint.status} />
            </div>
            <p className="text-neutral-400 text-sm line-clamp-2">{complaint.description}</p>
            <div className="text-xs text-neutral-500 flex justify-between mt-auto pt-4 border-t border-white/5">
              <span className="uppercase">{complaint.category} • {complaint.priority}</span>
              <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
        {complaints.length === 0 && (
          <div className="col-span-full p-12 text-center border border-white/5 rounded-2xl bg-white/5">
            <p className="text-neutral-400">No complaints submitted yet.</p>
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
                  <AlertCircle className="w-5 h-5 text-emerald-400" />
                  Submit Complaint
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
                      <option value="facility">Facility/Infrastructure</option>
                      <option value="academic">Academic</option>
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
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Description</label>
                  <textarea 
                    rows={4} required
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Location (Optional)</label>
                  <input 
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g. Lab 4, Block B"
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
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
