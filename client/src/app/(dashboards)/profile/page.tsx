'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, Phone, AlignLeft, Calendar, Save, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import API_BASE_URL from '@/lib/apiConfig';

export default function ProfilePage() {
  const { user, token } = useAuth();
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    dateOfBirth: '',
    role: '',
    department: '',
    registerNumber: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          setProfileData({
            name: d.name || '',
            email: d.email || '',
            phone: d.phone || '',
            bio: d.bio || '',
            dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth).toISOString().split('T')[0] : '',
            role: d.role || '',
            department: d.department || '',
            registerNumber: d.registerNumber || ''
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile', error);
      }
    };
    fetchProfile();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          phone: profileData.phone,
          bio: profileData.bio,
          dateOfBirth: profileData.dateOfBirth
        })
      });
      const json = await res.json();
      
      if (res.ok && json.success) {
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      } else {
        toast.error(json.message || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
          <p className="text-neutral-400">Manage your personal information</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            isEditing 
              ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' 
              : 'bg-emerald-600 text-white hover:bg-emerald-500'
          }`}
        >
          {isEditing ? 'Cancel Edit' : 'Edit Profile'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-1">
          <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6">
              <User size={64} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{profileData.name}</h2>
            <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-sm capitalize mb-4">
              {profileData.role.replace('_', ' ')}
            </div>
            {profileData.department && (
              <p className="text-neutral-400 text-sm mb-1">{profileData.department} Department</p>
            )}
            {profileData.registerNumber && (
              <p className="text-neutral-400 text-sm">{profileData.registerNumber}</p>
            )}
          </div>
        </div>

        <div className="col-span-1 md:col-span-2">
          <motion.form 
            onSubmit={handleSubmit}
            className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6"
            layout
          >
            <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Personal Details</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-neutral-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                      type="tel"
                      disabled={!isEditing}
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className={`w-full bg-neutral-950 border rounded-xl pl-12 pr-4 py-3 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                        isEditing ? 'border-white/20 focus:border-emerald-500' : 'border-white/5 opacity-70 cursor-not-allowed'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                  <input
                    type="date"
                    onClick={(e) => (e.target as any).showPicker?.()}
                    disabled={!isEditing}
                    value={profileData.dateOfBirth}
                    onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                    className={`w-full bg-neutral-950 border rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none transition-colors ${
                      isEditing ? 'border-white/20 focus:border-emerald-500' : 'border-white/5 opacity-70 cursor-not-allowed'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Bio</label>
                <div className="relative">
                  <AlignLeft className="absolute left-4 top-4 w-5 h-5 text-neutral-500" />
                  <textarea
                    disabled={!isEditing}
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    placeholder="Tell us a little about yourself..."
                    rows={4}
                    className={`w-full bg-neutral-950 border rounded-xl pl-12 pr-4 py-3 text-white placeholder-neutral-600 focus:outline-none transition-colors resize-none ${
                      isEditing ? 'border-white/20 focus:border-emerald-500' : 'border-white/5 opacity-70 cursor-not-allowed'
                    }`}
                  />
                </div>
              </div>

              {isEditing && (
                <div className="pt-4 border-t border-white/10 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 px-6 rounded-xl transition-colors disabled:opacity-70 flex items-center gap-2"
                  >
                    <Save size={18} />
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
