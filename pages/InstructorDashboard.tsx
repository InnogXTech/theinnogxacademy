
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { 
  Users, BookOpen, Plus, 
  Star, FileText, Loader2,
  ChevronRight, Award,
  Video, Clock, 
  Book, ChevronLeft, Lightbulb, Monitor, History,
  X, ShieldCheck, Upload, Trash2
} from 'lucide-react';
import { supabaseMock } from '../services/supabaseMock';
import { Course, Assignment, Module, Lesson } from '../types';

const InstructorDashboard: React.FC = () => {
  const session = supabaseMock.auth.getSession();
  const [activeTab, setActiveTab] = useState<'classroom' | 'students' | 'assignments'>('classroom');
  const [instructorCourses, setInstructorCourses] = useState<Course[]>([]);
  const [instructorStudents, setInstructorStudents] = useState<any[]>([]);
  const [instructorAssignments, setInstructorAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchTerm] = useState('');
  
  // Classroom Selection State
  const [selectedClassroom, setSelectedClassroom] = useState<Course | null>(null);
  const [classroomModules, setClassroomModules] = useState<Module[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [showLiveClass, setShowLiveClass] = useState(false);
  
  // Classroom Hub Sub-Tabs
  const [classTab, setClassTab] = useState<'notes' | 'archives'>('notes');

  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [assignmentForm, setAssignmentForm] = useState({ title: '', description: '', course_id: '', due_date: '' });
  const [gradeForm, setGradeForm] = useState({ submission_id: '', grade: '', feedback: '' });

  const refreshData = useCallback(async () => {
    if (!session?.user?.id) return;
    const allCourses = await supabaseMock.db.getCourses();
    const courses = allCourses.filter((c: any) => c.instructor_id === session.user.id);
    
    const [students, assignments, s] = await Promise.all([
      supabaseMock.db.getInstructorStudents(session.user.id),
      supabaseMock.db.getAssignmentsByInstructor(session.user.id),
      supabaseMock.db.getInstructorStats(session.user.id)
    ]);
    
    setInstructorCourses(courses);
    setInstructorStudents(students);
    setInstructorAssignments(assignments);
    setStats(s);
  }, [session?.user?.id]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleEnterClassroom = async (course: Course) => {
    setSelectedClassroom(course);
    const mods = await supabaseMock.db.getModules(course.id);
    
    setClassroomModules(mods);
    if (mods.length > 0) {
      const lessons = await supabaseMock.db.getLessons(mods[0].id);
      if (lessons.length > 0) setActiveLesson(lessons[0]);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await supabaseMock.db.createAssignment({ ...assignmentForm, instructor_id: session.user.id });
    setIsSubmitting(false);
    setShowAssignmentModal(false);
    setAssignmentForm({ title: '', description: '', course_id: '', due_date: '' });
    refreshData();
  };

  const handleViewSubmissions = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    const subs = await supabaseMock.db.getSubmissionsByAssignment(assignment.id);
    setSubmissions(subs);
  };

  const filteredStudents = useMemo(() => {
    return instructorStudents.filter(s => 
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.course_title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [instructorStudents, searchQuery]);

  const statCards = [
    { label: 'Assigned Scholars', value: stats?.studentCount || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Assigned Tracks', value: stats?.courseCount || 0, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Grading Queue', value: stats?.assignmentCount || 0, icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Expert Status', value: 'Verified', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-10 pb-20">
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Mentor Console</h1>
            <p className="text-slate-500 font-medium">Curriculum management and assignment orchestration terminal.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => setShowAssignmentModal(true)} className="px-8 py-5 bg-purple-gradient text-white rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-500/20 hover:scale-[1.02] transition-all flex items-center gap-3">
              <Plus size={18} strokeWidth={3} /> Post New Assignment
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm group hover:shadow-xl transition-all">
              <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6`}><stat.icon size={28} /></div>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</h3>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-1">
            {[
              { id: 'classroom', label: 'Faculty Hub', icon: Monitor },
              { id: 'students', label: 'Scholar Registry', icon: Users },
              { id: 'assignments', label: 'Evaluation Center', icon: FileText },
            ].map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as any); setSelectedClassroom(null); }}
                  className={`flex items-center gap-2 px-6 py-4 rounded-t-2xl text-[11px] font-black uppercase tracking-widest transition-all border-b-2 ${
                    activeTab === tab.id 
                    ? 'border-purple-600 text-purple-600 bg-purple-50/50 dark:bg-purple-900/10' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <TabIcon size={14} /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[500px]">
          {activeTab === 'classroom' && (
            <>
              {!selectedClassroom ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {instructorCourses.map((course) => (
                    <div key={course.id} className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm group hover:shadow-2xl transition-all duration-500 flex flex-col">
                      <div className="aspect-video relative overflow-hidden bg-slate-100 dark:bg-slate-900">
                        <img src={course.thumbnail_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <button 
                             onClick={() => handleEnterClassroom(course)}
                             className="px-6 py-3 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                           >
                             Manage Classroom
                           </button>
                        </div>
                      </div>
                      <div className="p-8 flex-1 flex flex-col">
                        <h4 className="font-black text-xl mb-4">{course.title}</h4>
                        <div className="mt-auto flex justify-between items-center pt-4 border-t border-slate-50 dark:border-slate-700">
                           <div className="flex items-center gap-2 text-slate-400">
                              <Clock size={14} className="text-purple-500" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Active Curriculum Node</span>
                           </div>
                           <button onClick={() => handleEnterClassroom(course)} className="text-purple-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-1">Open Hub <ChevronRight size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {instructorCourses.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-slate-900/30 rounded-[3rem] border-4 border-dashed border-slate-100 dark:border-slate-800">
                      <Monitor size={48} className="mx-auto mb-4 text-slate-300" />
                      <p className="font-black uppercase text-[10px] tracking-widest text-slate-400">No tracks assigned to your node</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col lg:flex-row min-h-[700px] animate-in zoom-in-95 duration-500">
                   <div className="w-full lg:w-[320px] border-r border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50/30 dark:bg-slate-900/50">
                      <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                         <button onClick={() => setSelectedClassroom(null)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 mb-6 transition-colors">
                           <ChevronLeft size={14} /> Back to Tracks
                         </button>
                         <h3 className="font-black text-lg tracking-tight leading-tight">{selectedClassroom.title}</h3>
                      </div>
                      
                      <div className="p-6 space-y-2">
                         {[
                            { id: 'notes', label: 'Teaching Briefs', icon: Book },
                            { id: 'archives', label: 'Session Archives', icon: History },
                         ].map(tab => {
                           const TabIcon = tab.icon;
                           return (
                             <button 
                               key={tab.id}
                               onClick={() => setClassTab(tab.id as any)}
                               className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${classTab === tab.id ? 'bg-purple-gradient text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
                             >
                               <TabIcon size={16} /> {tab.label}
                             </button>
                           );
                         })}
                      </div>

                      <div className="flex-1 overflow-y-auto custom-scrollbar border-t border-slate-100 dark:border-slate-800">
                         {classroomModules.map((m, mIdx) => (
                           <div key={m.id} className="p-6 border-b border-slate-50 dark:border-slate-800/50">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Module {mIdx+1}</p>
                              <p className="text-xs font-bold">{m.title}</p>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 p-8 lg:p-12">
                      {classTab === 'notes' && (
                         <div className="animate-in fade-in slide-in-from-bottom-4 space-y-12">
                            <div className="flex justify-between items-start">
                               <div>
                                  <h2 className="text-4xl font-black tracking-tight leading-tight">{activeLesson?.title || 'Session Briefing'}</h2>
                                  <p className="text-slate-500 mt-2 font-medium">Coordinate your Google Meet lecture from here.</p>
                               </div>
                               <button onClick={() => setShowLiveClass(true)} className="px-8 py-5 bg-purple-gradient text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all">
                                  <Video size={18} /> Start Global Session
                               </button>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                               <div className="p-8 bg-slate-900 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
                                  <div className="absolute top-0 right-0 p-8 opacity-10"><Lightbulb size={120} /></div>
                                  <h4 className="font-black text-sm uppercase tracking-[0.2em] text-purple-400 mb-6 flex items-center gap-3"><Award size={18} /> Faculty Briefing</h4>
                                  <ul className="space-y-4 relative z-10 text-sm font-medium opacity-90">
                                     <li className="flex gap-4"><div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 shrink-0"></div> Ensure screen sharing permissions are enabled.</li>
                                     <li className="flex gap-4"><div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 shrink-0"></div> Remind scholars about assignment milestones.</li>
                                     <li className="flex gap-4"><div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 shrink-0"></div> Node recording syncs automatically post-session.</li>
                                  </ul>
                               </div>
                               <div className="space-y-6">
                                  <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800">
                                     <h4 className="text-sm font-black uppercase tracking-widest mb-4">Lesson Synopsis</h4>
                                     <p className="text-slate-500 leading-relaxed font-medium">{activeLesson?.content || 'No specific briefing details provided for this lesson.'}</p>
                                  </div>
                               </div>
                            </div>
                         </div>
                      )}

                      {classTab === 'archives' && (
                         <div className="animate-in zoom-in-95 space-y-10">
                            <div className="flex justify-between items-center">
                               <h2 className="text-3xl font-black tracking-tight uppercase">Teaching Archives</h2>
                               <button className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">Refresh Sync</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <SessionList courseId={selectedClassroom.id} />
                            </div>
                         </div>
                      )}
                   </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'students' && (
             <div className="bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                   <h3 className="text-xl font-black uppercase tracking-tight">Active Scholar Registry</h3>
                   <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     {filteredStudents.length} Assigned Nodes
                   </div>
                </div>
                <table className="w-full text-left border-collapse">
                   <thead className="bg-slate-50 dark:bg-slate-900/50">
                     <tr>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Scholar</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Curriculum Node</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Command Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredStudents.map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                 <img src={`https://ui-avatars.com/api/?name=${s.full_name}&background=random`} className="w-12 h-12 rounded-2xl" alt="" />
                                 <div><p className="font-black text-sm text-slate-900 dark:text-white">{s.full_name}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{s.email}</p></div>
                              </div>
                           </td>
                           <td className="px-8 py-6 font-bold text-sm text-slate-600 dark:text-slate-400">{s.course_title}</td>
                           <td className="px-8 py-6 text-right">
                              <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-purple-600 transition-colors">Review Progress</button>
                           </td>
                        </tr>
                      ))}
                      {filteredStudents.length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-20 text-center opacity-30 font-black uppercase text-xs tracking-widest">No scholars found in registry</td>
                        </tr>
                      )}
                   </tbody>
                </table>
             </div>
          )}

          {activeTab === 'assignments' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-6">
                   <h3 className="text-xl font-black uppercase tracking-tight">Assignment Nodes</h3>
                   {instructorAssignments.map(as => (
                     <div key={as.id} onClick={() => handleViewSubmissions(as)} className={`p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] border cursor-pointer transition-all ${selectedAssignment?.id === as.id ? 'border-purple-500 shadow-xl' : 'border-slate-100 hover:border-slate-300'}`}>
                        <h4 className="font-black text-md mb-2">{as.title}</h4>
                        <p className="text-xs text-slate-500 mb-6 line-clamp-2 leading-relaxed font-medium">{as.description}</p>
                        <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Due: {as.due_date}</span>
                           <ChevronRight size={18} className="text-purple-500" />
                        </div>
                     </div>
                   ))}
                   {instructorAssignments.length === 0 && (
                     <div className="p-10 text-center opacity-30 border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                        <p className="font-black uppercase text-[10px] tracking-widest">No tasks deployed</p>
                     </div>
                   )}
                </div>
                
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-slate-700 overflow-hidden min-h-[600px] flex flex-col">
                   {selectedAssignment ? (
                      <div className="p-10 flex flex-col h-full">
                         <div className="flex justify-between items-center mb-10 pb-8 border-b border-slate-50 dark:border-slate-800">
                           <h3 className="text-3xl font-black">{selectedAssignment.title}</h3>
                           <button onClick={() => setSelectedAssignment(null)} className="p-2 text-slate-400"><X size={20} /></button>
                         </div>
                         <div className="space-y-8 overflow-y-auto max-h-[500px] custom-scrollbar">
                            {submissions.map(sub => (
                               <div key={sub.id} className="p-10 bg-slate-50 dark:bg-slate-900/40 rounded-[3rem] border border-slate-100 dark:border-slate-700">
                                  <div className="flex justify-between items-center mb-6">
                                     <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-purple-gradient rounded-xl flex items-center justify-center text-white text-xl font-black shadow-lg">{sub.student_name?.[0]}</div>
                                        <p className="font-black text-lg">{sub.student_name}</p>
                                     </div>
                                     {sub.grade && <span className="px-5 py-2.5 bg-green-100 text-green-600 rounded-2xl font-black text-xs uppercase">Graded: {sub.grade}</span>}
                                  </div>
                                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium italic mb-8">"{sub.content}"</p>
                                  {!sub.grade && (
                                     <form onSubmit={async (e) => { e.preventDefault(); await supabaseMock.db.gradeSubmission(sub.id, gradeForm.grade, gradeForm.feedback); handleViewSubmissions(selectedAssignment); }} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <input required placeholder="Grade" className="md:col-span-1 px-6 py-4 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 text-sm font-black focus:border-purple-500 outline-none" onChange={e => setGradeForm({...gradeForm, grade: e.target.value})} />
                                        <input required placeholder="Feedback notes..." className="md:col-span-2 px-6 py-4 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 text-sm font-medium focus:border-purple-500 outline-none" onChange={e => setGradeForm({...gradeForm, feedback: e.target.value})} />
                                        <button type="submit" className="md:col-span-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-purple-600 transition-all">Assign Grade</button>
                                     </form>
                                  )}
                               </div>
                            ))}
                            {submissions.length === 0 && (
                              <div className="py-20 text-center opacity-30">
                                <p className="font-black uppercase text-xs tracking-widest">No submissions yet for this node</p>
                              </div>
                            )}
                         </div>
                      </div>
                   ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-40 gap-4">
                         <FileText size={48} className="opacity-20" />
                         <p className="font-black uppercase tracking-widest text-[10px] italic">Initialization Required: Select task node to review submissions</p>
                      </div>
                   )}
                </div>
             </div>
          )}
        </div>
      </div>

      {showLiveClass && selectedClassroom && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-slate-950 animate-in fade-in duration-500">
           <div className="h-16 px-8 flex justify-between items-center bg-slate-900 border-b border-white/5 relative z-10">
              <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-purple-gradient rounded-xl text-white"><Video size={20} /></div>
                 <div>
                    <h4 className="text-white font-black text-sm tracking-tight">{selectedClassroom.title} • Mentoring Live</h4>
                    <p className="text-[9px] text-green-500 font-black uppercase tracking-widest">Global Sync Established</p>
                 </div>
              </div>
              <button 
                onClick={() => setShowLiveClass(false)}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all"
              >
                Terminate & Archive Node
              </button>
           </div>
           <div className="flex-1 bg-black relative">
              <iframe 
                src={selectedClassroom.google_meet_link} 
                allow="camera; microphone; fullscreen; display-capture; autoplay" 
                className="w-full h-full border-none"
                title="Google Meet Classroom"
              />
           </div>
        </div>
      )}

      {showAssignmentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[600px] rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95">
            <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30 px-12">
              <div>
                <h3 className="text-2xl font-black tracking-tight uppercase">Deploy Task</h3>
                <p className="text-[10px] font-black uppercase text-slate-400 mt-1">Initialize knowledge evaluation</p>
              </div>
              <button onClick={() => setShowAssignmentModal(false)} className="p-3 text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 rounded-xl shadow-sm"><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateAssignment} className="p-12 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Target Curriculum Track</label>
                <select 
                  required
                  className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 outline-none font-bold text-sm appearance-none focus:border-purple-500 transition-all dark:text-white"
                  value={assignmentForm.course_id}
                  onChange={e => setAssignmentForm({...assignmentForm, course_id: e.target.value})}
                >
                  <option value="">Select Curriculum Node...</option>
                  {instructorCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <input required value={assignmentForm.title} onChange={e => setAssignmentForm({...assignmentForm, title: e.target.value})} placeholder="Assignment Title" className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 outline-none font-bold text-sm" />
              <textarea rows={3} value={assignmentForm.description} onChange={e => setAssignmentForm({...assignmentForm, description: e.target.value})} placeholder="Detailed Task Description" className="w-full px-8 py-6 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 outline-none font-medium text-sm" />
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Curriculum Deliverables</label>
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-slate-400">PDFs, Docs, or Media nodes</p>
                  <button type="button" className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-purple-600 hover:text-white transition-all shadow-sm">
                    <Upload size={14} /> Upload Node
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Deadline Configuration</label>
                <input required type="date" value={assignmentForm.due_date} onChange={e => setAssignmentForm({...assignmentForm, due_date: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 outline-none font-bold text-sm" />
              </div>
              
              <button disabled={isSubmitting} type="submit" className="w-full py-6 bg-purple-gradient text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3">
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
                {isSubmitting ? "Syncing..." : "Commit Task Node"}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

const SessionList: React.FC<{ courseId: string }> = ({ courseId }) => {
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      const data = await supabaseMock.db.getClassSessions(courseId);
      setSessions(data);
    };
    fetchSessions();
  }, [courseId]);

  return (
    <>
      {sessions.map((sess: any) => (
        <div key={sess.id} className="p-8 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm group">
           <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 group-hover:text-purple-600 transition-colors"><Monitor size={20} /></div>
              <div className="text-right">
                 <p className="text-[10px] font-black uppercase text-slate-400">Archived On</p>
                 <p className="text-sm font-black">{new Date(sess.created_at).toLocaleDateString()}</p>
              </div>
           </div>
           <h4 className="font-black text-lg mb-6 leading-tight">Master Session: {sess.id.substring(0,8).toUpperCase()}</h4>
           <div className="flex gap-2">
              <button className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-purple-600 transition-all">Replay Node</button>
              <button className="flex-1 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-[9px] uppercase tracking-widest hover:border-purple-500 transition-all">Transcript</button>
           </div>
        </div>
      ))}
      {sessions.length === 0 && (
        <div className="col-span-full py-12 text-center opacity-30">
          <p className="font-black uppercase text-[10px] tracking-widest">No archives retrieved</p>
        </div>
      )}
    </>
  );
};

export default InstructorDashboard;
