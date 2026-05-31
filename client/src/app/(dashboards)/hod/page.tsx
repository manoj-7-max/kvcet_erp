'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { Users, Settings, Database } from 'lucide-react';

export default function HODDashboard() {
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['hod']}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-200">
            HOD Portal
          </h1>
          <p className="text-neutral-400 text-sm mt-0.5">Welcome back, {user?.name}. Manage department activities and review analytics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'User Management', icon: <Users className="w-8 h-8" />, count: 'Active' },
            { title: 'Department Settings', icon: <Settings className="w-8 h-8" />, count: 'Configure' },
            { title: 'System Logs', icon: <Database className="w-8 h-8" />, count: 'View' },
          ].map((item, i) => (
            <div key={i} className="backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-emerald-500/50 transition-all group cursor-pointer shadow-lg hover:shadow-emerald-950/10">
              <div className="text-emerald-400 mb-4 group-hover:scale-110 transition-transform origin-left">
                {item.icon}
              </div>
              <h2 className="text-lg font-semibold mb-1 text-white">{item.title}</h2>
              <p className="text-neutral-400 text-sm">{item.count}</p>
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
