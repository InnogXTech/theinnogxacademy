
import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { supabaseMock } from '../services/supabaseMock';
import { 
  FileText, Plus, ClipboardList, 
  ChevronRight, Users, Clock,
  CheckCircle, MoreVertical, Search,
  GraduationCap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InstructorAssignments: React.FC = () => {
  const navigate = useNavigate();
  const session = supabaseMock.auth.getSession();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, { total: number, pending: number }>>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (session?.user?.id) {
        // Correct: await the async database call
        const data = await supabaseMock.db.getAssignmentsByInstructor(session.user.id);
        setAssignments(data);
        
        // Correct: pre-fetch submission metadata for each assignment
        const counts: Record<string, { total: number, pending: number }> = {};
        await Promise.all(data.map(async (as: any) => {
           const subs = await supabaseMock.db.getSubmissionsByAssignment(as.id);
           counts[as.id] = {
             total: subs.length,
             pending: subs.filter((s: any) => !s.grade).length
           };
        }));
        setSubmissionCounts(counts);
      }
    };
    fetchData();
  }, [session?.user?.id]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter(as => 
      as.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [assignments, searchTerm]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white dark:bg-slate-800 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><ClipboardList size={160} /></div>
          <div>
            <h1 className="text-4xl font-black tracking-tight mb-2">Assignment Registry</h1>
            <p className="text-slate-500 font-medium">Manage and review academic tasks across all your curriculums.</p>
          </div>
          
          <div className="flex gap-4">
             <div className="relative w-64 hidden lg:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                   placeholder="Search tasks..."
                   className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-900 rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-purple-500 transition-all"
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
             <button 
               onClick={() => navigate('/dashboard/instructor')}
               className="px-8 py-4 bg-purple-gradient text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2"
             >
               <Plus size={16} strokeWidth={3} /> Post New Task
             </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-slate-50 dark:bg-slate-900/50">
                   <tr>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assignment Context</th>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Due Date</th>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Activity</th>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredAssignments.map((as) => {
                       const counts = submissionCounts[as.id] || { total: 0, pending: 0 };
                       
                       return (
                          <tr key={as.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors group">
                             <td className="px-10 py-8">
                                <div className="flex items-center gap-5">
                                   <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-purple-600 group-hover:text-white transition-all">
                                      <FileText size={20} />
                                   </div>
                                   <div>
                                      <p className="font-black text-slate-900 dark:text-white text-lg">{as.title}</p>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global ID: AS-{as.id.substring(0, 5)}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="px-10 py-8">
                                <div className="flex items-center gap-2">
                                   <Clock size={14} className="text-slate-400" />
                                   <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{as.due_date}</span>
                                </div>
                             </td>
                             <td className="px-10 py-8">
                                <div className="flex items-center gap-6">
                                   <div className="flex flex-col">
                                      <span className="text-sm font-black text-slate-900 dark:text-white">{counts.total}</span>
                                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Turns</span>
                                   </div>
                                   {counts.pending > 0 && (
                                      <div className="flex flex-col">
                                         <span className="text-sm font-black text-orange-500">{counts.pending}</span>
                                         <span className="text-[9px] font-black uppercase text-orange-400 tracking-widest">Grading</span>
                                      </div>
                                   )}
                                </div>
                             </td>
                             <td className="px-10 py-8 text-right">
                                <button 
                                  onClick={() => navigate('/dashboard/instructor')}
                                  className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-purple-500 hover:text-purple-600 transition-all"
                                >
                                   Review Work
                                </button>
                             </td>
                          </tr>
                       );
                    })}
                 </tbody>
              </table>
              {filteredAssignments.length === 0 && (
                <div className="py-40 text-center">
                   <ClipboardList size={64} className="mx-auto mb-6 text-slate-200" />
                   <p className="font-black text-slate-400 uppercase tracking-[0.2em] text-xs">No active knowledge tasks</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InstructorAssignments;
