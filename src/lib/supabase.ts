// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface Employee {
  id: string;
  emp_id: string;
  name: string;
  email: string;
  date_of_birth: string;
  gender: 'Male' | 'Female';
  mobile: string;
  joining_date: string;
  policy_start: string;
  policy_end: string;
  department?: string;
  designation?: string;
  salary?: number;
  enrolled: boolean;
  enrollment_date?: string;
  enrollment_status: 'pending' | 'submitted' | 'approved';
  enrollment_due_date: string;
  role: 'employee' | 'admin';
  created_at?: string;
  updated_at?: string;
}

export interface FamilyMember {
  id: string;
  employee_id: string;
  name: string;
  relationship: 'Spouse' | 'Child';
  date_of_birth: string;
  gender: 'Male' | 'Female';
  age: number;
  created_at?: string;
}

export interface Parent {
  id: string;
  employee_id: string;
  name: string;
  relationship: 'Father' | 'Mother' | 'Father-in-law' | 'Mother-in-law';
  date_of_birth: string;
  gender: 'Male' | 'Female';
  age: number;
  created_at?: string;
}

export interface Enrollment {
  id: string;
  employee_id: string;
  parental_coverage_selected: boolean;
  parental_coverage_type: 'parents' | 'parents-in-law' | null;
  main_policy_premium: number;
  parental_policy_premium: number;
  gst_amount: number;
  total_premium: number;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  created_at?: string;
}