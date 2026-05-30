'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { LogOut, BookOpen, Calendar, ClipboardList } from 'lucide-react';

export default function FacultyDashboard() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['faculty']}>
      <div className="min-h-screen bg-neutral-950 text-white p-8">
        <header className="flex justify-between items-center mb-12 backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-2xl">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-200">
              Faculty Dashboard
            </h1>
            <p className="text-neutral-400 mt-1">Welcome back, {user?.name}</p>
          </div>
          <button 
            onClick={logout}
            className="flex items-center px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors border border-red-500/20"
          >
            <LogOut size={18} className="mr-2" />
            Logout
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'My Classes', icon: <BookOpen className="w-8 h-8" />, desc: 'View assigned courses' },
            { title: 'Schedule', icon: <Calendar className="w-8 h-8" />, desc: 'Timetable and events' },
            { title: 'Attendance', icon: <ClipboardList className="w-8 h-8" />, desc: 'Mark student attendance' },
          ].map((item, i) => (
            <div key={i} className="backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-emerald-500/50 transition-colors group cursor-pointer">
              <div className="text-emerald-400 mb-4 group-hover:scale-110 transition-transform origin-left">
                {item.icon}
              </div>
              <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
              <p className="text-neutral-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
