
export enum AppRole {
  ADMIN = 'admin',
  INSTRUCTOR = 'instructor',
  PARENT = 'parent',
  STUDENT = 'student'
}

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: AppRole;
  career_role?: string;
  about_me?: string;
  joined_at: string;
  requested_child_email?: string;
  is_verified?: boolean;
  is_suspended?: boolean;
  is_online?: boolean;
  has_onboarded?: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  icon: string;
  description: string;
  unlocked_at?: string;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  project_link?: string;
  created_at: string;
  likes: number;
  comments: CommunityComment[];
}

export interface CommunityComment {
  id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  instructor_id: string;
  is_published: boolean;
  is_free: boolean;
  price?: number;
  google_meet_link?: string;
  batch?: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  course_id: string;
  lesson_id: string;
  duration_minutes: number;
  activity_score: number;
  status: 'present' | 'partial' | 'absent';
  timestamp: string;
}

export interface ClassSession {
  id: string;
  course_id: string;
  lesson_id: string;
  instructor_id: string;
  recording_url: string;
  transcript: string;
  created_at: string;
}

export interface Assignment {
  id: string;
  course_id: string;
  instructor_id: string;
  title: string;
  description: string;
  due_date: string;
  created_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  content: string;
  submitted_at: string;
  grade?: string;
  feedback?: string;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content: string;
  video_url?: string;
  duration_minutes: number;
  order_index: number;
}

export interface Quiz {
  id: string;
  lesson_id: string;
  title: string;
  questions: Question[];
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correct_option_index: number;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  progress_percentage: number;
  payment_verified: boolean;
  enrolled_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  status: 'success' | 'pending' | 'failed';
  item_name: string;
  date: string;
  reference: string;
}

export interface ParentChildLink {
  parent_id: string;
  child_id: string;
  status: 'pending' | 'approved';
}

export interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  xp: number;
  rank: number;
}
