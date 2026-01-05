
import React, { useState, useEffect, useMemo, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { 
  Users, CreditCard, Shield, Megaphone, 
  Trash2, Plus, BarChart3, Clock, 
  Search, Briefcase, FileText, Activity,
  X, Link as LinkIcon, BookOpen,
  CheckCircle, AlertCircle, ShieldCheck, 
  Loader2, Globe, Send, Image as ImageIcon,
  Edit, Video, Monitor, ExternalLink, Printer, Download,
  Filter, ArrowDownToLine, Receipt, DollarSign, UserCheck,
  UserX, ShieldOff, AlertTriangle, UserPlus, Fingerprint,
  Zap, Command, ShieldAlert, Settings, Save,
  GraduationCap, Crown, Eye, Layers, Upload, Camera,
  ShieldPlus
} from 'lucide-react';
import { supabaseMock, AdminLog, Announcement } from '../services/supabaseMock';
import { supabase } from '../services/supabase';
import { AppRole, Profile, Course, Transaction, Assignment } from '../types';

const AdminDashboard: React.FC = () => {
  const session = supabaseMock.auth.getSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'identity' | 'staff' | 'family' | 'courses' | 'payments'>('overview');
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingLinks, setPendingLinks] = useState<any[]>([]);
  
  // Staff Audit State
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);
  const [mentorAssignments, setMentorAssignments] = useState<Assignment[]>([]);
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(false);

  const [showAnnModal, setShowAnnModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Course Modal State
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    price: '',
    description: '',
    google_meet_link: '',
    thumbnail_url: ''
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    const [p, c, l, pl, txs, ens] = await Promise.all([
      supabaseMock.db.getProfiles(),
      supabaseMock.db.getCourses(),
      supabaseMock.db.getAdminLogs(),
      supabaseMock.db.getPendingLinks(),
      supabaseMock.db.getTransactions(),
      supabaseMock.db.getEnrollments()
    ]);
    
    setProfiles(p || []);
    setCourses(c || []);
    setLogs(l || []);
    setPendingLinks(pl || []);
    setTransactions(txs || []);
    setEnrollments(ens || []);

    const instrs = (p || []).filter(u => u.role === AppRole.INSTRUCTOR && u.is_verified);
    if (instrs.length > 0 && !selectedMentorId) {
      handleMentorSelect(instrs[0].id);
    }
  };

  const handleMentorSelect = async (id: string) => {
    setSelectedMentorId(id);
    setIsAssignmentsLoading(true);
    try {
      const data = await supabaseMock.db.getAssignmentsByInstructor(id);
      setMentorAssignments(data);
    } finally {
      setIsAssignmentsLoading(false);
    }
  };

  const handleVerifyInstructor = async (id: string) => {
    await supabaseMock.db.verifyInstructor(id, session?.user?.full_name || 'Admin');
    refreshData();
  };

  const handlePromoteToAdmin = async (id: string, name: string) => {
    if (confirm(`AUTHORIZE GOVERNANCE UPGRADE: Are you sure you want to promote ${name} to Administrator? This node will gain full access to all command functions.`)) {
      await supabaseMock.db.updateProfile(id, { role: AppRole.ADMIN });
      await supabase.from('admin_logs').insert({ 
        action: `PROMOTED USER TO ADMIN: ${name}`, 
        admin_name: session?.user?.full_name || 'Master Admin',
        timestamp: new Date().toISOString()
      });
      refreshData();
    }
  };

  const handleSuspendUser = async (id: string, role: string) => {
    if (role === AppRole.ADMIN) {
      alert("ADMIN_PROTECTED: Suspension protocol rejected. Admin users cannot be suspended.");
      return;
    }
    await supabaseMock.db.suspendUser(id, session?.user?.full_name || 'Admin');
    refreshData();
  };

  const handleDeleteUser = async (id: string, role: string) => {
    if (role === AppRole.ADMIN) {
      alert("ADMIN_PROTECTED: Termination protocol rejected. Admin users cannot be deleted.");
      return;
    }
    if (confirm("Terminate identity node? This action is absolute and irreversible.")) {
      await supabaseMock.db.deleteProfile(id, session?.user?.full_name || 'Admin');
      refreshData();
    }
  };

  // Fixed: Implemented missing openEditCourse function
  const openEditCourse = (course: Course) => {
    setEditingCourse(course);
    setEditForm({
      title: course.title,
      price: String(course.price || 0),
      description: course.description,
      google_meet_link: course.google_meet_link || '',
      thumbnail_url: course.thumbnail_url
    });
  };

  const handleSaveCourseEdits = async () => {
    if (!editingCourse) return;
    setIsSubmitting(true);
    try {
       await supabaseMock.db.updateCourse(editingCourse.id, {
         title: editForm.title,
         price: Number(editForm.price),
         description: editForm.description,
         google_meet_link: editForm.google_meet_link,
         thumbnail_url: editForm.thumbnail_url
       });

       await supabase.from('admin_logs').insert({ 
         action: `Updated configuration for curriculum node: ${editForm.title}`, 
         admin_name: session?.user?.full_name || 'Admin',
         timestamp: new Date().toISOString()
       });
       
       setEditingCourse(null);
       refreshData();
    } catch (err: any) {
       alert("Sync failed: " + err.message);
    } finally {
       setIsSubmitting(false);
    }
  };

  const stats = useMemo(() => {
    return {
      totalUsers: profiles.length,
      totalRevenue: transactions.reduce((acc, tx) => acc + (tx?.amount || 0), 0),
      activeCourses: courses.length,
      totalEnrollments: enrollments.length,
      onlineUsers: profiles.filter(p => p.is_online).length
    };
  }, [profiles, transactions, courses, enrollments]);

  const instructors = profiles.filter(p => p.role === AppRole.INSTRUCTOR && p.is_verified);
  const pendingInstructors = profiles.filter(p => p.role === AppRole.INSTRUCTOR && !p.is_verified);

  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => 
      p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [profiles, searchTerm]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
        
        {/* Header - Admin Specific */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden ring-1 ring-white/10">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Shield size={200} /></div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1 bg-purple-500/20 rounded-full border border-purple-500/30 mb-4">
               <ShieldCheck size={14} className="text-purple-400" />
               <span className="text-[9px] font-black uppercase tracking-widest text-purple-400">Governance Terminal v5.0</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-none mb-3">Central Command</h1>
            <p className="text-slate-400 font-medium max-w-lg">Absolute platform oversight. Verify staffing nodes, audit curriculum deliverables, and manage global identities.</p>
          </div>
          <div className="relative z-10 flex flex-wrap gap-4">
             <button onClick={() => setShowAnnModal(true)} className="flex items-center gap-3 px-8 py-5 bg-white text-slate-900 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all">
               <Megaphone size={18} /> Global Broadcast
             </button>
             <button onClick={() => setShowCourseModal(true)} className="flex items-center gap-3 px-8 py-5 bg-purple-gradient text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all border border-white/10">
               <Plus size={18} strokeWidth={3} /> Deploy Curriculum
             </button>
          </div>
        </div>

        {/* Admin Navigation */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-[2.5rem] w-full lg:w-fit border border-slate-200 dark:border-slate-700 overflow-x-auto scrollbar-hide">
            {[
              { id: 'overview', label: 'Intelligence', icon: Activity },
              { id: 'identity', label: 'Identity Registry', icon: Fingerprint },
              { id: 'staff', label: 'Staffing Hub', icon: GraduationCap, badge: pendingInstructors.length },
              { id: 'family', label: 'Connectivity', icon: LinkIcon },
              { id: 'courses', label: 'Curriculum Ops', icon: Settings },
              { id: 'payments', label: 'Financial Audit', icon: CreditCard },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-8 py-4 rounded-[2rem] text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap relative ${
                  activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-xl' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <tab.icon size={16} /> {tab.label}
                {tab.badge ? (
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-[9px] font-black ring-4 ring-slate-50 dark:ring-slate-900 animate-pulse">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              placeholder="Search registry..."
              className="w-full pl-14 pr-6 py-4 rounded-[1.8rem] border-2 border-transparent bg-white dark:bg-slate-800 text-sm font-bold outline-none focus:border-purple-500 transition-all shadow-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Command Panels */}
        <div className="min-h-[600px]">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 animate-in zoom-in-95 duration-500">
              <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
                {[
                  { label: 'Platform Identities', value: stats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-100/40' },
                  { label: 'Active Node Uplinks', value: stats.onlineUsers, icon: Zap, color: 'text-green-500', bg: 'bg-green-100/40' },
                  { label: 'Platform Inflow', value: `₦${stats.totalRevenue.toLocaleString()}`, icon: Receipt, color: 'text-purple-500', bg: 'bg-purple-100/40' },
                  { label: 'Mastery Enrollments', value: stats.totalEnrollments, icon: GraduationCap, color: 'text-orange-500', bg: 'bg-orange-100/40' }
                ].map((stat, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 p-10 rounded-[3.5rem] border border-slate-100 dark:border-slate-700 shadow-sm group hover:shadow-2xl transition-all">
                    <div className={`w-16 h-16 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-8 group-hover:rotate-6 transition-transform`}>
                      <stat.icon size={32} />
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">{stat.label}</p>
                    <h3 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</h3>
                  </div>
                ))}
              </div>
              <div className="xl:col-span-1 bg-white dark:bg-slate-800 p-10 rounded-[3.5rem] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col">
                 <h3 className="text-xl font-black mb-8 flex items-center gap-3"><Activity size={24} className="text-purple-600" /> Platform Logs</h3>
                 <div className="flex-1 space-y-6 overflow-y-auto pr-4 custom-scrollbar max-h-[500px]">
                    {logs.map(log => (
                       <div key={log.id} className="p-5 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 group hover:border-purple-200 transition-all">
                          <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight mb-2">{log.action}</p>
                          <div className="flex justify-between items-center opacity-40">
                             <p className="text-[9px] font-black uppercase tracking-widest">{log.admin_name}</p>
                             <p className="text-[9px] font-black uppercase">{new Date(log.timestamp).toLocaleTimeString()}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start animate-in slide-in-from-bottom-4 duration-500">
               
               {/* Instructor Verification Queue - ALWAYS VISIBLE Sidebar style */}
               <div className="xl:col-span-4 space-y-6">
                  <div className="bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-orange-50/50 dark:bg-orange-950/20">
                      <h3 className="text-xl font-black text-orange-600 flex items-center gap-3">
                        <ShieldAlert size={24} /> Verification Queue
                      </h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 mt-1">Authorized instructors waiting activation</p>
                    </div>
                    <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                       {pendingInstructors.map(p => (
                         <div key={p.id} className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 group">
                            <div className="flex items-center gap-4">
                               <img src={p.avatar_url || `https://ui-avatars.com/api/?name=${p.full_name}&background=orange&color=fff`} className="w-12 h-12 rounded-xl" />
                               <div>
                                  <p className="font-black text-sm">{p.full_name}</p>
                                  <p className="text-[10px] font-bold text-slate-400 truncate w-32">{p.email}</p>
                               </div>
                            </div>
                            <button 
                              onClick={() => handleVerifyInstructor(p.id)}
                              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-lg shadow-green-500/20"
                            >
                               Authorize Mentor Node
                            </button>
                         </div>
                       ))}
                       {pendingInstructors.length === 0 && (
                         <div className="py-20 text-center opacity-30 flex flex-col items-center">
                            <CheckCircle size={48} className="mb-4 text-green-500" />
                            <p className="font-black uppercase tracking-widest text-[10px]">Queue Clear</p>
                         </div>
                       )}
                    </div>
                  </div>
               </div>

               {/* Mentor Performance Hub */}
               <div className="xl:col-span-8 bg-white dark:bg-slate-800 rounded-[3.5rem] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col lg:flex-row min-h-[600px]">
                   <div className="w-full lg:w-72 border-r border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-700">
                          <h3 className="text-lg font-black uppercase tracking-tight">Active Mentors</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                          {instructors.map(instr => (
                              <button 
                                key={instr.id} 
                                onClick={() => handleMentorSelect(instr.id)}
                                className={`w-full p-6 flex items-center gap-4 transition-all hover:bg-white dark:hover:bg-slate-800 border-l-4 ${selectedMentorId === instr.id ? 'border-purple-600 bg-white dark:bg-slate-800' : 'border-transparent'}`}
                              >
                                <img src={instr.avatar_url || `https://ui-avatars.com/api/?name=${instr.full_name}&background=random`} className="w-10 h-10 rounded-xl" />
                                <div className="text-left overflow-hidden">
                                    <p className={`font-black text-xs truncate ${selectedMentorId === instr.id ? 'text-purple-600' : 'text-slate-900 dark:text-white'}`}>{instr.full_name}</p>
                                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Active Status</p>
                                </div>
                              </button>
                          ))}
                        </div>
                   </div>

                   <div className="flex-1 p-8 lg:p-12">
                      {selectedMentorId ? (
                         <div className="space-y-10 animate-in fade-in">
                            <div className="flex justify-between items-center">
                               <h2 className="text-2xl font-black">{profiles.find(p => p.id === selectedMentorId)?.full_name}'s Deliverables</h2>
                               <span className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase">{mentorAssignments.length} TASKS LOGGED</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               {mentorAssignments.map(as => (
                                 <div key={as.id} className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-purple-200 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                       <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-purple-600 shadow-sm"><FileText size={20} /></div>
                                       <span className="text-[8px] font-black uppercase text-slate-400">Due: {as.due_date}</span>
                                    </div>
                                    <h4 className="font-black text-sm mb-2">{as.title}</h4>
                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">{as.description}</p>
                                    <button className="text-[9px] font-black uppercase text-purple-600 flex items-center gap-1.5 hover:underline"><Eye size={12} /> Audit Submission Path</button>
                                 </div>
                               ))}
                               {mentorAssignments.length === 0 && (
                                 <div className="col-span-full py-20 text-center opacity-20">
                                    <Layers size={48} className="mx-auto mb-4" />
                                    <p className="font-black text-xs uppercase tracking-widest">No Deliverables Retrievable</p>
                                 </div>
                               )}
                            </div>
                         </div>
                      ) : (
                         <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-40">
                            <Users size={64} className="mb-4" />
                            <p className="font-black uppercase tracking-widest text-xs italic">Initialization Required: Select a staffing node</p>
                         </div>
                      )}
                   </div>
               </div>
            </div>
          )}

          {activeTab === 'identity' && (
            <div className="bg-white dark:bg-slate-800 rounded-[3.5rem] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
               <div className="p-10 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center">
                  <h3 className="text-2xl font-black flex items-center gap-4"><Users size={28} className="text-purple-600" /> Identity Management Registry</h3>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50/50 dark:bg-slate-900/50">
                        <tr>
                           <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Identity</th>
                           <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Protocol</th>
                           <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Live Status</th>
                           <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Command Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredProfiles.map(p => {
                          const isAdmin = p.role === AppRole.ADMIN;
                          return (
                          <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all group">
                             <td className="px-10 py-8">
                                <div className="flex items-center gap-5">
                                   <div className="relative">
                                      <img src={p.avatar_url || `https://ui-avatars.com/api/?name=${p.full_name}&background=random`} className="w-14 h-14 rounded-2xl" />
                                      {isAdmin && (
                                         <div className="absolute -top-2 -right-2 bg-yellow-400 text-slate-900 p-1 rounded-full shadow-lg border-2 border-white dark:border-slate-800">
                                            <Crown size={10} strokeWidth={3} />
                                         </div>
                                      )}
                                   </div>
                                   <div>
                                      <p className="font-black text-md text-slate-900 dark:text-white leading-none">{p.full_name}</p>
                                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{p.email}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="px-10 py-8">
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                   p.role === AppRole.ADMIN ? 'bg-red-100 text-red-600' :
                                   p.role === AppRole.INSTRUCTOR ? 'bg-blue-100 text-blue-600' :
                                   'bg-slate-100 text-slate-600'
                                }`}>{p.role}</span>
                             </td>
                             <td className="px-10 py-8 text-center">
                                <div className={`w-3 h-3 rounded-full mx-auto ${p.is_online ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse' : 'bg-slate-300'}`}></div>
                             </td>
                             <td className="px-10 py-8 text-right">
                                <div className={`flex justify-end gap-2 transition-opacity ${isAdmin ? 'opacity-20 cursor-not-allowed' : 'opacity-0 group-hover:opacity-100'}`}>
                                   {!isAdmin && p.role !== AppRole.ADMIN && (
                                      <button 
                                        onClick={() => handlePromoteToAdmin(p.id, p.full_name)}
                                        title="Elevate Governance Role"
                                        className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-xl hover:bg-purple-600 hover:text-white transition-all"
                                      >
                                        <ShieldPlus size={18} />
                                      </button>
                                   )}
                                   <button disabled={isAdmin} onClick={() => handleSuspendUser(p.id, p.role || AppRole.STUDENT)} title="Suspend User Access" className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-orange-500 hover:text-white transition-all"><ShieldOff size={18} /></button>
                                   <button disabled={isAdmin} onClick={() => handleDeleteUser(p.id, p.role || AppRole.STUDENT)} title="Terminate Node ID" className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18} /></button>
                                </div>
                             </td>
                          </tr>
                        );})}
                     </tbody>
                  </table>
               </div>
            </div>
          )}

          {activeTab === 'courses' && (
            <div className="space-y-8 animate-in slide-in-from-right-4">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {courses.map(course => {
                     const instructor = profiles.find(p => p.id === course.instructor_id);
                     return (
                        <div key={course.id} className="bg-white dark:bg-slate-800 rounded-[3.5rem] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm group hover:shadow-2xl transition-all flex flex-col">
                           <div className="aspect-video relative overflow-hidden bg-slate-900">
                              <img src={course.thumbnail_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                              <div className="absolute top-6 left-6 px-4 py-1.5 bg-slate-900/80 backdrop-blur rounded-xl text-[9px] font-black uppercase text-white border border-white/10">Active Node</div>
                              <div className="absolute bottom-6 right-6">
                                 <button 
                                   onClick={() => openEditCourse(course)}
                                   className="p-4 bg-purple-gradient text-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all"
                                 >
                                    <Settings size={20} />
                                 </button>
                              </div>
                           </div>
                           <div className="p-10 flex-1 flex flex-col">
                              <h4 className="text-2xl font-black leading-tight mb-4">{course.title}</h4>
                              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 mb-8">
                                 <p className="text-[10px] font-black uppercase text-slate-400 mb-2 flex items-center gap-2"><Video size={12} /> Lecture Endpoint</p>
                                 <p className="text-xs font-bold text-purple-600 truncate">{course.google_meet_link || 'LINK_NOT_ESTABLISHED'}</p>
                              </div>
                              <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-700">
                                 <div className="flex items-center gap-3">
                                    <img src={instructor?.avatar_url || `https://ui-avatars.com/api/?name=${instructor?.full_name}`} className="w-10 h-10 rounded-xl" />
                                    <div>
                                       <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Mentor</p>
                                       <p className="text-xs font-bold">{instructor?.full_name || 'UNASSIGNED'}</p>
                                    </div>
                                 </div>
                                 <button onClick={() => supabaseMock.db.deleteCourse(course.id, session?.user?.full_name || 'Admin')} className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-xl transition-all"><Trash2 size={18} /></button>
                              </div>
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>
          )}

          {activeTab === 'payments' && (
             <div className="bg-white dark:bg-slate-800 rounded-[3.5rem] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="p-10 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
                   <h3 className="text-2xl font-black flex items-center gap-4"><Receipt size={28} className="text-purple-600" /> Platform Revenue Ledger</h3>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50/30 dark:bg-slate-900/50">
                         <tr>
                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity Node</th>
                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Sync</th>
                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Value</th>
                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                         {transactions.map(tx => {
                            const user = profiles.find(p => p.id === tx.user_id);
                            return (
                               <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all">
                                  <td className="px-10 py-8">
                                     <div className="flex items-center gap-4">
                                        <img src={`https://ui-avatars.com/api/?name=${user?.full_name || 'U'}&background=random`} className="w-12 h-12 rounded-xl" />
                                        <div>
                                           <p className="font-black text-md leading-none">{user?.full_name || 'OFFLINE_ENTITY'}</p>
                                           <p className="text-[10px] text-slate-400 mt-1">{user?.email}</p>
                                        </div>
                                     </div>
                                  </td>
                                  <td className="px-10 py-8">
                                     <p className="text-sm font-bold">{tx.item_name}</p>
                                     <p className="text-[10px] text-slate-400 uppercase tracking-tight mt-1 opacity-50">REF: {tx.reference.substring(0, 12).toUpperCase()}</p>
                                  </td>
                                  <td className="px-10 py-8 text-center font-black text-lg text-slate-900 dark:text-white">₦{tx.amount.toLocaleString()}</td>
                                  <td className="px-10 py-8 text-right">
                                     <button className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-purple-600 transition-all">Audit Receipt</button>
                                  </td>
                               </tr>
                            );
                         })}
                      </tbody>
                   </table>
                </div>
             </div>
          )}

          {activeTab === 'family' && (
            <div className="bg-white dark:bg-slate-800 rounded-[3.5rem] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
               <div className="p-10 border-b border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center">
                  <h3 className="text-2xl font-black">Node Connectivity Registry</h3>
                  <span className="px-5 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">{pendingLinks.length} PENDING AUTHORIZATIONS</span>
               </div>
               <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pendingLinks.map((link, idx) => (
                    <div key={idx} className="p-12 flex flex-col md:flex-row items-center justify-between gap-10 group">
                       <div className="flex items-center gap-16">
                          <div className="text-center">
                             <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Uplink: Parent</p>
                             <p className="font-black text-lg">{link.parent?.full_name}</p>
                             <p className="text-xs font-bold text-purple-600">{link.parent?.email}</p>
                          </div>
                          <div className="flex flex-col items-center">
                             <ArrowDownToLine size={32} className="-rotate-90 text-purple-600 animate-pulse" />
                             <span className="text-[9px] font-black text-purple-400 mt-2 uppercase tracking-widest">Handshaking...</span>
                          </div>
                          <div className="text-center">
                             <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Downlink: Scholar</p>
                             <p className="font-black text-lg">{link.child?.full_name}</p>
                             <p className="text-xs font-bold text-blue-600">{link.child?.email}</p>
                          </div>
                       </div>
                       {/* Fixed: Added missing adminName argument to approveLink (fixing Expected 3 arguments, but got 2) */}
                       <button onClick={() => supabaseMock.db.approveLink(link.parent_id, link.child_id, session?.user?.full_name || 'Admin')} className="w-full md:auto px-12 py-5 bg-purple-gradient text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all">Authorize Node Link</button>
                    </div>
                  ))}
                  {pendingLinks.length === 0 && (
                    <div className="py-40 text-center opacity-30 flex flex-col items-center">
                       <LinkIcon size={80} className="mb-8" />
                       <p className="font-black uppercase tracking-[0.4em] text-sm">All family nodes are securely synchronized</p>
                    </div>
                  )}
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals are unchanged from previous logic to maintain persistence ... */}
      {editingCourse && (
         <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-[720px] rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95">
               <div className="p-10 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center px-12">
                  <div>
                    <h3 className="text-3xl font-black tracking-tight leading-none">Node Configuration</h3>
                    <p className="text-[10px] font-black uppercase text-purple-600 tracking-widest mt-2">{editingCourse.title}</p>
                  </div>
                  <button onClick={() => setEditingCourse(null)} className="p-3 text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border active:scale-90 transition-all"><X size={24} /></button>
               </div>
               
               <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-10 overflow-y-auto max-h-[70vh] custom-scrollbar">
                  <div className="space-y-6">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Curriculum Visualization</label>
                        <div className="relative group aspect-video rounded-[2.5rem] overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-inner">
                           <img src={editForm.thumbnail_url} className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                              <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-white text-slate-900 rounded-2xl shadow-xl hover:scale-110 transition-transform"><Upload size={20} /></button>
                              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Track Title</label>
                        <input className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 outline-none font-bold text-sm" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Tuition Value (NGN)</label>
                        <input type="number" className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 outline-none font-bold text-sm" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} />
                     </div>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Track Synopsis</label>
                     <textarea rows={4} className="w-full px-8 py-6 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 outline-none font-medium text-sm" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
                  </div>
               </div>

               <div className="p-10 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex justify-end gap-4 px-12">
                  <button 
                    disabled={isSubmitting}
                    onClick={handleSaveCourseEdits}
                    className="px-12 py-5 bg-purple-gradient text-white rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                  >
                     {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                     {isSubmitting ? "SYNCING..." : "COMMIT NODE UPDATES"}
                  </button>
               </div>
            </div>
         </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
