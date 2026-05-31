'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, Calendar, ClipboardList } from 'lucide-react';

export default function FacultyDashboard() {
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['faculty']}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-200">
            Faculty Portal
          </h1>
          <p className="text-neutral-400 text-sm mt-0.5">Welcome back, {user?.name}. Here is an overview of your schedule and classes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'My Classes', icon: <BookOpen className="w-8 h-8" />, desc: 'View assigned courses' },
            { title: 'Schedule', icon: <Calendar className="w-8 h-8" />, desc: 'Timetable and events' },
            { title: 'Attendance', icon: <ClipboardList className="w-8 h-8" />, desc: 'Mark student attendance' },
          ].map((item, i) => (
            <div key={i} className="backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-emerald-500/50 transition-all group cursor-pointer shadow-lg hover:shadow-emerald-950/10">
              <div className="text-emerald-400 mb-4 group-hover:scale-110 transition-transform origin-left">
                {item.icon}
              </div>
              <h2 className="text-lg font-semibold mb-1 text-white">{item.title}</h2>
              <p className="text-neutral-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
