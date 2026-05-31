'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Calendar, MapPin, User } from 'lucide-react';
import { useSocket } from '@/context/SocketContext';

export default function ViewCircularsPage() {
  const { token } = useAuth();
  const { socket } = useSocket();
  const [circulars, setCirculars] = useState<any[]>([]);

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

    if (socket) {
      socket.on('circular:new', (circular: any) => {
        setCirculars(prev => [circular, ...prev]);
        toast.success(`New Circular: ${circular.title}`);
      });
    }

    return () => {
      if (socket) socket.off('circular:new');
    };
  }, [token, socket]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-white">Circulars & Announcements</h1>

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
    </div>
  );
}
