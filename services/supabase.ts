
import { createClient } from '@supabase/supabase-js';
import { AppRole, Course, Module, Lesson } from '../types';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase environment variables are not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ACADEMY_CORE_COURSES: Course[] = [
  { id: 'da-node-001', title: 'Data Analysis', description: 'Master data visualization and statistical modeling with industry-standard tools.', thumbnail_url: 'https://images.unsplash.com/photo-1551288049-bbbda536339a?w=800&q=80', instructor_id: 'admin', is_published: true, is_free: false, price: 150000 },
  { id: 'cy-node-002', title: 'Cybersecurity', description: 'Advanced network protection, ethical hacking, and threat intelligence mastery.', thumbnail_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80', instructor_id: 'admin', is_published: true, is_free: false, price: 250000 },
  { id: 'wd-node-003', title: 'Web Development', description: 'Full-stack engineering from responsive layouts to scalable cloud architecture.', thumbnail_url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80', instructor_id: 'admin', is_published: true, is_free: false, price: 180000 },
  { id: 'ma-node-004', title: 'Mobile App Development', description: 'Build native-grade cross-platform applications for global markets.', thumbnail_url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80', instructor_id: 'admin', is_published: true, is_free: false, price: 200000 },
  { id: 'py-node-005', title: 'Python & Automation', description: 'Accelerate productivity with script-based logic and autonomous workflows.', thumbnail_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80', instructor_id: 'admin', is_published: true, is_free: false, price: 150000 },
  { id: 'dm-node-006', title: 'Digital Marketing', description: 'Master global reach, SEO, and performance-based marketing strategies.', thumbnail_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80', instructor_id: 'admin', is_published: true, is_free: false, price: 120000 },
  { id: 'pm-node-007', title: 'Project Management', description: 'Strategic leadership and agile methodology for high-impact tech teams.', thumbnail_url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80', instructor_id: 'admin', is_published: true, is_free: false, price: 140000 },
  { id: 'fx-node-008', title: 'Forex Trading', description: 'Advanced financial node analysis and technical market synchronization.', thumbnail_url: 'https://images.unsplash.com/photo-1611974717482-1e90d810842e?w=800&q=80', instructor_id: 'admin', is_published: true, is_free: false, price: 180000 },
  { id: 'cl-node-009', title: 'Computer Literacy', description: 'Foundational digital logic and operating systems for tech scholars.', thumbnail_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80', instructor_id: 'admin', is_published: true, is_free: false, price: 60000 },
];

export const supabaseService = {
  auth: {
    async signIn({ email, password }: any) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          const { data: dbProfile } = await supabase.from('profiles')
            .select('id, full_name, role, is_suspended, has_onboarded, avatar_url, joined_at, email')
            .eq('id', data.user.id)
            .single();
            
          if (dbProfile?.is_suspended) {
             await supabase.auth.signOut();
             throw new Error("Access node suspended by Academy governance.");
          }
          const safeUser = dbProfile || data.user;
          localStorage.setItem('innogx_user_session', JSON.stringify({ user: safeUser }));
          return { data: { user: safeUser }, error: null };
        }
        return { data: null, error: "Credentials rejected by Registry." };
      } catch (err: any) {
        return { data: null, error: String(err.message || err) };
      }
    },
    async signUp(formData: any) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { 
            data: { 
              full_name: formData.full_name, 
              role: formData.role, 
              has_onboarded: false,
              requested_child_email: formData.requested_child_email || undefined
            },
            emailRedirectTo: `${window.location.origin}/auth`
          }
        });
        if (error) throw error;
        return { data, emailSent: !data.session, error: null };
      } catch (err: any) {
        return { data: null, emailSent: false, error: String(err.message || err) };
      }
    },
    async signOut() {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
    },
    async getSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) return null;
        const { data: profile } = await supabase.from('profiles')
          .select('id, full_name, role, has_onboarded, avatar_url, email, joined_at')
          .eq('id', session.user.id)
          .single();
        const userData = profile || session.user;
        localStorage.setItem('innogx_user_session', JSON.stringify({ user: userData }));
        return { user: userData };
      } catch {
        return null;
      }
    },
    async resendVerification(email: string) {
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email
      });
      return { data, error };
    },
    async sendPasswordReset(email: string) {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      return { data, error };
    },
    async updatePassword(password: string) {
      const { data, error } = await supabase.auth.updateUser({
        password
      });
      return { data, error };
    }
  },
  db: {
    async getProfiles() {
      const { data } = await supabase.from('profiles')
        .select('id, full_name, email, role, is_verified, is_suspended, is_online, avatar_url, joined_at')
        .order('joined_at', { ascending: false });
      return (data || []) as any[];
    },
    async getCourses() {
      try {
        const { data } = await supabase.from('courses')
          .select('id, title, description, thumbnail_url, price, is_published, instructor_id, is_free, google_meet_link')
          .eq('is_published', true);
        const courses = data || [];
        const merged = [...ACADEMY_CORE_COURSES];
        courses.forEach(c => {
          if (!merged.find(m => m.id === c.id)) merged.push(c);
        });
        return merged;
      } catch { return ACADEMY_CORE_COURSES; }
    },
    async getCourse(id: string) {
      const core = ACADEMY_CORE_COURSES.find(c => c.id === id);
      if (core) return core;
      const { data } = await supabase.from('courses').select('*').eq('id', id).single();
      return data;
    },
    async updateCourse(id: string, updates: Partial<Course>) {
      const { error } = await supabase.from('courses').update(updates).eq('id', id);
      return { error: error ? error.message : null };
    },
    async getModules(courseId: string) {
      const { data } = await supabase.from('modules')
        .select('id, title, order_index, course_id')
        .eq('course_id', courseId)
        .order('order_index');
      return (data || []) as any[];
    },
    async getLessons(moduleId: string) {
      const { data } = await supabase.from('lessons')
        .select('id, title, content, duration_minutes, order_index, module_id')
        .eq('module_id', moduleId)
        .order('order_index');
      return (data || []) as any[];
    },
    async getQuizByLesson(lessonId: string) {
      const { data } = await supabase.from('quizzes').select('*').eq('lesson_id', lessonId).single();
      return data;
    },
    async getNotifications(userId: string) {
      const { data } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      return data || [];
    },
    async markNotificationRead(id: string) {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
    },
    async selectOnboardingCourse(userId: string, courseId: string) {
      const { error } = await supabase.from('enrollments').upsert({ student_id: userId, course_id: courseId, payment_verified: false });
      return { error: error ? error.message : null };
    },
    async recordOnboardingPayment(userId: string, courseId: string, paymentData: any) {
      await supabase.from('enrollments').update({ 
        payment_verified: paymentData.remaining_balance <= 0,
        installment_plan: paymentData.plan,
        installment_count: 1,
        amount_paid: paymentData.amount_paid,
        remaining_balance: paymentData.remaining_balance
      }).match({ student_id: userId, course_id: courseId });
      await supabase.from('transactions').insert({
        user_id: userId, amount: paymentData.amount_paid, status: 'success', item_name: `Installment 1/${paymentData.plan}`, reference: paymentData.reference, date: new Date().toISOString()
      });
      return { error: null };
    },
    async completeOnboarding(userId: string) {
      const results = await Promise.all([
        supabase.from('profiles').update({ has_onboarded: true }).eq('id', userId),
        supabase.auth.updateUser({ data: { has_onboarded: true } })
      ]);
      const error = results[0].error || results[1].error;
      return { error: error ? error.message : null };
    },
    async getStudentEnrollments(studentId: string) {
      const { data } = await supabase.from('enrollments')
        .select('id, course_id, progress_percentage, payment_verified, amount_paid, course:courses(id, title, thumbnail_url)')
        .eq('student_id', studentId);
      const results = (data || []) as any[];
      return results.map(r => {
        if (Array.isArray(r.course)) r.course = r.course[0];
        if (!r.course) r.course = ACADEMY_CORE_COURSES.find(c => c.id === r.course_id);
        return r;
      });
    },
    async getEnrollments() {
      const { data } = await supabase.from('enrollments').select('id, student_id, course_id, payment_verified');
      return data || [];
    },
    async enrollInCourse(studentId: string, courseId: string) {
      const { error } = await supabase.from('enrollments').insert({ student_id: studentId, course_id: courseId });
      return { error: error ? error.message : null };
    },
    async createCommunityPost(data: any) {
      const { error } = await supabase.from('community_posts').insert(data);
      return { error: error ? error.message : null };
    },
    async getCommunityPosts() {
      const { data } = await supabase.from('community_posts').select('*').order('created_at', { ascending: false });
      return data || [];
    },
    async saveAttendance(record: any) {
      const { error } = await supabase.from('attendance').insert(record);
      return { error: error ? error.message : null };
    },
    async getAllAttendance() {
      const { data } = await supabase.from('attendance').select('id, duration_minutes, activity_score, status, student:profiles(full_name, avatar_url), course:courses(title), lesson:lessons(title)');
      return data || [];
    },
    async getAttendanceForCourse(courseId: string) {
      const { data } = await supabase.from('attendance').select('*, student:profiles(full_name, avatar_url)').eq('course_id', courseId);
      return data || [];
    },
    async getStudentAttendance(studentId: string) {
      const { data } = await supabase.from('attendance').select('*, course:courses(title), lesson:lessons(title)').eq('student_id', studentId);
      return data || [];
    },
    async addTransaction(tx: any) {
      const { error } = await supabase.from('transactions').insert(tx);
      return { error: error ? error.message : null };
    },
    async getTransactions(userId?: string) {
      let query = supabase.from('transactions').select('*').order('date', { ascending: false });
      if (userId) query = query.eq('user_id', userId);
      const { data } = await query;
      return data || [];
    },
    async createCourse(data: any, adminName: string) {
      const { error } = await supabase.from('courses').insert(data);
      await supabase.from('admin_logs').insert({ action: `Created course: ${data.title}`, admin_name: adminName, timestamp: new Date().toISOString() });
      return { error: error ? error.message : null };
    },
    async deleteCourse(id: string, adminName: string) {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      await supabase.from('admin_logs').insert({ action: `Deleted course: ${id}`, admin_name: adminName, timestamp: new Date().toISOString() });
      return { error: error ? error.message : null };
    },
    async createAssignment(data: any) {
      const { error } = await supabase.from('assignments').insert(data);
      return { error: error ? error.message : null };
    },
    async submitAssignment(data: any) {
      const { error } = await supabase.from('submissions').insert(data);
      return { error: error ? error.message : null };
    },
    async getAssignmentsByCourse(courseId: string) {
      const { data } = await supabase.from('assignments').select('*').eq('course_id', courseId);
      return data || [];
    },
    async getAssignmentsByInstructor(instructorId: string) {
      const { data = [] } = await supabase.from('assignments').select('*').eq('instructor_id', instructorId);
      return data || [];
    },
    async getAssignmentsByStudent(studentId: string) {
      const { data: enrollments } = await supabase.from('enrollments').select('course_id').eq('student_id', studentId);
      const ids = enrollments?.map(e => e.course_id) || [];
      const { data = [] } = await supabase.from('assignments').select('*').in('course_id', ids);
      return data || [];
    },
    async gradeSubmission(id: string, grade: string, feedback: string) {
      const { error } = await supabase.from('submissions').update({ grade, feedback }).eq('id', id);
      return { error: error ? error.message : null };
    },
    async getSubmissionsByAssignment(assignmentId: string) {
      const { data = [] } = await supabase.from('submissions').select('*, student:profiles(full_name, avatar_url)').eq('assignment_id', assignmentId);
      return data || [];
    },
    async getSubmissionsByStudent(studentId: string) {
      const { data = [] } = await supabase.from('submissions').select('*, assignment:assignments(*)').eq('student_id', studentId);
      return data || [];
    },
    async linkChild(parentId: string, scholarId: string) {
      const { error } = await supabase.from('parent_child_links').insert({ parent_id: parentId, child_id: scholarId, status: 'pending' });
      return { error: error ? error.message : null };
    },
    async getLinkedChildren(parentId: string, includePending: boolean = true) {
      let query = supabase.from('parent_child_links').select('*, child:profiles!child_id(*)').eq('parent_id', parentId);
      if (!includePending) query = query.eq('status', 'approved');
      const { data = [] } = await query;
      return data || [];
    },
    async getPendingLinks() {
      const { data = [] } = await supabase.from('parent_child_links').select('*, parent:profiles!parent_id(full_name, email), child:profiles!child_id(full_name, email)').eq('status', 'pending');
      return data || [];
    },
    async approveLink(parentId: string, childId: string, adminName: string) {
      const { error = null } = await supabase.from('parent_child_links').update({ status: 'approved' }).match({ parent_id: parentId, child_id: childId });
      await supabase.from('admin_logs').insert({ action: `Approved link: ${parentId}->${childId}`, admin_name: adminName, timestamp: new Date().toISOString() });
      return { error: error ? (error as any).message : null };
    },
    async verifyInstructor(id: string, adminName: string) {
      await supabase.from('profiles').update({ is_verified: true }).eq('id', id);
      await supabase.from('admin_logs').insert({ action: `Verified instructor: ${id}`, admin_name: adminName, timestamp: new Date().toISOString() });
      return { error: null };
    },
    async suspendUser(id: string, adminName: string) {
      await supabase.from('profiles').update({ is_suspended: true }).eq('id', id);
      await supabase.from('admin_logs').insert({ action: `Suspended user: ${id}`, admin_name: adminName, timestamp: new Date().toISOString() });
      return { error: null };
    },
    async deleteProfile(id: string, adminName: string) {
      await supabase.from('profiles').delete().eq('id', id);
      await supabase.from('admin_logs').insert({ action: `Deleted profile: ${id}`, admin_name: adminName, timestamp: new Date().toISOString() });
      return { error: null };
    },
    async updateProfile(id: string, data: any) {
      const { error } = await supabase.from('profiles').update(data).eq('id', id);
      return { error: error ? error.message : null };
    },
    async getAchievements() {
      const { data = [] } = await supabase.from('achievements').select('*');
      return data || [];
    },
    async getAdminLogs() {
      const { data = [] } = await supabase.from('admin_logs').select('*').order('timestamp', { ascending: false });
      return data || [];
    },
    async getClassSessions(courseId: string) {
      const { data = [] } = await supabase.from('class_sessions').select('*').eq('course_id', courseId);
      return data || [];
    },
    async getStudentSessions(studentId: string) {
      const { data: enrollments } = await supabase.from('enrollments').select('course_id').eq('student_id', studentId);
      const ids = enrollments?.map(e => e.course_id) || [];
      const { data = [] } = await supabase.from('class_sessions').select('*, course:courses(title, thumbnail_url), lesson:lessons(title)').in('course_id', ids);
      return data || [];
    },
    async getInstructorSessions(instructorId: string) {
      const { data = [] } = await supabase.from('class_sessions').select('*, course:courses(title, thumbnail_url), lesson:lessons(title)').eq('instructor_id', instructorId);
      return data || [];
    },
    async getAllSessions() {
      const { data = [] } = await supabase.from('class_sessions').select('*, course:courses(title, thumbnail_url, batch), lesson:lessons(title), instructor:profiles(full_name)');
      return data || [];
    },
    async getInstructorStudents(instructorId: string) {
      const { data: courses } = await supabase.from('courses').select('id').eq('instructor_id', instructorId);
      const ids = courses?.map(c => c.id) || [];
      const { data = [] } = await supabase.from('enrollments').select('*, student:profiles(id, full_name, avatar_url, email), course:courses(title)').in('course_id', ids);
      return data?.map(e => ({ ...e.student, course_title: e.course?.title })) || [];
    },
    async getInstructorStats(instructorId: string) {
      const [coursesRes, assignmentsRes] = await Promise.all([
        supabase.from('courses').select('id', { count: 'exact' }).eq('instructor_id', instructorId),
        supabase.from('assignments').select('id', { count: 'exact' }).eq('instructor_id', instructorId)
      ]);
      const ids = coursesRes.data?.map(c => c.id) || [];
      const { count: studentCount } = await supabase.from('enrollments').select('*', { count: 'exact', head: true }).in('course_id', ids);
      return { studentCount: studentCount || 0, courseCount: coursesRes.count || 0, assignmentCount: assignmentsRes.count || 0, avgRating: 4.9 };
    }
  }
};