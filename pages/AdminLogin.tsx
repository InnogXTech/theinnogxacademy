
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseService } from '../services/supabase';
import { AppRole } from '../types';
import { ShieldAlert, Lock, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabaseService.auth.signIn({ email, password });
    
    if (err) {
      setError(String(err));
      setLoading(false);
      return;
    }

    const user = data?.user;
    const hasAdminRole = user?.role === AppRole.ADMIN || user?.user_metadata?.role === AppRole.ADMIN;

    if (!hasAdminRole) {
      await supabaseService.auth.signOut();
      setError("Unauthorized node. This terminal is reserved for authorized platform administrators.");
      setLoading(false);
      return;
    }

    // Force storage update for the role
    const session = JSON.parse(localStorage.getItem('innogx_user_session') || '{}');
    if (session.user) {
      session.user.role = AppRole.ADMIN;
      localStorage.setItem('innogx_user_session', JSON.stringify(session));
    }

    navigate('/dashboard/admin', { replace: true });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-purple-gradient"></div>
      
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[3rem] p-10 relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-purple-gradient rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-500/20">
            <ShieldAlert size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">Master Terminal</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">InnogX Command Center Access</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-4 tracking-widest">Admin Node ID (Email)</label>
            <div className="relative">
              <input 
                required
                type="email"
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-purple-500 outline-none text-white font-bold transition-all"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-4 tracking-widest">Security Key</label>
            <div className="relative">
              <input 
                required
                type={showPassword ? "text" : "password"}
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-purple-500 outline-none text-white font-bold transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full py-5 bg-purple-gradient text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Lock size={18} />}
            {loading ? "Synchronizing..." : "Establish Command Link"}
          </button>
        </form>

        <button 
          onClick={() => navigate('/')}
          className="w-full mt-8 flex items-center justify-center gap-2 text-[10px] font-black uppercase text-slate-600 hover:text-slate-400 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Scholar Portal
        </button>
      </div>

      <div className="absolute bottom-10 text-center w-full">
        <p className="text-slate-700 text-[10px] font-black uppercase tracking-[0.3em]">Governance Protocol Active</p>
      </div>
    </div>
  );
};

export default AdminLogin;
