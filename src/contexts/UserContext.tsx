// src/contexts/UserContext.tsx - Fixed loading state management
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Employee } from '../types';
import { supabase } from '../lib/supabase';

interface UserContextType {
  currentEmployee: Employee | null;
  setCurrentEmployee: (employee: Employee | null) => void;
  isLoading: boolean;
  refreshEmployeeData: () => Promise<void>;
  loginEmployee: (email: string, empId: string) => Promise<Employee | null>;
  markEmployeeEnrolled: (id: string) => Promise<void>;
  bulkUploadEmployees: (employees: Omit<Employee, 'id'>[]) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Convert database snake_case to frontend camelCase
  const convertEmployeeFromDB = (dbEmployee: any): Employee => {
    return {
      id: dbEmployee.id,
      emp_id: dbEmployee.emp_id,
      name: dbEmployee.name,
      email: dbEmployee.email,
      date_of_birth: convertDateFromDB(dbEmployee.date_of_birth),
      gender: dbEmployee.gender,
      mobile: dbEmployee.mobile,
      joining_date: convertDateFromDB(dbEmployee.joining_date),
      policy_start: convertDateFromDB(dbEmployee.policy_start),
      policy_end: convertDateFromDB(dbEmployee.policy_end),
      department: dbEmployee.department,
      designation: dbEmployee.designation,
      salary: dbEmployee.salary,
      enrolled: dbEmployee.enrolled,
      enrollment_date: dbEmployee.enrollment_date ? convertDateFromDB(dbEmployee.enrollment_date) : undefined,
      enrollmentStatus: dbEmployee.enrollment_status || 'pending',
      enrollmentDueDate: convertDateFromDB(dbEmployee.enrollment_due_date),
      role: dbEmployee.role || 'employee'
    };
  };

  // Convert YYYY-MM-DD to DD/MM/YYYY for frontend
  const convertDateFromDB = (dateString: string): string => {
    if (!dateString) return '';
    if (dateString.includes('-')) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    return dateString;
  };

	// Convert any date format to YYYY-MM-DD for database
	const convertDateToDB = (dateString: string): string => {
	  if (!dateString || dateString.trim() === '') return '';
  
	  const trimmed = dateString.trim();
  
	  // If already in YYYY-MM-DD format, validate and return
	  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
	    const date = new Date(trimmed);
	    if (!isNaN(date.getTime())) {
	      return trimmed;
	    }
	  }
  
	  // Handle DD/MM/YYYY format (legacy)
	  if (trimmed.includes('/')) {
	    const [day, month, year] = trimmed.split('/');
	    if (day && month && year) {
	      const convertedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
	      const date = new Date(convertedDate);
	      if (!isNaN(date.getTime())) {
	        return convertedDate;
	      }
	    }
	  }
  
	  // If all else fails, return empty string
	  console.warn(`Unable to parse date: ${dateString}`);
	  return '';
	};

  // Initialize data from localStorage
  const initializeData = async () => {
    console.log('[UserContext] Starting initialization...');
    setIsLoading(true);
    try {
      const stored = localStorage.getItem('currentEmployee');
      if (stored) {
        try {
          const employee = JSON.parse(stored);
          console.log('[UserContext] Loaded employee from localStorage:', employee);
          setCurrentEmployee(employee);
        } catch (parseError) {
          console.error('[UserContext] Error parsing stored employee:', parseError);
          localStorage.removeItem('currentEmployee');
          setCurrentEmployee(null);
        }
      } else {
        console.log('[UserContext] No employee in localStorage');
        setCurrentEmployee(null);
      }
    } catch (err) {
      console.error('[UserContext] Error in initializeData:', err);
      setCurrentEmployee(null);
    } finally {
      // CRITICAL: Always set loading to false
      console.log('[UserContext] Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const getEmployeeByEmpId = async (empId: string): Promise<Employee | null> => {
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

      return data ? convertEmployeeFromDB(data) : null;
    } catch (error) {
      console.error('Error fetching employee:', error);
      return null;
    }
  };

  const getEmployeeByCredentials = async (email: string, empId: string): Promise<Employee | null> => {
    try {
      console.log('Attempting login with:', { email, empId });
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('email', email)
        .eq('emp_id', empId)
        .single();

      if (error) {
        console.log('Supabase error:', error);
        if (error.code === 'PGRST116') {
          return null; // No matching employee found
        }
        throw error;
      }

      console.log('Found employee:', data);
      return data ? convertEmployeeFromDB(data) : null;
    } catch (error) {
      console.error('Error fetching employee by credentials:', error);
      return null;
    }
  };

  const loginEmployee = async (email: string, empId: string): Promise<Employee | null> => {
    try {
      console.log('Login attempt for:', email, empId);
      
      const employee = await getEmployeeByCredentials(email, empId);
      
      if (employee) {
        console.log('Employee found:', employee);
        
        // Allow admin users to login regardless of enrollment status
        if (employee.role === 'admin') {
          setCurrentEmployee(employee);
          localStorage.setItem('currentEmployee', JSON.stringify(employee));
          return employee;
        }
        
        // For regular employees, check enrollment restrictions
        if (employee.enrollmentStatus === 'submitted') {
          throw new Error('Enrollment already submitted. You cannot make changes.');
        }
        
        // Check if due date has passed for regular employees
        const dueDate = new Date(convertDateToDB(employee.enrollmentDueDate || '31/03/2025'));
        const currentDate = new Date();
        if (currentDate > dueDate) {
          throw new Error('Enrollment period has ended. Login not allowed.');
        }
        
        setCurrentEmployee(employee);
        localStorage.setItem('currentEmployee', JSON.stringify(employee));
        return employee;
      }
      
      console.log('No employee found with those credentials');
      return null;
    } catch (error) {
      console.error('Error in loginEmployee:', error);
      throw error;
    }
  };

  const refreshEmployeeData = async () => {
    if (currentEmployee) {
      try {
        const updatedEmployee = await getEmployeeByEmpId(currentEmployee.emp_id);
        if (updatedEmployee) {
          setCurrentEmployee(updatedEmployee);
          localStorage.setItem('currentEmployee', JSON.stringify(updatedEmployee));
        }
      } catch (error) {
        console.error('Error refreshing employee data:', error);
      }
    }
  };

  const markEmployeeEnrolled = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({
          enrolled: true,
          enrollment_status: 'submitted',
          enrollment_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', id);

      if (error) throw error;

      // Refresh current employee data
      await refreshEmployeeData();
    } catch (error) {
      console.error('Error marking employee as enrolled:', error);
      throw error;
    }
  };
  
  const bulkUploadEmployees = async (employees: Omit<Employee, 'id'>[]): Promise<void> => {
    try {
      const dbEmployees = employees.map(emp => ({
        emp_id: emp.emp_id,
        name: emp.name,
        email: emp.email,
        date_of_birth: convertDateToDB(emp.date_of_birth),
        gender: emp.gender,
        mobile: emp.mobile,
        joining_date: convertDateToDB(emp.joining_date),
        policy_start: convertDateToDB(emp.policy_start),
        policy_end: convertDateToDB(emp.policy_end),
        department: emp.department,
        designation: emp.designation || '',
        salary: emp.salary || 0,
        enrolled: false,
        enrollment_status: 'pending',
        enrollment_due_date: convertDateToDB(emp.enrollmentDueDate || '31/03/2025'),
        role: emp.role || 'employee'
      }));
    
      const { error } = await supabase
        .from('employees')
        .insert(dbEmployees);

      if (error) throw error;
    } catch (error) {
      console.error('Error in bulk upload:', error);
      throw error;
    }
  };

  // Initialize on mount
  useEffect(() => {
    console.log('[UserContext] useEffect triggered');
    initializeData();
  }, []);

  const value = {
    currentEmployee,
    setCurrentEmployee: (employee: Employee | null, skipStorage = false) => {
      console.log('[UserContext] Setting currentEmployee:', employee?.name);
      setCurrentEmployee(employee);
      if (employee && !skipStorage) {
        localStorage.setItem('currentEmployee', JSON.stringify(employee));
      } else if (!skipStorage) {
        localStorage.removeItem('currentEmployee');
      }
    },
    isLoading,
    refreshEmployeeData,
    loginEmployee,
    markEmployeeEnrolled,
	bulkUploadEmployees
  };

  console.log('[UserContext] Rendering with isLoading:', isLoading, 'currentEmployee:', currentEmployee?.name);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};