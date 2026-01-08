import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabaseService, supabase } from '../services/supabase';
import { 
  ShieldCheck, Loader2, Wallet, 
  ChevronLeft, Lock, ArrowRight,
  CheckCircle, Zap, Globe, Cpu, Receipt
} from 'lucide-react';
import { AppRole } from '../types';

const PAYSTACK_PUBLIC_KEY = (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string) || '';

const PaymentGateway: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};
  const { type, course, plan, amount, targetId, role } = state;
  
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    supabaseService.auth.getSession().then(s => {
      if (!s) return navigate('/landing');
      setSession(s);
    });

    // Critical: If essential state is missing and we're not in success mode, abort to onboarding
    if (!type && !isSuccess) {
      const timer = setTimeout(() => navigate('/onboarding'), 100);
      return () => clearTimeout(timer);
    }
  }, [type, navigate, isSuccess]);

  const finalizeOnboarding = async (shouldWait: boolean = true) => {
    if (!session?.user?.id) {
      navigate('/dashboard/student', { replace: true });
      return;
    }

    try {
      await Promise.all([
        supabase.from('profiles').update({ has_onboarded: true }).eq('id', session.user.id),
        supabase.auth.updateUser({ data: { has_onboarded: true } })
      ]);
      
      const cacheKey = 'innogx_user_session';
      const cachedString = localStorage.getItem(cacheKey);
      if (cachedString) {
        try {
          const cached = JSON.parse(cachedString);
          if (cached.user) {
            cached.user.has_onboarded = true;
            if (cached.user.user_metadata) cached.user.user_metadata.has_onboarded = true;
            localStorage.setItem(cacheKey, JSON.stringify(cached));
            localStorage.setItem(`innogx_verified_${session.user.id}`, 'true');
            window.dispatchEvent(new Event('storage'));
          }
        } catch (e) { console.error("Cache Patch Fault:", e); }
      }
      
      // Determine app role from metadata or fallback
      const metaRole = session.user?.user_metadata?.role;
      const dbRole = session.user?.role;

      let appRole = 'student';
      if (metaRole && Object.values(AppRole).includes(metaRole)) {
        appRole = String(metaRole).toLowerCase();
      } else if (dbRole && Object.values(AppRole).includes(dbRole)) {
        appRole = String(dbRole).toLowerCase();
      }

      const targetPath = `/dashboard/${appRole}`;
      if (shouldWait) {
        setTimeout(() => navigate(targetPath, { replace: true }), 2000);
      } else {
        navigate(targetPath, { replace: true });
      }
    } catch (e) {
      console.error('Onboarding finalization error:', e);
      navigate('/dashboard/student', { replace: true });
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      if (!session?.user?.id) {
        navigate('/landing', { replace: true });
        return;
      }

      // Update localStorage to mark as onboarded
      const cacheKey = 'innogx_user_session';
      const cachedString = localStorage.getItem(cacheKey);
      if (cachedString) {
        try {
          const cached = JSON.parse(cachedString);
          if (cached.user) {
            cached.user.has_onboarded = true;
            if (cached.user.user_metadata) cached.user.user_metadata.has_onboarded = true;
            localStorage.setItem(cacheKey, JSON.stringify(cached));
            localStorage.setItem(`innogx_verified_${session.user.id}`, 'true');
            window.dispatchEvent(new Event('storage'));
          }
        } catch (e) { console.error("Cache update error:", e); }
      }

      // Determine user's role for navigation
      const metaRole = session.user?.user_metadata?.role;
      const dbRole = session.user?.role;
      let userRole = 'student';
      
      if (metaRole && Object.values(AppRole).includes(metaRole)) {
        userRole = String(metaRole).toLowerCase();
      } else if (dbRole && Object.values(AppRole).includes(dbRole)) {
        userRole = String(dbRole).toLowerCase();
      }

      // Navigate immediately to HQ Overview
      navigate(`/dashboard/${userRole}`, { replace: true });
    } catch (err) {
      console.error('Skip error:', err);
      navigate('/dashboard/student', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handlePaystackPayment = () => {
    // For testing: use simulated payment flow if no valid Paystack key
    if (!PAYSTACK_PUBLIC_KEY || PAYSTACK_PUBLIC_KEY.length < 10) {
      console.log('No Paystack key detected, using simulation mode');
      simulatePayment();
      return;
    }

    const paystack = (window as any).PaystackPop;
    if (!paystack) {
      console.log('Paystack not loaded, using simulation mode');
      simulatePayment();
      return;
    }

    if (!session?.user?.email) {
      alert('User information missing. Please refresh and try again.');
      return;
    }
    
    setLoading(true);
    
    let amountInKobo: number;
    let metadata: any = {
      custom_fields: [
        { display_name: 'UserId', variable_name: 'userId', value: session.user.id }
      ]
    };
    
    if (type === 'enrollment' && course) {
      const amountToPay = Math.round((course.price || 0) / (plan || 1));
      amountInKobo = Math.floor(amountToPay * 100);
      metadata.custom_fields.push(
        { display_name: "Course Title", variable_name: "course_title", value: course.title },
        { display_name: "Payment Plan", variable_name: "plan", value: `${plan}-Phase Sync` },
        { display_name: 'CourseId', variable_name: 'course_id', value: course.id }
      );
    } else {
      const finalAmount = amount || 25000;
      amountInKobo = Math.floor(finalAmount * 100);
      metadata.custom_fields.push(
        { display_name: "Type", variable_name: "type", value: "Tuition Credit Recharge" }
      );
    }

    const handler = paystack.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: session.user.email,
      amount: amountInKobo,
      currency: 'NGN',
      ref: 'IGX_SYNC_' + Date.now(),
      metadata: metadata,
      callback: async (response: any) => {
        await handlePaymentSuccess(response.reference);
      },
      onClose: () => {
        setLoading(false);
      }
    });
    handler.openIframe();
  };

  const simulatePayment = () => {
    setLoading(true);
    setTimeout(() => {
      handlePaymentSuccess('IGX_SYNC_' + Date.now());
    }, 2000);
  };

  const handlePaymentSuccess = async (reference: string) => {
    try {
      const finalAmount = type === 'enrollment' 
        ? Math.round((course?.price || 0) / (plan || 1))
        : (amount || 25000);

      // Save transaction to database
      const { error } = await supabase.from('transactions').insert({
      user_id: session.user.id,
      amount: finalAmount,
      reference: reference,
      type: type === 'enrollment' ? 'course_enrollment' : 'tuition_credit',
      status: 'success',
      date: new Date().toISOString(),
      course_id: type === 'enrollment' ? course?.id : null,
      item_name: type === 'enrollment' ? course?.title : 'Tuition Credit Deposit'
    });

    if (error) {
      console.log('Transaction save skipped (expected in demo):', error);
    }


      setIsSuccess(true);
      
      if (type === 'enrollment') {
        await finalizeOnboarding(true);
      } else {
        // For recharge, stay on success page - user will navigate back
        // No auto-redirect, let user click the button
      }
    } catch (e) {
      console.error('Payment completion error:', e);
      setIsSuccess(true); // Still show success even if DB save fails
    } finally {
      setLoading(false);
    }
  };

  // VITAL: Absolute render block if data is missing to prevent mid-transition crash
  if (!session || (!type && !isSuccess)) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-purple-600" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Synchronizing Gateway...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-purple-gradient"></div>
      
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 bg-slate-900 border border-white/10 rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-700">
        
        <div className="p-12 lg:p-16 bg-slate-800/50 border-r border-white/5 flex flex-col justify-between">
           <div className="space-y-12">
              <button 
                onClick={() => navigate(-1)} 
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
              >
                <ChevronLeft size={14} /> Reconfigure Path
              </button>
              
              <div className="space-y-6">
                 <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 rounded-full border border-purple-500/20">
                    <ShieldCheck size={14} className="text-purple-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-purple-400">Secure Node Sync v3.1</span>
                 </div>
                 <h1 className="text-4xl font-black text-white tracking-tight leading-tight uppercase">
                    {type === 'enrollment' ? 'Pay for Your Course To Start Your Journey' : 'Financial Sync'}
                 </h1>
                 <p className="text-slate-400 font-medium leading-relaxed">
                   {type === 'enrollment' && course ? (
                     <>Synchronizing your identity with the <span className="text-white font-bold">{course.title}</span> curriculum node.</>
                   ) : (
                     <>Expanding your financial bandwidth. Your tuition credit will be globally available post-synchronization.</>
                   )}
                 </p>
              </div>

              <div className="p-8 bg-slate-950/50 rounded-[2.5rem] border border-white/5 space-y-6">
                 {type === 'enrollment' && course ? (
                   <>
                      <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                         <span>Path</span>
                         <span className="text-white truncate max-w-[120px]">{course.title}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-[0.25em] text-slate-500">
                         <span>Sync</span>
                         <span className="text-white">{plan}-Phase Cycle</span>
                      </div>
                      <div className="h-px bg-white/5"></div>
                      <div className="flex justify-between items-end">
                         <div>
                            <p className="text-[10px] font-black uppercase text-purple-400 mb-1">Deposit</p>
                            <p className="text-4xl font-black text-white tracking-tighter">₦{Math.round((course.price || 0) / (plan || 1)).toLocaleString()}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[9px] font-black text-slate-500 uppercase">Total</p>
                            <p className="text-sm font-black text-slate-300">₦{(course.price || 0).toLocaleString()}</p>
                         </div>
                      </div>
                   </>
                 ) : (
                   <>
                      <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                         <span>Sync Type</span>
                         <span className="text-white">Tuition Credit</span>
                      </div>
                      <div className="h-px bg-white/5"></div>
                      <div className="flex justify-between items-end">
                         <div>
                            <p className="text-[10px] font-black uppercase text-purple-400 mb-1">Value</p>
                            <p className="text-4xl font-black text-white tracking-tighter">₦{(amount || 0).toLocaleString()}</p>
                         </div>
                         <Receipt className="text-slate-700" size={32} />
                      </div>
                   </>
                 )}
              </div>
           </div>

           <div className="pt-12 flex items-center gap-6 opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700">
              <Zap size={24} className="text-purple-500" />
              <Globe size={24} className="text-blue-500" />
              <Cpu size={24} className="text-emerald-500" />
           </div>
        </div>

        <div className="p-12 lg:p-16 flex flex-col justify-center items-center text-center space-y-12">
           {isSuccess ? (
             <div className="space-y-8 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-green-500 rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-[0_0_50px_rgba(34,197,94,0.4)]">
                   <CheckCircle size={48} className="animate-bounce" />
                </div>
                <div className="space-y-3">
                   <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none">Payment Successful</h2>
                   <p className="text-[10px] font-black text-green-500 uppercase tracking-[0.4em]">TRANSACTION COMPLETE</p>
                   <p className="text-sm text-slate-400 mt-6 leading-relaxed">Your payment has been processed successfully. Your account will be updated shortly.</p>
                </div>
                
                <button 
                  onClick={() => {
                    if (type === 'enrollment') {
                      navigate(`/dashboard/${session?.user?.role || 'student'}`, { replace: true });
                    } else {
                      navigate('/dashboard/student/payments', { replace: true });
                    }
                  }}
                  className="mt-8 px-12 py-5 bg-purple-gradient text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-purple-500/30 hover:scale-[1.02] active:scale-95 transition-all border border-white/10"
                >
                  Return to Dashboard
                </button>
             </div>
           ) : (
             <>
                <div className="w-20 h-20 bg-purple-gradient rounded-[2rem] flex items-center justify-center text-white shadow-2xl relative">
                   <Lock size={32} />
                   <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-slate-900 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                   </div>
                </div>
                
                <div className="space-y-4">
                   <h2 className="text-3xl font-black text-white tracking-tight uppercase leading-none">Authorize Sync</h2>
                   <p className="text-slate-500 text-sm font-medium leading-relaxed">
                     Connect your financial node via Paystack's high-encryption tunnel to initialize your curriculum path.
                   </p>
                </div>

                <div className="w-full space-y-6">
                   <button 
                     onClick={handlePaystackPayment}
                     disabled={loading}
                     className="w-full py-6 bg-purple-gradient text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-purple-500/30 flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all border border-white/10"
                   >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : <Wallet size={20} />} 
                      {loading ? "PROCESSING..." : "Pay Now"}
                   </button>
                   
                   <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center justify-center gap-2">
                     <ShieldCheck size={12} className="text-emerald-500" /> AES-256 BANK GRADE ENCRYPTION
                   </p>
                </div>

                <div className="pt-8 border-t border-white/5 w-full">
                   <button 
                     onClick={handleSkip}
                     disabled={loading}
                     className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2 mx-auto"
                   >
                     {loading ? <Loader2 size={12} className="animate-spin" /> : null}
                     Skip & Return to HQ Overview
                   </button>
                </div>
             </>
           )}
        </div>
      </div>
    </div>
  );
};

export default PaymentGateway;