'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Check, X, Users, Search, Save } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FacultyAttendancePage() {
  const { token } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, boolean>>({});
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');

  // Fetch all students (in a real app, you'd fetch by department/year)
  const fetchStudents = async () => {
    try {
      // Reusing users endpoint to get students
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/users/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
        // Initialize attendance to true
        const initialData: Record<string, boolean> = {};
        data.forEach((s: any) => initialData[s._id] = true);
        setAttendanceData(initialData);
      }
    } catch (error) {
      toast.error('Failed to load students');
    }
  };

  useEffect(() => {
    if (token) fetchStudents();
  }, [token]);

  const handleToggle = (id: string) => {
    setAttendanceData(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async () => {
    if (!subjectCode || !subjectName) {
      toast.error('Please enter Subject Code and Name');
      return;
    }

    const payload = Object.keys(attendanceData).map(studentId => ({
      studentId,
      present: attendanceData[studentId]
    }));

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ subjectCode, subjectName, attendanceData: payload })
      });
      
      if (res.ok) {
        toast.success('Attendance marked successfully!');
      } else {
        toast.error('Failed to mark attendance');
      }
    } catch (error) {
      toast.error('Error saving attendance');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-white">Mark Attendance</h1>

      <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Subject Code</label>
            <input 
              type="text" 
              value={subjectCode}
              onChange={e => setSubjectCode(e.target.value.toUpperCase())}
              placeholder="e.g. CS801"
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none uppercase"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Subject Name</label>
            <input 
              type="text" 
              value={subjectName}
              onChange={e => setSubjectName(e.target.value)}
              placeholder="e.g. Machine Learning"
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-neutral-900/50 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-neutral-800/30">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Class List
          </h2>
          <button 
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl flex items-center transition-colors text-sm"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Attendance
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-neutral-400 text-sm">
                <th className="p-4 font-medium w-16 text-center">S.No</th>
                <th className="p-4 font-medium">Reg No</th>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, idx) => (
                <tr key={student._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 text-center text-neutral-500">{idx + 1}</td>
                  <td className="p-4 text-emerald-400 font-medium">{student.registerNumber}</td>
                  <td className="p-4 text-white">{student.name}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleToggle(student._id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all w-24 flex justify-center items-center gap-1 ${
                        attendanceData[student._id] 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {attendanceData[student._id] ? <><Check className="w-3 h-3" /> Present</> : <><X className="w-3 h-3" /> Absent</>}
                    </button>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-neutral-500">No students found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
