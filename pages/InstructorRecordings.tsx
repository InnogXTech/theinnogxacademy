
import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { supabaseMock } from '../services/supabaseMock';
import { History, PlayCircle, FileText, Search, Video, Download, ArrowLeft, Monitor } from 'lucide-react';

const InstructorRecordings: React.FC = () => {
  const session = supabaseMock.auth.getSession();
  const [sessions, setSessions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSess, setSelectedSess] = useState<any | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      // Fix: Await the async data fetch
      supabaseMock.db.getInstructorSessions(session.user.id).then(setSessions);
    }
  }, [session?.user?.id]);

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => 
      s.course?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.lesson?.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sessions, searchTerm]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-10">
        {!selectedSess ? (
          <>
            <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><History size={160} /></div>
              <div className="relative z-10">
                <h1 className="text-4xl font-black tracking-tight mb-2">Teaching Archives</h1>
                <p className="text-slate-500 font-medium">Revisit your past lectures, evaluate transcripts, and prepare for scholar reviews.</p>
              </div>
              <div className="w-16 h-16 bg-purple-gradient rounded-[2rem] flex items-center justify-center text-white shadow-xl relative z-10">
                <Video size={28} />
              </div>
            </div>

            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                placeholder="Search your records..."
                className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none font-bold text-sm focus:border-purple-500 transition-all shadow-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredSessions.map((sess) => (
                <div key={sess.id} className="bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col group">
                   <div className="aspect-video relative overflow-hidden bg-slate-50 dark:bg-slate-900">
                      <img src={sess.course?.thumbnail_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all" alt="" />
                      <div className="absolute inset-0 flex items-center justify-center">
                         <button onClick={() => setSelectedSess(sess)} className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-purple-600 shadow-xl group-hover:scale-110 transition-transform">
                            <PlayCircle size={28} />
                         </button>
                      </div>
                   </div>
                   <div className="p-8 flex-1 flex flex-col">
                      <p className="text-[10px] font-black uppercase text-purple-600 tracking-widest mb-3">{sess.course?.title}</p>
                      <h3 className="text-xl font-black leading-tight mb-6 line-clamp-2">{sess.lesson?.title}</h3>
                      <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-700">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(sess.created_at).toLocaleDateString()}</p>
                         <button onClick={() => setSelectedSess(sess)} className="text-[10px] font-black uppercase text-purple-600 hover:text-purple-400 flex items-center gap-2">View Transcript <ArrowLeft size={14} className="rotate-180" /></button>
                      </div>
                   </div>
                </div>
              ))}
              {filteredSessions.length === 0 && (
                <div className="col-span-full py-40 text-center opacity-30 flex flex-col items-center">
                  <Monitor size={64} className="mb-4 text-slate-200" />
                  <p className="font-black uppercase tracking-[0.2em] text-xs">No teaching archives found</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
             <button onClick={() => setSelectedSess(null)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-purple-600 transition-colors">
                <ArrowLeft size={14} /> Back to Archives
             </button>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                   <div className="aspect-video bg-black rounded-[3.5rem] overflow-hidden shadow-2xl relative border border-slate-100 dark:border-slate-800">
                      <video controls className="w-full h-full" src={selectedSess.recording_url}></video>
                   </div>
                   <div className="p-10 bg-white dark:bg-slate-800 rounded-[3.5rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                      <p className="text-[10px] font-black uppercase text-purple-600 tracking-widest mb-2">Lesson Context</p>
                      <h2 className="text-3xl font-black">{selectedSess.lesson?.title}</h2>
                   </div>
                </div>
                <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-slate-700 flex flex-col h-[650px] shadow-sm">
                   <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <h3 className="text-xl font-black flex items-center gap-3"><FileText size={20} className="text-purple-600" /> Archive Transcript</h3>
                      <button className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-400"><Download size={16} /></button>
                   </div>
                   <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                      <div className="prose prose-slate dark:prose-invert">
                         <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-medium whitespace-pre-wrap">{selectedSess.transcript}</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InstructorRecordings;
