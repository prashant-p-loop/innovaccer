// src/contexts/EnrollmentContext.tsx - FIXED: Proper employee context management
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Employee, FamilyMember, Parent, EnrollmentData, PremiumBreakdown } from '../types';
import { getPremiumBreakdown } from '../utils/premiumUtils';
import { SupabaseService } from '../services/supabaseService';
import { emailService } from '../services/emailService';

interface EnrollmentContextType {
  // Employee data
  currentEmployee: Employee | null;
  setCurrentEmployee: (employee: Employee | null) => void;
  
  // Family members
  familyMembers: FamilyMember[];
  addFamilyMember: (member: FamilyMember) => void;
  removeFamilyMember: (index: number) => void;
  setFamilyMembers: (members: FamilyMember[]) => void;
  
  // Parents
  parents: Parent[];
  addParent: (parent: Parent) => void;
  removeParent: (index: number) => void;
  setParents: (parents: Parent[]) => void;
  
  // Parental coverage
  parentalCoverage: {
    selected: boolean;
    parentSet: 'parents' | 'parents-in-law' | null;
  };
  setParentalCoverage: (selected: boolean, parentSet?: 'parents' | 'parents-in-law' | null) => void;
  
  // Premiums
  premiums: {
    mainPolicy: number;
    parentalPolicy: number;
    gst: number;
    total: number;
  };
  premiumBreakdown: PremiumBreakdown | null;
  
  // Enrollment management
  enrollments: EnrollmentData[];
  currentEnrollment: EnrollmentData | null;
  setCurrentEnrollment: (enrollment: EnrollmentData | null) => void;
  submitEnrollment: (employeeId: string) => Promise<void>;
  refreshEnrollments: () => Promise<void>;
  
  // Employee management
  markEmployeeEnrolled: (employeeId: string) => void;
  
  // Utility functions
  calculateAge: (dateOfBirth: string) => number;
  resetEnrollmentData: () => void;
}

const EnrollmentContext = createContext<EnrollmentContextType | undefined>(undefined);

export const EnrollmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State variables
  const [currentEmployee, setCurrentEmployeeState] = useState<Employee | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [parentalCoverage, setParentalCoverageState] = useState<{
    selected: boolean;
    parentSet: 'parents' | 'parents-in-law' | null;
  }>({
    selected: false,
    parentSet: null
  });
  const [premiums, setPremiums] = useState({
    mainPolicy: 0,
    parentalPolicy: 0,
    gst: 0,
    total: 0
  });
  const [premiumBreakdown, setPremiumBreakdown] = useState<PremiumBreakdown | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([]);
  const [currentEnrollment, setCurrentEnrollment] = useState<EnrollmentData | null>(null);

  // Initialize Supabase service
  const supabaseService = new SupabaseService();

  // Load enrollments on mount
  useEffect(() => {
    loadEnrollments();
  }, []);

  const loadEnrollments = useCallback(async () => {
    try {
      const supabaseEnrollments = await supabaseService.getAllEnrollments();
      setEnrollments(supabaseEnrollments);
    } catch (error) {
      console.error('Error loading enrollments:', error);
      // Fallback to localStorage
      const savedEnrollments = localStorage.getItem('enrollments');
      if (savedEnrollments) {
        setEnrollments(JSON.parse(savedEnrollments));
      }
    }
  }, []);

  const loadEmployeeEnrollment = useCallback(async (employeeId: string) => {
    try {
      const enrollment = await supabaseService.getEnrollmentByEmployeeId(employeeId);
      if (enrollment) {
        setCurrentEnrollment(enrollment);
        setFamilyMembers(enrollment.familyMembers);
        setParents(enrollment.parentalCoverage.parents);
        setParentalCoverageState({
          selected: enrollment.parentalCoverage.selected,
          parentSet: enrollment.parentalCoverage.parentSet
        });
      }
    } catch (error) {
      console.error('Error loading employee enrollment:', error);
    }
  }, []);

  // Update premium breakdown using joining date and actual policy dates
  const updatePremiumBreakdown = useCallback(() => {
    if (!currentEmployee) {
      setPremiumBreakdown(null);
      return;
    }

    // Use JOINING DATE instead of enrollment date for pro-rata calculation
    const joiningDate = new Date(convertDateFormat(currentEmployee.joining_date));
    const policyStartDate = new Date(convertDateFormat(currentEmployee.policy_start));
    const policyEndDate = new Date(convertDateFormat(currentEmployee.policy_end));
    
    // Pass all three dates to the breakdown calculation
    const breakdown = getPremiumBreakdown(parents.length, joiningDate, policyStartDate, policyEndDate);
    setPremiumBreakdown(breakdown);
  }, [currentEmployee, parents.length]);

  // Update premium breakdown when parents or current employee changes
  useEffect(() => {
    updatePremiumBreakdown();
  }, [updatePremiumBreakdown]);

  // Load existing enrollment for current employee
  useEffect(() => {
    if (currentEmployee?.id) {
      loadEmployeeEnrollment(currentEmployee.id);
    }
  }, [currentEmployee?.id, loadEmployeeEnrollment]);

  // Update premiums when premium breakdown changes
  useEffect(() => {
    if (premiumBreakdown) {
      setPremiums({
        mainPolicy: 0, // Always 0 as company pays
        parentalPolicy: premiumBreakdown.proRatedPremium,
        gst: premiumBreakdown.gst,
        total: premiumBreakdown.total
      });
    } else {
      setPremiums({
        mainPolicy: 0,
        parentalPolicy: 0,
        gst: 0,
        total: 0
      });
    }
  }, [premiumBreakdown]);

  const refreshEnrollments = useCallback(async () => {
    await loadEnrollments();
  }, [loadEnrollments]);

  // Helper function to convert date format consistently
  const convertDateFormat = (dateString: string): string => {
    if (!dateString) return '';
    
    if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    
    return dateString;
  };

  const addFamilyMember = (member: FamilyMember) => {
    console.log('[EnrollmentContext] Adding family member:', member);
    setFamilyMembers(prev => {
      const updated = [...prev, member];
      console.log('[EnrollmentContext] Updated family members:', updated);
      return updated;
    });
  };

  const removeFamilyMember = (index: number) => {
    console.log('[EnrollmentContext] Removing family member at index:', index);
    setFamilyMembers(prev => prev.filter((_, i) => i !== index));
  };

  const addParent = (parent: Parent) => {
    console.log('[EnrollmentContext] Adding parent:', parent);
    setParents(prev => {
      const updated = [...prev, parent];
      console.log('[EnrollmentContext] Updated parents:', updated);
      return updated;
    });
  };

  const removeParent = (index: number) => {
    console.log('[EnrollmentContext] Removing parent at index:', index);
    setParents(prev => prev.filter((_, i) => i !== index));
  };

  const setParentalCoverage = (selected: boolean, parentSet?: 'parents' | 'parents-in-law' | null) => {
    console.log('[EnrollmentContext] Setting parental coverage:', { selected, parentSet });
    setParentalCoverageState({
      selected,
      parentSet: selected ? (parentSet || null) : null
    });
    
    // Clear parents if deselecting parental coverage
    if (!selected) {
      setParents([]);
    }
  };

  const setCurrentEmployee = (employee: Employee | null) => {
    console.log('[EnrollmentContext] Setting currentEmployee:', employee?.name);
    setCurrentEmployeeState(employee);
  };

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const submitEnrollment = async (employeeId: string): Promise<void> => {
    console.log('[EnrollmentContext] Starting enrollment submission for employee:', employeeId);
    if (!currentEmployee) {
      throw new Error('No current employee found');
    }

    try {
      const enrollmentData: EnrollmentData = {
        employeeId,
        familyMembers,
        parentalCoverage: {
          selected: parentalCoverage.selected,
          parentSet: parentalCoverage.parentSet,
          parents
        },
        premiums,
        submittedAt: new Date().toISOString(),
        status: 'pending',
        proRataFactor: premiumBreakdown?.factor || 0,
        enrollmentDate: new Date().toISOString().split('T')[0],
        policyRemainingDays: premiumBreakdown?.remainingDays || 0
      };

      console.log('[EnrollmentContext] Enrollment data prepared:', enrollmentData);

      // Save to Supabase
      console.log('[EnrollmentContext] Saving to Supabase...');
      await supabaseService.saveEnrollment(enrollmentData);
      console.log('[EnrollmentContext] Successfully saved to Supabase');
      
      // Send confirmation email
      console.log('[EnrollmentContext] Sending confirmation email...');
      try {
        await emailService.sendConfirmationEmail({
          employee: currentEmployee,
          familyMembers,
          parents,
          parentalCoverage,
          premiums
        });
        console.log('[EnrollmentContext] Confirmation email sent successfully');
      } catch (emailError) {
        console.error('[EnrollmentContext] Failed to send confirmation email:', emailError);
        // Don't throw error here - enrollment should still succeed even if email fails
      }

      // Update local state
      setEnrollments([...enrollments, enrollmentData]);
      setCurrentEnrollment(enrollmentData);

      // Save to localStorage as backup
      const updatedEnrollments = [...enrollments, enrollmentData];
      localStorage.setItem('enrollments', JSON.stringify(updatedEnrollments));

    } catch (error) {
      console.error('[EnrollmentContext] Error submitting enrollment:', error);
      throw error;
    }
  };

  const markEmployeeEnrolled = (employeeId: string) => {
    if (currentEmployee && currentEmployee.id === employeeId) {
      const updatedEmployee = { ...currentEmployee, enrolled: true };
      setCurrentEmployee(updatedEmployee);
    }
  };

  const resetEnrollmentData = () => {
    console.log('[EnrollmentContext] Resetting enrollment data');
    setFamilyMembers([]);
    setParents([]);
    setParentalCoverageState({
      selected: false,
      parentSet: null
    });
    setPremiums({
      mainPolicy: 0,
      parentalPolicy: 0,
      gst: 0,
      total: 0
    });
    setPremiumBreakdown(null);
    setCurrentEnrollment(null);
  };

  const value: EnrollmentContextType = {
    // Employee data
    currentEmployee,
    setCurrentEmployee,
    
    // Family members
    familyMembers,
    addFamilyMember,
    removeFamilyMember,
    setFamilyMembers,
    
    // Parents
    parents,
    addParent,
    removeParent,
    setParents,
    
    // Parental coverage
    parentalCoverage,
    setParentalCoverage,
    
    // Premiums
    premiums,
    premiumBreakdown,
    
    // Enrollment management
    enrollments,
    currentEnrollment,
    setCurrentEnrollment,
    submitEnrollment,
    refreshEnrollments,
    
    // Employee management
    markEmployeeEnrolled,
    
    // Utility functions
    calculateAge,
    resetEnrollmentData
  };

  return (
    <EnrollmentContext.Provider value={value}>
      {children}
    </EnrollmentContext.Provider>
  );
};

export const useEnrollment = () => {
  const context = useContext(EnrollmentContext);
  if (context === undefined) {
    throw new Error('useEnrollment must be used within an EnrollmentProvider');
  }
  return context;
};