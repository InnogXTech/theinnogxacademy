import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { 
  Home, BookOpen, GraduationCap, 
  CreditCard, User, LogOut, 
  Menu, X, Bell, Moon, Sun,
  Settings, Info, Star, FileText, ClipboardList, Video, History, UserCheck, Fingerprint, Users, Sparkles, Layout, Shield, Monitor
} from 'lucide-react';
import { supabaseMock, Notification } from '../services/supabaseMock';
import { AppRole } from '../types';
import { supabaseService } from '../services/supabase';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
           (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [session, setSession] = useState<any>(() => {
    try {
      const local = localStorage.getItem('innogx_user_session');
      return local ? JSON.parse(local) : null;
    } catch { return null; }
  });
  
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Robust Role Detection Protocol
  const role = useMemo(() => {
    const user = session?.user;
    if (!user) return AppRole.STUDENT;
    
    // Resolve Role from database (not email-based)
    const metaRole = user.user_metadata?.role;
    const profileRole = user.role;
    
    const rawRole = String(metaRole || profileRole || 'student').toLowerCase();
    
    if (rawRole === 'admin') return AppRole.ADMIN;
    if (rawRole === 'instructor') return AppRole.INSTRUCTOR;
    if (rawRole === 'parent') return AppRole.PARENT;
    
    return AppRole.STUDENT; 
  }, [session]);

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
    const handleSync = () => {
      try {
        const updated = JSON.parse(localStorage.getItem('innogx_user_session') || 'null');
        if (updated) setSession(updated);
      } catch (e) {}
    };
    window.addEventListener('storage', handleSync);
    return () => window.removeEventListener('storage', handleSync);
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      supabaseMock.db.getNotifications(session.user.id).then(setNotifications);
    }
  }, [location.pathname, session?.user?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      await supabaseService.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      // Clear the session state and dispatch storage event to sync across tabs
      setSession(null);
      window.dispatchEvent(new Event('storage'));
      // Use replace to prevent back button returning to dashboard
      window.location.replace('/');
    }
  };

  const navItems = useMemo(() => {
    const items = [];
    if (role === AppRole.INSTRUCTOR) {
      items.push(
        { label: 'Command Hub', icon: Monitor, path: `/dashboard/instructor` },
        { label: 'Assignments', icon: ClipboardList, path: `/dashboard/instructor/assignments` },
        { label: 'Recordings', icon: History, path: `/dashboard/instructor/recordings` }
      );
    } else if (role === AppRole.ADMIN) {
      items.push(
        { label: 'HQ Overview', icon: Layout, path: `/dashboard/admin` },
        { label: 'Engagement Audit', icon: UserCheck, path: `/dashboard/admin/attendance` },
        { label: 'Global Archives', icon: History, path: `/dashboard/admin/recordings` }
      );
    } else if (role === AppRole.PARENT) {
      items.push(
        { label: 'HQ Overview', icon: Layout, path: `/dashboard/parent` },
        { label: 'Scholar Uplink', icon: Users, path: `/dashboard/parent` },
        { label: 'Payments', icon: CreditCard, path: `/dashboard/parent/payments` }
      );
    } else {
      items.push(
        { label: 'HQ Overview', icon: Layout, path: `/dashboard/student` },
        { label: 'Community', icon: Users, path: `/dashboard/student/community` },
        { label: 'Assignments', icon: ClipboardList, path: `/dashboard/student/assignments` },
        { label: 'Attendance', icon: UserCheck, path: `/dashboard/student/attendance` },
        { label: 'Recordings', icon: History, path: `/dashboard/student/recordings` },
        { label: 'Curriculum Vault', icon: BookOpen, path: '/courses' },
        { label: 'My Learning', icon: GraduationCap, path: `/dashboard/student/my-courses` },
        { label: 'Tuition Ledger', icon: CreditCard, path: `/dashboard/student/payments` }
      );
    }
    items.push({ label: 'Identity Portal', icon: User, path: `/dashboard/${role}/profile` });
    return items;
  }, [role]);

  const rawFullName = session?.user?.full_name || session?.user?.user_metadata?.full_name || 'User';
  const safeFullName = typeof rawFullName === 'string' ? rawFullName : 'User';
  const userAvatar = session?.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(safeFullName)}&background=random&size=100`;

  const breadcrumb = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const last = segments.pop() || 'Overview';
    return String(last).replace('-', ' ').toUpperCase();
  }, [location.pathname]);

  const getRoleLabel = () => {
    if (role === AppRole.ADMIN) return 'MASTER ADMIN';
    if (role === AppRole.INSTRUCTOR) return 'EXPERT MENTOR';
    if (role === AppRole.PARENT) return 'GUARDIAN NODE';
    return 'LVL 1 SCHOLAR';
  };

  const activeLogo = isDarkMode ? "https://i.ibb.co/Kcdk8c1x/Photoroom-20251210-193802.png" : "https://i.ibb.co/35GKJS4x/Photoroom-20251210-193746.png";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 flex transition-colors duration-300 overflow-hidden">
      <aside className="hidden lg:flex w-72 flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 h-screen sticky top-0 z-[60] shadow-sm">
        <div className="p-8 text-center border-b border-slate-50 dark:border-slate-700/50 mb-4">
          <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
            <img src={activeLogo} alt="InnogX Logo" className="h-32 w-auto object-contain mx-auto" />
          </Link>
        </div>
        <nav className="flex-1 px-6 space-y-1.5 overflow-y-auto custom-scrollbar pt-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.label + item.path}
                to={item.path}
                className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${
                  isActive 
                    ? 'bg-purple-gradient text-white font-black shadow-lg shadow-purple-500/20 translate-x-1' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon size={18} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="text-[12px] uppercase tracking-widest font-black">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-6 mt-auto border-t border-slate-200 dark:border-slate-700">
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-4 w-full px-5 py-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all font-black text-[12px] uppercase tracking-widest group"
          >
            <LogOut size={18} className="group-hover:rotate-12 transition-transform" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md transition-all duration-500 lg:hidden" onClick={() => setIsSidebarOpen(false)}>
           <aside className="w-72 h-full bg-white dark:bg-slate-900 p-6 flex flex-col animate-slide-in shadow-2xl border-r border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-8">
                <img src={activeLogo} alt="Logo" className="h-16" />
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-500"><X size={20} /></button>
              </div>
              <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => (
                  <Link 
                    key={item.label + item.path} 
                    to={item.path} 
                    onClick={() => setIsSidebarOpen(false)}
                    className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-left transition-all ${
                      location.pathname === item.path 
                      ? 'bg-purple-gradient text-white font-black shadow-lg shadow-purple-500/20' 
                      : 'text-slate-600 dark:text-slate-400 font-bold'
                    }`}
                  >
                    <item.icon size={18} />
                    <span className="text-[11px] uppercase tracking-widest">{item.label}</span>
                  </Link>
                ))}
              </nav>
              <button onClick={handleLogout} className="mt-4 flex items-center gap-4 p-4 text-red-500 font-black text-[11px] uppercase tracking-widest border-t border-slate-100 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors">
                <LogOut size={18} /> Sign Out
              </button>
           </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-x-hidden relative h-screen">
        <header className="h-16 lg:h-20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 px-4 lg:px-12 flex items-center justify-between sticky top-0 z-[55] transition-all duration-500 shrink-0">
          <button className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          
          <div className="flex items-center gap-3 lg:gap-4 ml-2 lg:ml-0">
             <div className="w-1 h-5 lg:w-1.5 lg:h-8 bg-purple-gradient rounded-full"></div>
             <h2 className="text-[10px] lg:text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.15em] lg:tracking-[0.2em] truncate max-w-[120px] sm:max-w-none">
               {breadcrumb}
             </h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-6 relative" ref={notificationRef}>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 lg:p-3 text-slate-400 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-all bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600 shadow-sm">
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            
            <button 
              onClick={() => setShowNotifications(!showNotifications)} 
              className={`p-2 lg:p-3 transition-all rounded-xl border border-slate-100 dark:border-slate-600 shadow-sm relative ${
                showNotifications ? 'bg-purple-600 text-white' : 'text-slate-400 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50'
              }`}
            >
              <Bell size={16} />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[7px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute top-14 right-0 w-[calc(100vw-32px)] sm:w-80 lg:w-96 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl lg:rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 z-[100]">
                 <div className="p-4 lg:p-6 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-[10px] lg:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Alert Center</h3>
                    <span className="text-[7px] lg:text-[10px] font-black px-2 py-1 bg-slate-100 dark:bg-slate-900 rounded-lg">{notifications.length} Total</span>
                 </div>
                 <div className="max-h-[300px] lg:max-h-[400px] overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <div key={n.id} className={`p-4 lg:p-6 border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer flex gap-3 lg:gap-4 ${!n.read ? 'bg-purple-50/30 dark:bg-purple-900/10' : ''}`}>
                           <div className="flex-1 min-w-0">
                              <p className="text-[9px] lg:text-xs font-black text-slate-900 dark:text-white truncate">{n.title}</p>
                              <p className="text-[8px] lg:text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-2">{n.message}</p>
                           </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-slate-400 opacity-40">
                         <Bell size={24} className="mx-auto mb-2" />
                         <p className="text-[9px] font-black uppercase tracking-widest">Quiet in the hub</p>
                      </div>
                    )}
                 </div>
              </div>
            )}
            
            <div className="flex items-center gap-2 sm:gap-4 pl-1.5 sm:pl-6 border-l border-slate-200 dark:border-slate-700">
              <Link to={`/dashboard/${role}/profile`} className="flex items-center gap-3 group">
                <div className="hidden sm:block text-right">
                   <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase leading-none truncate max-w-[100px]">{safeFullName.split(' ')[0]}</p>
                   <p className="text-[7px] font-black text-purple-600 uppercase tracking-widest mt-1">{getRoleLabel()}</p>
                </div>
                <div className="w-8 h-8 lg:w-12 lg:h-12 rounded-lg lg:rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-600 shadow-sm group-hover:border-purple-500 transition-colors">
                  <img src={userAvatar} alt="User" className="w-full h-full object-cover" />
                </div>
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-12 overflow-y-auto custom-scrollbar relative">
          <div className="animate-in fade-in duration-700 max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;