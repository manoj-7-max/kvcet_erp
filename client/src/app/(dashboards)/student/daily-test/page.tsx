'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { FileText, Clock } from 'lucide-react';

export default function StudentDailyTestPage() {
  const { token } = useAuth();
  const [dailyTests, setDailyTests] = useState<any[]>([]);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/academic/daily-tests`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          const testsData = Array.isArray(json) ? json : (json.data || []);
          // Sort by newest first
          setDailyTests(testsData.sort((a: any, b: any) => new Date(b.dateConducted).getTime() - new Date(a.dateConducted).getTime()));
        }
      } catch (error) {
        toast.error('Failed to load daily tests');
      }
    };
    if (token) fetchTests();
  }, [token]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-white">Daily Updates & Tests</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dailyTests.map((test) => {
          const total = test.partA + test.partB;
          const isLowScore = total < 25; // Less than 50% of 50
          
          return (
            <div key={test._id} className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-white font-mono">{test.subjectCode}</h3>
                  <p className="text-sm text-neutral-400">Faculty: {test.facultyName}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-emerald-400 uppercase font-semibold mb-1">Total Score</div>
                  <div className={`text-2xl font-bold ${isLowScore ? 'text-red-400' : 'text-white'}`}>
                    {total} <span className="text-sm text-neutral-500 font-normal">/ 50</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="bg-neutral-950 border border-white/5 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-xs text-neutral-400 uppercase">Part A (10)</span>
                  <span className="text-white font-semibold">{test.partA}</span>
                </div>
                <div className="bg-neutral-950 border border-white/5 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-xs text-neutral-400 uppercase">Part B (40)</span>
                  <span className="text-white font-semibold">{test.partB}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mt-2 pt-4 border-t border-white/5 text-xs text-neutral-500">
                <div className="flex items-center">
                  <FileText className="w-3.5 h-3.5 mr-1" />
                  Conducted: {new Date(test.dateConducted).toLocaleDateString()}
                </div>
                {test.deadline && (
                  <div className="flex items-center text-red-400">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    Deadline: {new Date(test.deadline).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {dailyTests.length === 0 && (
          <div className="col-span-full p-12 text-center border border-white/5 rounded-2xl bg-white/5 text-neutral-400">
            No daily test updates found.
          </div>
        )}
      </div>
    </div>
  );
}
