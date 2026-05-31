'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, X, FileText, Calendar, MapPin, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HODCircularsPage() {
  const { token } = useAuth();
  const [circulars, setCirculars] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'general',
    description: '',
    event_date: '',
    deadline: '',
    location: '',
    organizer: '',
  });

  const fetchCirculars = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/circulars`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCirculars(Array.isArray(data) ? data : (data.data || data));
      }
    } catch (error) {
      toast.error('Failed to load circulars');
    }
  };

  useEffect(() => {
    if (token) fetchCirculars();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/circulars`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        toast.success('Circular published successfully');
        setShowModal(false);
        setFormData({ title: '', category: 'general', description: '', event_date: '', deadline: '', location: '', organizer: '' });
        fetchCirculars();
      } else {
        toast.error('Failed to publish circular');
      }
    } catch (error) {
      toast.error('Error publishing circular');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Circulars & Announcements</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl flex items-center transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Publish Circular
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {circulars.map(circular => (
          <div key={circular._id} className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-xs font-medium uppercase mb-2 inline-block">
                  {circular.category}
                </span>
                <h3 className="font-bold text-xl text-white leading-tight">{circular.title}</h3>
              </div>
              <span className="text-xs text-neutral-500">{new Date(circular.createdAt).toLocaleDateString()}</span>
            </div>
            
            <p className="text-neutral-300 text-sm">{circular.description}</p>
            
            <div className="grid grid-cols-2 gap-4 mt-auto pt-4 border-t border-white/5">
              {circular.event_date && (
                <div className="flex items-center text-xs text-neutral-400">
                  <Calendar className="w-4 h-4 mr-2 text-emerald-500" />
                  Event: {new Date(circular.event_date).toLocaleDateString()}
                </div>
              )}
              {circular.deadline && (
                <div className="flex items-center text-xs text-red-400">
                  <Calendar className="w-4 h-4 mr-2" />
                  Deadline: {new Date(circular.deadline).toLocaleDateString()}
                </div>
              )}
              {circular.location && (
                <div className="flex items-center text-xs text-neutral-400">
                  <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                  {circular.location}
                </div>
              )}
              {circular.organizer && (
                <div className="flex items-center text-xs text-neutral-400">
                  <User className="w-4 h-4 mr-2 text-purple-500" />
                  {circular.organizer}
                </div>
              )}
            </div>
          </div>
        ))}
        {circulars.length === 0 && (
          <div className="col-span-full p-12 text-center border border-white/5 rounded-2xl bg-white/5">
            <p className="text-neutral-400">No circulars published yet.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8"
            >
              <div className="flex justify-between items-center p-6 border-b border-white/10 sticky top-0 bg-neutral-900 z-10">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  Publish New Circular
                </h2>
                <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                <div className="flex gap-4">
                  <div className="flex-[2]">
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Title</label>
                    <input 
                      type="text" required
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Category</label>
                    <select 
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="general">General</option>
                      <option value="academic">Academic</option>
                      <option value="event">Event</option>
                      <option value="exam">Exam</option>
                      <option value="holiday">Holiday</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Description</label>
                  <textarea 
                    rows={5} required
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Event Date (Optional)</label>
                    <input 
                      type="date"
                      value={formData.event_date}
                      onChange={e => setFormData({...formData, event_date: e.target.value})}
                      className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Deadline (Optional)</label>
                    <input 
                      type="date"
                      value={formData.deadline}
                      onChange={e => setFormData({...formData, deadline: e.target.value})}
                      className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Location (Optional)</label>
                    <input 
                      type="text"
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                      className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Organizer (Optional)</label>
                    <input 
                      type="text"
                      value={formData.organizer}
                      onChange={e => setFormData({...formData, organizer: e.target.value})}
                      className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-3 sticky bottom-0 bg-neutral-900 pt-4 border-t border-white/10">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors">
                    Publish
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
