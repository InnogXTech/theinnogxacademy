
import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { supabaseMock } from '../services/supabaseMock';
import { 
  FileText, Clock, CheckCircle, 
  Search, Filter, ChevronRight,
  AlertCircle, Send, Award, Plus, X, Loader2,
  BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudentAssignments: React.FC = () => {
  const navigate = useNavigate();
  const session = supabaseMock.auth.getSession();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitForm, setSubmitForm] = useState({ assignmentId: '', content: '' });

  const loadData = () => {
    if (session?.user?.id) {
      supabaseMock.db.getAssignmentsByStudent(session.user.id).then(setAssignments);
      supabaseMock.db.getSubmissionsByStudent(session.user.id).then(setSubmissions);
    }
  };

  useEffect(() => {
    loadData();
  }, [session?.user?.id]);

  const assignmentList = useMemo(() => {
    return assignments.map(as => {
      const submission = submissions.find(s => s.assignment_id === as.id);
      let status: 'pending' | 'submitted' | 'graded' = 'pending';
      if (submission) {
        status = submission.grade ? 'graded' : 'submitted';
      }
      return { ...as, status, submission };
    }).filter(as => {
      const matchesSearch = as.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || as.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [assignments, submissions, filterStatus, searchTerm]);

  const pendingSubmissions = useMemo(() => {
    return assignments.filter(as => !submissions.some(s => s.assignment_id === as.id));
  }, [assignments, submissions]);

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitForm.assignmentId || !submitForm.content.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      supabaseMock.db.submitAssignment({
        assignment_id: submitForm.assignmentId,
        student_id: session.user.id,
        content: submitForm.content
      });
      setIsSubmitting(false);
      setShowSubmitModal(false);
      setSubmitForm({ assignmentId: '', content: '' });
      loadData(); 
    }, 1200);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header with Submit Button */}
        <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><FileText size={160} /></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-black tracking-tight mb-2">Academic Hub</h1>
            <p className="text-slate-500 font-medium">Manage and track your knowledge tasks across all curriculums.</p>
          </div>
          
          <button 
            onClick={() => {
              setSubmitForm({ ...submitForm, assignmentId: '' });
              setShowSubmitModal(true);
            }}
            className="relative z-10 px-8 py-4 bg-purple-gradient text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 shrink-0 group"
          >
            <Plus size={16} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
            Submit Assignment
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-slate-100/50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700">
           <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-inner w-full md:w-fit">
              {['all', 'pending', 'submitted', 'graded'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status as any)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    filterStatus === status 
                    ? 'bg-purple-gradient text-white shadow-lg' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
           </div>
           
           <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Find specific task..."
                className="w-full pl-12 pr-6 py-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none font-bold text-sm focus:border-purple-500 transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        {/* Assignment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
          {assignmentList.map((as) => (
            <div key={as.id} className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-2xl transition-all duration-500 group flex flex-col">
               <div className="flex justify-between items-start mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                    as.status === 'graded' ? 'bg-green-100 text-green-600' :
                    as.status === 'submitted' ? 'bg-blue-100 text-blue-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {as.status === 'graded' ? <Award size={28} /> : 
                     as.status === 'submitted' ? <CheckCircle size={28} /> : 
                     <Clock size={28} />}
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    as.status === 'graded' ? 'bg-green-100 text-green-600' :
                    as.status === 'submitted' ? 'bg-blue-100 text-blue-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {as.status}
                  </span>
               </div>

               <h3 className="text-xl font-black mb-2 line-clamp-1">{as.title}</h3>
               <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 line-clamp-2 leading-relaxed font-medium">
                 {as.description}
               </p>

               <div className="mt-auto space-y-6 pt-6 border-t border-slate-50 dark:border-slate-700">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                     <span>Due Date</span>
                     <span className="text-slate-900 dark:text-white">{as.due_date}</span>
                  </div>
                  
                  <button 
                    onClick={() => {
                      if (as.status === 'pending') {
                        setSubmitForm({ ...submitForm, assignmentId: as.id });
                        setShowSubmitModal(true);
                      } else {
                        navigate(`/courses/${as.course_id}`);
                      }
                    }}
                    className="w-full py-4 bg-slate-900 text-white dark:bg-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-purple-600 transition-all flex items-center justify-center gap-2"
                  >
                    {as.status === 'pending' ? 'Submit Work' : 'View Submission'} <ChevronRight size={14} />
                  </button>
               </div>
            </div>
          ))}

          {assignmentList.length === 0 && (
            <div className="col-span-full py-40 text-center bg-slate-50 dark:bg-slate-900/30 rounded-[3rem] border-4 border-dashed border-slate-100 dark:border-slate-800">
               <AlertCircle size={64} className="mx-auto mb-6 text-slate-200" />
               <h3 className="text-2xl font-black text-slate-300">No Assignments Found</h3>
               <p className="text-slate-400 font-medium">Try adjusting your filters or search query.</p>
            </div>
          )}
        </div>
      </div>

      {/* Submission Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[540px] rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 border border-slate-100 dark:border-slate-800">
            <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30 px-12">
              <div>
                <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Knowledge Submission</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Upload your curriculum deliverables</p>
              </div>
              <button 
                onClick={() => setShowSubmitModal(false)} 
                className="p-3 text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-all active:scale-90"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleQuickSubmit} className="p-12 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 flex items-center gap-2">
                  <BookOpen size={12} /> Target Assignment
                </label>
                <div className="relative">
                  <select 
                    required
                    className="w-full px-8 py-5 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 outline-none font-bold text-sm appearance-none focus:border-purple-500 transition-all dark:text-white"
                    value={submitForm.assignmentId}
                    onChange={e => setSubmitForm({ ...submitForm, assignmentId: e.target.value })}
                  >
                    <option value="">Select a task to submit...</option>
                    {pendingSubmissions.map(as => (
                      <option key={as.id} value={as.id}>{as.title}</option>
                    ))}
                  </select>
                  <ChevronRight size={20} className="absolute right-6 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 flex items-center gap-2">
                  <Send size={12} /> Your Work / Solution Link
                </label>
                <textarea 
                  required
                  rows={5}
                  className="w-full px-8 py-6 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 outline-none font-medium text-sm focus:border-purple-500 transition-all dark:text-white"
                  placeholder="Describe your implementation or paste your GitHub/Project link here..."
                  value={submitForm.content}
                  onChange={e => setSubmitForm({ ...submitForm, content: e.target.value })}
                />
              </div>

              <div className="pt-4 flex gap-4">
                 <button 
                   type="button" 
                   onClick={() => setShowSubmitModal(false)}
                   className="flex-1 py-5 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-[1.8rem] font-black text-xs uppercase tracking-widest hover:text-slate-600 dark:hover:text-white transition-all"
                 >
                   Discard
                 </button>
                 <button 
                   disabled={isSubmitting || !submitForm.assignmentId || !submitForm.content.trim()}
                   type="submit" 
                   className="flex-[2] py-5 bg-purple-gradient text-white rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-500/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                 >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    {isSubmitting ? "Uploading..." : "Publish Submission"}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentAssignments;
