import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabaseService } from '../services/supabase';
import { AppRole } from '../types';
import { ShieldAlert, LogOut, Loader2 } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: AppRole[];
  children: React.ReactNode;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const navigate = useNavigate();
  
  const [session, setSession] = useState<any>(() => {
    try {
      const local = localStorage.getItem('innogx_user_session');
      return local ? JSON.parse(local) : null;
    } catch {
      return null;
    }
  });
  
  const [loading, setLoading] = useState(!session);

  useEffect(() => {
    let mounted = true;

    const verifySession = async () => {
      try {
        const s = await supabaseService.auth.getSession();
        if (mounted) {
          if (s && s.user) {
            try {
              const cachedRaw = localStorage.getItem('innogx_user_session');
              const cachedUser = cachedRaw ? JSON.parse(cachedRaw).user : null;
              const mergedUser = cachedUser ? { ...s.user, ...cachedUser } : s.user;
              setSession({ user: mergedUser });
            } catch {
              setSession(s);
            }
          } else {
            setSession(s);
          }
          setLoading(false);
        }
      } catch (err) {
        if (mounted) setLoading(false);
      }
    };

    verifySession();

    const timer = setTimeout(() => {
      if (mounted && loading) setLoading(false);
    }, 2500);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
          <div className="absolute inset-0 bg-purple-500/10 blur-xl rounded-full"></div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verifying Node Access...</p>
      </div>
    </div>
  );

  if (!session || !session.user) {
    return <Navigate to="/" replace />;
  }

  const user = session.user;
  
  // Absolute string conversion to prevent crashes during object-to-string transitions
  const rawRole = String(user.role || '').toLowerCase();
  const metaRole = String(user.user_metadata?.role || '').toLowerCase();
  
  let currentRole: AppRole = AppRole.STUDENT;
  if (rawRole === 'admin' || metaRole === 'admin') {
    currentRole = AppRole.ADMIN;
  } else if (rawRole === 'instructor' || metaRole === 'instructor') {
    currentRole = AppRole.INSTRUCTOR;
  } else if (rawRole === 'parent' || metaRole === 'parent') {
    currentRole = AppRole.PARENT;
  }
  
  const hasOnboarded = user.has_onboarded || user.user_metadata?.has_onboarded || currentRole === AppRole.ADMIN;

  if (!hasOnboarded && currentRole !== AppRole.ADMIN) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!allowedRoles.includes(currentRole as AppRole)) {
    return <Navigate to={`/dashboard/${currentRole}`} replace />;
  }

  if (currentRole === AppRole.INSTRUCTOR && user.is_verified === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-[4rem] shadow-2xl border border-slate-100 dark:border-slate-800 max-w-lg w-full relative z-10 animate-in zoom-in-95">
          <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-orange-500/10">
            < ShieldAlert size={48} className="animate-pulse" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight leading-tight">Welcome, Mentor!</h1>
          <p className="text-[10px] font-black uppercase text-orange-500 tracking-[0.3em] mb-6">Verification Protocol Initialized</p>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed text-lg">
            Your instructor node is currently being audited by the <span className="text-purple-600 font-black">InnogX Academic Board</span>. <br/> 
            Dashboard synchronization will occur once your credentials are authorized.
          </p>
          <button 
            onClick={async () => {
              localStorage.clear();
              sessionStorage.clear();
              await supabaseService.auth.signOut();
              window.location.replace('/');
            }}
            className="flex items-center justify-center gap-3 w-full px-8 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl group"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            Sign Out & Reconnect Later
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleGuard;