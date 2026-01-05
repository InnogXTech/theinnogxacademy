
import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { supabaseMock } from '../services/supabaseMock';
import { 
  History, PlayCircle, FileText, Search, Video, 
  Download, ArrowLeft, Monitor, Trash2, Calendar, 
  Filter, Layers, Clock, ChevronDown, ChevronRight
} from 'lucide-react';

type GroupMode = 'all' | 'batch' | 'month' | 'week';

const AdminRecordings: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSess, setSelectedSess] = useState<any | null>(null);
  const [groupMode, setGroupMode] = useState<GroupMode>('all');

  useEffect(() => {
    // Fix: Await the async data fetch
    supabaseMock.db.getAllSessions().then(setSessions);
  }, []);

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => 
      s.course?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.lesson?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.instructor?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sessions, searchTerm]);

  const getWeekNumber = (d: Date) => {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };

  const groupedSessions = useMemo(() => {
    if (groupMode === 'all') return { "All Recordings": filteredSessions };

    const groups: Record<string, any[]> = {};
    
    filteredSessions.forEach(sess => {
      let key = "Uncategorized";
      const date = new Date(sess.created_at);

      if (groupMode === 'batch') {
        key = sess.course?.batch || "General Cohort";
      } else if (groupMode === 'month') {
        key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      } else if (groupMode === 'week') {
        key = `Week ${getWeekNumber(date)}, ${date.getFullYear()}`;
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(sess);
    });

    return groups;
  }, [filteredSessions, groupMode]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-10">
        {!selectedSess ? (
          <>
            <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8 border border-white/5">
              <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none"><Video size={160} /></div>
              <div className="relative z-10">
                <h1 className="text-4xl font-black tracking-tight mb-2">Global Archive Registry</h1>
                <p className="text-slate-400 font-medium">Review and manage platform-wide lectures grouped by timelines or batches.</p>
              </div>
              <div className="px-8 py-5 bg-white/10 backdrop-blur rounded-[2rem] border border-white/10 text-center relative z-10">
                 <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Active Archives</p>
                 <p className="text-3xl font-black">{sessions.length}</p>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  placeholder="Search by instructor, curriculum..."
                  className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none font-bold text-sm focus:border-purple-500 transition-all shadow-sm"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                 {[
                   { id: 'all', label: 'Flat View', icon: Filter },
                   { id: 'batch', label: 'By Batch', icon: Layers },
                   { id: 'month', label: 'By Month', icon: Calendar },
                   { id: 'week', label: 'By Week', icon: Clock },
                 ].map(mode => (
                   <button
                     key={mode.id}
                     onClick={() => setGroupMode(mode.id as GroupMode)}
                     className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                       groupMode === mode.id ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                     }`}
                   >
                     <mode.icon size={14} /> {mode.label}
                   </button>
                 ))}
              </div>
            </div>

            <div className="space-y-12">
               {/* Fix: Grouped sessions mapping */}
               {(Object.entries(groupedSessions) as [string, any[]][]).map(([groupTitle, items]) => (
                  <div key={groupTitle} className="space-y-6">
                     <div className="flex items-center gap-4">
                        <div className="h-0.5 flex-1 bg-slate-100 dark:bg-slate-800"></div>
                        <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 bg-slate-50 dark:bg-slate-900 px-4 py-1.5 rounded-full border border-slate-100 dark:border-slate-800">{groupTitle} ({items.length})</h2>
                        <div className="h-0.5 flex-1 bg-slate-100 dark:bg-slate-800"></div>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {items.map((sess) => (
                           <div key={sess.id} className="bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col group">
                              <div className="aspect-video relative overflow-hidden bg-slate-100 dark:bg-slate-900">
                                 <img src={sess.course?.thumbnail_url} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" alt="" />
                                 <div className="absolute inset-0 flex items-center justify-center">
                                    <button onClick={() => setSelectedSess(sess)} className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-purple-600 shadow-xl scale-90 group-hover:scale-100 transition-transform">
                                       <PlayCircle size={28} />
                                    </button>
                                 </div>
                                 <div className="absolute top-4 left-4">
                                    <span className="px-3 py-1 bg-slate-900/80 backdrop-blur rounded-lg text-[8px] font-black uppercase text-white border border-white/10">{sess.course?.batch || 'Standard'}</span>
                                 </div>
                              </div>
                              <div className="p-8 space-y-4">
                                 <div className="flex items-center gap-2 text-[10px] font-black uppercase text-purple-600 tracking-widest">
                                    <Monitor size={12} /> {sess.course?.title}
                                 </div>
                                 <h3 className="text-xl font-black leading-tight line-clamp-1">{sess.lesson?.title}</h3>
                                 <div className="flex justify-between items-center pt-4 border-t border-slate-50 dark:border-slate-700">
                                    <div>
                                       <p className="text-[10px] font-black uppercase text-slate-400">Mentor</p>
                                       <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{sess.instructor?.full_name}</p>
                                    </div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(sess.created_at).toLocaleDateString()}</p>
                                 </div>
                                 <div className="flex gap-2 mt-4">
                                    <button onClick={() => setSelectedSess(sess)} className="flex-1 py-3 bg-slate-900 text-white dark:bg-slate-700 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-purple-600 transition-colors">Review Session</button>
                                    <button className="p-3 text-slate-300 hover:text-red-500 transition-colors bg-slate-50 dark:bg-slate-900 rounded-xl"><Trash2 size={16} /></button>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               ))}
               {filteredSessions.length === 0 && (
                  <div className="py-40 text-center opacity-30 flex flex-col items-center">
                     <Video size={64} className="mb-4" />
                     <p className="font-black uppercase tracking-[0.2em] text-xs">No records found matching criteria</p>
                  </div>
               )}
            </div>
          </>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
             <button onClick={() => setSelectedSess(null)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-purple-600 transition-colors">
                <ArrowLeft size={14} /> Back to Registry
             </button>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                   <div className="aspect-video bg-black rounded-[3.5rem] overflow-hidden shadow-2xl relative border border-white/5">
                      <video controls className="w-full h-full" src={selectedSess.recording_url}></video>
                   </div>
                   <div className="p-10 bg-white dark:bg-slate-800 rounded-[3.5rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                      <h2 className="text-3xl font-black mb-6">{selectedSess.lesson?.title}</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-slate-50 dark:border-slate-700">
                         <div><p className="text-[10px] font-black uppercase text-slate-400">Curriculum</p><p className="text-sm font-bold text-purple-600">{selectedSess.course?.title}</p></div>
                         <div><p className="text-[10px] font-black uppercase text-slate-400">Batch Node</p><p className="text-sm font-bold">{selectedSess.course?.batch || 'N/A'}</p></div>
                         <div><p className="text-[10px] font-black uppercase text-slate-400">Archived Date</p><p className="text-sm font-bold">{new Date(selectedSess.created_at).toLocaleDateString()}</p></div>
                         <div><p className="text-[10px] font-black uppercase text-slate-400">Instructor</p><p className="text-sm font-bold">{selectedSess.instructor?.full_name}</p></div>
                      </div>
                   </div>
                </div>
                <div className="lg:col-span-1 bg-slate-50 dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-700 flex flex-col h-[700px]">
                   <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <h3 className="text-xl font-black flex items-center gap-3"><FileText size={20} className="text-purple-600" /> Lesson Transcript</h3>
                      <button className="p-2.5 text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 rounded-xl shadow-sm"><Download size={16} /></button>
                   </div>
                   <div className="flex-1 overflow-y-auto p-8 custom-scrollbar prose prose-slate dark:prose-invert">
                      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-medium whitespace-pre-wrap">{selectedSess.transcript}</p>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminRecordings;
