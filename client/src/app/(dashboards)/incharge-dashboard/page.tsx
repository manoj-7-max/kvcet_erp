'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { Users, FileBarChart, AlertCircle } from 'lucide-react';

export default function InchargeDashboard() {
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['class_incharge']}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-200">
            Class Incharge Portal
          </h1>
          <p className="text-neutral-400 text-sm mt-0.5">Welcome back, {user?.name}. Manage class attendance, performance records, and circulars.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Student Roster', icon: <Users className="w-8 h-8" />, desc: 'Manage your class students' },
            { title: 'Performance Reports', icon: <FileBarChart className="w-8 h-8" />, desc: 'Class analytics' },
            { title: 'Issues & Alerts', icon: <AlertCircle className="w-8 h-8" />, desc: 'Student grievances' },
          ].map((item, i) => (
            <div key={i} className="backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-teal-500/50 transition-all group cursor-pointer shadow-lg hover:shadow-teal-950/10">
              <div className="text-teal-400 mb-4 group-hover:scale-110 transition-transform origin-left">
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
