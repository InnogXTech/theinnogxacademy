
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { supabaseMock } from '../services/supabaseMock';
import { 
  BookOpen, PlayCircle, Trophy, 
  ChevronRight, AlertCircle, GraduationCap,
  Clock, CheckCircle, Award, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MyCourses: React.FC = () => {
  const navigate = useNavigate();
  const session = supabaseMock.auth.getSession();
  const [enrollments, setEnrollments] = useState<any[]>([]);

  useEffect(() => {
    if (session?.user?.id) {
      supabaseMock.db.getStudentEnrollments(session.user.id).then(setEnrollments);
    }
  }, [session?.user?.id]);

  const handleDownloadCertificate = (courseTitle: string) => {
    alert(`Generating Excellence Certificate for ${courseTitle}...\nThis node is now globally verified.`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-12 pb-20">
        {/* Header */}
        <div className="bg-purple-gradient p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <GraduationCap size={240} />
          </div>
          <div className="relative z-10 space-y-4">
            <h1 className="text-4xl font-black tracking-tight">Your Academic Path</h1>
            <p className="text-purple-100 font-medium max-w-xl">Continue mastering your chosen curriculum and tracking your progress toward certification.</p>
          </div>
        </div>

        {/* Enrolled Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {enrollments.map((e) => {
            const isCompleted = e.progress_percentage === 100;
            return (
              <div key={e.id} className={`bg-white dark:bg-slate-800 rounded-[3rem] border transition-all duration-500 overflow-hidden shadow-sm hover:shadow-2xl flex flex-col group ${isCompleted ? 'border-yellow-400 dark:border-yellow-600 ring-2 ring-yellow-400/20' : 'border-slate-100 dark:border-slate-700'}`}>
                <div className="aspect-video relative overflow-hidden">
                  <img src={e.course?.thumbnail_url} className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${isCompleted ? 'grayscale-[0.5]' : ''}`} alt="" />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     {isCompleted ? <Award size={64} className="text-yellow-400 drop-shadow-2xl animate-pulse" /> : <PlayCircle size={64} className="text-white drop-shadow-2xl" />}
                  </div>
                  {isCompleted && (
                    <div className="absolute top-4 left-4 px-4 py-1.5 bg-yellow-400 text-slate-900 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl">
                      <ShieldCheck size={14} /> EXCELLENCE MASTERED
                    </div>
                  )}
                </div>
                
                <div className="p-10 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white line-clamp-1">{e.course?.title}</h3>
                    <div className="flex items-center gap-1.5 text-purple-600">
                      {isCompleted ? <Trophy size={16} className="text-yellow-500" /> : <BookOpen size={16} />}
                    </div>
                  </div>

                  <div className="space-y-6 mt-auto">
                     <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <span>Mastery Progress</span>
                          <span className={isCompleted ? 'text-green-500 font-black' : 'text-purple-600'}>{e.progress_percentage}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${isCompleted ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-purple-gradient'}`}
                            style={{ width: `${e.progress_percentage}%` }}
                          ></div>
                        </div>
                     </div>

                     {isCompleted ? (
                       <button 
                        onClick={() => handleDownloadCertificate(e.course?.title)}
                        className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl shadow-yellow-400/20"
                       >
                         <Award size={16} /> Download Excellence Certificate
                       </button>
                     ) : (
                       <button 
                        onClick={() => navigate(`/courses/${e.course_id}`)}
                        className="w-full py-4 bg-slate-900 text-white dark:bg-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-purple-600 transition-all flex items-center justify-center gap-2"
                       >
                         Resume Learning <ChevronRight size={14} />
                       </button>
                     )}
                  </div>
                </div>
              </div>
            );
          })}

          {enrollments.length === 0 && (
            <div className="col-span-full py-40 text-center bg-slate-50 dark:bg-slate-900/30 rounded-[3rem] border-4 border-dashed border-slate-100 dark:border-slate-800">
              <AlertCircle size={64} className="mx-auto mb-6 text-slate-200" />
              <h3 className="text-2xl font-black text-slate-300">You haven't started any curriculum yet</h3>
              <p className="text-slate-400 font-medium mt-2 mb-10">Visit the catalog to choose your tech path.</p>
              <button 
                onClick={() => navigate('/courses')}
                className="px-8 py-4 bg-purple-gradient text-white rounded-2xl font-black text-xs uppercase tracking-widest"
              >
                Browse Curriculum
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyCourses;
