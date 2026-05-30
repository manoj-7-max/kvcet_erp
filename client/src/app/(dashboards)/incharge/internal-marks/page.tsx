'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { FileBarChart } from 'lucide-react';

export default function ClassInchargeMarksPage() {
  const { token } = useAuth();
  const [marksData, setMarksData] = useState<any[]>([]);

  useEffect(() => {
    const fetchMarks = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/academic/internal-marks`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMarksData(data);
        }
      } catch (error) {
        toast.error('Failed to load internal marks data');
      }
    };
    if (token) fetchMarks();
  }, [token]);

  // Transform data: Map student ID -> { student: StudentObj, subjects: { [code]: marks } }
  const consolidated = marksData.reduce((acc, curr) => {
    const sId = curr.studentId?._id;
    if (!sId) return acc;
    if (!acc[sId]) {
      acc[sId] = {
        student: curr.studentId,
        subjects: {}
      };
    }
    // Simplification: taking the latest or aggregated marks. In reality, you'd filter by assessmentType.
    if (!acc[sId].subjects[curr.subjectCode]) {
      acc[sId].subjects[curr.subjectCode] = [];
    }
    acc[sId].subjects[curr.subjectCode].push(curr);
    return acc;
  }, {});

  const studentsList = Object.values(consolidated);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-white">Class Internal Marks Report</h1>

      <div className="bg-neutral-900/50 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-neutral-800/30">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-purple-400" />
            Consolidated Marks
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-neutral-400 text-sm">
                <th className="p-4 font-medium w-16 text-center">S.No</th>
                <th className="p-4 font-medium">Reg No</th>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Detailed Assessment Breakdown</th>
              </tr>
            </thead>
            <tbody>
              {studentsList.map((entry: any, idx) => (
                <tr key={entry.student._id} className="border-b border-white/5 hover:bg-white/5 transition-colors align-top">
                  <td className="p-4 text-center text-neutral-500 pt-6">{idx + 1}</td>
                  <td className="p-4 text-emerald-400 font-medium pt-6">{entry.student.registerNumber}</td>
                  <td className="p-4 text-white pt-6">{entry.student.name}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-3">
                      {Object.keys(entry.subjects).map(subCode => (
                        <div key={subCode} className="bg-neutral-950 border border-white/5 rounded-lg p-3">
                          <span className="text-xs text-purple-400 font-mono font-semibold mb-2 block">{subCode}</span>
                          <div className="flex flex-wrap gap-3">
                            {entry.subjects[subCode].map((m: any) => (
                              <div key={m._id} className="bg-white/5 px-2 py-1 rounded text-xs flex gap-2 items-center">
                                <span className="text-neutral-400">{m.assessmentType}:</span>
                                <span className={`font-bold ${((m.marksScored/m.maximumMarks)*100) < 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                                  {m.marksScored}/{m.maximumMarks}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {studentsList.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-neutral-500">No marks data found for class.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
