import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Interview Bridge features will be disabled.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type InterviewSession = {
  id: string;
  employer_id: string;
  candidate_id: string;
  candidate_name: string;
  job_title: string;
  status: 'pending' | 'active' | 'ended';
  created_at: string;
  expires_at: string;
};

export type InterviewTranscript = {
  id: number;
  session_id: string;
  sender: 'employer' | 'candidate';
  text: string;
  created_at: string;
};

export type Notification = {
  id: number;
  user_id: string;
  session_id: string;
  message: string;
  read: boolean;
  created_at: string;
};
