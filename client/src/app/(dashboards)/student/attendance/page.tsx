'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { AlertTriangle } from 'lucide-react';

export default function StudentAttendancePage() {
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
        toast.error('Failed to load attendance');
      }
    };
    if (token) fetchAttendance();
  }, [token]);

  const COLORS = ['#10b981', '#ef4444']; // emerald-500, red-500

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-white">Attendance Overview</h1>

      {attendanceData.length === 0 ? (
        <div className="p-12 text-center border border-white/5 rounded-2xl bg-white/5 text-neutral-400">
          No attendance records found.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {attendanceData.map((record) => {
            const percentage = record.totalClasses === 0 ? 0 : Math.round((record.classesAttended / record.totalClasses) * 100);
            const isShortage = percentage < 75 && record.totalClasses > 0;
            
            const chartData = [
              { name: 'Attended', value: record.classesAttended },
              { name: 'Absent', value: record.totalClasses - record.classesAttended }
            ];

            return (
              <div key={record._id} className={`bg-neutral-900/50 border ${isShortage ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-white/10'} rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden flex flex-col`}>
                {isShortage && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl flex items-center shadow-lg">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Shortage
                  </div>
                )}
                
                <h3 className="font-bold text-lg text-white mb-1">{record.subjectName}</h3>
                <p className="text-sm text-neutral-400 mb-6 uppercase tracking-wider">{record.subjectCode}</p>

                <div className="flex-1 flex items-center justify-between">
                  <div className="w-32 h-32 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={55}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-xl font-bold ${isShortage ? 'text-red-400' : 'text-emerald-400'}`}>
                        {percentage}%
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pl-4">
                    <div>
                      <p className="text-xs text-neutral-500 uppercase">Total</p>
                      <p className="text-lg font-semibold text-white">{record.totalClasses}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 uppercase">Attended</p>
                      <p className="text-lg font-semibold text-emerald-400">{record.classesAttended}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bar Chart Overview */}
      {attendanceData.length > 0 && (
        <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm mt-6">
          <h3 className="font-bold text-lg text-white mb-6">Subject-wise Analysis</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={attendanceData.map(d => ({
                  name: d.subjectCode,
                  Attended: d.classesAttended,
                  Absent: d.totalClasses - d.classesAttended
                }))}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#a3a3a3" tick={{fill: '#a3a3a3'}} />
                <YAxis stroke="#a3a3a3" tick={{fill: '#a3a3a3'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', borderColor: '#ffffff20', color: '#fff', borderRadius: '0.5rem' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="Attended" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Absent" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
