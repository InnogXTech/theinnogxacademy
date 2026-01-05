import React, { Component, useEffect, useState, ErrorInfo, ReactNode } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import AdminLogin from './pages/AdminLogin';
import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';
import PaymentGateway from './pages/PaymentGateway';
import StudentDashboard from './pages/StudentDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import ParentDashboard from './pages/ParentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CourseCatalog from './pages/CourseCatalog';
import MyCourses from './pages/MyCourses';
import CourseViewer from './pages/CourseViewer';
import ProfilePage from './pages/Profile';
import Payments from './pages/Payments';
import StudentAssignments from './pages/StudentAssignments';
import StudentAttendance from './pages/StudentAttendance';
import StudentRecordings from './pages/StudentRecordings';
import Community from './pages/Community';
import InstructorAssignments from './pages/InstructorAssignments';
import InstructorRecordings from './pages/InstructorRecordings';
import AdminAttendance from './pages/AdminAttendance';
import AdminRecordings from './pages/AdminRecordings';
import RoleGuard from './components/RoleGuard';
import { AppRole } from './types';
import { supabaseService, supabase } from './services/supabase';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState;
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App Node Error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-10 text-center font-sans">
          <div className="space-y-6">
            <h1 className="text-4xl font-black text-purple-500 tracking-tighter uppercase">Node Crash</h1>
            <p className="text-slate-400 max-w-md text-sm leading-relaxed">A structural failure occurred in the current rendering node. Re-synchronizing interface terminal.</p>
            <button onClick={() => window.location.reload()} className="px-8 py-4 bg-purple-gradient rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-purple-500/20">Restart Node</button>
          </div>
        </div>
      );
    }
    return this.props.children || null;
  }
}

const App: React.FC = () => {
  const [session, setSession] = useState<any>(() => {
    try {
      const local = localStorage.getItem('innogx_user_session');
      return local ? JSON.parse(local) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    supabaseService.auth.getSession().then(s => {
      if (s) setSession(s);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (currentSession?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', currentSession.user.id).single();
        const fullUser = { ...currentSession.user, ...(profile || {}) };
        localStorage.setItem('innogx_user_session', JSON.stringify({ user: fullUser }));
        setSession({ user: fullUser });
      } else {
        localStorage.removeItem('innogx_user_session');
        setSession(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const user = session?.user;
  
  // Role Detection Protocol (database-based, not email-based)
  const metaRole = user?.user_metadata?.role;
  const rawRole = user?.role;
  
  let appRole: AppRole | null = null;
  if (metaRole && Object.values(AppRole).includes(metaRole as AppRole)) {
    appRole = metaRole as AppRole;
  } else if (rawRole && Object.values(AppRole).includes(rawRole as AppRole)) {
    appRole = rawRole as AppRole;
  } else if (user) {
    appRole = AppRole.STUDENT;
  }
  
  const hasOnboarded = user?.has_onboarded === true || 
                       user?.user_metadata?.has_onboarded === true || 
                       localStorage.getItem(`innogx_verified_${user?.id}`) === 'true';

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={
            !appRole ? <Landing /> :
            (appRole === AppRole.ADMIN) ? <Navigate to="/dashboard/admin" replace /> :
            (hasOnboarded) ? <Navigate to={`/dashboard/${appRole}`} replace /> :
            <Navigate to="/onboarding" replace />
          } />

          <Route path="/auth" element={<Auth />} />
          
          <Route path="/onboarding" element={
            (hasOnboarded && appRole) ? <Navigate to={`/dashboard/${appRole}`} replace /> : <Onboarding />
          } />

          <Route path="/payment-gateway" element={<PaymentGateway />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/admin" element={<AdminLogin />} />
          
          <Route path="/dashboard/student" element={<RoleGuard allowedRoles={[AppRole.STUDENT]}><StudentDashboard /></RoleGuard>} />
          <Route path="/dashboard/student/assignments" element={<RoleGuard allowedRoles={[AppRole.STUDENT]}><StudentAssignments /></RoleGuard>} />
          <Route path="/dashboard/student/attendance" element={<RoleGuard allowedRoles={[AppRole.STUDENT]}><StudentAttendance /></RoleGuard>} />
          <Route path="/dashboard/student/recordings" element={<RoleGuard allowedRoles={[AppRole.STUDENT]}><StudentRecordings /></RoleGuard>} />
          <Route path="/dashboard/student/community" element={<RoleGuard allowedRoles={[AppRole.STUDENT]}><Community /></RoleGuard>} />
          <Route path="/dashboard/student/my-courses" element={<RoleGuard allowedRoles={[AppRole.STUDENT]}><MyCourses /></RoleGuard>} />
          <Route path="/dashboard/student/payments" element={<RoleGuard allowedRoles={[AppRole.STUDENT]}><Payments /></RoleGuard>} />
          
          <Route path="/courses" element={<RoleGuard allowedRoles={[AppRole.STUDENT, AppRole.ADMIN, AppRole.INSTRUCTOR]}><CourseCatalog /></RoleGuard>} />
          <Route path="/courses/:courseId" element={<RoleGuard allowedRoles={[AppRole.STUDENT]}><CourseViewer /></RoleGuard>} />

          <Route path="/dashboard/parent" element={<RoleGuard allowedRoles={[AppRole.PARENT]}><ParentDashboard /></RoleGuard>} />
          <Route path="/dashboard/parent/payments" element={<RoleGuard allowedRoles={[AppRole.PARENT]}><Payments /></RoleGuard>} />
          
          <Route path="/dashboard/instructor" element={<RoleGuard allowedRoles={[AppRole.INSTRUCTOR]}><InstructorDashboard /></RoleGuard>} />
          <Route path="/dashboard/instructor/assignments" element={<RoleGuard allowedRoles={[AppRole.INSTRUCTOR]}><InstructorAssignments /></RoleGuard>} />
          <Route path="/dashboard/instructor/recordings" element={<RoleGuard allowedRoles={[AppRole.INSTRUCTOR]}><InstructorRecordings /></RoleGuard>} />
          
          <Route path="/dashboard/admin" element={<RoleGuard allowedRoles={[AppRole.ADMIN]}><AdminDashboard /></RoleGuard>} />
          <Route path="/dashboard/admin/attendance" element={<RoleGuard allowedRoles={[AppRole.ADMIN]}><AdminAttendance /></RoleGuard>} />
          <Route path="/dashboard/admin/recordings" element={<RoleGuard allowedRoles={[AppRole.ADMIN]}><AdminRecordings /></RoleGuard>} />
          
          <Route path="/dashboard/:role/profile" element={<RoleGuard allowedRoles={[AppRole.STUDENT, AppRole.INSTRUCTOR, AppRole.PARENT, AppRole.ADMIN]}><ProfilePage /></RoleGuard>} />
          <Route path="/dashboard/:role/payments" element={<RoleGuard allowedRoles={[AppRole.STUDENT, AppRole.PARENT, AppRole.ADMIN]}><Payments /></RoleGuard>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
};

export default App;