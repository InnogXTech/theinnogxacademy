
import { supabaseService } from './supabase';
import { AppRole, Profile, Course, Module, Lesson, Enrollment, Quiz, LeaderboardEntry, Transaction, ParentChildLink, Assignment, Submission, AttendanceRecord, ClassSession, Achievement, CommunityPost } from '../types';

/**
 * PRODUCTION COMPATIBILITY BRIDGE:
 * This ensures the existing UI continues to function with zero changes 
 * while speaking directly to the Supabase engine.
 */
export const supabaseMock = {
  auth: {
    signIn: (data: any) => supabaseService.auth.signIn(data),
    signUp: (data: any) => supabaseService.auth.signUp(data),
    signOut: () => supabaseService.auth.signOut(),
    resendVerification: (email: string) => supabaseService.auth.resendVerification(email),
    // Updated to return a reactive session helper
    getSession: () => {
      // NOTE: This synchronous return is a legacy of the mock.
      // Dashboards should use useEffect with supabaseService.auth.getSession()
      // or the global session state provided in App.tsx.
      return JSON.parse(localStorage.getItem('innogx_user_session') || 'null');
    }
  },
  db: {
    ...supabaseService.db,
    getCourse: (id: string) => supabaseService.db.getCourse(id),
    updateCourse: (id: string, updates: Partial<Course>) => supabaseService.db.updateCourse(id, updates),
    getModules: (courseId: string) => supabaseService.db.getModules(courseId),
    getLessons: (moduleId: string) => supabaseService.db.getLessons(moduleId),
    getQuizByLesson: (lessonId: string) => supabaseService.db.getQuizByLesson(lessonId),
    getNotifications: (userId: string) => supabaseService.db.getNotifications(userId),
    // Fix: Added markNotificationRead to mock bridge
    markNotificationRead: (id: string) => supabaseService.db.markNotificationRead(id),
    createCommunityPost: (data: any) => supabaseService.db.createCommunityPost(data),
    // Fix: Added getCommunityPosts to mock bridge
    getCommunityPosts: () => supabaseService.db.getCommunityPosts(),
    saveAttendance: (record: any) => supabaseService.db.saveAttendance(record),
    // Fix: Added getAllAttendance to mock bridge
    getAllAttendance: () => supabaseService.db.getAllAttendance(),
    // Fix: Added getAttendanceForCourse to mock bridge
    getAttendanceForCourse: (courseId: string) => supabaseService.db.getAttendanceForCourse(courseId),
    // Fix: Added getStudentAttendance to mock bridge
    getStudentAttendance: (studentId: string) => supabaseService.db.getStudentAttendance(studentId),
    enrollInCourse: (studentId: string, courseId: string) => supabaseService.db.enrollInCourse(studentId, courseId),
    addTransaction: (tx: any) => supabaseService.db.addTransaction(tx),
    // Fix: Updated getTransactions signature in mock bridge
    getTransactions: (userId?: string) => supabaseService.db.getTransactions(userId),
    createCourse: (data: any, adminName: string) => supabaseService.db.createCourse(data, adminName),
    deleteCourse: (id: string, adminName: string) => supabaseService.db.deleteCourse(id, adminName),
    // Fix: Added createAssignment to mock bridge
    createAssignment: (data: any) => supabaseService.db.createAssignment(data),
    submitAssignment: (data: any) => supabaseService.db.submitAssignment(data),
    // Fix: Added getAssignmentsByCourse to mock bridge
    getAssignmentsByCourse: (courseId: string) => supabaseService.db.getAssignmentsByCourse(courseId),
    // Fix: Added getAssignmentsByInstructor to mock bridge
    getAssignmentsByInstructor: (instructorId: string) => supabaseService.db.getAssignmentsByInstructor(instructorId),
    getAssignmentsByStudent: (studentId: string) => supabaseService.db.getAssignmentsByStudent(studentId),
    gradeSubmission: (id: string, grade: string, feedback: string) => supabaseService.db.gradeSubmission(id, grade, feedback),
    // Fix: Added getSubmissionsByAssignment to mock bridge
    getSubmissionsByAssignment: (assignmentId: string) => supabaseService.db.getSubmissionsByAssignment(assignmentId),
    // Fix: Added getSubmissionsByStudent to mock bridge
    getSubmissionsByStudent: (studentId: string) => supabaseService.db.getSubmissionsByStudent(studentId),
    linkChild: (parentId: string, scholarId: string) => supabaseService.db.linkChild(parentId, scholarId),
    // Fix: Updated getLinkedChildren signature in mock bridge
    getLinkedChildren: (parentId: string, includePending?: boolean) => supabaseService.db.getLinkedChildren(parentId, includePending),
    // Fix: Added getPendingLinks to mock bridge
    getPendingLinks: () => supabaseService.db.getPendingLinks(),
    approveLink: (parentId: string, childId: string, adminName: string) => supabaseService.db.approveLink(parentId, childId, adminName),
    verifyInstructor: (id: string, adminName: string) => supabaseService.db.verifyInstructor(id, adminName),
    suspendUser: (id: string, adminName: string) => supabaseService.db.suspendUser(id, adminName),
    deleteProfile: (id: string, adminName: string) => supabaseService.db.deleteProfile(id, adminName),
    // Fix: Added updateProfile to mock bridge
    updateProfile: (id: string, data: any) => supabaseService.db.updateProfile(id, data),
    // Fix: Added getProfiles to mock bridge
    getProfiles: () => supabaseService.db.getProfiles(),
    getAchievements: () => supabaseService.db.getAchievements(),
    // Fix: Added getAdminLogs to mock bridge
    getAdminLogs: () => supabaseService.db.getAdminLogs(),
    // Fix: Added getEnrollments to mock bridge
    getEnrollments: () => supabaseService.db.getEnrollments(),
    // Fix: Added getClassSessions to mock bridge
    getClassSessions: (courseId: string) => supabaseService.db.getClassSessions(courseId),
    // Fix: Added getStudentSessions to mock bridge
    getStudentSessions: (studentId: string) => supabaseService.db.getStudentSessions(studentId),
    // Fix: Added getInstructorSessions to mock bridge
    getInstructorSessions: (instructorId: string) => supabaseService.db.getInstructorSessions(instructorId),
    // Fix: Added getAllSessions to mock bridge
    getAllSessions: () => supabaseService.db.getAllSessions(),
    // Fix: Added getInstructorStudents to mock bridge
    getInstructorStudents: (instructorId: string) => supabaseService.db.getInstructorStudents(instructorId),
    // Fix: Added getInstructorStats to mock bridge
    getInstructorStats: (instructorId: string) => supabaseService.db.getInstructorStats(instructorId)
  }
};

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'grade' | 'assignment' | 'course' | 'info';
  read: boolean;
  created_at: string;
}

export interface AdminLog {
  id: string;
  action: string;
  admin_name: string;
  timestamp: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  created_by: string;
}
