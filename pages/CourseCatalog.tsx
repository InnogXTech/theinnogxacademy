import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { supabaseMock } from '../services/supabaseMock';
import { 
  Search, BookOpen, Loader2, 
  CheckCircle, X, ShieldCheck, 
  Wallet, Layers, Lock, Clock, ChevronRight, ListChecks, FileText, Sparkles, Terminal, Code, Cpu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppRole } from '../types';

const COURSE_OUTLINES: Record<string, { modules: { title: string; lessons: string[]; outcome?: string }[]; capstone?: string }> = {
  'da-node-001': {
    modules: [
      { title: "Introduction to Data & Tools", lessons: ["What is Data? Types and Sources", "Data Analysis Workflow", "Setting up Python, Excel, SQL, Power BI"], outcome: "Foundation of data handling and tools setup." },
      { title: "Excel for Data Analysis", lessons: ["Advanced Formulas & Functions", "Pivot Tables & Dashboards", "Data Cleaning in Excel"], outcome: "Perform structured analysis with Excel." },
      { title: "SQL for Data Analysis", lessons: ["Introduction to Databases", "Writing SQL Queries (SELECT, JOIN, WHERE)", "Aggregations & Subqueries"], outcome: "Confident database querying." },
      { title: "Python for Data Analysis", lessons: ["Python Basics", "Pandas & NumPy for Data Wrangling", "Data Cleaning & Preparation", "Visualization with Matplotlib & Seaborn"], outcome: "Automate and visualize data insights." },
      { title: "Data Visualization & Storytelling", lessons: ["Visualization Principles", "Power BI/Tableau Dashboards", "Report Writing & Presentations"], outcome: "Build professional dashboards and reports." },
      { title: "Real-World Projects", lessons: ["Sales Data Analysis (Excel + SQL)", "Customer Segmentation (Python)", "Visualization Dashboard (Power BI)"], outcome: "Practical industry-relevant experience." },
      { title: "Career & Professional Development", lessons: ["LinkedIn Optimization", "CV & Cover Letter Training", "GitHub Portfolio Hosting", "Mock Interviews + Internship Placement"] }
    ],
    capstone: "Capstone Project + Internship"
  },
  'cy-node-002': {
    modules: [
      { title: "Introduction to Cybersecurity", lessons: ["Core Principles (CIA Triad)", "Cybersecurity Domains & Careers", "Setting up Kali Linux, Virtual Labs"], outcome: "Students set up secure learning environments." },
      { title: "Networking Foundations", lessons: ["TCP/IP & OSI Model", "Ports, Protocols & Services", "Network Devices & Traffic Analysis"], outcome: "Understand core networking concepts." },
      { title: "Threats & Vulnerabilities", lessons: ["Malware Types & Attack Vectors", "Social Engineering & Phishing", "Vulnerability Management"], outcome: "Recognize and assess risks." },
      { title: "Ethical Hacking & Penetration Testing", lessons: ["Reconnaissance & Footprinting", "Scanning & Enumeration (Nmap, Wireshark)", "Exploitation Basics", "Post-Exploitation & Reporting"], outcome: "Hands-on penetration testing experience." },
      { title: "Security Operations & Tools", lessons: ["SIEM (Splunk/ELK) Basics", "IDS/IPS, Firewalls & Endpoint Security", "Incident Response & Forensics"], outcome: "Operate in real-world SOC environments." },
      { title: "Cloud & Application Security", lessons: ["Cloud Security (AWS, Azure basics)", "Secure Software Development", "Web Application Testing (OWASP Top 10)"], outcome: "Apply security controls in modern environments." },
      { title: "Certification Prep & Career Development", lessons: ["Security+ / CEH Prep", "LinkedIn Branding", "CV Templates + Interview Training", "Internship Placement"] }
    ],
    capstone: "Capstone: Red Team vs Blue Team Simulation"
  },
  'wd-node-003': {
    modules: [
      { title: "Introduction to Web Development", lessons: ["Web Technologies Overview", "Setting up VS Code, Git, GitHub"], outcome: "Basic setup for development." },
      { title: "Frontend Development", lessons: ["HTML5, CSS3 (Flexbox, Grid)", "JavaScript Fundamentals", "Responsive Design with TailwindCSS"], outcome: "Build static & responsive websites." },
      { title: "Advanced Frontend", lessons: ["React Basics (Components, Props, State)", "React Hooks & Router", "APIs & JSON Integration"], outcome: "Build dynamic apps with React." },
      { title: "Backend Development", lessons: ["Node.js & Express", "REST APIs & Authentication", "Database Integration (MongoDB/MySQL)"], outcome: "Build secure full-stack apps." },
      { title: "Deployment & DevOps Basics", lessons: ["GitHub Actions (CI/CD Basics)", "Deployment on Vercel/Netlify/Heroku"], outcome: "Deploy real-world apps." },
      { title: "Projects & Career Development", lessons: ["E-commerce Website", "Portfolio Website", "LinkedIn Optimization + CV Review"] }
    ],
    capstone: "Capstone Project + Internship"
  },
  'ma-node-004': {
    modules: [
      { title: "Introduction to Mobile Development", lessons: ["Mobile Ecosystem (iOS vs Android)", "Tools Setup: Android Studio / Flutter"], outcome: "Understand app development workflow." },
      { title: "Frontend Development with Flutter", lessons: ["Dart Basics", "Widgets & UI Components", "Navigation & State Management"], outcome: "Build cross-platform UI." },
      { title: "Backend & APIs", lessons: ["REST APIs Integration", "Firebase Authentication", "Database Management (Firestore/SQLite)"], outcome: "Connect apps to real data." },
      { title: "Advanced Features", lessons: ["Push Notifications", "Location Services & Maps", "Payment Integration"], outcome: "Build production-ready apps." },
      { title: "Projects & Deployment", lessons: ["Google Play Store & App Store Submission", "Portfolio App Development"], outcome: "Publish mobile apps publicly." },
      { title: "Career Development", lessons: ["CV Templates", "LinkedIn Branding", "Interview Preparation"] }
    ],
    capstone: "Capstone: A Startup-Ready App"
  },
  'py-node-005': {
    modules: [
      { title: "Python Basics", lessons: ["Data Types, Variables, Control Structures", "Functions & Modules"], outcome: "Write clean Python code." },
      { title: "Intermediate Python", lessons: ["File Handling", "Error Handling & Debugging", "OOP in Python"], outcome: "Build structured applications." },
      { title: "Python for Automation", lessons: ["Automating Excel & PDFs", "Web Scraping with BeautifulSoup/Selenium", "Task Scheduling"], outcome: "Automate repetitive tasks." },
      { title: "Advanced Python Applications", lessons: ["APIs & JSON Handling", "Automation Scripts for Networking", "GUI Development with Tkinter"], outcome: "Create practical automation tools." },
      { title: "Projects & Career Development", lessons: ["Automated Report Generator", "Web Scraper for E-commerce Data", "LinkedIn + CV Training"] }
    ],
    capstone: "Capstone: Automation Portfolio Projects"
  },
  'dm-node-006': {
    modules: [
      { title: "Fundamentals of Digital Marketing", lessons: ["Marketing Principles & Buyer Persona", "Online Marketing Platforms Overview"], outcome: "Understand marketing foundations." },
      { title: "Social Media Marketing", lessons: ["Facebook, Instagram, LinkedIn Ads", "Content Creation & Management"], outcome: "Run effective campaigns." },
      { title: "SEO & SEM", lessons: ["SEO Basics & Keyword Research", "Google Ads Campaigns"], outcome: "Drive organic & paid traffic." },
      { title: "Analytics & Optimization", lessons: ["Google Analytics & Data Insights", "A/B Testing"], outcome: "Optimize performance campaigns." },
      { title: "Career Development", lessons: ["CV Templates + Portfolio", "LinkedIn Optimization", "Internship Placement"] }
    ],
    capstone: "Capstone: Real Marketing Campaign"
  },
  'pm-node-007': {
    modules: [
      { title: "Introduction to Project Management", lessons: ["PM Principles & Frameworks (Agile, Scrum, Waterfall)", "Tools: Trello, Jira, MS Project"], outcome: "Understand project lifecycles." },
      { title: "Project Planning", lessons: ["Work Breakdown Structure", "Scheduling & Resource Allocation", "Risk Management"], outcome: "Plan effective projects." },
      { title: "Execution & Monitoring", lessons: ["Agile Sprints & Standups", "Progress Tracking & Reporting", "Budget Control"], outcome: "Lead project execution." },
      { title: "Closure & Professional Development", lessons: ["Stakeholder Management", "Lessons Learned Documentation", "CV & LinkedIn Optimization"] }
    ],
    capstone: "Capstone: Manage a Simulated Project"
  },
  'fx-node-008': {
    modules: [
      { title: "Introduction to Forex", lessons: ["Forex Market Basics", "Currency Pairs & Brokers"], outcome: "Understand forex operations." },
      { title: "Technical Analysis", lessons: ["Charts, Indicators & Patterns", "Price Action Trading"], outcome: "Analyze price movement." },
      { title: "Risk & Money Management", lessons: ["Leverage & Margin", "Risk Management Rules"], outcome: "Trade sustainably." },
      { title: "Trading Strategies & Psychology", lessons: ["Day Trading vs Swing Trading", "Trading Psychology"], outcome: "Build discipline & strategy." }
    ],
    capstone: "Capstone: Simulated Trading Portfolio"
  },
  'fx-node-009': {
    modules: [
      { title: "Introduction to Computers", lessons: ["Basic Hardware & Software", "Operating Systems (Windows, Linux basics)"], outcome: "Understand computers." },
      { title: "Productivity Tools", lessons: ["MS Word, Excel, PowerPoint", "Google Workspace"], outcome: "Work with office tools." },
      { title: "Internet & Online Safety", lessons: ["Email & Web Basics", "Cybersecurity Awareness"], outcome: "Use the internet safely." }
    ],
    capstone: "Capstone: Personal Productivity Project"
  }
};

const CourseCatalog: React.FC = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(() => {
    try {
      const local = localStorage.getItem('innogx_user_session');
      return local ? JSON.parse(local) : null;
    } catch {
      return null;
    }
  });
  
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showOutlineModal, setShowOutlineModal] = useState(false);
  const [selectedCourseForPayment, setSelectedCourseForPayment] = useState<any>(null);
  const [selectedCourseForOutline, setSelectedCourseForOutline] = useState<any>(null);
  const [paymentPlan, setPaymentPlan] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const s = await supabaseMock.auth.getSession();
        if (s) setSession(s);
        
        let allCourses = await supabaseMock.db.getCourses();
        if (s?.user?.role === AppRole.INSTRUCTOR) {
          allCourses = allCourses.filter((c: any) => c.instructor_id === s.user.id);
        }
        setCourses(allCourses);
        
        if (s?.user?.id && (s.user.role === AppRole.STUDENT || !s.user.role || s.user.email === 'innogxtechnovations@gmail.com')) {
          const userEnrollments = await supabaseMock.db.getStudentEnrollments(s.user.id);
          setEnrollments(userEnrollments || []);
        }
      } catch (err) {
        console.error("Registry Sync Fault:", err);
      } finally {
        setIsInitialLoad(false);
      }
    };
    fetchData();
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter((c: any) => 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [courses, searchTerm]);

  const calculateFirstPayment = (price: number, plan: number) => {
    return Math.round(price / plan);
  };

  const handleEnrollClick = (course: any) => {
    if (!session?.user?.id) {
      navigate('/landing');
      return;
    }
    if (course.is_free || (course.price || 0) <= 0) {
      processFreeEnrollment(course.id);
      return;
    }
    setSelectedCourseForPayment(course);
    setShowPlanModal(true);
  };

  const handleViewOutline = (course: any) => {
    setSelectedCourseForOutline(course);
    setShowOutlineModal(true);
  };

  const processFreeEnrollment = (courseId: string) => {
    setLoadingId(courseId);
    setTimeout(async () => {
      await supabaseMock.db.enrollInCourse(session.user.id, courseId);
      setLoadingId(null);
      navigate(`/courses/${courseId}`);
    }, 800);
  };

  const executePaymentRedirect = () => {
    if (!selectedCourseForPayment) return;
    
    // Redirect to the centralized payment gateway
    navigate('/payment-gateway', {
      state: {
        type: 'enrollment',
        course: selectedCourseForPayment,
        plan: paymentPlan,
        role: session?.user?.role || AppRole.STUDENT
      }
    });
  };

  const isEnrolled = (courseId: string) => enrollments.some(e => e.course_id === courseId);
  const isPaid = (courseId: string) => enrollments.some(e => e.course_id === courseId && e.payment_verified);
  const isInstructor = session?.user?.role === AppRole.INSTRUCTOR;

  if (isInitialLoad && courses.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
          <Loader2 className="animate-spin text-purple-600" size={48} />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing Curriculum Registry...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 lg:gap-8 bg-white dark:bg-slate-800 p-8 lg:p-12 rounded-[2.5rem] lg:rounded-[3.5rem] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none hidden md:block"><BookOpen size={160} /></div>
          <div className="space-y-2 relative z-10">
            <h1 className="text-3xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
              {isInstructor ? 'Track Command' : 'Curriculum Vault'}
            </h1>
            <p className="text-xs lg:text-sm text-slate-500 font-bold uppercase tracking-widest">
              {isInstructor ? 'Managing assigned academic nodes.' : 'Elite tech paths for African excellence.'}
            </p>
          </div>
          
          <div className="relative w-full lg:w-80 relative z-10">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Filter nodes..."
              className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent rounded-2xl shadow-inner outline-none focus:border-purple-500 transition-all font-bold text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-12">
          {filteredCourses.map((course: any) => {
            const enrolled = isEnrolled(course.id);
            const paid = isPaid(course.id);
            const loading = loadingId === course.id;

            return (
              <div key={course.id} className="group bg-white dark:bg-slate-800 rounded-[2.5rem] lg:rounded-[3.5rem] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col">
                <div className="aspect-video relative overflow-hidden bg-slate-100 dark:bg-slate-900">
                  <img src={course.thumbnail_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={course.title} />
                  <div className="absolute top-5 right-5">
                    <span className="px-4 py-2 bg-white/95 backdrop-blur rounded-xl text-[10px] font-black tracking-widest text-slate-900 shadow-xl border border-white">
                      {course.is_free ? 'GRANT' : `₦${course.price?.toLocaleString() || '0'}`}
                    </span>
                  </div>
                  {enrolled && (
                    <div className="absolute top-5 left-5">
                       <span className={`px-4 py-2 text-white rounded-xl text-[9px] font-black tracking-widest flex items-center gap-2 shadow-lg ${paid ? 'bg-green-500' : 'bg-orange-500'}`}>
                         {paid ? <CheckCircle size={12} /> : <Lock size={12} />} {paid ? 'SYNCED' : 'UNPAID'}
                       </span>
                    </div>
                  )}
                </div>
                
                <div className="p-8 lg:p-12 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-[10px] font-black text-purple-600 uppercase mb-4 tracking-widest">
                    <BookOpen size={14} /> CORE NODE • ACTIVE
                  </div>
                  <h3 className="text-xl lg:text-3xl font-black text-slate-900 dark:text-white mb-4 line-clamp-1 group-hover:text-purple-600 transition-colors leading-none">{course.title}</h3>
                  <p className="text-sm lg:text-md text-slate-500 dark:text-slate-400 mb-10 line-clamp-2 leading-relaxed font-medium">{course.description}</p>
                  
                  <div className="space-y-4 mt-auto">
                    <button 
                      onClick={() => isInstructor ? navigate('/dashboard/instructor') : enrolled ? navigate(`/courses/${course.id}`) : handleEnrollClick(course)}
                      disabled={loading}
                      className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl ${
                        enrolled || isInstructor ? 'bg-slate-900 text-white dark:bg-slate-700' : 'bg-purple-gradient text-white shadow-purple-500/20'
                      }`}
                    >
                      {loading ? <Loader2 size={18} className="animate-spin" /> : enrolled ? (paid ? 'Resume Path' : 'Unlock Node') : isInstructor ? 'Monitor Hub' : 'Enroll Now'}
                    </button>
                    
                    <button 
                      onClick={() => handleViewOutline(course)}
                      className="w-full py-4 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 border border-transparent hover:border-purple-100 dark:hover:border-purple-800"
                    >
                      <ListChecks size={14} /> View Course Outline
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredCourses.length === 0 && !isInitialLoad && (
           <div className="py-40 text-center opacity-30 italic font-black uppercase text-xs tracking-widest bg-slate-50 dark:bg-slate-900/30 rounded-[3rem] border-4 border-dashed border-slate-100 dark:border-slate-800">
             Registry empty for current search parameters
           </div>
        )}
      </div>

      {/* Payment Plan Modal */}
      {showPlanModal && selectedCourseForPayment && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[480px] rounded-[3rem] lg:rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95">
            <div className="p-8 lg:p-10 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center px-10">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Sync Strategy</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Select payment frequency</p>
               </div>
               <button onClick={() => setShowPlanModal(false)} className="p-3 text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 active:scale-90 transition-all"><X size={20} /></button>
            </div>

            <div className="p-8 lg:p-10 space-y-6">
               <div className="space-y-4">
                  {[
                    { id: 1, label: 'One Cycle', sub: 'Full Node Sync', icon: ShieldCheck },
                    { id: 2, label: 'Dual Sync', sub: '50% Per Cycle', icon: Wallet },
                    { id: 3, label: 'Tri Sync', sub: '33% Per Cycle', icon: Layers }
                  ].map(plan => {
                    const firstPay = calculateFirstPayment(selectedCourseForPayment.price || 0, plan.id);
                    const isSelected = paymentPlan === plan.id;
                    return (
                      <button 
                        key={plan.id}
                        onClick={() => setPaymentPlan(plan.id as any)}
                        className={`w-full flex items-center justify-between p-6 rounded-3xl border-2 transition-all group ${
                          isSelected ? 'border-purple-600 bg-purple-50/30 dark:bg-purple-900/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
                        }`}
                      >
                         <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                               <plan.icon size={20} />
                            </div>
                            <div className="text-left">
                               <p className="font-black text-sm text-slate-900 dark:text-white">{plan.label}</p>
                               <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-0.5">{plan.sub}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="font-black text-sm text-slate-900 dark:text-white">₦{firstPay.toLocaleString()}</p>
                            <p className="text-[8px] font-black uppercase text-slate-400 mt-0.5">Initial Sync</p>
                         </div>
                      </button>
                    );
                  })}
               </div>

               <div className="pt-6 border-t border-slate-50 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-8 px-2">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Commitment</p>
                     <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">₦{selectedCourseForPayment.price?.toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={executePaymentRedirect}
                    className="w-full py-6 bg-purple-gradient text-white rounded-2xl lg:rounded-[2.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 border border-white/10"
                  >
                    Proceed to Pay ₦{calculateFirstPayment(selectedCourseForPayment.price || 0, paymentPlan).toLocaleString()}
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Outline Modal */}
      {showOutlineModal && selectedCourseForOutline && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[800px] max-h-[85vh] rounded-[3rem] lg:rounded-[5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col animate-in zoom-in-95">
            <div className="p-8 lg:p-12 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center px-10">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-3xl bg-purple-gradient flex items-center justify-center text-white shadow-xl">
                     <FileText size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{selectedCourseForOutline.title}</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-600 mt-2">Tactical Curriculum Blueprint</p>
                  </div>
               </div>
               <button onClick={() => setShowOutlineModal(false)} className="p-4 text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 active:scale-90 transition-all"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-16 space-y-12">
               {COURSE_OUTLINES[selectedCourseForOutline.id] ? (
                  <>
                    <div className="space-y-10">
                       {COURSE_OUTLINES[selectedCourseForOutline.id].modules.map((mod, idx) => (
                          <div key={idx} className="relative pl-12 group">
                             <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-100 dark:bg-slate-800"></div>
                             <div className="absolute left-[-12px] top-0 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-4 border-purple-600 flex items-center justify-center z-10">
                                <div className="w-1 h-1 bg-purple-600 rounded-full animate-ping"></div>
                             </div>
                             
                             <div className="space-y-6">
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                   <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Module {idx + 1}: {mod.title}</h4>
                                   {mod.outcome && (
                                      <span className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 text-[8px] font-black uppercase rounded-lg border border-green-100 dark:border-green-800/30 self-start md:self-center">
                                         Goal: {mod.outcome}
                                      </span>
                                   )}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   {mod.lessons.map((lesson, lIdx) => (
                                      <div key={lIdx} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-700 group-hover:border-purple-200 transition-colors">
                                         <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-purple-600 shadow-sm font-black text-xs">{lIdx + 1}</div>
                                         <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{lesson}</p>
                                      </div>
                                   ))}
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>

                    {COURSE_OUTLINES[selectedCourseForOutline.id].capstone && (
                       <div className="p-8 lg:p-12 bg-purple-gradient rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                             <Sparkles size={120} />
                          </div>
                          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                             <div className="space-y-3 text-center md:text-left">
                                <div className="flex items-center gap-3 justify-center md:justify-start">
                                   <div className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-[9px] font-black uppercase tracking-widest">Final Phase</div>
                                   <Sparkles size={16} />
                                </div>
                                <h4 className="text-3xl font-black tracking-tight">{COURSE_OUTLINES[selectedCourseForOutline.id].capstone}</h4>
                                <p className="text-sm text-purple-100 font-medium max-w-md">The ultimate validation of your curriculum mastery. Build industry-grade solutions and earn global certification.</p>
                             </div>
                             <div className="flex gap-4">
                                <div className="p-4 bg-white/10 backdrop-blur rounded-3xl border border-white/20 text-center">
                                   <Terminal size={24} className="mx-auto mb-2" />
                                   <p className="text-[7px] font-black uppercase opacity-60">Verified</p>
                                   <p className="text-xs font-black">Code</p>
                                </div>
                                <div className="p-4 bg-white/10 backdrop-blur rounded-3xl border border-white/20 text-center">
                                   <Cpu size={24} className="mx-auto mb-2" />
                                   <p className="text-[7px] font-black uppercase opacity-60">Impact</p>
                                   <p className="text-xs font-black">Global</p>
                                </div>
                             </div>
                          </div>
                       </div>
                    )}
                  </>
               ) : (
                  <div className="py-32 text-center flex flex-col items-center gap-6">
                     <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300">
                        <Lock size={40} />
                     </div>
                     <div>
                        <h4 className="text-2xl font-black">Registry Encrypted</h4>
                        <p className="text-slate-500 font-medium mt-2">The outline for this specific node is currently being updated by the board.</p>
                     </div>
                  </div>
               )}
            </div>
            
            <div className="p-8 lg:p-12 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex justify-center">
               <button 
                 onClick={() => { setShowOutlineModal(false); handleEnrollClick(selectedCourseForOutline); }}
                 className="px-12 py-5 bg-purple-gradient text-white rounded-3xl font-black text-xs uppercase tracking-[0.25em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
               >
                  Initialize Enrollment <ChevronRight size={18} />
               </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CourseCatalog;