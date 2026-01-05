
import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { supabaseMock } from '../services/supabaseMock';
import { History, PlayCircle, FileText, Search, Video, Download, X, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { ClassSession } from '../types';

const StudentRecordings: React.FC = () => {
  const session = supabaseMock.auth.getSession();
  const [sessions, setSessions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSess, setSelectedSess] = useState<any | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      // Fix: Await the async data fetch
      supabaseMock.db.getStudentSessions(session.user.id).then(setSessions);
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
      <div className="max-w-6xl mx-auto space-y-10">
        {!selectedSess ? (
          <>
            <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none"><History size={160} /></div>
              <div className="relative z-10">
                <h1 className="text-4xl font-black tracking-tight mb-2">Class Archives</h1>
                <p className="text-slate-400 font-medium">Revisit past lectures, search transcripts, and master curriculum nodes.</p>
              </div>
              <div className="w-16 h-16 bg-purple-gradient rounded-3xl flex items-center justify-center shadow-lg relative z-10">
                <Video size={28} />
              </div>
            </div>

            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                placeholder="Search archived lectures..."
                className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none font-bold text-sm focus:border-purple-500 transition-all shadow-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredSessions.map((sess) => (
                <div key={sess.id} className="bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 group flex flex-col">
                   <div className="aspect-video relative overflow-hidden">
                      <img src={sess.course?.thumbnail_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100" />
                      <div className="absolute inset-0 flex items-center justify-center">
                         <button onClick={() => setSelectedSess(sess)} className="w-16 h-16 bg-white/90 dark:bg-slate-900/90 rounded-2xl flex items-center justify-center text-purple-600 shadow-xl transition-all transform group-hover:scale-110">
                            <PlayCircle size={32} />
                         </button>
                      </div>
                      <div className="absolute top-4 left-4 px-3 py-1 bg-slate-900/80 backdrop-blur rounded-lg text-[9px] font-black uppercase text-white">Playback Ready</div>
                   </div>
                   <div className="p-8 space-y-4 flex-1">
                      <p className="text-[10px] font-black uppercase text-purple-600 tracking-widest">{sess.course?.title}</p>
                      <h3 className="text-xl font-black leading-tight line-clamp-1">{sess.lesson?.title || 'Live Recording Archive'}</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{new Date(sess.created_at).toLocaleDateString()} • Global Node</p>
                      
                      <div className="pt-4 flex gap-2">
                         <button onClick={() => setSelectedSess(sess)} className="flex-1 py-3 bg-slate-900 text-white dark:bg-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-purple-600 transition-all">Watch Session</button>
                         <button onClick={() => setSelectedSess(sess)} className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-400 hover:text-purple-600"><FileText size={18} /></button>
                      </div>
                   </div>
                </div>
              ))}
              {filteredSessions.length === 0 && (
                <div className="col-span-full py-40 text-center bg-slate-50 dark:bg-slate-900/30 rounded-[3rem] border-4 border-dashed border-slate-100 dark:border-slate-800">
                  <Video size={64} className="mx-auto mb-6 text-slate-200" />
                  <p className="font-black text-slate-300 uppercase tracking-widest text-xs italic">No recordings found for your curriculums</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
             <button onClick={() => setSelectedSess(null)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-purple-600 transition-colors">
                <ArrowLeft size={14} /> Back to Archives
             </button>

             <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                <div className="xl:col-span-2 space-y-8">
                   <div className="aspect-video bg-black rounded-[3.5rem] overflow-hidden shadow-2xl relative group ring-1 ring-white/10">
                      <video controls className="w-full h-full" src={selectedSess.recording_url}></video>
                      <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button className="px-5 py-2.5 bg-white/10 backdrop-blur rounded-xl text-white text-[9px] font-black uppercase tracking-widest border border-white/20 flex items-center gap-2"><Download size={14} /> Download</button>
                      </div>
                   </div>

                   <div className="p-10 bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-8 border-b border-slate-50 dark:border-slate-800">
                         <div>
                            <p className="text-[10px] font-black uppercase text-purple-600 tracking-widest mb-2">Subject Node Recording</p>
                            <h2 className="text-3xl font-black">{selectedSess.lesson?.title || 'Curriculum Lecture'}</h2>
                         </div>
                         <div className="flex gap-4">
                            <div className="text-right">
                               <p className="text-[9px] font-black uppercase text-slate-400">Archived Date</p>
                               <p className="text-sm font-bold">{new Date(selectedSess.created_at).toLocaleDateString()}</p>
                            </div>
                         </div>
                      </div>
                      <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{selectedSess.course?.description}</p>
                   </div>
                </div>

                <div className="xl:col-span-1 space-y-8">
                   <div className="bg-slate-50 dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 flex flex-col h-[700px] overflow-hidden">
                      <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50">
                         <h3 className="text-xl font-black flex items-center gap-3"><Sparkles size={20} className="text-purple-600" /> AI Transcript</h3>
                         <div className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[9px] font-black uppercase">Searchable</div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                         <div className="prose prose-slate dark:prose-invert max-w-none">
                            <p className="text-md leading-relaxed text-slate-600 dark:text-slate-400 font-medium whitespace-pre-wrap">
                               {selectedSess.transcript}
                            </p>
                         </div>
                      </div>
                      <div className="p-6 bg-slate-100/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                         <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input placeholder="Search keywords in lecture..." className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border-2 border-transparent focus:border-purple-500 rounded-xl text-xs font-bold outline-none transition-all" />
                         </div>
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

export default StudentRecordings;
