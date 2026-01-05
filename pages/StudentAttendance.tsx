
import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { supabaseMock } from '../services/supabaseMock';
import { UserCheck, Clock, Activity, Calendar, Search, Filter, AlertCircle } from 'lucide-react';

const StudentAttendance: React.FC = () => {
  const session = supabaseMock.auth.getSession();
  const [records, setRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (session?.user?.id) {
      // Fix: Await the async data fetch
      supabaseMock.db.getStudentAttendance(session.user.id).then(setRecords);
    }
  }, [session?.user?.id]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => 
      r.course?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.lesson?.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [records, searchTerm]);

  const stats = useMemo(() => {
    if (records.length === 0) return { total: 0, avgFocus: 0, presentCount: 0 };
    const avgFocus = records.reduce((acc, r) => acc + r.activity_score, 0) / records.length;
    const presentCount = records.filter(r => r.status === 'present').length;
    return { total: records.length, avgFocus: Math.round(avgFocus), presentCount };
  }, [records]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><UserCheck size={160} /></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-black tracking-tight mb-2">Attendance Node</h1>
            <p className="text-slate-500 font-medium">Monitoring your presence and engagement across the academy.</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 relative z-10">
             <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-800 text-center">
                <p className="text-[10px] font-black uppercase text-purple-600 mb-1">Lectures</p>
                <p className="text-2xl font-black">{stats.total}</p>
             </div>
             <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800 text-center">
                <p className="text-[10px] font-black uppercase text-green-600 mb-1">Present</p>
                <p className="text-2xl font-black">{stats.presentCount}</p>
             </div>
             <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 text-center hidden sm:block">
                <p className="text-[10px] font-black uppercase text-blue-600 mb-1">Avg Focus</p>
                <p className="text-2xl font-black">{stats.avgFocus}%</p>
             </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
           <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                placeholder="Filter by curriculum..."
                className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none font-bold text-sm focus:border-purple-500 transition-all shadow-inner"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
           <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                   <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lesson Node</th>
                   <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Curriculum</th>
                   <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Duration</th>
                   <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Engagement</th>
                   <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                 {filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-400"><Calendar size={18} /></div>
                             <div>
                                <p className="font-black text-slate-900 dark:text-white text-md leading-tight">{r.lesson?.title}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{new Date(r.timestamp).toLocaleDateString()}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <span className="px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-lg text-[10px] font-black uppercase">{r.course?.title}</span>
                       </td>
                       <td className="px-10 py-8 text-center">
                          <div className="flex flex-col items-center gap-1">
                             <Clock size={14} className="text-slate-300" />
                             <span className="text-sm font-black">{r.duration_minutes}m</span>
                          </div>
                       </td>
                       <td className="px-10 py-8 text-center">
                          <div className="inline-flex items-center gap-3">
                             <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-gradient" style={{ width: `${r.activity_score}%` }}></div>
                             </div>
                             <span className="text-[10px] font-black">{r.activity_score}%</span>
                          </div>
                       </td>
                       <td className="px-10 py-8 text-right">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                             r.status === 'present' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                          }`}>{r.status}</span>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
           {filteredRecords.length === 0 && (
             <div className="py-40 text-center opacity-30 italic font-black uppercase text-xs tracking-widest">No logs found</div>
           )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentAttendance;
