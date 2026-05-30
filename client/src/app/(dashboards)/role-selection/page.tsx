'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { LogOut, Users, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RoleSelection() {
  const { user, logout, setSelectedRole } = useAuth();
  const router = useRouter();

  const handleSelectRole = (role: string) => {
    setSelectedRole(role);
    if (role === 'class_incharge') {
      router.push('/incharge-dashboard'); // Note: For this phase, we just mock this or go to another placeholder
    } else {
      router.push('/faculty');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['class_incharge']}>
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent" />
        
        <div className="relative z-10 w-full max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-200 mb-4">
              Select Your Workspace
            </h1>
            <p className="text-neutral-400 text-lg">
              Welcome {user?.name}. You have multiple roles. Please select your workspace for this session.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectRole('faculty')}
              className="cursor-pointer backdrop-blur-md bg-white/5 border border-white/10 p-8 rounded-2xl flex flex-col items-center justify-center text-center group hover:border-emerald-500/50 hover:bg-white/10 transition-all"
            >
              <div className="p-4 rounded-full bg-emerald-500/20 text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <BookOpen size={40} />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Faculty Portal</h3>
              <p className="text-neutral-400">Manage your assigned classes and schedule</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectRole('class_incharge')}
              className="cursor-pointer backdrop-blur-md bg-white/5 border border-white/10 p-8 rounded-2xl flex flex-col items-center justify-center text-center group hover:border-emerald-500/50 hover:bg-white/10 transition-all"
            >
              <div className="p-4 rounded-full bg-teal-500/20 text-teal-400 mb-6 group-hover:scale-110 transition-transform">
                <Users size={40} />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Class Incharge Portal</h3>
              <p className="text-neutral-400">Manage your entire class, student issues, and performance</p>
            </motion.div>
          </div>

          <div className="mt-12 text-center">
            <button 
              onClick={logout}
              className="inline-flex items-center px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors border border-red-500/20"
            >
              <LogOut size={18} className="mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
