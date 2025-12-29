export type UserRole = 'admin' | 'student' | 'instructor';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  created_at: string;
}

export type CourseStatus = 'draft' | 'published';
export type AccessType = 'free' | 'paid' | 'invite';

export interface Course {
  id: string;
  title: string;
  description: string | null;
  status: CourseStatus;
  access_type: AccessType;
  price_cents: number | null;
  currency: string | null;
  is_paid: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  position: number;
  created_at: string;
}

export type ItemType = 'resource' | 'slide' | 'exercise' | 'tp' | 'game';

export interface Item {
  id: string;
  module_id: string;
  type: ItemType;
  title: string;
  content: Record<string, any> | null;
  asset_path: string | null;
  external_url: string | null;
  position: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export type EnrollmentStatus = 'active' | 'pending' | 'revoked';
export type EnrollmentSource = 'manual' | 'payment_future';

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: EnrollmentStatus;
  source: EnrollmentSource;
  enrolled_at: string;
}

export type SubmissionStatus = 'draft' | 'submitted' | 'graded';

export interface Submission {
  id: string;
  user_id: string;
  item_id: string;
  answer_text: string | null;
  answer_json: Record<string, any> | null;
  file_path: string | null;
  status: SubmissionStatus;
  grade: number | null;
  submitted_at: string;
  graded_at: string | null;
}

export interface GameScore {
  id: string;
  user_id: string;
  course_id: string;
  item_id: string;
  score: number;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface Chapter {
  id: string;
  item_id: string;
  title: string;
  content: Record<string, any> | null; // Format TipTap JSON
  position: number;
  created_at: string;
  updated_at: string;
}

export type Theme = 'light' | 'dark';
export type FontSize = 'small' | 'normal' | 'large';

export interface UserSettings {
  id: string;
  user_id: string;
  pdf_zoom: number;
  theme: Theme;
  font_size: FontSize;
  layout_preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}
