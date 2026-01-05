import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseService, supabase } from '../services/supabase';
import { 
  Rocket, ChevronRight, 
  BookOpen, CreditCard, Loader2, Wallet, Layers, Info, Clock, Tag, ShieldCheck, CheckCircle,
  Command, Users, UserPlus, ShieldAlert, Cpu
} from 'lucide-react';
import { AppRole } from '../types';

const ACADEMY_COURSES = [
  { id: 'da-node-001', title: 'Data Analysis', duration: '4 - 7 Months', price: 150000, category: 'Data Science', icon_bg: 'bg-blue-500' },
  { id: 'cy-node-002', title: 'Cybersecurity', duration: '4 - 9 Months', price: 250000, category: 'Security', icon_bg: 'bg-red-500' },
  { id: 'wd-node-003', title: 'Web Development', duration: '6 - 7 Months', price: 180000, category: 'Software', icon_bg: 'bg-indigo-500' },
  { id: 'ma-node-004', title: 'Mobile App Development', duration: '7 Months', price: 200000, category: 'Software', icon_bg: 'bg-emerald-500' },
  { id: 'py-node-005', title: 'Python & Automation', duration: '6 Months', price: 150000, category: 'Development', icon_bg: 'bg-yellow-500' },
  { id: 'dm-node-006', title: 'Digital Marketing', duration: '4 - 6 Months', price: 120000, category: 'Marketing', icon_bg: 'bg-pink-500' },
  { id: 'pm-node-007', title: 'Project Management', duration: '4 - 6 Months', price: 140000, category: 'Management', icon_bg: 'bg-orange-500' },
  { id: 'fx-node-008', title: 'Forex Trading', duration: '4 - 6 Months', price: 180000, category: 'Finance', icon_bg: 'bg-green-500' },
  { id: 'cl-node-009', title: 'Computer Literacy', duration: '3 - 4 Months', price: 60000, category: 'Foundations', icon_bg: 'bg-slate-500' },
];

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [installmentPlan, setInstallmentPlan] = useState<1 | 2 | 3>(1);

  // Role identification from database (not email-based)
  const role = useMemo(() => {
    const user = session?.user;
    if (!user) return AppRole.STUDENT;
    
    const r = (user.user_metadata?.role || user.role || 'student').toLowerCase();
    if (r === 'instructor') return AppRole.INSTRUCTOR;
    if (r === 'parent') return AppRole.PARENT;
    if (r === 'admin') return AppRole.ADMIN;
    return AppRole.STUDENT;
  }, [session]);

  useEffect(() => {
    supabaseService.auth.getSession().then(s => {
      if (!s) return navigate('/landing');
      const u = s.user as any;
      
      const hasOnboarded = u.user_metadata?.has_onboarded === true || u.has_onboarded === true || localStorage.getItem(`innogx_verified_${u.id}`) === 'true';
      if (hasOnboarded) {
        const r = (u.user_metadata?.role || u.role || 'student').toLowerCase();
        return navigate(`/dashboard/${r}`, { replace: true });
      }

      setSession(s);
    });
  }, [navigate]);

  const finishOnboarding = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      // Mark as onboarded in DB and local state
      await Promise.all([
        supabase.from('profiles').update({ has_onboarded: true }).eq('id', session.user.id),
        supabase.auth.updateUser({ data: { has_onboarded: true } })
      ]);
      
      const cacheKey = 'innogx_user_session';
      const cached = JSON.parse(localStorage.getItem(cacheKey) || '{}');
      if (cached.user) {
        cached.user.has_onboarded = true;
        if (cached.user.user_metadata) cached.user.user_metadata.has_onboarded = true;
        localStorage.setItem(cacheKey, JSON.stringify(cached));
        localStorage.setItem(`innogx_verified_${session.user.id}`, 'true');
        window.dispatchEvent(new Event('storage'));
      }
      
      // Navigate straight to dashboard
      navigate(`/dashboard/${role}`, { replace: true });
    } catch (error) {
      console.error("Finalization error:", error);
      navigate(`/dashboard/${role}`, { replace: true });
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleSelectCourse = async (course: any) => {
    setSelectedCourse(course);
    if (role === AppRole.STUDENT) {
      await supabaseService.db.selectOnboardingCourse(session.user.id, course.id);
      setStep(3);
    } else {
      setStep(3);
    }
  };

  const handlePayNow = () => {
    if (!selectedCourse) return;
    navigate('/payment-gateway', { 
      state: { 
        type: 'enrollment',
        course: selectedCourse, 
        plan: installmentPlan,
        role: role
      } 
    });
  };

  if (!session) return null;
  const userName = session?.user?.user_metadata?.full_name || session?.user?.full_name || 'Scholar';

  // 1. STUDENT ONBOARDING FLOW
  if (role === AppRole.STUDENT) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 relative transition-colors duration-500">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3.5rem] shadow-2xl p-12 relative z-10 animate-in zoom-in-95 duration-500">
          
          {step === 1 && (
            <div className="space-y-10 text-center animate-in slide-in-from-bottom-8">
              <div className="w-24 h-24 bg-purple-gradient rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl">
                <Rocket size={40} className="animate-bounce" />
              </div>
              <div className="space-y-4">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-tight">Welcome to the InnogX Excellence Protocol</h1>
                <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-lg mx-auto">
                  Greetings, <span className="text-purple-600 font-black">{userName}</span>. We are honored to be your catalyst for global tech leadership. Your journey toward mastering world-class engineering starts now.
                </p>
              </div>
              <button onClick={() => setStep(2)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3">
                Initialize Mastery Path <ChevronRight size={18} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-right-8">
              <div className="text-center space-y-1">
                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Select the course you want to learn</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {ACADEMY_COURSES.map((course) => (
                  <button key={course.id} onClick={() => handleSelectCourse(course)} className="p-6 rounded-[2rem] border-2 border-slate-50 dark:border-slate-800 hover:border-purple-600 bg-white dark:bg-slate-900 transition-all flex items-center justify-between group shadow-sm">
                    <div className="flex items-center gap-5">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg ${course.icon_bg}`}><BookOpen size={24} /></div>
                      <div className="text-left">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[8px] font-black uppercase text-slate-500">{course.category}</span>
                        <p className="text-xl font-black text-slate-900 dark:text-white">{course.title}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-purple-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-10 animate-in zoom-in-95">
              <div className="text-center space-y-1">
                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Sync Strategy</h2>
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">Initialize payment frequency</p>
              </div>
              <div className="space-y-4">
                {[
                  { id: 1, label: 'Full Access', sub: 'Single Deployment', icon: CreditCard },
                  { id: 2, label: 'Dual Sync', sub: 'Two Phase Cycles', icon: Wallet },
                  { id: 3, label: 'Tri-Phase', sub: 'Three Stage Load', icon: Layers },
                ].map((plan) => (
                  <button key={plan.id} onClick={() => setInstallmentPlan(plan.id as 1|2|3)} className={`w-full p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between group ${installmentPlan === plan.id ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-900/10' : 'border-slate-100 dark:border-slate-800'}`}>
                    <div className="flex items-center gap-5">
                      <div className={`p-3 rounded-2xl ${installmentPlan === plan.id ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}><plan.icon size={20} /></div>
                      <div className="text-left">
                        <p className="font-black text-sm text-slate-900 dark:text-white">{plan.label}</p>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-0.5">{plan.sub}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-lg text-slate-900 dark:text-white">₦{(selectedCourse.price / plan.id).toLocaleString()}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-4">
                <button onClick={() => setStep(2)} className="flex-1 py-5 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">Back</button>
                <button onClick={() => setStep(4)} className="flex-[2] py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">Lock Strategy <ChevronRight size={18} /></button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-12 text-center animate-in slide-in-from-right-8">
              <div className="w-24 h-24 bg-purple-gradient rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl relative">
                <CreditCard size={40} />
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center text-white font-black text-xs">₦</div>
              </div>
              <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none uppercase">Execute Node Sync</h2>
              <div className="p-8 bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 text-left space-y-4">
                <div className="flex justify-between items-center text-[11px] font-black text-slate-400 uppercase tracking-widest"><span>Path</span><span className="text-slate-900 dark:text-white">{selectedCourse.title}</span></div>
                <div className="flex justify-between items-center text-[11px] font-black text-slate-400 uppercase tracking-widest"><span>Sync</span><span className="text-slate-900 dark:text-white">{installmentPlan}-Stage Cycle</span></div>
                <div className="h-px bg-slate-200 dark:bg-slate-800"></div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase text-purple-600 tracking-widest">Deposit Required</span>
                  <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">₦{(selectedCourse.price / installmentPlan).toLocaleString()}</span>
                </div>
              </div>
              <div className="space-y-4">
                <button onClick={handlePayNow} disabled={loading} className="w-full py-6 bg-[#3bb75e] text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-4 hover:scale-[1.01] active:scale-95 transition-all">
                  <Wallet size={20} /> Make payment now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. ADMIN/INSTRUCTOR ONBOARDING FLOW
  if (role === AppRole.ADMIN || role === AppRole.INSTRUCTOR) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3.5rem] shadow-2xl p-12 relative z-10 animate-in zoom-in-95">
          
          {step === 1 && (
            <div className="space-y-10 text-center">
              <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl">
                {role === AppRole.ADMIN ? <Command size={40} className="text-purple-500" /> : <ShieldCheck size={40} className="text-purple-500" />}
              </div>
              <div className="space-y-4">
                <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">
                  {role === AppRole.ADMIN ? "Admin Console v1.0" : "Mentor Protocol Initialized"}
                </h1>
                <p className="text-slate-500 text-xl font-medium leading-relaxed max-w-lg mx-auto">
                  Welcome, Administrator <span className="text-purple-600 font-black">{userName}</span>. System permissions require node synchronization with specific academic tracks.
                </p>
              </div>
              <button onClick={() => setStep(2)} className="w-full py-5 bg-purple-gradient text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
                Begin Authority Linking <ChevronRight size={18} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-right-8">
              <div className="text-center space-y-1">
                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Faculty Node Selection</h2>
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">Select curriculum to manage/lecture</p>
              </div>
              <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {ACADEMY_COURSES.map((course) => (
                  <button key={course.id} onClick={() => handleSelectCourse(course)} className="p-6 rounded-[2rem] border-2 border-slate-50 dark:border-slate-800 hover:border-purple-600 bg-white dark:bg-slate-900 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-5">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg ${course.icon_bg}`}><Cpu size={24} /></div>
                      <p className="text-xl font-black text-slate-900 dark:text-white">{course.title}</p>
                    </div>
                    <div className="px-4 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-[8px] font-black uppercase text-slate-400">Sync Node</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-10 text-center animate-in zoom-in-95">
              <div className="w-24 h-24 bg-orange-100 dark:bg-orange-950/20 rounded-[2.5rem] flex items-center justify-center text-orange-600 mx-auto shadow-xl">
                <ShieldAlert size={40} className="animate-pulse" />
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Awaiting Clearance</h2>
                <div className="p-10 bg-slate-50 dark:bg-slate-950 rounded-[3rem] border border-slate-100 dark:border-slate-800 text-center space-y-6">
                  <p className="text-lg font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                    Identity verified for <span className="text-purple-600 font-bold">{selectedCourse?.title}</span>.
                  </p>
                  <div className="flex items-center justify-center gap-3 py-3 px-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 inline-flex">
                    <CheckCircle size={16} className="text-green-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Admin linkage confirmation in progress</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Platform governance board will authorize your permissions shortly. Access to the command hub is currently in read-only mode.</p>
                </div>
              </div>
              <button onClick={() => finishOnboarding()} disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Rocket size={18} />} Enter Dashboard Node
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. PARENT ONBOARDING FLOW
  if (role === AppRole.PARENT) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3.5rem] shadow-2xl p-12 relative z-10 animate-in zoom-in-95">
          
          {step === 1 && (
            <div className="space-y-10 text-center">
              <div className="w-24 h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl">
                <Users size={40} />
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-tight">Welcome to the InnogX Parental Hub</h1>
                <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-lg mx-auto">
                  Greetings, <span className="text-purple-600 font-black">{userName}</span>. Oversee academic breakthroughs and manage curriculum investments for your linked scholars from this dedicated interface.
                </p>
              </div>
              <button onClick={() => setStep(2)} className="w-full py-5 bg-purple-gradient text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
                Initialize Connectivity <ChevronRight size={18} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-10 text-center animate-in slide-in-from-right-8">
              <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center text-slate-400 mx-auto shadow-xl">
                <UserPlus size={40} />
              </div>
              <div className="space-y-6">
                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Scholar Uplink</h2>
                <div className="p-8 bg-slate-50 dark:bg-slate-950 rounded-[3rem] border border-slate-100 dark:border-slate-800 text-left space-y-6">
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shrink-0 font-black text-xs">01</div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">Inside the dashboard, use the <span className="text-purple-600 font-bold">Scholar Registry</span> section.</p>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shrink-0 font-black text-xs">02</div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">Provide your child's unique <span className="text-purple-600 font-bold">Node UID</span> or registered email.</p>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shrink-0 font-black text-xs">03</div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">Await administrative handshake for full synchronization.</p>
                  </div>
                </div>
              </div>
              <button onClick={() => finishOnboarding()} disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Rocket size={18} />} Deploy Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // FALLBACK (In case role detection is still resolving)
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
       <Loader2 className="animate-spin text-purple-600" size={48} />
    </div>
  );
};

export default Onboarding;