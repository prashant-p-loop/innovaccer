// src/components/CoverageInformation.tsx - FIXED VERSION
import React from 'react';
import { Shield, Heart, Users, AlertCircle } from 'lucide-react';
import { useEnrollment } from '../contexts/EnrollmentContext';
import { getPolicyYear } from '../utils/premiumUtils';

const CoverageInformation: React.FC = () => {
  const { currentEmployee } = useEnrollment();

  // Convert date format helper
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

  // Format date for display
  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return '';
    
    if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${parts[0]} ${months[parseInt(parts[1]) - 1]}, ${parts[2]}`;
      }
    }
    
    if (dateString.includes('-')) {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${parts[2]} ${months[parseInt(parts[1]) - 1]}, ${parts[0]}`;
      }
    }
    
    return dateString;
  };

  // Get policy year from actual dates
  const getPolicyYearFromEmployee = (): string => {
    if (!currentEmployee) return '';
    
    const policyStart = new Date(convertDateFormat(currentEmployee.policy_start));
    const policyEnd = new Date(convertDateFormat(currentEmployee.policy_end));
    
    return getPolicyYear(policyStart, policyEnd);
  };

  return (
    <div className="card mb-8">
      <div className="card-header-blue">
        <h3 className="text-lg font-medium flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Coverage Information
        </h3>
      </div>
      
      <div className="card-body">
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Main Policy */}
          <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-3 flex items-center">
              <Heart className="h-5 w-5 mr-2" />
              Base Group Medical Coverage
            </h4>
            <div className="space-y-2 text-sm">
              <p className="text-green-700">
                <strong>Coverage:</strong> Self + Spouse + Up to 2 Children
              </p>
              <p className="text-green-700">
                <strong>Sum Insured:</strong> ₹10 Lakhs (Family Floater)
              </p>
              <p className="text-green-700 font-medium">
                <strong>Premium:</strong> Fully covered by company (₹0 for you)
              </p>
            </div>
          </div>
          
          {/* Parental Policy */}
          <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Voluntary Parental Group Medical Coverage
            </h4>
            <div className="space-y-2 text-sm">
              <p className="text-purple-700">
                <strong>Coverage:</strong> Parents OR Parents-in-law (One set only)
              </p>
              <p className="text-purple-700">
                <strong>Sum Insured:</strong> ₹10 Lakhs (Separate Policy)
              </p>
              <p className="text-purple-700">
                <strong>Premium:</strong> ₹36,203 (1 parent) / ₹72,407 (2 parents) + GST
              </p>
            </div>
          </div>
        </div>
        
        {/* FIXED: Dynamic Enrollment Due Date Alert using employee data */}
        {currentEmployee?.enrollmentDueDate && (
          <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded mb-6 pulse-warning">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Enrollment Due Date: {formatDisplayDate(currentEmployee.enrollmentDueDate)}
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Please complete your enrollment before this date. After the due date, enrollment will be closed.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* FIXED: Dynamic Policy Year Display */}
        {currentEmployee && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded mb-6">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Policy Year: {getPolicyYearFromEmployee()}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Coverage Period: {formatDisplayDate(currentEmployee.policy_start)} to {formatDisplayDate(currentEmployee.policy_end)}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Important Information */}
        <div className="pt-5 border-t border-gray-200">
          <h4 className="font-semibold mb-3 text-base">Important Information:</h4>
          <ul className="text-sm list-disc pl-5 space-y-2 text-gray-700">
            <li>Base group medical coverage covers you, your spouse, and up to 2 children at no cost to you.</li>
            <li>Parental coverage is optional and requires premium payment.</li>
            <li>You can choose to cover either your parents OR your parents-in-law, but not both sets.</li>
            <li>Parental coverage is a separate policy with its own sum insured of ₹10 Lakhs.</li>
            <li>Premium for parental coverage will be deducted from your salary if selected.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CoverageInformation;