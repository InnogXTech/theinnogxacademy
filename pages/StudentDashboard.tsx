import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { 
  Flame, BookOpen, PlayCircle,
  Loader2, ArrowRight,
  Lock, CreditCard, ShieldCheck, Info, Compass, ChevronRight
} from 'lucide-react';
import { supabaseMock } from '../services/supabaseMock';

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const s = await supabaseMock.auth.getSession();
        if (!s || !mounted) return;
        setSession(s);
        
        const [e, courses] = await Promise.all([
          supabaseMock.db.getStudentEnrollments(s.user.id),
          supabaseMock.db.getCourses()
        ]);
        
        if (mounted) {
          setEnrollments(Array.isArray(e) ? e : []);
          setAllCourses(Array.isArray(courses) ? courses : []);
        }
      } catch (err) {
        console.error("Dashboard Node Sync Error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  // Ultimate null-safety for primary enrollment data
  const primaryEnrollment = useMemo(() => {
    return Array.isArray(enrollments) && enrollments.length > 0 ? enrollments[0] : null;
  }, [enrollments]);

  const isFullyPaid = primaryEnrollment?.payment_verified || false;
  const isPartiallyPaid = (Number(primaryEnrollment?.amount_paid) || 0) > 0;

  if (loading) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
        <div className="relative">
          <Loader2 className="animate-spin text-purple-600" size={32} />
          <div className="absolute inset-0 bg-purple-500/10 blur-xl rounded-full"></div>
        </div>
        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Syncing Dashboard Node...</p>
      </div>
    </DashboardLayout>
  );

  const rawName = session?.user?.full_name || session?.user?.user_metadata?.full_name || 'Scholar';
  const displayName = typeof rawName === 'string' ? rawName : 'Scholar';
  const firstName = displayName.split(' ')[0] || 'Scholar';

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 lg:space-y-10 pb-16">
        <section className={`${isFullyPaid ? 'bg-purple-gradient' : 'bg-slate-900'} p-6 lg:p-12 rounded-[1.8rem] lg:rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-6`}>
          <div className="relative z-10 space-y-3 lg:space-y-6 w-full text-center md:text-left">
            <h1 className="text-2xl lg:text-5xl font-black tracking-tight leading-tight">
              {primaryEnrollment 
                ? (isFullyPaid ? `Accelerate, ${firstName}!` : isPartiallyPaid ? `Keep Going, ${firstName}` : `Verification Required, ${firstName}`)
                : `Welcome, ${firstName}.`}
            </h1>
            <p className="text-xs lg:text-lg opacity-80 font-medium max-w-2xl mx-auto md:mx-0">
              {primaryEnrollment 
                ? (isFullyPaid 
                  ? 'Your tech experience is synchronized. Access the full strategic core below.' 
                  : isPartiallyPaid 
                  ? 'Great progress. Complete your remaining installments to fully unlock the InnogX archive.'
                  : 'Your curriculum path is selected. Finalize your tuition to synchronize with live classes.')
                : 'Your journey begins now. Explore our curriculum vault to take your career to another level.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start pt-2">
               {isFullyPaid ? (
                 <button onClick={() => navigate('/dashboard/student/my-courses')} className="w-full sm:w-auto px-6 py-3.5 lg:px-10 lg:py-5 bg-white text-purple-700 rounded-xl lg:rounded-2xl font-black text-[9px] lg:text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">
                   <PlayCircle size={14} /> Resume Learning
                 </button>
               ) : primaryEnrollment ? (
                 <button onClick={() => navigate('/dashboard/student/payments')} className="w-full sm:w-auto px-6 py-3.5 lg:px-10 lg:py-5 bg-[#3bb75e] text-white rounded-xl lg:rounded-2xl font-black text-[9px] lg:text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">
                   <CreditCard size={14} /> {isPartiallyPaid ? 'Complete Payment' : 'Verify Access Node'}
                 </button>
               ) : (
                 <button onClick={() => navigate('/courses')} className="w-full sm:w-auto px-6 py-3.5 lg:px-10 lg:py-5 bg-purple-gradient text-white rounded-xl lg:rounded-2xl font-black text-[9px] lg:text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 border border-white/10">
                    <Compass size={14} /> View Curriculum Vault
                 </button>
               )}
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 lg:top-0 lg:right-0 p-8 lg:p-12 opacity-10 lg:opacity-20 pointer-events-none">
             {isFullyPaid ? <ShieldCheck size={120} className="lg:w-[180px] lg:h-[180px]" /> : primaryEnrollment ? <Lock size={120} className="lg:w-[180px] lg:h-[180px]" /> : <Compass size={120} className="lg:w-[180px] lg:h-[180px]" />}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          <div className="lg:col-span-8 space-y-4 lg:space-y-8">
             <h2 className="text-lg lg:text-2xl font-black flex items-center gap-2 lg:gap-3 px-1">
                <BookOpen size={18} className="text-purple-600" /> {primaryEnrollment ? 'Ongoing Path' : 'Suggested Career Nodes'}
             </h2>
             
             {primaryEnrollment ? (
               <div className="bg-white dark:bg-slate-800 p-4 lg:p-10 rounded-[1.8rem] lg:rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 lg:gap-8 items-center relative overflow-hidden">
                  <img src={primaryEnrollment?.course?.thumbnail_url || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80'} className="w-full md:w-56 lg:w-64 aspect-video rounded-xl lg:rounded-3xl object-cover" alt="" />
                  <div className="flex-1 space-y-2 lg:space-y-4 text-center md:text-left">
                     <h3 className="text-lg lg:text-3xl font-black">{primaryEnrollment?.course?.title || 'Active Track'}</h3>
                     <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 lg:gap-3">
                        <span className={`px-2 py-0.5 lg:px-4 lg:py-1.5 rounded-full text-[8px] lg:text-[10px] font-black uppercase tracking-widest ${isFullyPaid ? 'bg-green-100 text-green-600' : isPartiallyPaid ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                           {isFullyPaid ? 'Verified' : isPartiallyPaid ? 'Partially Verified' : 'Action Required'}
                        </span>
                        {!isFullyPaid && (
                           <button onClick={() => navigate('/dashboard/student/payments')} className="text-purple-600 font-black text-[10px] lg:text-xs hover:underline flex items-center gap-1">
                              {isPartiallyPaid ? 'Complete Verification' : 'Unlock Now'} <ArrowRight size={12} />
                           </button>
                        )}
                     </div>
                  </div>
               </div>
             ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                  {Array.isArray(allCourses) && allCourses.slice(0, 4).map(course => (
                    <div key={course.id} className="bg-white dark:bg-slate-800 p-4 lg:p-6 rounded-[1.8rem] lg:rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col gap-3 group">
                       <div className="aspect-video rounded-xl lg:rounded-2xl overflow-hidden relative">
                          <img src={course.thumbnail_url || ''} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                          <div className="absolute top-2 right-2 lg:top-3 lg:right-3 px-2 py-0.5 bg-white/90 backdrop-blur rounded-md text-[7px] lg:text-[8px] font-black">
                            ₦{Number(course.price)?.toLocaleString() || '0'}
                          </div>
                       </div>
                       <h4 className="font-black text-sm lg:text-lg line-clamp-1">{course.title}</h4>
                       <button onClick={() => navigate('/courses')} className="w-full py-2.5 lg:py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-lg lg:rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-purple-600 transition-colors">
                          Initialize Node <ChevronRight size={12} />
                       </button>
                    </div>
                  ))}
               </div>
             )}
          </div>

          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-4 lg:gap-10">
            <div className="flex-1 bg-white dark:bg-slate-800 p-6 lg:p-10 rounded-[1.8rem] lg:rounded-[3rem] border border-slate-100 dark:border-slate-700 text-center shadow-sm">
              <div className="w-12 h-12 lg:w-20 lg:h-20 bg-orange-100 dark:bg-orange-900/30 text-orange-500 rounded-xl lg:rounded-[2rem] flex items-center justify-center mx-auto mb-3 lg:mb-6 shadow-inner">
                <Flame size={24} fill="currentColor" className="animate-pulse lg:w-12 lg:h-12" />
              </div>
              <h3 className="text-2xl lg:text-4xl font-black text-slate-900 dark:text-white mb-0.5 tracking-tighter">0 DAYS</h3>
              <p className="text-slate-400 text-[8px] lg:text-[10px] font-black uppercase tracking-[0.2em]">Excellence Streak</p>
            </div>
            
            <div className="flex-1 bg-slate-900 p-5 lg:p-8 rounded-2xl lg:rounded-[2.5rem] border border-white/5 text-white">
               <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3 lg:mb-6 flex items-center gap-2"><Info size={12} /> InnogX Protocol</h4>
               <p className="text-xs lg:text-sm font-medium opacity-70 leading-relaxed">
                  Your journey to taking your career to another level is protected. Maintain your streak to unlock the ultimate tech experience.
               </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;