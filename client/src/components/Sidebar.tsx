'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, Users, UserCheck, UserPlus, ShieldAlert,
  FileText, MessageSquare, BookOpen, Clock, FileBarChart,
  FolderOpen, AlertCircle, Settings, Calendar, CheckCircle
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, selectedRole } = useAuth();
  
  const role = selectedRole || user?.role || 'student';

  const linksMap: Record<string, any[]> = {
    hod: [
      { name: 'Dashboard', path: '/hod', icon: <LayoutDashboard /> },
      { name: 'Faculty', path: '/hod/faculty', icon: <UserCheck /> },
      { name: 'Students', path: '/hod/students', icon: <Users /> },
      { name: 'Requests', path: '/hod/requests', icon: <MessageSquare /> },
      { name: 'Complaints', path: '/hod/complaints', icon: <AlertCircle /> },
      { name: 'Circulars', path: '/hod/circulars', icon: <FileText /> },
      { name: 'Reports', path: '/hod/reports', icon: <FileBarChart /> },
      { name: 'User Management', path: '/hod/users', icon: <UserPlus /> },
      { name: 'Messages', path: '/chat', icon: <MessageSquare /> },
    ],
    faculty: [
      { name: 'Dashboard', path: '/faculty', icon: <LayoutDashboard /> },
      { name: 'Attendance', path: '/faculty/attendance', icon: <Clock /> },
      { name: 'Daily Test', path: '/faculty/daily-test', icon: <FileText /> },
      { name: 'Internal Marks', path: '/faculty/internal-marks', icon: <FileBarChart /> },
      { name: 'Mentor', path: '/faculty/mentor', icon: <Users /> },
      { name: 'Requests', path: '/faculty/requests', icon: <MessageSquare /> },
      { name: 'Complaints', path: '/faculty/complaints', icon: <AlertCircle /> },
      { name: 'Circulars', path: '/faculty/circulars', icon: <FileText /> },
      { name: 'Chat', path: '/chat', icon: <MessageSquare /> },
    ],
    class_incharge: [
      { name: 'Dashboard', path: '/incharge-dashboard', icon: <LayoutDashboard /> },
      { name: 'Class Attendance', path: '/incharge/attendance', icon: <Clock /> },
      { name: 'Internal Marks', path: '/incharge/internal-marks', icon: <FileBarChart /> },
      { name: 'Complaints', path: '/incharge/complaints', icon: <AlertCircle /> },
      { name: 'Circulars', path: '/incharge/circulars', icon: <FileText /> },
      { name: 'Reports', path: '/incharge/reports', icon: <FileBarChart /> },
    ],
    student: [
      { name: 'Dashboard', path: '/student', icon: <LayoutDashboard /> },
      { name: 'Attendance', path: '/student/attendance', icon: <Clock /> },
      { name: 'Academic Records', path: '/student/records', icon: <BookOpen /> },
      { name: 'Timeline', path: '/student/timeline', icon: <Calendar /> },
      { name: 'Goals', path: '/student/goals', icon: <CheckCircle /> },
      { name: 'Documents', path: '/student/documents', icon: <FolderOpen /> },
      { name: 'Mentor', path: '/student/mentor', icon: <UserCheck /> },
      { name: 'Requests', path: '/student/requests', icon: <MessageSquare /> },
      { name: 'Feedback', path: '/student/feedback', icon: <AlertCircle /> },
      { name: 'Circulars', path: '/student/circulars', icon: <FileText /> },
      { name: 'Chat', path: '/chat', icon: <MessageSquare /> },
    ]
  };

  const links = linksMap[role] || linksMap.student;

  return (
    <div className="w-64 h-screen border-r border-white/10 bg-neutral-950/50 backdrop-blur-xl hidden md:flex flex-col sticky top-0">
      <div className="h-20 flex items-center px-6 border-b border-white/10">
        <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-200">
          KVCET ERP
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
        {links.map((link) => {
          const isActive = pathname === link.path || (link.path !== `/${role}` && pathname.startsWith(link.path));
          
          return (
            <Link key={link.name} href={link.path} className="relative block">
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className={`relative flex items-center px-4 py-3 rounded-xl transition-colors ${isActive ? 'text-emerald-400' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}>
                <span className="mr-3 opacity-80">{link.icon}</span>
                <span className="font-medium text-sm">{link.name}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-neutral-400 capitalize truncate">{role.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
