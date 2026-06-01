'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { GraduationCap, Calendar, FileText } from 'lucide-react';
import Link from 'next/link';

export default function StudentDashboard() {
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-200">
            Student Portal
          </h1>
          <p className="text-neutral-400 text-sm mt-0.5">Welcome back, {user?.name}. Here is an overview of your academic stats.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Academic Profile', icon: <GraduationCap className="w-8 h-8" />, desc: 'View grades and marks', href: '/student/records' },
            { title: 'My Schedule', icon: <Calendar className="w-8 h-8" />, desc: 'Timetable and deadlines', href: '/student/timeline' },
            { title: 'Study Materials', icon: <FileText className="w-8 h-8" />, desc: 'Access course notes', href: '/student/documents' },
          ].map((item, i) => (
            <Link key={i} href={item.href} className="backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-emerald-500/50 transition-all group cursor-pointer shadow-lg hover:shadow-emerald-950/10 block">
              <div className="text-emerald-400 mb-4 group-hover:scale-110 transition-transform origin-left">
                {item.icon}
              </div>
              <h2 className="text-lg font-semibold mb-1 text-white">{item.title}</h2>
              <p className="text-neutral-400 text-sm">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
