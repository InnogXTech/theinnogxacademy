
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabaseMock } from '../services/supabaseMock';
import { 
  ArrowLeft, CheckCircle, ChevronRight, 
  Book, FileText, 
  PlayCircle,
  Trophy, X, Clock,
  ClipboardCheck, Video, Monitor, 
  History, Lock, Menu
} from 'lucide-react';
import { Assignment, ClassSession } from '../types';

const CourseViewer: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const session = supabaseMock.auth.getSession();
  
  const [course, setCourse] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'quiz' | 'assignments' | 'archives'>('content');
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  
  const [sessions, setSessions] = useState<ClassSession[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (courseId && session?.user?.id) {
        const [c, m, a, s, studentEnrollments] = await Promise.all([
          supabaseMock.db.getCourse(courseId),
          supabaseMock.db.getModules(courseId),
          supabaseMock.db.getAssignmentsByCourse(courseId),
          supabaseMock.db.getClassSessions(courseId),
          supabaseMock.db.getStudentEnrollments(session.user.id)
        ]);
        
        const e = studentEnrollments.find((en: any) => en.course_id === courseId);
        
        setCourse(c);
        setEnrollment(e);
        setModules(m);
        setSessions(s);

        if (m.length > 0) {
          const lessons = await supabaseMock.db.getLessons(m[0].id);
          if (lessons.length > 0) handleLessonSelect(lessons[0]);
        }
      }
    };
    fetchData();
  }, [courseId, session?.user?.id]);

  const handleJoinClass = () => {
    if (!enrollment?.payment_verified) return;
    window.open(course.google_meet_link, '_blank');
  };

  const handleLessonSelect = async (lesson: any) => {
    setCurrentLesson(lesson);
    if (activeTab === 'quiz') setActiveTab('content');
    setIsSidebarVisible(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!course) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col lg:flex-row font-sans transition-colors duration-500 overflow-x-hidden">
      <aside className={`fixed lg:relative inset-y-0 left-0 z-50 w-80 sm:w-[360px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 lg:transform-none ${isSidebarVisible ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-5 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 sticky top-0 z-30 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard/student/my-courses')} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
              <ArrowLeft size={16} className="text-slate-500" />
            </button>
            <div className="min-w-0">
              <h1 className="font-black text-[9px] sm:text-xs truncate uppercase tracking-wider">{course.title}</h1>
              <p className="text-[7px] sm:text-[8px] text-purple-600 font-black uppercase tracking-[0.2em] mt-0.5">Academic Track</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarVisible(false)} className="lg:hidden p-2 text-slate-400"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar h-[calc(100vh-80px)]">
          {modules.map((m: any, idx: number) => (
            <div key={m.id} className="border-b border-slate-100 dark:border-slate-800/40">
              <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/20 text-[8px] sm:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex justify-between items-center">
                <span>Module {idx + 1}: {m.title}</span>
                <Book size={10} />
              </div>
              <div className="py-1">
                 <LessonList moduleId={m.id} currentLessonId={currentLesson?.id} onSelect={handleLessonSelect} />
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-x-hidden">
        <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-40">
           <button onClick={() => setIsSidebarVisible(true)} className="p-2 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-lg"><Menu size={18} /></button>
           <h2 className="text-[10px] font-black uppercase tracking-widest truncate max-w-[200px]">{currentLesson?.title}</h2>
           <div className="w-8"></div>
        </div>

        <div className="h-[25vh] xs:h-[35vh] lg:h-[55vh] w-full bg-slate-900 dark:bg-black relative shadow-2xl overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
             {enrollment?.payment_verified ? (
                <div className="space-y-4 animate-in zoom-in-95 duration-700 max-w-sm">
                   <button 
                     onClick={handleJoinClass}
                     className="w-14 h-14 sm:w-20 sm:h-20 bg-purple-gradient rounded-2xl sm:rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl hover:scale-110 transition-all mb-4"
                   >
                     <Video className="w-6 h-6 sm:w-10 sm:h-10" />
                   </button>
                   <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight">Virtual Learning Node</h3>
                   <button onClick={handleJoinClass} className="px-6 py-2.5 bg-white/10 backdrop-blur rounded-xl text-white text-[9px] font-black uppercase tracking-widest border border-white/20">Launch Live Meet</button>
                </div>
             ) : (
                <div className="space-y-4 max-w-xs">
                   <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 mx-auto"><Lock size={20} /></div>
                   <h3 className="text-sm font-black text-white uppercase tracking-widest">Node Locked</h3>
                   <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Tuition sync required for live access.</p>
                </div>
             )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 flex items-center gap-6 shadow-sm z-20 overflow-x-auto scrollbar-hide shrink-0 sticky top-0 lg:static">
          {[
            { id: 'content', label: 'Notes', icon: FileText },
            { id: 'archives', label: 'Archives', icon: History },
            { id: 'quiz', label: 'Evaluation', icon: Trophy },
            { id: 'assignments', label: 'Tasks', icon: ClipboardCheck }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border-b-2 transition-all relative whitespace-nowrap ${
                activeTab === tab.id 
                ? 'text-purple-600 border-purple-600' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" /> 
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-8 lg:p-12 bg-white dark:bg-slate-950 transition-colors custom-scrollbar">
          <div className="max-w-4xl mx-auto pb-12 lg:pb-24">
            {activeTab === 'content' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6 lg:space-y-12">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="min-w-0">
                    <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg text-[8px] font-black uppercase tracking-widest mb-2 inline-block">Lesson Node</span>
                    <h2 className="text-xl sm:text-4xl font-black tracking-tight leading-tight">{currentLesson?.title}</h2>
                  </div>
                </div>
                <div className="prose prose-slate dark:prose-invert max-w-none text-sm sm:text-xl lg:text-2xl leading-[1.6] text-slate-600 dark:text-slate-300 font-medium">
                  {currentLesson?.content}
                </div>
              </div>
            )}

            {activeTab === 'archives' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 animate-in fade-in duration-500">
                {sessions.map((sess) => (
                  <div key={sess.id} className="p-5 sm:p-8 bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:border-purple-300 cursor-pointer transition-all group">
                     <div className="flex justify-between items-start mb-4 lg:mb-6">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:bg-purple-600 group-hover:text-white transition-all"><Monitor size={18} /></div>
                        <span className="text-[7px] lg:text-[8px] font-black uppercase text-slate-400 tracking-widest">{new Date(sess.created_at).toLocaleDateString()}</span>
                     </div>
                     <h4 className="font-black text-xs sm:text-base leading-tight">Class Archive: {sess.id.substring(0,6).toUpperCase()}</h4>
                  </div>
                ))}
                {sessions.length === 0 && <div className="col-span-full py-20 text-center opacity-30 font-black uppercase text-[8px] tracking-widest">Registry Silent</div>}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const LessonList: React.FC<{ moduleId: string, currentLessonId: string, onSelect: (lesson: any) => void }> = ({ moduleId, currentLessonId, onSelect }) => {
  const [lessons, setLessons] = useState<any[]>([]);

  useEffect(() => {
    const fetchLessons = async () => {
      const data = await supabaseMock.db.getLessons(moduleId);
      setLessons(data);
    };
    fetchLessons();
  }, [moduleId]);

  return (
    <>
      {lessons.map((lesson: any) => (
        <button 
          key={lesson.id}
          onClick={() => onSelect(lesson)}
          className={`w-full px-5 sm:px-8 py-3.5 sm:py-5 flex items-center gap-3 sm:gap-4 transition-all text-left group relative ${
            currentLessonId === lesson.id 
            ? 'bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400' 
            : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
        >
          {currentLessonId === lesson.id && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-600"></div>
          )}
          <div className={`shrink-0 ${currentLessonId === lesson.id ? 'text-purple-600' : 'text-slate-300 dark:text-slate-600 group-hover:text-purple-400'}`}>
            <CheckCircle size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[11px] sm:text-sm font-bold truncate ${currentLessonId === lesson.id ? 'text-purple-700 dark:text-purple-300' : 'text-slate-600 dark:text-slate-400'}`}>{lesson.title}</p>
            <p className="text-[7px] sm:text-[8px] text-slate-400 font-black uppercase mt-0.5 flex items-center gap-1">
              <Clock size={8} /> {lesson.duration_minutes}M
            </p>
          </div>
          <PlayCircle size={12} className={`transition-opacity ${currentLessonId === lesson.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
        </button>
      ))}
    </>
  );
};

export default CourseViewer;
