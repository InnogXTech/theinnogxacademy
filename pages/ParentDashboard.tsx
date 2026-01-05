
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { 
  Users, UserPlus, GraduationCap,
  ChevronDown, CreditCard, ClipboardList, UserCheck, 
  BookOpen, Loader2
} from 'lucide-react';
import { supabaseMock } from '../services/supabaseMock';
import { Transaction } from '../types';

const ParentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const session = supabaseMock.auth.getSession();
  const [linkedScholars, setLinkedScholars] = useState<any[]>([]);
  const [scholarId, setScholarId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [expandedScholarId, setExpandedScholarId] = useState<string | null>(null);
  const [scholarDetailTab, setScholarDetailTab] = useState<'progress' | 'assignments' | 'attendance' | 'billing'>('progress');

  const [selectedScholarData, setSelectedScholarData] = useState<{
    enrollments: any[],
    assignments: any[],
    submissions: any[],
    attendance: any[],
    transactions: Transaction[]
  } | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      loadScholars();
    }
  }, [session]);

  const loadScholars = async () => {
    const data = await supabaseMock.db.getLinkedChildren(session.user.id, true);
    setLinkedScholars(data);
  };

  const handleLinkScholar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const result = await supabaseMock.db.linkChild(session.user.id, scholarId);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setTimeout(() => {
        setLoading(false);
        setScholarId('');
        loadScholars();
      }, 1000);
    }
  };

  const handleExpandScholar = async (scholar: any) => {
    const childId = scholar.child_id;
    if (expandedScholarId === childId) {
      setExpandedScholarId(null);
      setSelectedScholarData(null);
      return;
    }

    if (scholar.status !== 'approved') return;

    setExpandedScholarId(childId);
    setScholarDetailTab('progress');
    
    const [enrollments, assignments, submissions, attendance, transactions] = await Promise.all([
       supabaseMock.db.getStudentEnrollments(childId),
       supabaseMock.db.getAssignmentsByStudent(childId),
       supabaseMock.db.getSubmissionsByStudent(childId),
       supabaseMock.db.getStudentAttendance(childId),
       supabaseMock.db.getTransactions(childId)
    ]);

    setSelectedScholarData({
      enrollments,
      assignments,
      submissions,
      attendance,
      transactions
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-10 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-800 p-10 rounded-[3.5rem] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none transition-transform duration-1000"><Users size={200} /></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2 leading-none">Parental Control Node</h1>
            <p className="text-slate-500 font-medium">Overseeing the academic growth and financial synchronization of your scholars.</p>
          </div>
          <div className="relative z-10 flex gap-4">
             <div className="hidden sm:flex flex-col items-end justify-center px-6 py-2 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Linked Nodes</p>
                <p className="text-lg font-black text-purple-600">{linkedScholars.filter(s => s.status === 'approved').length}</p>
             </div>
             <button onClick={() => setScholarId('S-')} className="px-8 py-4 bg-purple-gradient text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
               <UserPlus size={16} /> Link New Scholar
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between px-4">
               <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                 <GraduationCap size={28} className="text-purple-600" />
                 Global Scholar Registry
               </h2>
            </div>

            <div className="space-y-6">
              {linkedScholars.map((scholarRow) => {
                const scholar = scholarRow.child;
                if (!scholar) return null;

                const isApproved = scholarRow.status === 'approved';
                const isExpanded = expandedScholarId === scholar.id;

                return (
                  <div key={scholarRow.id || scholar.id} className={`bg-white dark:bg-slate-800 rounded-[3rem] border transition-all duration-500 overflow-hidden ${isExpanded ? 'border-purple-400 shadow-2xl scale-[1.01]' : 'border-slate-100 dark:border-slate-700 shadow-sm hover:border-purple-200'}`}>
                    
                    <div 
                      onClick={() => handleExpandScholar(scholarRow)}
                      className={`p-8 flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer group ${!isApproved ? 'opacity-60 grayscale' : ''}`}
                    >
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <div className={`w-20 h-20 rounded-[2rem] p-1 bg-purple-gradient shadow-xl transition-transform duration-500 ${isExpanded ? 'rotate-6' : 'group-hover:rotate-3'}`}>
                             <img src={scholar.avatar_url || `https://ui-avatars.com/api/?name=${scholar.full_name}&background=random`} className="w-full h-full rounded-[1.8rem] object-cover" alt="" />
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white dark:border-slate-800 ${isApproved ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-orange-500 animate-pulse'}`}></div>
                        </div>
                        <div>
                          <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">{scholar.full_name}</h3>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                             Node UID: {scholar.id.toUpperCase().substring(0, 8)} • {isApproved ? 'Synchronized' : 'Handshake Pending'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {!isApproved ? (
                          <div className="px-5 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-orange-100 dark:border-orange-800/40">In Admin Queue</div>
                        ) : (
                          <div className={`p-4 rounded-2xl transition-all ${isExpanded ? 'bg-purple-600 text-white rotate-180' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 group-hover:text-purple-600'}`}>
                             <ChevronDown size={20} />
                          </div>
                        )}
                      </div>
                    </div>

                    {isExpanded && selectedScholarData && (
                      <div className="border-t border-slate-50 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/20 animate-in slide-in-from-top-4 duration-500">
                         <div className="flex border-b border-slate-50 dark:border-slate-700 px-8">
                            {[
                              { id: 'progress', label: 'Curriculum Mastery', icon: GraduationCap },
                              { id: 'assignments', label: 'Academic Tasks', icon: ClipboardList },
                              { id: 'attendance', label: 'Lecture Presence', icon: UserCheck },
                              { id: 'billing', label: 'Tuition Ledger', icon: CreditCard },
                            ].map(tab => (
                              <button
                                key={tab.id}
                                onClick={() => setScholarDetailTab(tab.id as any)}
                                className={`py-6 px-6 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border-b-2 transition-all ${
                                  scholarDetailTab === tab.id 
                                  ? 'text-purple-600 border-purple-600' 
                                  : 'text-slate-400 border-transparent hover:text-slate-600'
                                }`}
                              >
                                <tab.icon size={14} /> {tab.label}
                              </button>
                            ))}
                         </div>
                         <div className="p-10 min-h-[400px]">
                            {scholarDetailTab === 'progress' && (
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
                                  {selectedScholarData.enrollments.map(e => (
                                     <div key={e.id} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm group">
                                        <div className="flex justify-between items-start mb-6">
                                           <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                              <BookOpen size={20} />
                                           </div>
                                           <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Course ID: {e.course_id.substring(0, 8)}</span>
                                        </div>
                                        <h4 className="text-lg font-black mb-6 leading-tight">{e.course?.title}</h4>
                                        <div className="space-y-4">
                                           <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                              <span>Scholar Progress</span>
                                              <span className="text-purple-600">{e.progress_percentage}% Mastery</span>
                                           </div>
                                           <div className="h-3 bg-slate-100 dark:bg-slate-900 rounded-full p-0.5 overflow-hidden border border-slate-50 dark:border-slate-800">
                                              <div 
                                                className="h-full bg-purple-gradient rounded-full shadow-[0_0_10px_rgba(138,3,170,0.3)] transition-all duration-1000" 
                                                style={{ width: `${e.progress_percentage}%` }}
                                              ></div>
                                           </div>
                                        </div>
                                     </div>
                                  ))}
                               </div>
                            )}
                         </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ParentDashboard;
