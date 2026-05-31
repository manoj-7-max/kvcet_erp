'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Users, Mail, Landmark, Search, Award } from 'lucide-react';

export default function HODStudentsPage() {
  const { token } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/hod/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data_raw = await res.json();
        const data = Array.isArray(data_raw) ? data_raw : (data_raw.data || data_raw);
        // Filter users whose role is 'student'
        const filtered = data.filter((u: any) => u.role === 'student');
        setStudents(filtered);
      }
    } catch (err) {
      console.error('Failed to load student profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchStudents();
  }, [token]);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.registerNumber && s.registerNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <ProtectedRoute allowedRoles={['hod']}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-400" />
            Student Directory
          </h1>
          <p className="text-neutral-400 text-sm mt-0.5">Browse and monitor active students enrolled in the department.</p>
        </div>

        {/* Search */}
        <div className="bg-neutral-900/40 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3 backdrop-blur-sm max-w-md focus-within:border-emerald-500/50 transition-colors">
          <Search className="w-5 h-5 text-neutral-400" />
          <input 
            type="text" 
            placeholder="Search students by name, email, register number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-white placeholder-neutral-500 focus:outline-none text-sm"
          />
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map(s => (
            <div key={s._id} className="backdrop-blur-sm bg-neutral-900/40 border border-white/10 p-6 rounded-2xl flex flex-col gap-4 hover:border-emerald-500/30 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
                  {s.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">{s.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 inline-block mt-1">
                    STUDENT
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-white/5 text-sm text-neutral-300">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-neutral-500" />
                  <span className="truncate">{s.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-neutral-500" />
                  <span>Dept: {s.department || 'N/A'}</span>
                </div>
                {s.registerNumber && (
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-neutral-500" />
                    <span>Reg No: {s.registerNumber}</span>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-4 flex justify-between items-center text-xs text-neutral-500">
                <span>Account Status</span>
                <span className={`font-semibold ${s.isActive ? 'text-emerald-400' : 'text-neutral-500'}`}>
                  {s.isActive ? '● Active' : '● Disabled'}
                </span>
              </div>
            </div>
          ))}
          {filteredStudents.length === 0 && (
            <div className="col-span-full p-12 text-center border border-white/5 rounded-2xl bg-white/5 text-neutral-500">
              No student profiles match your search criteria.
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
