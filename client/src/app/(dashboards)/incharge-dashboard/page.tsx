'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { LogOut, Users, FileBarChart, AlertCircle } from 'lucide-react';

export default function InchargeDashboard() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['class_incharge']}>
      <div className="min-h-screen bg-neutral-950 text-white p-8">
        <header className="flex justify-between items-center mb-12 backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-2xl">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-200">
              Class Incharge Portal
            </h1>
            <p className="text-neutral-400 mt-1">Class Management - {user?.name}</p>
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
            { title: 'Student Roster', icon: <Users className="w-8 h-8" />, desc: 'Manage your class students' },
            { title: 'Performance Reports', icon: <FileBarChart className="w-8 h-8" />, desc: 'Class analytics' },
            { title: 'Issues & Alerts', icon: <AlertCircle className="w-8 h-8" />, desc: 'Student grievances' },
          ].map((item, i) => (
            <div key={i} className="backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-teal-500/50 transition-colors group cursor-pointer">
              <div className="text-teal-400 mb-4 group-hover:scale-110 transition-transform origin-left">
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
