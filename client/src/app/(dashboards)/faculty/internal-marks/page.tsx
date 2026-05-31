'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Save, Users } from 'lucide-react';

export default function FacultyInternalMarksPage() {
  const { token } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [subjectCode, setSubjectCode] = useState('');
  const [assessmentType, setAssessmentType] = useState('CAT-1');
  const [maximumMarks, setMaximumMarks] = useState(50);
  const [marksData, setMarksData] = useState<Record<string, number>>({});

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/users/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(Array.isArray(data) ? data : (data.data || data));
        const initialData: Record<string, number> = {};
        data.forEach((s: any) => initialData[s._id] = 0);
        setMarksData(initialData);
      }
    } catch (error) {
      toast.error('Failed to load students');
    }
  };

  useEffect(() => {
    if (token) fetchStudents();
  }, [token]);

  const handleMarkChange = (id: string, val: string) => {
    setMarksData(prev => ({ ...prev, [id]: Number(val) }));
  };

  const handleSave = async () => {
    if (!subjectCode) {
      toast.error('Please enter Subject Code');
      return;
    }

    const payload = Object.keys(marksData).map(studentId => ({
      studentId,
      marksScored: marksData[studentId]
    }));

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/academic/internal-marks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ subjectCode, assessmentType, maximumMarks, marksData: payload })
      });
      
      if (res.ok) {
        toast.success('Internal marks saved successfully!');
      } else {
        toast.error('Failed to save marks');
      }
    } catch (error) {
      toast.error('Error saving marks');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-white">Internal Marks Entry</h1>

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
            <label className="block text-sm font-medium text-neutral-400 mb-1">Assessment Type</label>
            <select 
              value={assessmentType}
              onChange={e => setAssessmentType(e.target.value)}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="CAT-1">CAT-1</option>
              <option value="CAT-2">CAT-2</option>
              <option value="CAT-3">CAT-3</option>
              <option value="Model">Model Exam</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Maximum Marks</label>
            <input 
              type="number" 
              value={maximumMarks}
              onChange={e => setMaximumMarks(Number(e.target.value))}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-neutral-900/50 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-neutral-800/30">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Student List
          </h2>
          <button 
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl flex items-center transition-colors text-sm"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Marks
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-neutral-400 text-sm">
                <th className="p-4 font-medium w-16 text-center">S.No</th>
                <th className="p-4 font-medium">Reg No</th>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium text-right w-48">Marks Scored</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, idx) => (
                <tr key={student._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 text-center text-neutral-500">{idx + 1}</td>
                  <td className="p-4 text-emerald-400 font-medium">{student.registerNumber}</td>
                  <td className="p-4 text-white">{student.name}</td>
                  <td className="p-4">
                    <input 
                      type="number" 
                      min="0" max={maximumMarks}
                      value={marksData[student._id] || 0}
                      onChange={e => handleMarkChange(student._id, e.target.value)}
                      className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-1.5 text-white focus:border-emerald-500 focus:outline-none text-right font-mono"
                    />
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
