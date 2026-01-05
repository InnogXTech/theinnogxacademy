import React, { useState, useRef, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { supabaseMock } from '../services/supabaseMock';
import { supabaseService, supabase } from '../services/supabase';
import { 
  Camera, User, Mail, Briefcase, 
  Save, Check, Loader2, Globe, Award, Shield, Lock, Key, AlertCircle, RefreshCw
} from 'lucide-react';
import { AppRole, Achievement } from '../types';

const ProfilePage: React.FC = () => {
  const [session, setSession] = useState<any>(() => {
    try {
      const local = localStorage.getItem('innogx_user_session');
      return local ? JSON.parse(local) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!session);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  
  const u = session?.user as any;
  const [formData, setFormData] = useState({
    full_name: u?.full_name || '',
    email: u?.email || '',
    career_role: u?.career_role || '',
    about_me: u?.about_me || '',
    avatar_url: u?.avatar_url || `https://ui-avatars.com/api/?name=${u?.full_name || 'User'}&size=200`
  });

  // Password Update States
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  useEffect(() => {
    const initProfile = async () => {
      try {
        const s = await supabaseService.auth.getSession();
        if (s) {
          const u = s.user as any;
          setSession(s);
          const defaultRole = u.role === AppRole.INSTRUCTOR ? 'Expert Instructor' : 'Emerging Tech Scholar';
          const defaultAbout = u.role === AppRole.INSTRUCTOR 
            ? 'Dedicated educator shaping the next generation of tech talent.' 
            : 'Passionate about building the next big thing in tech.';

          setFormData({
            full_name: u.full_name || '',
            email: u.email || '',
            career_role: u.career_role || defaultRole,
            about_me: u.about_me || defaultAbout,
            avatar_url: u.avatar_url || `https://ui-avatars.com/api/?name=${u.full_name || 'User'}&size=200`
          });

          const ach = await supabaseMock.db.getAchievements();
          setAllAchievements(ach);
        }
      } catch (err) {
        console.error("Profile Load Error:", err);
      } finally {
        setFetching(false);
      }
    };

    initProfile();
    
    const timer = setTimeout(() => setFetching(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (fetching && !session) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Profile Node...</p>
      </div>
    </DashboardLayout>
  );

  if (!session) return (
    <DashboardLayout>
      <div className="text-center py-20">
        <Shield size={48} className="mx-auto text-slate-300 mb-4" />
        <p className="font-black text-slate-400 uppercase tracking-widest">Authentication Node Offline</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-purple-600 font-bold uppercase text-[10px] tracking-widest hover:underline">Retry Synchronization</button>
      </div>
    </DashboardLayout>
  );

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      // Update the mock database
      const { error } = await supabaseMock.db.updateProfile(session.user.id, formData);
      if (error) throw new Error(error);

      // Also try to update Supabase auth metadata for real persistence
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: formData.full_name,
            career_role: formData.career_role,
            about_me: formData.about_me,
            avatar_url: formData.avatar_url
          }
        });
      } catch (authError) {
        console.log('Auth metadata update skipped (expected in demo mode):', authError);
      }

      // Update local session storage for immediate UI sync
      const currentSession = JSON.parse(localStorage.getItem('innogx_user_session') || '{}');
      if (currentSession.user) {
        currentSession.user = { ...currentSession.user, ...formData };
        localStorage.setItem('innogx_user_session', JSON.stringify(currentSession));
        // Dispatch storage event to sync across components and tabs
        window.dispatchEvent(new Event('storage'));
      }

      // Also update the state
      setSession({ ...session, user: { ...session.user, ...formData } });

      setLoading(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Profile sync error:", err);
      setLoading(false);
      alert("Synchronization failed. Please retry.");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (passwords.new !== passwords.confirm) {
      setPasswordError("CREDENTIAL_MISMATCH: Passwords do not align.");
      return;
    }

    if (passwords.new.length < 6) {
      setPasswordError("WEAK_PROTOCOL: Minimum 6 characters required.");
      return;
    }

    setPasswordLoading(true);
    try {
      // Re-verify current password by attempting a silent sign-in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: passwords.current,
      });

      if (verifyError) throw new Error("VERIFICATION_FAILED: Current access key is invalid.");

      // If verification passes, update with the new password
      const { error: updateError } = await supabaseService.auth.updatePassword(passwords.new);
      if (updateError) throw updateError;

      setPasswordSuccess("CREDENTIALS_RECONFIGURED: Access key updated successfully.");
      setPasswords({ current: '', new: '', confirm: '' });
      
      // Cleanup success message after 5 seconds
      setTimeout(() => setPasswordSuccess(null), 5000);
    } catch (err: any) {
      setPasswordError(err.message || "SYNC_ERROR: Failed to update node credentials.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto pb-20 space-y-12 animate-in fade-in duration-700">
        <div className="flex justify-between items-end">
          <div>
             <h1 className="text-4xl font-black tracking-tight mb-2 text-slate-900 dark:text-white uppercase">Profile Portal</h1>
             <p className="text-slate-500 font-medium">Manage your {session.user.role} identity and visibility.</p>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-200 dark:border-slate-700">
             Account ID: <span className="text-slate-900 dark:text-white font-mono">{session.user.id.substring(0, 8).toUpperCase()}</span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-10">
          <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-purple-gradient opacity-10"></div>
            <div className="relative flex flex-col md:flex-row items-center gap-8">
               <div className="relative group">
                  <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden border-8 border-white dark:border-slate-800 shadow-xl bg-slate-100">
                    <img src={formData.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                  </div>
                  <button 
                    type="button"
                    onClick={handleAvatarClick}
                    className="absolute bottom-2 right-2 w-12 h-12 bg-white text-purple-600 rounded-2xl shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border border-slate-100"
                  >
                    <Camera size={20} />
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
               </div>
               
               <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl font-black tracking-tight mb-1 text-slate-900 dark:text-white">{formData.full_name}</h2>
                  <p className="text-purple-600 font-black uppercase text-xs tracking-widest mb-4">{formData.career_role}</p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                     <span className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-800">
                       <Mail size={12} /> {formData.email}
                     </span>
                     <span className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-800">
                       <Globe size={12} /> Excellence Hub
                     </span>
                  </div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Display Name</label>
                  <div className="relative">
                    <input 
                      required
                      className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-purple-500 outline-none transition-all font-bold text-slate-900 dark:text-white"
                      value={formData.full_name}
                      onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    />
                    <User className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Current Focus / Role</label>
                  <div className="relative">
                    <input 
                      placeholder="e.g. Senior Frontend Engineer"
                      className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-purple-500 outline-none transition-all font-bold text-slate-900 dark:text-white"
                      value={formData.career_role}
                      onChange={e => setFormData({ ...formData, career_role: e.target.value })}
                    />
                    <Briefcase className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  </div>
                </div>
             </div>

             <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Bio / Professional Synopsis</label>
                  <textarea 
                    rows={5}
                    placeholder="Tell your story..."
                    className="w-full px-8 py-6 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-purple-500 outline-none transition-all font-medium text-slate-900 dark:text-white text-sm"
                    value={formData.about_me}
                    onChange={e => setFormData({ ...formData, about_me: e.target.value })}
                  />
                </div>
             </div>
          </div>

          <div className="flex justify-end gap-4">
             <button 
               type="submit"
               disabled={loading}
               className={`px-10 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all ${
                 saved 
                 ? 'bg-green-500 text-white' 
                 : 'bg-purple-gradient text-white shadow-xl shadow-purple-500/20 hover:scale-[1.02] active:scale-95'
               }`}
             >
               {loading ? <Loader2 className="animate-spin" size={18} /> : saved ? <Check size={18} /> : <Save size={18} />}
               {saved ? 'Successfully Updated' : 'Sync Profile Settings'}
             </button>
          </div>
        </form>

        {/* Security / Password Reconfiguration Section */}
        <section className="space-y-8">
           <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-slate-900 dark:bg-white rounded-full"></div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Security Protocol</h2>
           </div>

           <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm">
             <div className="max-w-2xl">
               <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600">
                    <Lock size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight leading-none uppercase">Credential Management</h3>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">Reconfigure your core access key</p>
                  </div>
               </div>

               <form onSubmit={handlePasswordChange} className="space-y-6">
                 {passwordError && (
                   <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in shake">
                     <AlertCircle size={14} /> {passwordError}
                   </div>
                 )}
                 {passwordSuccess && (
                   <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-600 dark:text-green-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-top-2">
                     <Check size={14} /> {passwordSuccess}
                   </div>
                 )}

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Current Access Key</label>
                      <div className="relative">
                        <input 
                          required
                          type="password"
                          placeholder="••••••••"
                          className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-purple-500 outline-none transition-all font-bold"
                          value={passwords.current}
                          onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                        />
                        <Key className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">New Access Key</label>
                      <input 
                        required
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-purple-500 outline-none transition-all font-bold"
                        value={passwords.new}
                        onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Verify New Key</label>
                      <input 
                        required
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-purple-500 outline-none transition-all font-bold"
                        value={passwords.confirm}
                        onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                      />
                    </div>
                 </div>

                 <div className="pt-4">
                   <button 
                     disabled={passwordLoading || !passwords.current || !passwords.new}
                     className="px-10 py-4 bg-slate-900 text-white dark:bg-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-purple-600 transition-all disabled:opacity-50"
                   >
                     {passwordLoading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                     Update Access Node
                   </button>
                 </div>
               </form>
             </div>
           </div>
        </section>

        {session.user.role === AppRole.STUDENT && (
          <section className="space-y-8 pb-12">
             <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-purple-gradient rounded-full"></div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Achievement Vault</h2>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {allAchievements.map((badge, idx) => (
                  <div key={badge.id} className={`p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-700 text-center relative group transition-all hover:border-purple-400 hover:shadow-xl ${idx > 1 ? 'opacity-40 grayscale' : ''}`}>
                     <div className="text-5xl mb-4 group-hover:scale-125 transition-transform duration-500">{badge.icon}</div>
                     <h4 className="font-black text-sm text-slate-900 dark:text-white mb-2">{badge.title}</h4>
                     <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{badge.description}</p>
                     
                     <div className="absolute top-4 right-4">
                        {idx <= 1 ? (
                          <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg"><Check size={12} strokeWidth={4} /></div>
                        ) : (
                          <div className="w-6 h-6 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-full flex items-center justify-center"><Shield size={12} /></div>
                        )}
                     </div>
                  </div>
                ))}
             </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;