'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { GraduationCap, Users, Shield, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import API_BASE_URL from '@/lib/apiConfig';

export default function LandingPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const roles = [
    { id: 'student', title: 'Student', icon: <GraduationCap size={40} />, desc: 'Access your academic portal' },
    { id: 'faculty', title: 'Faculty', icon: <Users size={40} />, desc: 'Manage your classes' },
    { id: 'hod', title: 'HOD', icon: <Shield size={40} />, desc: 'Department administration' },
  ];

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setIdentifier('');
    setPassword('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Students login with registerNumber; faculty/HOD login with email
      const payload = selectedRole === 'student'
        ? { registerNumber: identifier, password }
        : { email: identifier, password };
      
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const json = await res.json();
      
      if (res.ok && json.success) {
        const { user, token: authToken } = json.data;
        toast.success(`Welcome back, ${user.name}`);
        login(user, authToken, selectedRole || user.role);
        
        if (user.role === 'hod') router.push('/hod');
        else if (user.role === 'faculty') router.push('/faculty');
        else if (user.role === 'class_incharge') router.push('/role-selection');
        else router.push('/student');
      } else {
        toast.error(json.message || 'Invalid credentials. Please try again.');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-neutral-950">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent" />

      <div className="relative z-10 w-full max-w-6xl px-6">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-6"
          >
            <img 
              src="/logo.png" 
              alt="KVCET Logo" 
              className="h-20 md:h-28 object-contain w-auto drop-shadow-2xl bg-white/10 p-4 rounded-xl"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) {
                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                }
              }}
            />
            <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-200 hidden">
              KVCET CSE ERP
            </h1>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto"
          >
            The comprehensive digital campus management system for the Department of Computer Science & Engineering.
          </motion.p>
        </div>

        <AnimatePresence mode="wait">
          {!selectedRole ? (
            <motion.div 
              key="role-selection"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
            >
              {roles.map((role, idx) => (
                <motion.div
                  key={role.id}
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  onClick={() => handleRoleSelect(role.id)}
                  className="cursor-pointer backdrop-blur-md bg-white/5 border border-white/10 p-8 rounded-2xl flex flex-col items-center justify-center text-center group hover:border-emerald-500/50 hover:bg-white/10 transition-all"
                >
                  <div className="p-4 rounded-full bg-emerald-500/20 text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                    {role.icon}
                  </div>
                  <h3 className="text-2xl font-semibold mb-2">{role.title}</h3>
                  <p className="text-neutral-400">{role.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="login-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md mx-auto w-full"
            >
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
                
                <button 
                  onClick={() => setSelectedRole(null)}
                  className="flex items-center text-neutral-400 hover:text-white mb-8 transition-colors text-sm"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Back to roles
                </button>

                <h2 className="text-3xl font-bold mb-6 capitalize">{selectedRole} Login</h2>
                
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      {selectedRole === 'student' ? 'Register Number' : 'Email Address'}
                    </label>
                    <input
                      type={selectedRole === 'student' ? 'text' : 'email'}
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      autoComplete={selectedRole === 'student' ? 'username' : 'email'}
                      className="w-full bg-neutral-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      placeholder={selectedRole === 'student' ? 'e.g. CS2023001' : 'name@college.edu'}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        className="w-full bg-neutral-900/50 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors p-1"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 px-4 rounded-xl transition-colors mt-4 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                  >
                    {isSubmitting ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
