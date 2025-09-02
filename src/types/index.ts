// src/types/index.ts
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
  enrolled?: boolean;
  enrollment_date?: string;
  enrollmentStatus?: 'pending' | 'submitted' | 'approved';
  enrollmentDueDate?: string;
  role?: 'employee' | 'admin';
}

export interface FamilyMember {
  id?: string;
  name: string;
  relationship: 'Spouse' | 'Child';
  date_of_birth: string;
  gender: 'Male' | 'Female';
  age?: number;
}

export interface Parent {
  id?: string;
  name: string;
  relationship: 'Father' | 'Mother' | 'Father-in-law' | 'Mother-in-law';
  date_of_birth: string;
  gender: 'Male' | 'Female';
  age?: number;
}

export interface EnrollmentData {
  employeeId: string;
  id?: string;
  familyMembers: FamilyMember[];
  parentalCoverage: {
    selected: boolean;
    parentSet: 'parents' | 'parents-in-law' | null;
    parents: Parent[];
  };
  premiums: {
    mainPolicy: number;
    parentalPolicy: number;
    gst: number;
    total: number;
  };
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  proRataFactor?: number;
  enrollmentDate?: string;
  policyRemainingDays?: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface BusinessRulesValidation {
  valid: boolean;
  errors: string[];
}

// Pro-rata calculation interfaces
export interface ProRataCalculation {
  basePremium: number;
  proRatedPremium: number;
  factor: number;
  remainingDays: number;
  totalPolicyDays: number;
  enrollmentDate: Date;
  policyEndDate: Date;
}

export interface PremiumBreakdown {
  description: string;
  basePremium: number;
  proRatedPremium: number;
  gst: number;
  total: number;
  monthlyDeduction: number;
  factor: number;
  remainingDays: number;
}

// Supabase database types
export interface SupabaseEmployee {
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
  created_at: string;
  updated_at: string;
}

export interface SupabaseFamilyMember {
  id: string;
  employee_id: string;
  name: string;
  relationship: 'Spouse' | 'Child';
  date_of_birth: string;
  gender: 'Male' | 'Female';
  age: number;
  created_at: string;
}

export interface SupabaseParent {
  id: string;
  employee_id: string;
  name: string;
  relationship: 'Father' | 'Mother' | 'Father-in-law' | 'Mother-in-law';
  date_of_birth: string;
  gender: 'Male' | 'Female';
  age: number;
  created_at: string;
}

export interface SupabaseEnrollment {
  id: string;
  employee_id: string;
  parental_coverage_selected: boolean;
  parental_coverage_type: 'parents' | 'parents-in-law' | null;
  main_policy_premium: number;
  parental_policy_premium: number;
  gst_amount: number;
  total_premium: number;
  pro_rata_factor: number;
  enrollment_date: string;
  policy_remaining_days: number;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  created_at: string;
}

interface UserContextType {
  currentEmployee: Employee | null;
  setCurrentEmployee: (employee: Employee | null, skipStorage?: boolean) => void;
  isLoading: boolean;
  refreshEmployeeData: () => Promise<void>;
}