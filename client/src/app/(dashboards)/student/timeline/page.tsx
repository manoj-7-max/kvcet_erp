'use client';

import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Flag } from 'lucide-react';

export default function StudentTimelinePage() {
  const { token } = useAuth();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['student-timeline'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/timeline`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch timeline');
      const json = await res.json();
      return Array.isArray(json) ? json : (json.data || []);
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Calendar className="w-6 h-6 text-emerald-400" /> My Timeline
      </h1>

      <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm max-w-3xl">
        {events.length === 0 && !isLoading ? (
          <div className="text-neutral-500 text-center py-8">No timeline events yet.</div>
        ) : (
          <div className="relative border-l border-white/10 ml-4 py-4 flex flex-col gap-8">
            {events.map((ev: any) => (
              <div key={ev._id} className="relative pl-8">
                <div className="absolute w-4 h-4 rounded-full bg-emerald-500/20 border-2 border-emerald-500 -left-[9px] top-1" />
                <div className="bg-neutral-950 border border-white/5 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-white font-bold">{ev.title}</h3>
                    <span className="text-xs text-neutral-500">{new Date(ev.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-neutral-400">{ev.description}</p>
                  <div className="mt-3 inline-block px-2 py-1 bg-white/5 rounded text-xs text-neutral-300 border border-white/10 uppercase tracking-wider">
                    {ev.type}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
