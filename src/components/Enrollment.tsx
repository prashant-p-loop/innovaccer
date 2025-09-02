// src/components/Enrollment.tsx - Fixed employee context handling
import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { TestTube2 } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useEnrollment } from '../contexts/EnrollmentContext';
import { getPolicyYear } from '../utils/premiumUtils';
import InnovaccerLogo from './InnovaccerLogo';
import CoverageInformation from './CoverageInformation';
import PersonalDetails from './PersonalDetails';
import FamilyMemberSection from './FamilyMemberSection';
import ParentalCoverageSection from './ParentalCoverageSection';
import PremiumSummary from './PremiumSummary';
import ConfirmationModal from './ConfirmationModal';

interface EnrollmentProps {
  onSuccess: () => void;
  isTestMode?: boolean;
}

const Enrollment: React.FC<EnrollmentProps> = ({ onSuccess, isTestMode = false }) => {
  // Get currentEmployee from UserContext
  const { currentEmployee } = useUser();
  
  const { 
    submitEnrollment, 
    markEmployeeEnrolled,
    resetEnrollmentData,
    parentalCoverage,
    parents,
    familyMembers,
    premiums,
    setCurrentEmployee
  } = useEnrollment();
  
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [employeeSet, setEmployeeSet] = useState(false);

  // Set current employee in enrollment context only once
  useEffect(() => {
    if (currentEmployee && !employeeSet) {
      console.log('[Enrollment] Setting employee in enrollment context:', currentEmployee);
      setCurrentEmployee(currentEmployee);
      setEmployeeSet(true);
    }
  }, [currentEmployee, setCurrentEmployee, employeeSet]);

  // Reset enrollment data only once when component mounts
  useEffect(() => {
    console.log('[Enrollment] Component mounted, currentEmployee:', currentEmployee?.name);
    if (!employeeSet) {
      resetEnrollmentData();
    }
  }, []); // Empty dependency array - only run once on mount

  // If no current employee, redirect to login
  if (!currentEmployee) {
    console.log('[Enrollment] No current employee found, should redirect to login');
    return <Navigate to="/login" replace />;
  }

  // FIXED: Convert date format helper
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

  // FIXED: Get policy year from actual employee data
  const getPolicyYearFromEmployee = (): string => {
    if (!currentEmployee) return '';
    
    const policyStart = new Date(convertDateFormat(currentEmployee.policy_start));
    const policyEnd = new Date(convertDateFormat(currentEmployee.policy_end));
    
    return getPolicyYear(policyStart, policyEnd);
  };

  // Validation function
  const validateEnrollment = (): string[] => {
    const errors: string[] = [];

    // Validate family members
    familyMembers.forEach((member, index) => {
      if (!member.name.trim()) {
        errors.push(`Family member ${index + 1}: Name is required`);
      }
      if (!member.date_of_birth) {
        errors.push(`Family member ${index + 1}: Date of birth is required`);
      }
      if (!member.relationship) {
        errors.push(`Family member ${index + 1}: Relationship is required`);
      }
    });

    // Validate spouse count (max 1)
    const spouseCount = familyMembers.filter(member => member.relationship === 'Spouse').length;
    if (spouseCount > 1) {
      errors.push('Only one spouse can be added');
    }

    // Validate children count (max 2)
    const childrenCount = familyMembers.filter(member => member.relationship === 'Child').length;
    if (childrenCount > 2) {
      errors.push('Maximum 2 children can be added');
    }

    // Validate parental coverage
    if (parentalCoverage.selected) {
      if (!parentalCoverage.parentSet) {
        errors.push('Please select which parents to cover (Parents or Parents-in-law)');
      }
      
      if (parents.length === 0) {
        errors.push('Please add at least one parent for parental coverage');
      }

      if (parents.length > 2) {
        errors.push('Maximum 2 parents can be added');
      }

      // Validate parent details
      parents.forEach((parent, index) => {
        if (!parent.name.trim()) {
          errors.push(`Parent ${index + 1}: Name is required`);
        }
        if (!parent.date_of_birth) {
          errors.push(`Parent ${index + 1}: Date of birth is required`);
        }
        if (!parent.relationship) {
          errors.push(`Parent ${index + 1}: Relationship is required`);
        }
      });

      // Validate parent relationships match selected set
      if (parentalCoverage.parentSet === 'parents') {
        const invalidParents = parents.filter(p => 
          !['Father', 'Mother'].includes(p.relationship)
        );
        if (invalidParents.length > 0) {
          errors.push('For "Parents" coverage, only Father and Mother relationships are allowed');
        }
      } else if (parentalCoverage.parentSet === 'parents-in-law') {
        const invalidParents = parents.filter(p => 
          !['Father-in-law', 'Mother-in-law'].includes(p.relationship)
        );
        if (invalidParents.length > 0) {
          errors.push('For "Parents-in-law" coverage, only Father-in-law and Mother-in-law relationships are allowed');
        }
      }
    }

    return errors;
  };

  const handleSubmit = async () => {
    if (!currentEmployee) {
      alert('Employee information not found. Please login again.');
      return;
    }

    // Validate enrollment data
    const errors = validateEnrollment();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    setShowConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    console.log('[Enrollment] Starting enrollment submission...');
    if (!currentEmployee) return;

    setSubmitting(true);
    try {
      console.log('[Enrollment] Submitting enrollment for employee ID:', currentEmployee.id);
      await submitEnrollment(currentEmployee.id);
      console.log('[Enrollment] Enrollment submitted successfully');
      markEmployeeEnrolled(currentEmployee.id);
      setShowConfirmation(false);
      onSuccess();
    } catch (error) {
      console.error('[Enrollment] Enrollment submission failed:', error);
      alert(`Failed to submit enrollment: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  // FIXED: Format date for display
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Calculate enrollment deadline warning
  const getEnrollmentWarning = (): { show: boolean; daysLeft: number; urgent: boolean } => {
    if (!currentEmployee?.enrollmentDueDate) {
      return { show: false, daysLeft: 0, urgent: false };
    }

    const dueDate = new Date(convertDateFormat(currentEmployee.enrollmentDueDate));
    const today = new Date();
    const timeDiff = dueDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return {
      show: daysLeft >= 0,
      daysLeft,
      urgent: daysLeft <= 7
    };
  };

  const enrollmentWarning = getEnrollmentWarning();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8 fade-in">
        {/* Header with Innovaccer Logo */}
        <div className="text-center mb-8">
          {/* Innovaccer Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src="https://cdn.brandfetch.io/idMbRL3_se/w/800/h/135/theme/dark/logo.png?c=1bxid64Mup7aczewSAYMX&t=1668070663872"
              alt="Innovaccer Logo"
              className="h-16 w-auto"
              onError={(e) => {
                // Fallback if logo fails to load
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'block';
              }}
            />
            {/* Fallback to InnovaccerLogo component */}
            <div className="hidden">
              <InnovaccerLogo size="lg" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold primary-text mb-2">Health Insurance Enrollment</h1>
          <p className="text-gray-600 mb-4">
            Complete your health insurance enrollment for policy year {getPolicyYearFromEmployee()}
          </p>
          
          {/* Enrollment Warning */}
          {enrollmentWarning.show && (
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-4 ${
              enrollmentWarning.urgent 
                ? 'bg-red-100 text-red-800 border border-red-200' 
                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
            }`}>
              <TestTube2 className="h-4 w-4 mr-2" />
              {enrollmentWarning.daysLeft === 0 
                ? 'Enrollment due today!' 
                : `${enrollmentWarning.daysLeft} day${enrollmentWarning.daysLeft > 1 ? 's' : ''} left to enroll`
              }
            </div>
          )}
          
          {isTestMode && (
            <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              <TestTube2 className="h-4 w-4 mr-1" />
              Demo Mode
            </div>
          )}
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium mb-2">Please fix the following errors:</h3>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-red-700 text-sm">{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Enrollment Sections */}
        <div className="space-y-6">
          <CoverageInformation />
          <PersonalDetails employee={currentEmployee} />
          <FamilyMemberSection />
          <ParentalCoverageSection />
          <PremiumSummary />
        </div>

        {/* Submit Button */}
        <div className="flex justify-center mt-8 mb-10">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`btn-primary py-3 px-8 text-base font-medium ${
              submitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {submitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </div>
            ) : (
              'Submit Enrollment'
            )}
          </button>
        </div>

        {/* Summary Information */}
        <div className="text-center text-sm text-gray-600 space-y-2">
          <p>
            <strong>Policy Period:</strong> {formatDate(convertDateFormat(currentEmployee.policy_start))} to {formatDate(convertDateFormat(currentEmployee.policy_end))}
          </p>
          <p>
            <strong>Coverage Start:</strong> {formatDate(convertDateFormat(currentEmployee.joining_date))} (From your joining date)
          </p>
          {premiums.total > 0 && (
            <p>
              <strong>Monthly Deduction:</strong> ₹{Math.round(premiums.total / 12).toLocaleString()}
            </p>
          )}
        </div>

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          onConfirm={handleConfirmSubmit}
        />
      </div>
    </div>
  );
};

export default Enrollment;