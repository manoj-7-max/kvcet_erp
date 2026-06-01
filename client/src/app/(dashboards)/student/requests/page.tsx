'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import StatusBadge from '@/components/StatusBadge';
import toast from 'react-hot-toast';
import { Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/context/SocketContext';

export default function StudentRequestsPage() {
  const { token } = useAuth();
  const { socket } = useSocket();
  const [requests, setRequests] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'leave',
    title: '',
    description: '',
    startDate: '',
    endDate: '',
  });

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : (data.data || data));
      }
    } catch (error) {
      toast.error('Failed to load requests');
    }
  };

  useEffect(() => {
    if (token) fetchRequests();

    if (socket) {
      socket.on('request:updated', (updatedRequest: any) => {
        setRequests(prev => prev.map(req => req._id === updatedRequest._id ? updatedRequest : req));
      });
    }

    return () => {
      if (socket) socket.off('request:updated');
    };
  }, [token, socket]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        toast.success('Request submitted successfully');
        setShowModal(false);
        fetchRequests();
      } else {
        toast.error('Failed to submit request');
      }
    } catch (error) {
      toast.error('Error submitting request');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">My Requests</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl flex items-center transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Request
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.map(request => (
          <div key={request._id} className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-lg text-white">{request.title}</h3>
              <StatusBadge status={request.status} />
            </div>
            <p className="text-neutral-400 text-sm mb-4 line-clamp-3">{request.description}</p>
            <div className="text-xs text-neutral-500 flex justify-between">
              <span className="uppercase">{request.type}</span>
              <span>{new Date(request.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
        {requests.length === 0 && (
          <div className="col-span-full p-12 text-center border border-white/5 rounded-2xl bg-white/5">
            <p className="text-neutral-400">No requests submitted yet.</p>
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
                <h2 className="text-xl font-bold text-white">Submit Request</h2>
                <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Request Type</label>
                  <select 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="leave">Leave Request</option>
                    <option value="bonafide">Bonafide Certificate</option>
                    <option value="onduty">On Duty</option>
                    <option value="other">Other</option>
                  </select>
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
                {formData.type === 'leave' && (
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-neutral-400 mb-1">Start Date</label>
                      <input 
                        type="date"
                        onClick={(e) => (e.target as any).showPicker?.()}
                        value={formData.startDate}
                        onChange={e => setFormData({...formData, startDate: e.target.value})}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-neutral-400 mb-1">End Date</label>
                      <input 
                        type="date"
                        onClick={(e) => (e.target as any).showPicker?.()}
                        value={formData.endDate}
                        onChange={e => setFormData({...formData, endDate: e.target.value})}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
                <div className="mt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors">
                    Submit Request
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
