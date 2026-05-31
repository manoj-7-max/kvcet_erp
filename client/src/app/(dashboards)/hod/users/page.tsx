'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import toast from 'react-hot-toast';
import { 
  Users, Plus, X, Key, Trash2, Shield, UserCheck, 
  Search, RefreshCw, Mail, Award, Landmark, UserMinus 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HODUserManagement() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Forms States
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'faculty',
    department: 'CSE',
    employeeId: '',
    registerNumber: '',
  });

  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/hod/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data_raw = await res.json();
        const data = Array.isArray(data_raw) ? data_raw : (data_raw.data || data_raw);
        setUsers(data);
      } else {
        toast.error('Failed to load users');
      }
    } catch (err) {
      toast.error('Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/hod/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const resData_raw = await res.json();
        const resData = Array.isArray(resData_raw) ? resData_raw : (resData_raw.data || resData_raw);
      if (res.ok) {
        toast.success(resData.message || 'User created successfully');
        setShowAddModal(false);
        // Reset form
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'faculty',
          department: 'CSE',
          employeeId: '',
          registerNumber: '',
        });
        fetchUsers();
      } else {
        toast.error(resData.message || 'Failed to create user');
      }
    } catch (err) {
      toast.error('Server error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    try {
      const newStatus = !user.isActive;
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/hod/users/${user._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: newStatus })
      });
      
      const resData_raw = await res.json();
        const resData = Array.isArray(resData_raw) ? resData_raw : (resData_raw.data || resData_raw);
      if (res.ok) {
        toast.success(resData.message || 'User status updated');
        fetchUsers();
      } else {
        toast.error(resData.message || 'Failed to update status');
      }
    } catch (err) {
      toast.error('Error connecting to backend');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/hod/users/${selectedUser._id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword })
      });
      
      const resData_raw = await res.json();
        const resData = Array.isArray(resData_raw) ? resData_raw : (resData_raw.data || resData_raw);
      if (res.ok) {
        toast.success(resData.message || 'Password reset completed');
        setShowPassModal(false);
        setNewPassword('');
      } else {
        toast.error(resData.message || 'Failed to reset password');
      }
    } catch (err) {
      toast.error('Error resetting password');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to delete this user? This action is irreversible.')) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/hod/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const resData_raw = await res.json();
        const resData = Array.isArray(resData_raw) ? resData_raw : (resData_raw.data || resData_raw);
      if (res.ok) {
        toast.success(resData.message || 'User deleted');
        fetchUsers();
      } else {
        toast.error(resData.message || 'Failed to delete user');
      }
    } catch (err) {
      toast.error('Server connection error');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.registerNumber && u.registerNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === '' ? true : u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <ProtectedRoute allowedRoles={['hod']}>
      <div className="flex flex-col gap-6">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="w-7 h-7 text-emerald-400" />
              User Directory
            </h1>
            <p className="text-neutral-400 text-sm mt-0.5">Manage departmental HOD, faculty, class incharge, and student profiles.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl flex items-center justify-center font-medium transition-all shadow-lg hover:shadow-emerald-950/20"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New User
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-neutral-900/40 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3 backdrop-blur-sm focus-within:border-emerald-500/50 transition-colors">
            <Search className="w-5 h-5 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search by name, email, register number..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-white placeholder-neutral-500 focus:outline-none text-sm"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="bg-neutral-900/40 border border-white/10 rounded-xl px-4 py-2.5 text-neutral-300 text-sm focus:outline-none focus:border-emerald-500/50 backdrop-blur-sm cursor-pointer"
            >
              <option value="">All Roles</option>
              <option value="hod">HOD</option>
              <option value="faculty">Faculty</option>
              <option value="class_incharge">Class Incharge</option>
              <option value="student">Student</option>
            </select>
            <button 
              onClick={fetchUsers}
              className="p-2.5 bg-neutral-900/40 border border-white/10 hover:bg-white/5 rounded-xl text-neutral-400 hover:text-white transition-all backdrop-blur-sm flex items-center justify-center"
              title="Refresh User List"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-neutral-900/30 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-neutral-800/30 text-neutral-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">User</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Department / ID</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map(user => (
                  <tr key={user._id} className="hover:bg-white/5 transition-colors">
                    {/* User Profile */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm flex items-center gap-1.5">
                            {user.name}
                            {user._id === currentUser?.id && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/10">You</span>
                            )}
                          </div>
                          <span className="text-xs text-neutral-500">ID: {user._id}</span>
                        </div>
                      </div>
                    </td>
                    
                    {/* Contact Info */}
                    <td className="p-4">
                      <div className="flex items-center text-sm text-neutral-300 gap-1.5">
                        <Mail className="w-4 h-4 text-neutral-500" />
                        {user.email}
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border uppercase tracking-wide inline-flex items-center gap-1 ${
                        user.role === 'hod' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        user.role === 'faculty' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        user.role === 'class_incharge' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        <Shield className="w-3.5 h-3.5" />
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Dept / IDs */}
                    <td className="p-4">
                      <div className="flex flex-col text-sm text-neutral-300">
                        <div className="font-semibold flex items-center gap-1">
                          <Landmark className="w-3.5 h-3.5 text-neutral-500" />
                          {user.department || 'N/A'}
                        </div>
                        {user.registerNumber && <span className="text-xs text-neutral-400">Reg: {user.registerNumber}</span>}
                        {user.employeeId && <span className="text-xs text-neutral-400">Emp: {user.employeeId}</span>}
                      </div>
                    </td>

                    {/* Status Button */}
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        disabled={user._id === currentUser?.id}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                          user.isActive 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                            : 'bg-neutral-800 text-neutral-500 border-neutral-700/50 hover:bg-neutral-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        {user.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>

                    {/* Actions Panel */}
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            setSelectedUser(user);
                            setShowPassModal(true);
                          }}
                          className="p-1.5 bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/20 rounded-lg text-neutral-400 hover:text-emerald-400 transition-colors"
                          title="Reset Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user._id)}
                          disabled={user._id === currentUser?.id}
                          className="p-1.5 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 rounded-lg text-neutral-400 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-neutral-500">
                      <UserMinus className="w-12 h-12 text-neutral-600 mx-auto mb-2 opacity-30" />
                      No registered users match the search conditions.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Add User */}
        <AnimatePresence>
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl my-8 flex flex-col"
              >
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-neutral-800/30">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Plus className="w-5 h-5 text-emerald-400" />
                    Register New User
                  </h2>
                  <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <form onSubmit={handleCreateUser} className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                  {/* Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Full Name</label>
                      <input 
                        type="text" required
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none text-sm placeholder-neutral-700"
                        placeholder="e.g. Dr. Ramesh Kumar"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Email Address</label>
                      <input 
                        type="email" required
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none text-sm placeholder-neutral-700"
                        placeholder="e.g. ramesh@college.edu"
                      />
                    </div>
                  </div>

                  {/* Password & Role */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Temporary Password</label>
                      <input 
                        type="password" required
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none text-sm placeholder-neutral-700"
                        placeholder="Min 6 characters"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Institutional Role</label>
                      <select 
                        value={formData.role}
                        onChange={e => setFormData({...formData, role: e.target.value})}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none text-sm cursor-pointer"
                      >
                        <option value="hod">HOD</option>
                        <option value="faculty">Faculty</option>
                        <option value="class_incharge">Class Incharge</option>
                        <option value="student">Student</option>
                      </select>
                    </div>
                  </div>

                  {/* Department & Registration/Employee Identifier */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Department</label>
                      <input 
                        type="text" required
                        value={formData.department}
                        onChange={e => setFormData({...formData, department: e.target.value})}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none text-sm placeholder-neutral-700"
                        placeholder="e.g. CSE"
                      />
                    </div>

                    {formData.role === 'student' ? (
                      <div>
                        <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Student Register Number</label>
                        <input 
                          type="text" required
                          value={formData.registerNumber}
                          onChange={e => setFormData({...formData, registerNumber: e.target.value})}
                          className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none text-sm placeholder-neutral-700"
                          placeholder="e.g. CS2026045"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Faculty Employee ID (Optional)</label>
                        <input 
                          type="text"
                          value={formData.employeeId}
                          onChange={e => setFormData({...formData, employeeId: e.target.value})}
                          className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none text-sm placeholder-neutral-700"
                          placeholder="e.g. FAC-CSE-091"
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end gap-3 sticky bottom-0 bg-neutral-900 pt-4 border-t border-white/10">
                    <button 
                      type="button" 
                      onClick={() => setShowAddModal(false)} 
                      className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors text-sm flex items-center gap-1.5"
                    >
                      Create Account
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal: Reset Password */}
        <AnimatePresence>
          {showPassModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
              >
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-neutral-800/30">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Key className="w-5 h-5 text-emerald-400" />
                    Reset Password
                  </h2>
                  <button onClick={() => setShowPassModal(false)} className="text-neutral-400 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <form onSubmit={handleResetPassword} className="p-6 flex flex-col gap-4">
                  <p className="text-xs text-neutral-400">
                    Resetting password for: <strong className="text-white">{selectedUser?.name}</strong> ({selectedUser?.email})
                  </p>
                  
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">New Secure Password</label>
                    <input 
                      type="password" required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none text-sm placeholder-neutral-700"
                      placeholder="Min 6 characters"
                    />
                  </div>

                  <div className="mt-4 flex justify-end gap-3 border-t border-white/10 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setShowPassModal(false)} 
                      className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors text-sm flex items-center gap-1.5"
                    >
                      Update Password
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}
