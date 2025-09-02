// src/services/adminService.ts - Enhanced with batch support
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';

export class AdminService {
  // Helper function to format dates to DD/MMM/YYYY without conversion
  private formatDateForExport(dateString: string): string {
    if (!dateString) return '';
    
    // If date is in YYYY-MM-DD format, convert to DD/MMM/YYYY
    if (dateString.includes('-') && dateString.length === 10) {
      const [year, month, day] = dateString.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = parseInt(month) - 1;
      return `${day}/${monthNames[monthIndex]}/${year}`;
    }
    
    // If date is in DD/MM/YYYY format, convert to DD/MMM/YYYY
    if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthIndex = parseInt(month) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
          return `${day}/${monthNames[monthIndex]}/${year}`;
        }
      }
    }
    
    return dateString;
  }

  // Calculate age from date of birth
  private calculateAge(dobString: string): number {
    if (!dobString) return 0;
    
    try {
      let dob: Date;
      
      // Handle different date formats
      if (dobString.includes('-')) {
        dob = new Date(dobString);
      } else if (dobString.includes('/')) {
        const parts = dobString.split('/');
        if (parts.length === 3) {
          // Assume DD/MM/YYYY format
          const [day, month, year] = parts;
          dob = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          return 0;
        }
      } else {
        return 0;
      }
      
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      console.error('Error calculating age:', error);
      return 0;
    }
  }

  // Create Upload Batch
  async createUploadBatch(batchName: string, description: string, uploadedBy: string): Promise<string> {
    try {
      // Get the current admin user's UUID instead of using string
      const { data: { user } } = await supabase.auth.getUser();
      let adminUserId = null;
      
      // Try to find admin user by email or emp_id if auth user exists
      if (user?.email) {
        const { data: adminEmployee } = await supabase
          .from('employees')
          .select('id')
          .eq('email', user.email)
          .eq('role', 'admin')
          .single();
        
        if (adminEmployee) {
          adminUserId = adminEmployee.id;
        }
      }
      
      // If no admin user found, try to get any admin user
      if (!adminUserId) {
        const { data: anyAdmin } = await supabase
          .from('employees')
          .select('id')
          .eq('role', 'admin')
          .limit(1)
          .single();
        
        if (anyAdmin) {
          adminUserId = anyAdmin.id;
        }
      }

      const { data, error } = await supabase
        .from('upload_batches')
        .insert([{
          batch_name: batchName,
          description: description,
          uploaded_by: adminUserId, // Use UUID instead of string
          uploaded_at: new Date().toISOString()
        }])
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating upload batch:', error);
      throw error;
    }
  }

  // Get Upload Batches
  async getUploadBatches(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('upload_batches')
        .select(`
          id, batch_name, description, uploaded_at,
          employees!batch_id (count),
          uploader:uploaded_by (
            name, emp_id
          )
        `)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(batch => ({
        id: batch.id,
        batchName: batch.batch_name,
        description: batch.description,
        uploadedBy: batch.uploader?.name || 'Unknown Admin',
        uploadedAt: batch.uploaded_at,
        employeeCount: batch.employees?.[0]?.count || 0
      }));
    } catch (error) {
      console.error('Error fetching upload batches:', error);
      // Fallback query without joins if the above fails
      try {
        const { data, error: fallbackError } = await supabase
          .from('upload_batches')
          .select(`
            id, batch_name, description, uploaded_at,
          employees!batch_id (count)
        `)
        .order('uploaded_at', { ascending: false });

        if (fallbackError) throw fallbackError;

        return (data || []).map(batch => ({
          id: batch.id,
          batchName: batch.batch_name,
          description: batch.description,
          uploadedBy: 'Admin',
          uploadedAt: batch.uploaded_at,
          employeeCount: batch.employees?.[0]?.count || 0
        }));
      } catch (fallbackError) {
        console.error('Error in fallback query:', fallbackError);
        return [];
      }
    }
  }

  // Get Dashboard Statistics
  async getDashboardStats(): Promise<any> {
    try {
      const { data: employees, error } = await supabase
        .from('employees')
        .select('*');

      if (error) throw error;

      const totalEmployees = employees?.length || 0;
      const enrolledEmployees = employees?.filter(emp => emp.enrolled).length || 0;
      const pendingEmployees = totalEmployees - enrolledEmployees;

      // Department breakdown
      const departmentBreakdown: any = {};
      employees?.forEach(emp => {
        const dept = emp.department || 'Not Specified';
        if (!departmentBreakdown[dept]) {
          departmentBreakdown[dept] = { total: 0, enrolled: 0, pending: 0 };
        }
        departmentBreakdown[dept].total++;
        if (emp.enrolled) {
          departmentBreakdown[dept].enrolled++;
        } else {
          departmentBreakdown[dept].pending++;
        }
      });

      return {
        totalEmployees,
        enrolledEmployees,
        pendingEmployees,
        enrollmentRate: totalEmployees > 0 ? (enrolledEmployees / totalEmployees) * 100 : 0,
        departmentBreakdown: Object.entries(departmentBreakdown).map(([department, data]) => ({
          department,
          total: (data as any).total,
          enrolled: (data as any).enrolled,
          pending: (data as any).pending,
          enrollmentRate: (data as any).total > 0 ? ((data as any).enrolled / (data as any).total) * 100 : 0
        }))
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  // Get Detailed Enrollment Report with Batch Filter
  async getDetailedEnrollmentReport(batchId?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('employees')
        .select(`
          id, emp_id, name, email, date_of_birth, gender, mobile, joining_date,
          department, designation, salary, enrollment_status, enrolled,
          policy_start, policy_end, enrollment_due_date, batch_id,
          enrollments (
            id, total_premium, pro_rata_factor, parental_coverage_selected,
            parental_coverage_type, main_policy_premium, parental_policy_premium, gst_amount
          ),
          family_members (
            id, name, relationship, date_of_birth, gender
          ),
          parents (
            id, name, relationship, date_of_birth, gender
          )
        `);

      // Apply batch filter if provided
      if (batchId) {
        query = query.eq('batch_id', batchId);
      }

      const { data: employees, error: empError } = await query;

      if (empError) throw empError;

      const detailedReport = employees?.map(emp => {
        const enrollment = (emp.enrollments as any)?.[0];
        const familyMembers = (emp.family_members as any) || [];
        const parents = (emp.parents as any) || [];
        
        // Combine all dependents with complete details
        const dependents = [
          ...familyMembers.map((fm: any) => ({
            name: fm.name,
            relationship: fm.relationship,
            type: 'family' as const,
            dateOfBirth: fm.date_of_birth,
            gender: fm.gender,
            age: this.calculateAge(fm.date_of_birth)
          })),
          ...parents.map((p: any) => ({
            name: p.name,
            relationship: p.relationship,
            type: 'parent' as const,
            dateOfBirth: p.date_of_birth,
            gender: p.gender,
            age: this.calculateAge(p.date_of_birth)
          }))
        ];

        const totalPremium = enrollment?.total_premium || 0;
        const monthlyDeduction = totalPremium > 0 ? Math.round(totalPremium / 12) : 0;

        return {
          employeeId: emp.id,
          empId: emp.emp_id,
          name: emp.name,
          email: emp.email,
          dateOfBirth: emp.date_of_birth,
          gender: emp.gender,
          mobile: emp.mobile,
          joiningDate: emp.joining_date,
          department: emp.department || 'Not Specified',
          designation: emp.designation || '',
          salary: emp.salary || 0,
          enrollmentStatus: emp.enrollment_status || 'pending',
          enrollmentId: enrollment?.id || null,
          policyStart: emp.policy_start,
          policyEnd: emp.policy_end,
          enrollmentDueDate: emp.enrollment_due_date,
          batchId: emp.batch_id,
          totalPremium,
          monthlyDeduction,
          mainPolicyPremium: enrollment?.main_policy_premium || 0,
          parentalPolicyPremium: enrollment?.parental_policy_premium || 0,
          gstAmount: enrollment?.gst_amount || 0,
          proRataFactor: enrollment?.pro_rata_factor || 0,
          parentalCoverageSelected: enrollment?.parental_coverage_selected || false,
          parentalCoverageType: enrollment?.parental_coverage_type || '',
          dependents
        };
      }) || [];

      return detailedReport;
    } catch (error) {
      console.error('Error fetching detailed enrollment report:', error);
      throw error;
    }
  }

  // Export Detailed Enrollment Report with Batch Filter
  async exportDetailedEnrollmentReport(format: 'csv' | 'excel' = 'csv', batchId?: string): Promise<string | void> {
    try {
      const detailedReport = await this.getDetailedEnrollmentReport(batchId);

      const headers = [
        'Record Type', 'Employee ID', 'Enrollment ID', 'Name', 'Email', 'Date of Birth', 
        'Gender', 'Mobile', 'Joining Date', 'Enrollment Due Date', 'Enrollment Status', 
        'Relationship', 'Age', 'Coverage Type', 'Annual Premium', 'Monthly Deduction', 
        'Main Policy Premium', 'Parental Policy Premium', 'GST Amount', 'Pro-rata Factor (%)'
      ];

      const rows: any[] = [];

      detailedReport.forEach(emp => {
        // Employee row with complete details
        const employeeRow = [
          'Employee',
          emp.empId,
          emp.enrollmentId || '',
          emp.name,
          emp.email,
          this.formatDateForExport(emp.dateOfBirth),
          emp.gender,
          emp.mobile,
          this.formatDateForExport(emp.joiningDate),
          this.formatDateForExport(emp.enrollmentDueDate),
          emp.enrollmentStatus,
          'Self',
          this.calculateAge(emp.dateOfBirth),
          'Base Coverage',
          emp.totalPremium,
          emp.monthlyDeduction,
          emp.mainPolicyPremium,
          emp.parentalPolicyPremium,
          emp.gstAmount,
          emp.proRataFactor ? (emp.proRataFactor * 100).toFixed(2) : ''
        ];
        
        rows.push(employeeRow);

        // Dependent rows with complete details
        emp.dependents.forEach((dependent: any, index: number) => {
          const dependentRow = [
            'Dependent',
            `${emp.empId}-DEP${index + 1}`,
            emp.enrollmentId || '',
            dependent.name,
            '', // Email not applicable for dependents
            this.formatDateForExport(dependent.dateOfBirth),
            dependent.gender,
            '', // Mobile not applicable for dependents
            '', // Joining date not applicable for dependents
            '', // Enrollment due date not applicable for dependents
            emp.enrollmentStatus,
            dependent.relationship,
            dependent.age,
            dependent.type === 'family' ? 'Base Coverage' : 'Parental Coverage',
            dependent.type === 'family' ? 'Included in Base' : 'Premium Applied',
            '', // Monthly deduction not applicable for individual dependents
            '', // Main policy premium not applicable for individual dependents
            '', // Parental policy premium not applicable for individual dependents
            '', // GST amount not applicable for individual dependents
            '' // Pro-rata factor not applicable for individual dependents
          ];
          
          rows.push(dependentRow);
        });
      });

      if (format === 'excel') {
        // Create Excel file
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Detailed Enrollment Report');
        
        // Generate Excel file and trigger download
        const batchSuffix = batchId ? `-batch-${batchId}` : '';
        const fileName = `detailed-enrollment-report${batchSuffix}-${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        return; // No return value for Excel as it's downloaded directly
      } else {
        // Return CSV format
        const csvRows = rows.map(row => 
          row.map((cell: any) => 
            typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
          ).join(',')
        );
        return [headers.join(','), ...csvRows].join('\n');
      }
    } catch (error) {
      console.error('Error exporting detailed enrollment report:', error);
      throw error;
    }
  }

  // Create Employee with Batch ID
  async createEmployee(employeeData: any, batchId?: string): Promise<void> {
    try {
      // Enhanced date conversion with better validation
      const convertDate = (dateStr: string): string => {
        if (!dateStr) return '';
        
        // Remove any extra whitespace
        dateStr = dateStr.trim();
        
        // If already in YYYY-MM-DD format, validate and return
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return dateStr;
          }
        }
        
        // Handle DD/MM/YYYY format
        if (dateStr.includes('/')) {
          const [day, month, year] = dateStr.split('/');
          if (day && month && year) {
            const convertedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            const date = new Date(convertedDate);
            if (!isNaN(date.getTime())) {
              return convertedDate;
            }
          }
        }
        
        // Handle MM/DD/YYYY format (less common but possible)
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            // Try MM/DD/YYYY format
            const [month, day, year] = parts;
            if (month && day && year && parseInt(month) <= 12 && parseInt(day) <= 31) {
              const convertedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              const date = new Date(convertedDate);
              if (!isNaN(date.getTime())) {
                return convertedDate;
              }
            }
          }
        }
        
        // If all else fails, try to parse as-is
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
        
        // Return empty string if unable to parse
        console.warn(`Unable to parse date: ${dateStr}`);
        return dateStr;
      };

      const employeeRecord: any = {
        emp_id: employeeData.emp_id,
        name: employeeData.name,
        email: employeeData.email,
        date_of_birth: convertDate(employeeData.date_of_birth),
        gender: employeeData.gender,
        mobile: employeeData.mobile,
        joining_date: convertDate(employeeData.joining_date),
        policy_start: convertDate(employeeData.policy_start),
        policy_end: convertDate(employeeData.policy_end),
        department: employeeData.department,
        designation: employeeData.designation || '',
        salary: employeeData.salary || 0,
        enrolled: false,
        enrollment_status: 'pending',
        enrollment_due_date: convertDate(employeeData.enrollment_due_date),
        role: 'employee'
      };

      // Add batch_id if provided
      if (batchId) {
        employeeRecord.batch_id = batchId;
      }

      const { error } = await supabase
        .from('employees')
        .insert([employeeRecord]);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  // Export Employee Data with Complete Details
  async exportEmployeeData(format: 'csv' | 'excel' = 'csv'): Promise<string | void> {
    try {
      const { data: employees, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');

      if (error) throw error;

      const headers = [
        'Employee ID', 'Name', 'Email', 'Date of Birth', 'Gender', 'Mobile',
        'Joining Date', 'Enrollment Due Date', 
        'Enrollment Status', 'Enrolled'
      ];

      const rows = (employees || []).map(emp => [
        emp.emp_id,
        emp.name,
        emp.email,
        this.formatDateForExport(emp.date_of_birth),
        emp.gender,
        emp.mobile,
        this.formatDateForExport(emp.joining_date),
        this.formatDateForExport(emp.enrollment_due_date),
        emp.enrollment_status || 'pending',
        emp.enrolled ? 'Yes' : 'No'
      ]);

      if (format === 'excel') {
        // Create Excel file
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Data');
        
        // Generate Excel file and trigger download
        const fileName = `employee-data-${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        return; // No return value for Excel as it's downloaded directly
      } else {
        // Return CSV format
        const csvRows = rows.map(row => 
          row.map((cell: any) => 
            typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
          ).join(',')
        );
        return [headers.join(','), ...csvRows].join('\n');
      }
    } catch (error) {
      console.error('Error exporting employee data:', error);
      throw error;
    }
  }

  // Send Enrollment Reminder
  async sendEnrollmentReminder(employeeId: string): Promise<void> {
    try {
      // This would integrate with email service
      console.log(`Sending enrollment reminder to employee: ${employeeId}`);
      // Implementation would depend on email service integration
    } catch (error) {
      console.error('Error sending enrollment reminder:', error);
      throw error;
    }
  }

  // Get All Employees
  async getAllEmployees(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all employees:', error);
      throw error;
    }
  }

  // Update Employee
  async updateEmployee(employeeId: string, updates: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', employeeId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  // Delete Employee
  async deleteEmployee(employeeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }
}