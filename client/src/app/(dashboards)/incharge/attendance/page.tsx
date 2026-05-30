'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Clock, AlertTriangle } from 'lucide-react';

export default function ClassInchargeAttendancePage() {
  const { token } = useAuth();
  const [attendanceData, setAttendanceData] = useState<any[]>([]);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/attendance`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAttendanceData(data);
        }
      } catch (error) {
        toast.error('Failed to load class attendance');
      }
    };
    if (token) fetchAttendance();
  }, [token]);

  // Aggregate by student
  const consolidated = attendanceData.reduce((acc, curr) => {
    const sId = curr.studentId?._id;
    if (!sId) return acc;
    if (!acc[sId]) {
      acc[sId] = {
        student: curr.studentId,
        totalClasses: 0,
        classesAttended: 0,
        subjects: []
      };
    }
    acc[sId].totalClasses += curr.totalClasses;
    acc[sId].classesAttended += curr.classesAttended;
    acc[sId].subjects.push(curr);
    return acc;
  }, {});

  const studentsList = Object.values(consolidated);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-white">Class Attendance Report</h1>

      <div className="bg-neutral-900/50 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-neutral-800/30">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            Consolidated Attendance
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-neutral-400 text-sm">
                <th className="p-4 font-medium w-16 text-center">S.No</th>
                <th className="p-4 font-medium">Reg No</th>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium text-center">Aggregate %</th>
                <th className="p-4 font-medium">Alerts</th>
              </tr>
            </thead>
            <tbody>
              {studentsList.map((entry: any, idx) => {
                const percentage = entry.totalClasses === 0 ? 0 : Math.round((entry.classesAttended / entry.totalClasses) * 100);
                const hasShortage = percentage < 75 && entry.totalClasses > 0;
                
                return (
                  <tr key={entry.student._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 text-center text-neutral-500">{idx + 1}</td>
                    <td className="p-4 text-emerald-400 font-medium">{entry.student.registerNumber}</td>
                    <td className="p-4 text-white font-medium">{entry.student.name}</td>
                    <td className="p-4 text-center">
                      <span className={`font-bold text-lg ${hasShortage ? 'text-red-400' : 'text-emerald-400'}`}>
                        {percentage}%
                      </span>
                      <div className="text-xs text-neutral-500">{entry.classesAttended} / {entry.totalClasses}</div>
                    </td>
                    <td className="p-4">
                      {hasShortage ? (
                        <span className="flex items-center text-xs font-medium text-red-400 bg-red-500/10 px-2 py-1 rounded-md w-fit border border-red-500/20">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Defaulter list
                        </span>
                      ) : (
                        <span className="text-neutral-500 text-xs">Clear</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {studentsList.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-neutral-500">No attendance data found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
