'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserCheck, Mail, Shield, Landmark, Search, Award } from 'lucide-react';

export default function HODFacultyPage() {
  const { token } = useAuth();
  const [faculty, setFaculty] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/hod/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter users whose role is 'faculty' or 'class_incharge'
        const filtered = data.filter((u: any) => u.role === 'faculty' || u.role === 'class_incharge');
        setFaculty(filtered);
      }
    } catch (err) {
      console.error('Failed to load faculty profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchFaculty();
  }, [token]);

  const filteredFaculty = faculty.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProtectedRoute allowedRoles={['hod']}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-emerald-400" />
            Faculty Directory
          </h1>
          <p className="text-neutral-400 text-sm mt-0.5">Browse and monitor registered academic staff within the department.</p>
        </div>

        {/* Search */}
        <div className="bg-neutral-900/40 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3 backdrop-blur-sm max-w-md focus-within:border-emerald-500/50 transition-colors">
          <Search className="w-5 h-5 text-neutral-400" />
          <input 
            type="text" 
            placeholder="Search faculty by name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-white placeholder-neutral-500 focus:outline-none text-sm"
          />
        </div>

        {/* Faculty Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFaculty.map(f => (
            <div key={f._id} className="backdrop-blur-sm bg-neutral-900/40 border border-white/10 p-6 rounded-2xl flex flex-col gap-4 hover:border-emerald-500/30 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
                  {f.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">{f.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border inline-flex items-center gap-1 mt-1 ${
                    f.role === 'class_incharge' 
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    <Shield className="w-3 h-3" />
                    {f.role.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-white/5 text-sm text-neutral-300">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-neutral-500" />
                  <span className="truncate">{f.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-neutral-500" />
                  <span>Dept: {f.department || 'N/A'}</span>
                </div>
                {f.employeeId && (
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-neutral-500" />
                    <span>Emp ID: {f.employeeId}</span>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-4 flex justify-between items-center text-xs text-neutral-500">
                <span>Account Status</span>
                <span className={`font-semibold ${f.isActive ? 'text-emerald-400' : 'text-neutral-500'}`}>
                  {f.isActive ? '● Active' : '● Disabled'}
                </span>
              </div>
            </div>
          ))}
          {filteredFaculty.length === 0 && (
            <div className="col-span-full p-12 text-center border border-white/5 rounded-2xl bg-white/5 text-neutral-500">
              No faculty profiles match your query.
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
