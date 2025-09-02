import { supabase } from '../lib/supabase';
import { Employee, FamilyMember, Parent } from '../types';
import { calculateAge, formatDateWithMonthName } from '../utils/dateUtils';

export interface EnrollmentEmailData {
  employee: Employee;
  familyMembers: FamilyMember[];
  parents: Parent[];
  parentalCoverage: {
    selected: boolean;
    parentSet: 'parents' | 'parents-in-law' | null;
  };
  premiums: {
    mainPolicy: number;
    parentalPolicy: number;
    gst: number;
    total: number;
  };
}

export const emailService = {
  async sendConfirmationEmail(enrollmentData: EnrollmentEmailData): Promise<boolean> {
    try {
      console.log('[EmailService] Attempting to send confirmation email to:', enrollmentData.employee.email);
      
      // Prepare email data for the edge function
      const emailPayload = {
        employeeName: enrollmentData.employee.name,
        employeeEmail: enrollmentData.employee.email,
        employeeId: enrollmentData.employee.emp_id,
        enrollmentDate: new Date().toISOString().split('T')[0],
        totalPremium: enrollmentData.premiums.total,
        familyMembersCount: enrollmentData.familyMembers.length,
        parentalCoverageSelected: enrollmentData.parentalCoverage.selected,
        parentalCoverageType: enrollmentData.parentalCoverage.parentSet,
        
        // Employee details
        employee: {
          name: enrollmentData.employee.name,
          emp_id: enrollmentData.employee.emp_id,
          email: enrollmentData.employee.email,
          date_of_birth: enrollmentData.employee.date_of_birth,
          gender: enrollmentData.employee.gender,
          joining_date: enrollmentData.employee.joining_date,
          age: calculateAge(enrollmentData.employee.date_of_birth),
          date_of_birth_formatted: formatDateWithMonthName(enrollmentData.employee.date_of_birth)
        },
        
        // Family members with formatted data
        familyMembers: enrollmentData.familyMembers.map(member => ({
          name: member.name,
          relationship: member.relationship,
          date_of_birth: member.date_of_birth,
          gender: member.gender,
          age: calculateAge(member.date_of_birth),
          date_of_birth_formatted: formatDateWithMonthName(member.date_of_birth)
        })),
        
        // Parents with formatted data
        parents: enrollmentData.parents.map(parent => ({
          name: parent.name,
          relationship: parent.relationship,
          date_of_birth: parent.date_of_birth,
          gender: parent.gender,
          age: calculateAge(parent.date_of_birth),
          date_of_birth_formatted: formatDateWithMonthName(parent.date_of_birth)
        })),
        
        // Premium details
        premiums: enrollmentData.premiums
      };

      console.log('[EmailService] Email payload prepared:', emailPayload);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('[EmailService] Missing Supabase configuration');
        throw new Error('Missing Supabase configuration');
      }

      const functionUrl = `${supabaseUrl}/functions/v1/send-confirmation-email`;
      console.log('[EmailService] Calling edge function at:', functionUrl);

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      });

      console.log('[EmailService] Edge function response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[EmailService] Edge function error response:', errorText);
        throw new Error(`Email service error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('[EmailService] Edge function result:', result);
      
      return result.success || false;
    } catch (error) {
      console.error('[EmailService] Failed to send confirmation email:', error);
      // Return false instead of throwing to prevent enrollment failure
      return false;
    }
  }
};