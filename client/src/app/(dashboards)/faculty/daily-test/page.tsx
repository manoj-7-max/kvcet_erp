'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Save, Users } from 'lucide-react';

export default function FacultyDailyTestPage() {
  const { token } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [subjectCode, setSubjectCode] = useState('');
  const [deadline, setDeadline] = useState('');
  const [dateConducted, setDateConducted] = useState(new Date().toISOString().split('T')[0]);
  const [testData, setTestData] = useState<Record<string, { partA: number, partB: number }>>({});

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/users/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(Array.isArray(data) ? data : (data.data || data));
        const initialData: Record<string, { partA: number, partB: number }> = {};
        data.forEach((s: any) => initialData[s._id] = { partA: 0, partB: 0 });
        setTestData(initialData);
      }
    } catch (error) {
      toast.error('Failed to load students');
    }
  };

  useEffect(() => {
    if (token) fetchStudents();
  }, [token]);

  const handlePartChange = (id: string, part: 'partA' | 'partB', val: string) => {
    setTestData(prev => ({
      ...prev,
      [id]: { ...prev[id], [part]: Number(val) }
    }));
  };

  const handleSave = async () => {
    if (!subjectCode) {
      toast.error('Please enter Subject Code');
      return;
    }

    const payload = Object.keys(testData).map(studentId => ({
      studentId,
      partA: testData[studentId].partA,
      partB: testData[studentId].partB,
    }));

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/academic/daily-tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ subjectCode, deadline, dateConducted, testData: payload })
      });
      
      if (res.ok) {
        toast.success('Daily test marks saved successfully!');
      } else {
        toast.error('Failed to save marks');
      }
    } catch (error) {
      toast.error('Error saving marks');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-white">Daily Test Management</h1>

      <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <label className="block text-sm font-medium text-neutral-400 mb-1">Date Conducted</label>
            <input 
              type="date" 
              onClick={(e) => (e.target as any).showPicker?.()}
              value={dateConducted}
              onChange={e => setDateConducted(e.target.value)}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Submission Deadline (Optional)</label>
            <input 
              type="date" 
              onClick={(e) => (e.target as any).showPicker?.()}
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-neutral-900/50 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-neutral-800/30">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Enter Marks
          </h2>
          <button 
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl flex items-center transition-colors text-sm"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Tests
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-neutral-400 text-sm">
                <th className="p-4 font-medium w-16 text-center">S.No</th>
                <th className="p-4 font-medium">Reg No</th>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium text-center w-32">Part A (10)</th>
                <th className="p-4 font-medium text-center w-32">Part B (40)</th>
                <th className="p-4 font-medium text-center w-32">Total (50)</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, idx) => {
                const pA = testData[student._id]?.partA || 0;
                const pB = testData[student._id]?.partB || 0;
                const total = pA + pB;
                
                return (
                  <tr key={student._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 text-center text-neutral-500">{idx + 1}</td>
                    <td className="p-4 text-emerald-400 font-medium">{student.registerNumber}</td>
                    <td className="p-4 text-white">{student.name}</td>
                    <td className="p-4">
                      <input 
                        type="number" min="0" max="10"
                        value={pA}
                        onChange={e => handlePartChange(student._id, 'partA', e.target.value)}
                        className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-1.5 text-white focus:border-emerald-500 focus:outline-none text-center font-mono"
                      />
                    </td>
                    <td className="p-4">
                      <input 
                        type="number" min="0" max="40"
                        value={pB}
                        onChange={e => handlePartChange(student._id, 'partB', e.target.value)}
                        className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-1.5 text-white focus:border-emerald-500 focus:outline-none text-center font-mono"
                      />
                    </td>
                    <td className="p-4 text-center text-white font-bold">
                      {total}
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500">No students found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
