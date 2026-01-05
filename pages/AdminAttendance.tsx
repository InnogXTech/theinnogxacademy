
import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { supabaseMock } from '../services/supabaseMock';
import { UserCheck, Clock, Search, Filter, Monitor, Users, GraduationCap } from 'lucide-react';

const AdminAttendance: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Fix: Await the async data fetch
    supabaseMock.db.getAllAttendance().then(setRecords);
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter(r => 
      r.student?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.course?.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [records, searchTerm]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><UserCheck size={160} /></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-black tracking-tight mb-2">Global Attendance Log</h1>
            <p className="text-slate-500 font-medium">Monitoring platform-wide participation and student engagement metrics.</p>
          </div>
          <div className="flex gap-4 relative z-10">
             <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-[2rem] text-center min-w-[140px]">
                <p className="text-[10px] font-black uppercase text-purple-600 mb-1">Total Logs</p>
                <p className="text-3xl font-black">{records.length}</p>
             </div>
          </div>
        </div>

        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            placeholder="Search by scholar or course..."
            className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none font-bold text-sm focus:border-purple-500 transition-all shadow-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
           <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                   <tr>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Scholar</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Curriculum Node</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Duration</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Engagement</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                   {filteredRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                         <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                               <img src={`https://ui-avatars.com/api/?name=${r.student?.full_name}&background=random`} className="w-10 h-10 rounded-xl" alt="" />
                               <div>
                                  <p className="font-black text-sm">{r.student?.full_name}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase">{r.student?.email}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{r.course?.title}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{r.lesson?.title}</p>
                         </td>
                         <td className="px-8 py-6 text-center">
                            <span className="text-sm font-black text-slate-600 dark:text-slate-400">{r.duration_minutes}m</span>
                         </td>
                         <td className="px-8 py-6 text-center">
                            <div className="inline-flex items-center gap-3">
                               <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-purple-gradient" style={{ width: `${r.activity_score}%` }}></div>
                               </div>
                               <span className="text-[10px] font-black">{r.activity_score}%</span>
                            </div>
                         </td>
                         <td className="px-8 py-6 text-right">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                               r.status === 'present' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                            }`}>{r.status}</span>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
           </div>
           {filteredRecords.length === 0 && (
              <div className="py-40 text-center opacity-30 flex flex-col items-center">
                 <Users size={64} className="mb-4" />
                 <p className="font-black uppercase tracking-[0.2em] text-xs">No attendance data logs</p>
              </div>
           )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminAttendance;
