// src/services/supabaseService.ts - Fixed Column Names
import { supabase } from '../lib/supabase';
import { Employee, FamilyMember, Parent, EnrollmentData } from '../types';
import { calculateProRataFactor } from '../utils/premiumUtils';

export class SupabaseService {
  // Convert database snake_case to frontend camelCase
  private convertEmployeeFromDB(dbEmployee: any): Employee {
    return {
      id: dbEmployee.id,
      emp_id: dbEmployee.emp_id,
      name: dbEmployee.name,
      email: dbEmployee.email,
      date_of_birth: this.convertDateFromDB(dbEmployee.date_of_birth),
      gender: dbEmployee.gender,
      mobile: dbEmployee.mobile,
      joining_date: this.convertDateFromDB(dbEmployee.joining_date),
      policy_start: this.convertDateFromDB(dbEmployee.policy_start),
      policy_end: this.convertDateFromDB(dbEmployee.policy_end),
      department: dbEmployee.department,
      designation: dbEmployee.designation,
      salary: dbEmployee.salary,
      enrolled: dbEmployee.enrolled,
      enrollment_date: dbEmployee.enrollment_date ? this.convertDateFromDB(dbEmployee.enrollment_date) : undefined,
      enrollmentStatus: dbEmployee.enrollment_status || 'pending',
      enrollmentDueDate: this.convertDateFromDB(dbEmployee.enrollment_due_date),
      role: dbEmployee.role || 'employee'
    };
  }

  // Convert frontend camelCase to database snake_case
  private convertEmployeeToDB(employee: any): any {
    const result: any = {};
    
    // Only include fields that have values
    if (employee.emp_id !== undefined) result.emp_id = employee.emp_id;
    if (employee.name !== undefined) result.name = employee.name;
    if (employee.email !== undefined) result.email = employee.email;
    if (employee.date_of_birth !== undefined && employee.date_of_birth !== '') {
      result.date_of_birth = this.convertDateToDB(employee.date_of_birth);
    }
    if (employee.gender !== undefined) result.gender = employee.gender;
    if (employee.mobile !== undefined) result.mobile = employee.mobile;
    if (employee.joining_date !== undefined && employee.joining_date !== '') {
      result.joining_date = this.convertDateToDB(employee.joining_date);
    }
    if (employee.policy_start !== undefined && employee.policy_start !== '') {
      result.policy_start = this.convertDateToDB(employee.policy_start);
    }
    if (employee.policy_end !== undefined && employee.policy_end !== '') {
      result.policy_end = this.convertDateToDB(employee.policy_end);
    }
    if (employee.department !== undefined) result.department = employee.department;
    if (employee.designation !== undefined) result.designation = employee.designation;
    if (employee.salary !== undefined) result.salary = employee.salary;
    if (employee.enrolled !== undefined) result.enrolled = employee.enrolled;
    if (employee.enrollment_date !== undefined && employee.enrollment_date !== '') {
      result.enrollment_date = this.convertDateToDB(employee.enrollment_date);
    }
    if (employee.enrollmentStatus !== undefined || employee.enrollment_status !== undefined) {
      result.enrollment_status = employee.enrollmentStatus || employee.enrollment_status || 'pending';
    }
    if (employee.enrollmentDueDate !== undefined && employee.enrollmentDueDate !== '') {
      result.enrollment_due_date = this.convertDateToDB(employee.enrollmentDueDate);
    } else if (employee.enrollment_due_date !== undefined && employee.enrollment_due_date !== '') {
      result.enrollment_due_date = this.convertDateToDB(employee.enrollment_due_date);
    }
    if (employee.role !== undefined) result.role = employee.role || 'employee';
    
    return {
      ...result
    };
  }

  // Convert YYYY-MM-DD to DD/MM/YYYY for frontend
  private convertDateFromDB(dateString: string): string {
    if (!dateString) return '';
    if (dateString.includes('-')) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    return dateString;
  }

  // Convert DD/MM/YYYY to YYYY-MM-DD for database
  private convertDateToDB(dateString: string): string {
    if (!dateString) return '';
    
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // Convert DD/MM/YYYY to YYYY-MM-DD
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      if (day && month && year) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
    return dateString;
  }

  async getAllEmployees(): Promise<Employee[]> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      return (data || []).map(emp => this.convertEmployeeFromDB(emp));
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  }

  async getEmployeeByEmpId(empId: string): Promise<Employee | null> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('emp_id', empId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data ? this.convertEmployeeFromDB(data) : null;
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw error;
    }
  }

  async getEmployeeByCredentials(email: string, empId: string): Promise<Employee | null> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('email', email)
        .eq('emp_id', empId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No matching employee found
        }
        throw error;
      }

      return data ? this.convertEmployeeFromDB(data) : null;
    } catch (error) {
      console.error('Error fetching employee by credentials:', error);
      throw error;
    }
  }

  async createEmployee(employeeData: any): Promise<Employee> {
    try {
      const dbEmployee = this.convertEmployeeToDB(employeeData);
      
      const { data, error } = await supabase
        .from('employees')
        .insert([dbEmployee])
        .select()
        .single();

      if (error) throw error;

      return this.convertEmployeeFromDB(data);
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  async updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<void> {
    try {
      const dbUpdates = this.convertEmployeeToDB(updates);
      
      // Remove any empty date fields to prevent database errors
      Object.keys(dbUpdates).forEach(key => {
        if (key.includes('date') && dbUpdates[key] === '') {
          delete dbUpdates[key];
        }
      });
      
      const { error } = await supabase
        .from('employees')
        .update(dbUpdates)
        .eq('id', employeeId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  async createFamilyMember(employeeId: string, familyMember: FamilyMember): Promise<void> {
    try {
      const { error } = await supabase
        .from('family_members')
        .insert([{
          employee_id: employeeId,
          name: familyMember.name,
          relationship: familyMember.relationship,
          date_of_birth: this.convertDateToDB(familyMember.date_of_birth),
          gender: familyMember.gender,
          age: familyMember.age
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating family member:', error);
      throw error;
    }
  }

  async createParent(employeeId: string, parent: Parent): Promise<void> {
    try {
      const { error } = await supabase
        .from('parents')
        .insert([{
          employee_id: employeeId,
          name: parent.name,
          relationship: parent.relationship,
          date_of_birth: this.convertDateToDB(parent.date_of_birth),
          gender: parent.gender,
          age: parent.age
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating parent:', error);
      throw error;
    }
  }

  async saveEnrollment(enrollmentData: EnrollmentData): Promise<void> {
    console.log('[SupabaseService] Starting saveEnrollment for employee:', enrollmentData.employeeId);
    try {
      // Create enrollment record with pro-rata calculation
      console.log('[SupabaseService] Creating enrollment record...');
      const { data: enrollmentRecord, error: enrollmentError } = await supabase
        .from('enrollments')
        .insert([{
          employee_id: enrollmentData.employeeId,
          parental_coverage_selected: enrollmentData.parentalCoverage.selected,
          parental_coverage_type: enrollmentData.parentalCoverage.parentSet,
          main_policy_premium: enrollmentData.premiums.mainPolicy,
          parental_policy_premium: enrollmentData.premiums.parentalPolicy,
          gst_amount: enrollmentData.premiums.gst,
          total_premium: enrollmentData.premiums.total,
          pro_rata_factor: enrollmentData.proRataFactor || 0,
          enrollment_date: enrollmentData.enrollmentDate || new Date().toISOString().split('T')[0],
          policy_remaining_days: enrollmentData.policyRemainingDays || 0,
          status: 'pending'
        }])
        .select('id')
        .single();

      if (enrollmentError) {
        console.error('[SupabaseService] Error creating enrollment:', enrollmentError);
        throw enrollmentError;
      }
      console.log('[SupabaseService] Enrollment record created successfully');
      
      // Update the enrollment data with the generated ID
      if (enrollmentRecord) {
        enrollmentData.id = enrollmentRecord.id;
      }

      // Create family members
      console.log('[SupabaseService] Creating family members...');
      for (const member of enrollmentData.familyMembers) {
        await this.createFamilyMember(enrollmentData.employeeId, member);
      }
      console.log('[SupabaseService] Family members created successfully');

      // Create parents
      console.log('[SupabaseService] Creating parents...');
      for (const parent of enrollmentData.parentalCoverage.parents) {
        await this.createParent(enrollmentData.employeeId, parent);
      }
      console.log('[SupabaseService] Parents created successfully');

      // Update employee status
      console.log('[SupabaseService] Updating employee status...');
      await this.updateEmployee(enrollmentData.employeeId, {
        enrolled: true,
        enrollmentStatus: 'submitted',
        enrollment_date: new Date().toISOString().split('T')[0] // Use YYYY-MM-DD format
      });
      console.log('[SupabaseService] Employee status updated successfully');
      
    } catch (error) {
      console.error('[SupabaseService] Error saving enrollment:', error);
      throw error;
    }
  }

  async getFamilyMembersByEmployeeId(employeeId: string): Promise<FamilyMember[]> {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('employee_id', employeeId);

      if (error) throw error;

      return (data || []).map(fm => ({
        id: fm.id,
        name: fm.name,
        relationship: fm.relationship,
        date_of_birth: this.convertDateFromDB(fm.date_of_birth),
        gender: fm.gender,
        age: fm.age
      }));
    } catch (error) {
      console.error('Error fetching family members:', error);
      return [];
    }
  }

  async getParentsByEmployeeId(employeeId: string): Promise<Parent[]> {
    try {
      const { data, error } = await supabase
        .from('parents')
        .select('*')
        .eq('employee_id', employeeId);

      if (error) throw error;

      return (data || []).map(p => ({
        id: p.id,
        name: p.name,
        relationship: p.relationship,
        date_of_birth: this.convertDateFromDB(p.date_of_birth),
        gender: p.gender,
        age: p.age
      }));
    } catch (error) {
      console.error('Error fetching parents:', error);
      return [];
    }
  }

  async getAllEnrollments(): Promise<EnrollmentData[]> {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      const enrollments: EnrollmentData[] = [];

      for (const enrollment of data || []) {
        const familyMembers = await this.getFamilyMembersByEmployeeId(enrollment.employee_id);
        const parents = await this.getParentsByEmployeeId(enrollment.employee_id);

        enrollments.push({
          employeeId: enrollment.employee_id,
          familyMembers,
          parentalCoverage: {
            selected: enrollment.parental_coverage_selected,
            parentSet: enrollment.parental_coverage_type,
            parents
          },
          premiums: {
            mainPolicy: enrollment.main_policy_premium || 0,
            parentalPolicy: enrollment.parental_policy_premium || 0,
            gst: enrollment.gst_amount || 0,
            total: enrollment.total_premium || 0
          },
          submittedAt: enrollment.submitted_at,
          status: enrollment.status,
          proRataFactor: enrollment.pro_rata_factor,
          enrollmentDate: enrollment.enrollment_date,
          policyRemainingDays: enrollment.policy_remaining_days
        });
      }

      return enrollments;
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      throw error;
    }
  }

  async createEnrollment(enrollmentData: EnrollmentData): Promise<void> {
    // This method calls saveEnrollment for compatibility
    await this.saveEnrollment(enrollmentData);
  }

  async getEnrollmentByEmployeeId(employeeId: string): Promise<EnrollmentData | null> {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('employee_id', employeeId)
        .limit(1);

      if (error) {
        throw error;
      }

      // Check if any enrollment was found
      if (!data || data.length === 0) {
        return null;
      }

      const enrollment = data[0];

      // Get family members and parents
      const familyMembers = await this.getFamilyMembersByEmployeeId(employeeId);
      const parents = await this.getParentsByEmployeeId(employeeId);

      return {
        employeeId,
        familyMembers,
        parentalCoverage: {
          selected: enrollment.parental_coverage_selected,
          parentSet: enrollment.parental_coverage_type,
          parents
        },
        premiums: {
          mainPolicy: enrollment.main_policy_premium || 0,
          parentalPolicy: enrollment.parental_policy_premium || 0,
          gst: enrollment.gst_amount || 0,
          total: enrollment.total_premium || 0
        },
        submittedAt: enrollment.submitted_at,
        status: enrollment.status,
        proRataFactor: enrollment.pro_rata_factor,
        enrollmentDate: enrollment.enrollment_date,
        policyRemainingDays: enrollment.policy_remaining_days
      };
    } catch (error) {
      console.error('Error fetching enrollment:', error);
      throw error;
    }
  }
}

export const supabaseService = new SupabaseService();