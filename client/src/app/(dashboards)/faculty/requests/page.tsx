'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import StatusBadge from '@/components/StatusBadge';
import toast from 'react-hot-toast';
import { Check, X, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/context/SocketContext';

export default function FacultyRequestsPage() {
  const { token } = useAuth();
  const { socket } = useSocket();
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [comments, setComments] = useState('');

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setRequests(Array.isArray(json) ? json : (json.data || []));
      }
    } catch (error) {
      toast.error('Failed to load requests');
    }
  };

  useEffect(() => {
    if (token) fetchRequests();

    if (socket) {
      socket.on('notification:new', (data: any) => {
        if (data.type === 'request') fetchRequests();
      });
    }

    return () => {
      if (socket) socket.off('notification:new');
    };
  }, [token, socket]);

  const handleStatusUpdate = async (status: string) => {
    if (!selectedRequest) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/requests/${selectedRequest._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, comments })
      });
      
      if (res.ok) {
        toast.success(`Request ${status.split('_')[1].toLowerCase()} successfully`);
        setSelectedRequest(null);
        setComments('');
        fetchRequests();
      } else {
        toast.error('Failed to update request');
      }
    } catch (error) {
      toast.error('Error updating request');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-white">Pending Requests</h1>

      <div className="bg-neutral-900/50 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-neutral-400 text-sm">
                <th className="p-4 font-medium">Student</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Title</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(request => (
                <tr key={request._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="text-white font-medium">{request.studentId?.name || 'Unknown'}</div>
                    <div className="text-xs text-neutral-500">{request.studentId?.registerNumber}</div>
                  </td>
                  <td className="p-4 uppercase text-xs text-neutral-300">{request.type}</td>
                  <td className="p-4 text-sm text-neutral-300">{request.title}</td>
                  <td className="p-4 text-sm text-neutral-400">{new Date(request.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <button 
                      onClick={() => setSelectedRequest(request)}
                      className="px-3 py-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg text-xs font-medium transition-colors"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-neutral-500">No pending requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  Review Request
                </h2>
                <button onClick={() => setSelectedRequest(null)} className="text-neutral-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[60vh]">
                <div>
                  <h4 className="text-xs text-neutral-500 uppercase font-semibold mb-1">Student Info</h4>
                  <p className="text-white text-sm">{selectedRequest.studentId?.name} ({selectedRequest.studentId?.registerNumber})</p>
                </div>
                <div>
                  <h4 className="text-xs text-neutral-500 uppercase font-semibold mb-1">Title</h4>
                  <p className="text-white text-sm">{selectedRequest.title}</p>
                </div>
                <div>
                  <h4 className="text-xs text-neutral-500 uppercase font-semibold mb-1">Description</h4>
                  <div className="bg-neutral-950 border border-white/5 p-4 rounded-xl text-neutral-300 text-sm">
                    {selectedRequest.description}
                  </div>
                </div>
                
                {selectedRequest.type === 'leave' && (
                  <div className="flex gap-4">
                    <div>
                      <h4 className="text-xs text-neutral-500 uppercase font-semibold mb-1">Start Date</h4>
                      <p className="text-white text-sm">{new Date(selectedRequest.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <h4 className="text-xs text-neutral-500 uppercase font-semibold mb-1">End Date</h4>
                      <p className="text-white text-sm">{new Date(selectedRequest.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <label className="text-xs text-neutral-500 uppercase font-semibold mb-1 block">Add Comments (Optional)</label>
                  <textarea 
                    rows={3}
                    value={comments}
                    onChange={e => setComments(e.target.value)}
                    placeholder="Enter remarks for the student/HOD..."
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-white/10 bg-neutral-800/30 flex justify-end gap-3">
                <button 
                  onClick={() => handleStatusUpdate('Faculty_Rejected')}
                  className="px-4 py-2 flex items-center gap-2 rounded-xl text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                >
                  <X className="w-4 h-4" /> Reject
                </button>
                <button 
                  onClick={() => handleStatusUpdate('Faculty_Approved')}
                  className="px-4 py-2 flex items-center gap-2 rounded-xl text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
                >
                  <Check className="w-4 h-4" /> Approve & Forward to HOD
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
