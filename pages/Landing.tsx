import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, Zap, Star, Users, Globe, ArrowRight, 
  Play, BookOpen, Layout, Rocket, Command, Cpu, 
  Moon, Sun, Eye, EyeOff, Mail, Loader2, Send, 
  ChevronLeft, ChevronRight, Fingerprint, Info, CheckCircle, Key, Shield,
  ChevronDown, Video, Terminal, Layers, Tag, X
} from 'lucide-react';
import { supabaseService } from '../services/supabase';
import { AppRole } from '../types';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return true; 
  });

  // Auth States
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showVerifyPopup, setShowVerifyPopup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirm_password: '',
    full_name: '',
    role: AppRole.STUDENT,
    requested_child_email: '',
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('reset') === 'true') {
      setIsResettingPassword(true);
      setIsLogin(false);
    }
    
    supabaseService.auth.getSession().then(session => {
      if (session?.user && !isResettingPassword) {
        const u = session.user as any;
        const role = u.user_metadata?.role || u.role;
        const onboarded = u.user_metadata?.has_onboarded || u.has_onboarded;
        if (onboarded || role === 'admin') navigate(`/dashboard/${role}`, { replace: true });
        else navigate('/onboarding', { replace: true });
      }
    });
  }, [navigate, location, isResettingPassword]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isResettingPassword) {
        if (formData.password !== formData.confirm_password) throw new Error("Passwords do not match");
        const { error: err } = await supabaseService.auth.updatePassword(formData.password);
        if (err) throw new Error(err.message);
        setSuccess("Credentials updated. Syncing login node...");
        setTimeout(() => { setIsResettingPassword(false); setIsLogin(true); }, 2000);
        return;
      }

      if (isForgotPassword) {
        const { error: err } = await supabaseService.auth.sendPasswordReset(formData.email);
        if (err) throw new Error(err.message);
        setSuccess("Recovery node link dispatched.");
        return;
      }

      if (isLogin) {
        const { data, error: err } = await supabaseService.auth.signIn({ email: formData.email, password: formData.password });
        if (err) throw new Error(err);
        if (data?.user) {
          const u = data.user as any;
          const role = u.user_metadata?.role || u.role;
          const onboarded = u.user_metadata?.has_onboarded || u.has_onboarded;
          if (onboarded || role === 'admin') navigate(`/dashboard/${role}`, { replace: true });
          else navigate('/onboarding', { replace: true });
        }
      } else {
        if (formData.password !== formData.confirm_password) throw new Error("Passwords do not match");
        const { data, emailSent: sent, error: err } = await supabaseService.auth.signUp(formData);
        if (err) throw new Error(err);
        if (sent) {
          setShowVerifyPopup(true);
        } else if (data?.session) {
          navigate('/onboarding', { replace: true });
        }
      }
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const lightLogo = "https://i.ibb.co/35GKJS4x/Photoroom-20251210-193746.png";
  const logoUrl = lightLogo;

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 relative overflow-x-hidden flex flex-col font-sans transition-colors duration-500 selection:bg-purple-500 selection:text-white">
      {/* Dynamic Grid Background */}
      <div className="absolute inset-0 z-0 bg-grid-pattern opacity-30 dark:opacity-40 pointer-events-none"></div>
      <div className="absolute inset-0 z-0 grid-glow-overlay opacity-50 pointer-events-none"></div>
      
      <div className="absolute top-0 left-0 w-full max-w-2xl h-[500px] bg-white/40 dark:bg-white/5 blur-[120px] rounded-full opacity-50 -translate-x-1/4 -translate-y-1/4 pointer-events-none"></div>
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-purple-600/20 blur-[120px] rounded-full opacity-30 pointer-events-none"></div>
      
      <nav className="fixed top-6 lg:top-10 left-1/2 -translate-x-1/2 z-[100] w-[90%] lg:w-auto lg:max-w-[95%] bg-white border border-slate-200 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-1 lg:p-2 transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] lg:hover:w-full lg:hover:max-w-4xl lg:hover:px-8 lg:hover:py-4 flex items-center justify-between group">
        
        <Link to="/" className="flex items-center gap-2 lg:gap-3 shrink-0 px-3 lg:px-4 transition-all duration-500">
          <img 
            src={logoUrl} 
            alt="InnogX" 
            className="h-7 lg:h-10 w-auto object-contain transition-all duration-500"
          />
          <span className="hidden sm:inline-block lg:w-0 lg:overflow-hidden lg:group-hover:w-auto transition-all duration-500 text-[10px] lg:text-xs font-black uppercase tracking-[0.3em] whitespace-nowrap opacity-100 lg:opacity-0 lg:group-hover:opacity-100 text-slate-900">
            Academy
          </span>
        </Link>
        
        <div className="flex items-center gap-1 lg:gap-4 transition-all duration-500">
          <a href="https://www.innogx.tech/courses" className="flex items-center gap-2 p-2 lg:p-4 rounded-full hover:bg-slate-50 transition-all group/item shadow-none hover:shadow-lg">
            <BookOpen size={18} className="text-purple-600 shrink-0" />
            <span className="hidden md:inline-block lg:w-0 lg:overflow-hidden lg:group-hover:w-auto transition-all duration-500 text-[9px] lg:text-[10px] font-black uppercase tracking-[0.25em] whitespace-nowrap opacity-100 lg:opacity-0 lg:group-hover:opacity-100 text-slate-600">
              Curriculum
            </span>
          </a>
          <a href="https://www.innogx.tech/pricing" className="flex items-center gap-2 p-2 lg:p-4 rounded-full hover:bg-slate-50 transition-all group/item shadow-none hover:shadow-lg">
            <Tag size={18} className="text-purple-600 shrink-0" />
            <span className="hidden md:inline-block lg:w-0 lg:overflow-hidden lg:group-hover:w-auto transition-all duration-500 text-[9px] lg:text-[10px] font-black uppercase tracking-[0.25em] whitespace-nowrap opacity-100 lg:opacity-0 lg:group-hover:opacity-100 text-slate-600">
              Pricing
            </span>
          </a>
        </div>

        <div className="flex items-center gap-1 lg:gap-4 px-2 lg:px-3">
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-full p-1 shadow-inner">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="p-2 lg:p-2.5 rounded-full flex items-center justify-center transition-all bg-white text-purple-600 shadow-md lg:shadow-none lg:bg-transparent lg:text-slate-400 lg:hover:text-slate-600"
              title="Toggle Node Theme"
            >
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-between px-6 lg:px-24 py-28 lg:py-32 gap-12 lg:gap-16">
        <div className="w-full lg:w-[45%] flex flex-col justify-center space-y-6 lg:space-y-10 text-center lg:text-left">
          <div className="flex flex-col items-center lg:items-start gap-3 lg:gap-4">
            <div className="inline-flex items-center gap-2 lg:gap-3 px-4 lg:px-5 py-2 bg-slate-200/50 dark:bg-white/5 backdrop-blur-xl border border-slate-300 dark:border-white/10 rounded-full shadow-lg">
              <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-purple-500 animate-pulse"></div>
              <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.25em] text-purple-600 dark:text-purple-400">Africa's Tech Frontier v3.1</span>
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-8xl xl:text-9xl font-black leading-[0.9] tracking-tighter">
              <span className="text-purple-gradient">Code</span> <br className="hidden sm:block" /> 
              <span className="text-white drop-shadow-sm">Impact.</span>
            </h1>
          </div>
          <p className="text-sm sm:text-base md:text-xl text-slate-600 dark:text-slate-400 font-medium max-w-lg mx-auto lg:mx-0 leading-relaxed">
            World-class engineering education, decentralized for African excellence. Master the stack, build the nodes, and dominate the digital economy.
          </p>
          
          <div className="pt-2 lg:pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 lg:gap-8 opacity-60">
             <div className="flex -space-x-3">
               {[1,2,3,4].map(i => (
                 <div key={i} className="w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 border-slate-50 dark:border-slate-950 bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                    <img src={`https://ui-avatars.com/api/?name=Scholar+${i}&background=random`} alt="user" className="w-full h-full object-cover" />
                 </div>
               ))}
             </div>
             <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">200+ Scholars Syncing</p>
          </div>
        </div>

        <div className="w-full lg:w-[48%] relative flex items-center justify-center px-0 sm:px-4 lg:px-0">
          <div className="w-full max-w-[540px] bg-white dark:bg-slate-900/60 backdrop-blur-3xl rounded-[2.5rem] lg:rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(138,3,170,0.3)] border border-slate-200 dark:border-white/10 overflow-hidden p-8 sm:p-12 lg:p-14 animate-in zoom-in-95 duration-700">
             <div className="text-center w-full space-y-6 lg:space-y-10">
                <div className="space-y-2 lg:space-y-3">
                   <h2 className="text-2xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
                     {isResettingPassword ? "Secure Node" : isForgotPassword ? "Recovery" : isLogin ? "Initialize" : "Register"}
                   </h2>
                   <p className="text-[8px] lg:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">
                     {isResettingPassword ? "RECONFIGURE IDENTITY NODE" : "EXCELLENCE SYNC PROTOCOL v3.0"}
                   </p>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-4 lg:space-y-5 text-left">
                  {error && <div className="text-red-500 dark:text-red-400 text-[10px] font-black uppercase tracking-widest bg-red-500/10 p-4 rounded-2xl text-center border border-red-500/20 animate-in fade-in zoom-in">{error}</div>}
                  {success && <div className="text-green-600 dark:text-green-400 text-[10px] font-black uppercase tracking-widest bg-green-500/10 p-4 rounded-2xl text-center border border-green-500/20 flex items-center justify-center gap-3 animate-in slide-in-from-top-2">
                    <CheckCircle size={16} /> {success}
                  </div>}
                  
                  <div className="space-y-3 lg:space-y-4">
                    {(!isLogin && !isForgotPassword && !isResettingPassword) && (
                      <div className="relative group">
                        <input required placeholder="Full Identity Name" className="w-full px-5 py-4 lg:px-6 lg:py-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl lg:rounded-2xl outline-none font-bold text-sm text-slate-900 dark:text-white focus:border-purple-600 focus:bg-white/10 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} />
                      </div>
                    )}

                    {(!isResettingPassword) && (
                      <div className="relative group">
                        <input required type="email" placeholder="Email Node Address" className="w-full px-5 py-4 lg:px-6 lg:py-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl lg:rounded-2xl outline-none font-bold text-sm text-slate-900 dark:text-white focus:border-purple-600 focus:bg-white/10 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        <Mail className="absolute right-5 lg:right-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 group-focus-within:text-purple-500 transition-colors" size={16} />
                      </div>
                    )}

                    {(!isForgotPassword) && (
                      <div className="relative group">
                        <input required type={showPassword ? "text" : "password"} placeholder={isResettingPassword ? "Configure New Password" : "Secure Password"} className="w-full px-5 py-4 lg:px-6 lg:py-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl lg:rounded-2xl outline-none font-bold text-sm text-slate-900 dark:text-white focus:border-purple-600 focus:bg-white/10 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 lg:right-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white transition-colors">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                      </div>
                    )}

                    {( (!isLogin && !isForgotPassword) || isResettingPassword ) && (
                      <div className="space-y-3 lg:space-y-4">
                        <input required type="password" placeholder="Confirm Credentials" className="w-full px-5 py-4 lg:px-6 lg:py-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl lg:rounded-2xl outline-none font-bold text-sm text-slate-900 dark:text-white focus:border-purple-600 focus:bg-white/10 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600" value={formData.confirm_password} onChange={e => setFormData({ ...formData, confirm_password: e.target.value })} />
                        {(!isResettingPassword) && (
                          <div className="space-y-3 lg:space-y-4">
                            <div className="relative group">
                              <select className="w-full px-5 py-4 lg:px-6 lg:py-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl lg:rounded-2xl outline-none font-black text-[9px] lg:text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-300 appearance-none focus:border-purple-600 transition-all" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as AppRole })}>
                                <option value={AppRole.STUDENT} className="dark:bg-slate-900">Register as a Student</option>
                                <option value={AppRole.INSTRUCTOR} className="dark:bg-slate-900">Register as an Instructor</option>
                                <option value={AppRole.PARENT} className="dark:bg-slate-900">Register as a Parent</option>
                              </select>
                              <ChevronDown className="absolute right-5 lg:right-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 pointer-events-none" size={16} />
                            </div>
                            
                            {formData.role === AppRole.PARENT && (
                              <div className="relative group animate-in slide-in-from-top-2 duration-300">
                                <input required type="email" placeholder="Scholar's Email Node Address" className="w-full px-5 py-4 lg:px-6 lg:py-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-500/20 rounded-xl lg:rounded-2xl outline-none font-bold text-sm text-slate-900 dark:text-white focus:border-purple-600 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600" value={formData.requested_child_email} onChange={e => setFormData({ ...formData, requested_child_email: e.target.value })} />
                                <Users className="absolute right-5 lg:right-6 top-1/2 -translate-y-1/2 text-purple-400" size={16} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {isLogin && !isForgotPassword && (
                    <div className="flex justify-end">
                      <button type="button" onClick={() => { setIsForgotPassword(true); setIsLogin(false); }} className="text-[9px] lg:text-[10px] font-black text-slate-500 dark:text-slate-600 uppercase tracking-[0.2em] hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Credential Recovery?</button>
                    </div>
                  )}

                  <div className="pt-2">
                    <button disabled={loading} type="submit" className="w-full py-4 lg:py-5 bg-purple-gradient text-white rounded-xl lg:rounded-2xl font-black uppercase tracking-[0.25em] shadow-2xl shadow-purple-500/30 flex items-center justify-center gap-4 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 text-[10px] border border-white/10">
                      {loading ? <Loader2 className="animate-spin" size={18} /> : 
                       isResettingPassword ? <Shield size={16} /> : 
                       isForgotPassword ? <Send size={16} /> : 
                       isLogin ? <Fingerprint size={18} /> : <Rocket size={18} />}
                      {isResettingPassword ? "Sync New Credentials" : 
                       isForgotPassword ? "Dispatched Protocol" : 
                       isLogin ? "Establish Session" : "Deploy Identity"}
                    </button>
                  </div>

                  <p className="text-center text-[9px] lg:text-[10px] font-bold text-slate-500 dark:text-slate-600 uppercase tracking-widest">
                    {isForgotPassword ? "Credentials remembered? " : isResettingPassword ? "Return to " : isLogin ? "Unidentified scholar? " : "Identity already synced? "}
                    <button type="button" onClick={() => { 
                      setIsLogin(isForgotPassword || isResettingPassword ? true : !isLogin);
                      setIsForgotPassword(false); 
                      setIsResettingPassword(false);
                      setError(null); setSuccess(null);
                    }} className="text-purple-600 dark:text-purple-500 font-black ml-1 hover:text-purple-500 dark:hover:text-purple-400 transition-colors"> 
                      {isForgotPassword || isResettingPassword ? "Log In" : isLogin ? "Register Now" : "Sign In"}
                    </button>
                  </p>
                </form>
             </div>
          </div>
        </div>
      </main>

      {/* Email Verification Popup - Restored Original Version */}
      {showVerifyPopup && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500">
           <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-[0_50px_100px_-20px_rgba(138,3,170,0.5)] overflow-hidden animate-in zoom-in-95 duration-700">
              <div className="p-10 text-center space-y-8">
                 <div className="w-24 h-24 bg-purple-gradient rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl relative">
                    <Mail size={40} className="animate-bounce" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center text-white">
                       <CheckCircle size={14} />
                    </div>
                 </div>
                 
                 <div className="space-y-3">
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Verification Dispatched</h3>
                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em]">Identity Authentication Required</p>
                 </div>

                 <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                       A synchronization link has been sent to <span className="text-slate-900 dark:text-white font-black">{formData.email}</span>. Please authorize your node via your inbox to initialize the excellence protocol.
                    </p>
                 </div>

                 <button 
                   onClick={() => { setShowVerifyPopup(false); setIsLogin(true); }}
                   className="w-full py-5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.25em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                 >
                    Got It, Establish Link
                 </button>
                 
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Didn't receive the node? <button onClick={handleAuthSubmit} className="text-purple-600 hover:underline">Re-dispatch link</button>
                 </p>
              </div>
           </div>
        </div>
      )}

      <section className="relative z-10 px-6 lg:px-24 py-16 lg:py-24 bg-slate-100/30 dark:bg-slate-900/20 border-y border-black/5 dark:border-white/5">
        <div className="max-w-6xl mx-auto space-y-12 lg:space-y-20">
          <div className="flex flex-col md:flex-row justify-between items-center lg:items-end gap-8 text-center lg:text-left">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 rounded-full border border-purple-500/20">
                <Play size={14} className="text-purple-500 fill-current" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-600 dark:text-purple-400">System Briefing</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">The Blueprint of Excellence.</h2>
              <p className="text-sm lg:text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Watch the tactical overview of the InnogX platform. Learn how to synchronize your learning node, engage with mentors, and accelerate your tech career.
              </p>
            </div>
            <div className="flex gap-3 lg:gap-4 mb-2">
              <div className="p-3 lg:p-4 bg-white dark:bg-slate-800 rounded-2xl lg:rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm text-center min-w-[100px] lg:min-w-[120px]">
                <Terminal size={18} className="mx-auto mb-2 text-purple-500" />
                <p className="text-[7px] lg:text-[8px] font-black uppercase text-slate-400">Interface</p>
                <p className="text-[10px] lg:text-xs font-black">Intuitive</p>
              </div>
              <div className="p-3 lg:p-4 bg-white dark:bg-slate-800 rounded-2xl lg:rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm text-center min-w-[100px] lg:min-w-[120px]">
                <Layers size={18} className="mx-auto mb-2 text-purple-500" />
                <p className="text-[7px] lg:text-[8px] font-black uppercase text-slate-400">Stack</p>
                <p className="text-[10px] lg:text-xs font-black">Modern</p>
              </div>
            </div>
          </div>

          <div className="aspect-video w-full bg-slate-200 dark:bg-black rounded-2xl lg:rounded-[5rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 group relative">
             <iframe 
               className="w-full h-full"
               src="https://www.youtube.com/embed/3vW9X2X-4yE?si=v6A6e_oW8t6z8n7v&controls=1&rel=0" 
               title="InnogX Academy Briefing"
               frameBorder="0"
               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
               allowFullScreen
             ></iframe>
             <div className="absolute inset-0 bg-purple-gradient/5 pointer-events-none mix-blend-overlay"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8 pt-4">
             {[
               { id: '01', title: 'Initialize Node', desc: 'Create your identity and select your high-impact curriculum track.' },
               { id: '02', title: 'Sync with Mentors', desc: 'Join live sessions and interact with the AI intelligence core (Inno).' },
               { id: '03', title: 'Master the Stack', desc: 'Complete tasks, earn achievements, and take your career to the next level.' }
             ].map(step => (
               <div key={step.id} className="space-y-3 p-6 lg:p-8 bg-white dark:bg-slate-800/40 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 font-black">{step.id}</div>
                  <h4 className="font-black text-sm lg:text-base uppercase tracking-wider">{step.title}</h4>
                  <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{step.desc}</p>
               </div>
             ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 px-6 lg:px-16 py-10 lg:py-12 flex flex-col md:flex-row justify-between items-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-t border-slate-200 dark:border-white/5 mt-auto gap-8 text-center md:text-left">
        <div className="flex gap-6 lg:gap-12 order-2 md:order-1">
          {['LinkedIn', 'Twitter', 'GitHub', 'Discord'].map(social => (
            <a key={social} href="#" className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-purple-500 transition-colors">
              {social}
            </a>
          ))}
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 lg:gap-10 order-1 md:order-2">
          <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Established 2025 • InnogX Intelligence</p>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div>
            <span className="text-[8px] font-black uppercase text-green-500 tracking-widest">Mainnet Live</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;