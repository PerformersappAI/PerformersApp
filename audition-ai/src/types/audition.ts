
export interface Audition {
  id: string;
  user_id: string;
  title: string;
  casting_director?: string;
  production_company?: string;
  audition_date?: string;
  audition_type: 'self-tape' | 'in-person' | 'callback' | 'chemistry-read';
  status: 'preparation' | 'submitted' | 'callback' | 'booked' | 'rejected' | 'expired';
  notes?: string;
  script_id?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_website?: string;
  casting_director_preferences?: string;
  casting_director_current_projects?: string;
  created_at: string;
  updated_at: string;
  submission_deadline?: string;
  reminder_enabled?: boolean;
  reminder_time?: string;
  actor_email?: string;
  scripts?: {
    title: string;
    content: string;
  };
  script_analyses?: {
    selected_character: string;
    acting_method: string;
  }[];
  video_submissions?: {
    id: string;
    video_title?: string;
    evaluation_status?: string;
  }[];
}

export interface AuditionStats {
  total_auditions: number;
  preparation: number;
  submitted: number;
  callback: number;
  booked: number;
  rejected: number;
  success_rate: number;
}

// Create a separate type for audition creation that matches the database insert schema
export interface CreateAuditionData {
  title: string;
  casting_director?: string;
  production_company?: string;
  audition_date?: string;
  audition_type?: 'self-tape' | 'in-person' | 'callback' | 'chemistry-read';
  status?: 'preparation' | 'submitted' | 'callback' | 'booked' | 'rejected' | 'expired';
  notes?: string;
  script_id?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_website?: string;
  casting_director_preferences?: string;
  casting_director_current_projects?: string;
  submission_deadline?: string;
  reminder_enabled?: boolean;
  reminder_time?: string;
  actor_email?: string;
}
