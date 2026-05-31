'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { BookOpen, Award, BarChart3 } from 'lucide-react';

export default function StudentRecordsPage() {
  const { token } = useAuth();
  const [internalMarks, setInternalMarks] = useState<any[]>([]);
  const [academicRecords, setAcademicRecords] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [marksRes, recordsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/academic/internal-marks`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/academic/records`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (marksRes.ok) {
          const mJson = await marksRes.json();
          setInternalMarks(Array.isArray(mJson) ? mJson : (mJson.data || []));
        }
        if (recordsRes.ok) {
          const rJson = await recordsRes.json();
          setAcademicRecords(Array.isArray(rJson) ? rJson : (rJson.data || []));
        }
      } catch (error) {
        toast.error('Failed to load academic data');
      }
    };
    if (token) fetchData();
  }, [token]);

  // Group internal marks by Assessment Type
  const marksByAssessment = internalMarks.reduce((acc, curr) => {
    if (!acc[curr.assessmentType]) acc[curr.assessmentType] = [];
    acc[curr.assessmentType].push(curr);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-white">Academic Performance</h1>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Internal Marks Section */}
        <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-lg text-white">Internal Assessments</h2>
          </div>

          {Object.keys(marksByAssessment).length === 0 ? (
            <div className="text-center text-neutral-500 py-8">No internal marks found.</div>
          ) : (
            Object.keys(marksByAssessment).map((assessmentType) => (
              <div key={assessmentType} className="bg-neutral-950 border border-white/5 rounded-xl overflow-hidden">
                <div className="bg-white/5 px-4 py-2 font-semibold text-emerald-400 text-sm uppercase">
                  {assessmentType}
                </div>
                <div className="p-4 flex flex-col gap-3">
                  {marksByAssessment[assessmentType].map((mark: any) => {
                    const percentage = Math.round((mark.marksScored / mark.maximumMarks) * 100);
                    return (
                      <div key={mark._id} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0 last:pb-0">
                        <span className="text-neutral-300 text-sm font-mono">{mark.subjectCode}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-white text-sm font-semibold">{mark.marksScored} / {mark.maximumMarks}</span>
                          <span className={`text-xs px-2 py-1 rounded-md ${percentage < 50 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* University Records Section */}
        <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <Award className="w-5 h-5 text-purple-400" />
            <h2 className="font-bold text-lg text-white">University Results</h2>
          </div>

          {academicRecords.length === 0 ? (
            <div className="text-center text-neutral-500 py-8">No university records available.</div>
          ) : (
            academicRecords.map((record: any) => (
              <div key={record._id} className="bg-neutral-950 border border-white/5 rounded-xl overflow-hidden">
                <div className="bg-white/5 px-4 py-2 font-semibold flex justify-between items-center">
                  <span className="text-purple-400 text-sm uppercase">Semester {record.semester}</span>
                  {record.gpa && <span className="text-white font-bold bg-purple-500/20 px-2 py-0.5 rounded-md text-xs">GPA: {record.gpa}</span>}
                </div>
                <div className="p-4 flex flex-col gap-3">
                  {record.subjects.map((sub: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0 last:pb-0">
                      <div>
                        <div className="text-neutral-300 text-sm font-medium">{sub.name}</div>
                        <div className="text-neutral-500 text-xs font-mono">{sub.code}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-neutral-400 text-xs text-right w-16">{sub.credits} Credits</span>
                        <span className="text-white font-bold bg-white/10 w-8 h-8 flex items-center justify-center rounded-lg">{sub.grade}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
