'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import StatusBadge from '@/components/StatusBadge';
import toast from 'react-hot-toast';
import { AlertCircle, X, Check, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/context/SocketContext';

export default function HODComplaintsPage() {
  const { token } = useAuth();
  const { socket } = useSocket();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [newComment, setNewComment] = useState('');
  const [status, setStatus] = useState('');

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

    if (socket) {
      socket.on('notification:new', (data: any) => {
        if (data.type === 'complaint') fetchComplaints();
      });
      socket.on('complaint:updated', fetchComplaints);
    }

    return () => {
      if (socket) {
        socket.off('notification:new');
        socket.off('complaint:updated');
      }
    };
  }, [token, socket]);

  const handleUpdate = async () => {
    if (!selectedComplaint) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/portal/complaint/${selectedComplaint._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: status || selectedComplaint.status, comment: newComment })
      });
      
      if (res.ok) {
        toast.success('Complaint updated');
        setNewComment('');
        setSelectedComplaint(null);
        fetchComplaints();
      } else {
        toast.error('Failed to update complaint');
      }
    } catch (error) {
      toast.error('Error updating complaint');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-white">Complaints & Feedback</h1>

      <div className="bg-neutral-900/50 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-neutral-400 text-sm">
                <th className="p-4 font-medium">Submitted By</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Title</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Priority</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map(complaint => (
                <tr key={complaint._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="text-white font-medium">{complaint.submittedBy?.name || 'Unknown'}</div>
                    <div className="text-xs text-neutral-500 capitalize">{complaint.submittedBy?.role?.replace('_', ' ')}</div>
                  </td>
                  <td className="p-4 uppercase text-xs text-neutral-300">{complaint.category}</td>
                  <td className="p-4 text-sm text-neutral-300">{complaint.title}</td>
                  <td className="p-4"><StatusBadge status={complaint.status} /></td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-md text-xs ${complaint.priority === 'high' ? 'bg-red-500/20 text-red-400' : complaint.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {complaint.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-neutral-400">{new Date(complaint.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <button 
                      onClick={() => {
                        setSelectedComplaint(complaint);
                        setStatus(complaint.status);
                      }}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium transition-colors border border-white/10"
                    >
                      Resolve
                    </button>
                  </td>
                </tr>
              ))}
              {complaints.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500">No complaints found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedComplaint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-neutral-800/30">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-emerald-400" />
                  Complaint Details
                </h2>
                <button onClick={() => setSelectedComplaint(null)} className="text-neutral-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs text-neutral-500 uppercase font-semibold mb-1">Submitted By</h4>
                    <p className="text-white text-sm">{selectedComplaint.submittedBy?.name}</p>
                  </div>
                  <div>
                    <h4 className="text-xs text-neutral-500 uppercase font-semibold mb-1">Type & Category</h4>
                    <p className="text-white text-sm capitalize">{selectedComplaint.type} - {selectedComplaint.category}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs text-neutral-500 uppercase font-semibold mb-1">Description</h4>
                  <div className="bg-neutral-950 border border-white/5 p-4 rounded-xl text-neutral-300 text-sm">
                    {selectedComplaint.description}
                  </div>
                </div>

                {selectedComplaint.location && (
                  <div>
                    <h4 className="text-xs text-neutral-500 uppercase font-semibold mb-1">Location</h4>
                    <p className="text-white text-sm">{selectedComplaint.location}</p>
                  </div>
                )}

                <div className="border-t border-white/10 pt-4">
                  <h4 className="text-xs text-neutral-500 uppercase font-semibold mb-3 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" /> Resolution & Comments
                  </h4>
                  <div className="flex flex-col gap-3 mb-4">
                    {selectedComplaint.comments?.map((c: any, idx: number) => (
                      <div key={idx} className="bg-white/5 p-3 rounded-lg text-sm">
                        <div className="text-xs text-emerald-400 mb-1">{new Date(c.createdAt).toLocaleString()}</div>
                        <div className="text-neutral-300">{c.text}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="text-xs text-neutral-500 uppercase font-semibold mb-1 block">Add Note</label>
                      <input 
                        type="text"
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Add a remark..."
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-neutral-500 uppercase font-semibold mb-1 block">Update Status</label>
                      <select 
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-white/10 bg-neutral-800/30 flex justify-end gap-3">
                <button 
                  onClick={handleUpdate}
                  className="px-4 py-2 flex items-center gap-2 rounded-xl text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
                >
                  <Check className="w-4 h-4" /> Update Complaint
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
