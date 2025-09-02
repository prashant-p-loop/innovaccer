import React, { useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { useEnrollment } from '../contexts/EnrollmentContext';
import { CheckCircle, Download, Mail, FileText, XCircle } from 'lucide-react';
import { calculateAge, formatDateWithMonthName } from '../utils/dateUtils';

interface SuccessProps {
  onBackToLogin: () => void;
}

const Success: React.FC<SuccessProps> = ({ onBackToLogin }) => {
  const { currentEmployee, setCurrentEmployee } = useUser();
  const { familyMembers, parents, parentalCoverage, premiums } = useEnrollment();

  // Silently clear session after 30 seconds to give user time to read and download
  useEffect(() => {
    const timer = setTimeout(() => {
      // Clear the current employee session silently
      setCurrentEmployee(null);
      localStorage.removeItem('currentEmployee');
    }, 60000); // 1 minute (60 seconds)

    return () => clearTimeout(timer);
  }, [setCurrentEmployee]);

  // Prevent back navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Push the current state again to prevent going back
      window.history.pushState(null, '', window.location.href);
    };

    // Push initial state
    window.history.pushState(null, '', window.location.href);
    
    // Listen for back button
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleDownloadSummary = () => {
    // Create enrollment summary content
    const summaryContent = generateEnrollmentSummary();
    
    // Create and download PDF-like content as HTML
    const blob = new Blob([summaryContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enrollment-summary-${currentEmployee?.emp_id || 'employee'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handlePrintSummary = () => {
    window.print();
  };

  const generateEnrollmentSummary = () => {
    const currentDate = new Date().toLocaleDateString('en-GB');
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Health Insurance Enrollment Summary</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #025F4C; padding-bottom: 20px; }
        .logo { color: #025F4C; font-size: 24px; font-weight: bold; }
        .section { margin-bottom: 25px; }
        .section-title { background-color: #025F4C; color: white; padding: 10px; margin-bottom: 15px; font-weight: bold; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0; border-bottom: 1px dotted #ccc; }
        .label { font-weight: bold; }
        .value { color: #333; }
        .total-row { background-color: #f0f9ff; padding: 10px; margin-top: 15px; font-weight: bold; font-size: 18px; }
        .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
        @media print { body { margin: 20px; } }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">Innovaccer Inc.</div>
        <h2>Health Insurance Enrollment Summary</h2>
        <p>Generated on: ${currentDate}</p>
    </div>

    <div class="section">
        <div class="section-title">Employee Information</div>
        <div class="info-row">
            <span class="label">Name:</span>
            <span class="value">${currentEmployee?.name || 'N/A'}</span>
        </div>
        <div class="info-row">
            <span class="label">Employee ID:</span>
            <span class="value">${currentEmployee?.emp_id || 'N/A'}</span>
        </div>
        <div class="info-row">
            <span class="label">Email:</span>
            <span class="value">${currentEmployee?.email || 'N/A'}</span>
        </div>
        <div class="info-row">
            <span class="label">Department:</span>
            <span class="value">${currentEmployee?.department || 'N/A'}</span>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Base Group Medical Coverage</div>
        <div class="info-row">
            <span class="label">Sum Insured:</span>
            <span class="value">₹10 Lakhs (Family Floater)</span>
        </div>
        <div class="info-row">
            <span class="label">Premium:</span>
            <span class="value">₹0 (Company Paid)</span>
        </div>
        <div class="info-row">
            <span class="label">Covered Members:</span>
            <span class="value">
                ${currentEmployee?.name || 'Self'} (Self)${familyMembers.length > 0 ? familyMembers.map(m => `, ${m.name} (${m.relationship}, ${m.gender}, Age: ${calculateAge(m.date_of_birth)})`).join('') : ''}
            </span>
        </div>
    </div>

    ${parentalCoverage.selected && parents.length > 0 ? `
    <div class="section">
        <div class="section-title">Parental Group Medical Coverage</div>
        <div class="info-row">
            <span class="label">Sum Insured:</span>
            <span class="value">₹10 Lakhs (Separate Policy)</span>
        </div>
        <div class="info-row">
            <span class="label">Coverage Type:</span>
            <span class="value">${parentalCoverage.parentSet === 'parents' ? 'Parents' : 'Parents-in-law'}</span>
        </div>
        <div class="info-row">
            <span class="label">Covered Parents:</span>
            <span class="value">${parents.map(p => `${p.name} (${p.relationship}, ${p.gender}, Age: ${calculateAge(p.date_of_birth)})`).join(', ')}</span>
        </div>
        <div class="info-row">
            <span class="label">Annual Premium:</span>
            <span class="value">₹${Math.round(premiums.total).toLocaleString()}</span>
        </div>
    </div>
    ` : ''}

    <div class="section">
        <div class="section-title">Premium Summary</div>
        <div class="info-row">
            <span class="label">Base Group Medical Coverage:</span>
            <span class="value">₹0 (Company Paid)</span>
        </div>
        <div class="info-row">
            <span class="label">Parental Group Medical Coverage:</span>
            <span class="value">₹${Math.round(premiums.total).toLocaleString()}</span>
        </div>
        <div class="total-row">
            <div class="info-row" style="border: none; margin: 0;">
                <span>Total Annual Premium:</span>
                <span>₹${Math.round(premiums.total).toLocaleString()}</span>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Policy Information</div>
        <div class="info-row">
            <span class="label">Policy Period:</span>
            <span class="value">${currentEmployee?.policy_start || ''} to ${currentEmployee?.policy_end || ''}</span>
        </div>
        <div class="info-row">
            <span class="label">Enrollment Date:</span>
            <span class="value">${currentDate}</span>
        </div>
        <div class="info-row">
            <span class="label">Status:</span>
            <span class="value">Successfully Submitted</span>
        </div>
    </div>

    <div class="footer">
        <p>This is a computer-generated document. No signature is required.</p>
        <p>For any queries, please contact HR department.</p>
    </div>
</body>
</html>`;
  };

  if (!currentEmployee) {
    return (
      <div className="max-w-4xl mx-auto fade-in">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 mx-auto rounded-full flex items-center justify-center mb-6">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-red-600 mb-2">Session Expired</h1>
          <p className="text-gray-600 mb-6">
            Your session has expired for security reasons. Please login again to access the portal.
          </p>
          <button
            onClick={onBackToLogin}
            className="btn-primary"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto fade-in">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 mx-auto rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-green-600 mb-2">Enrollment Successful!</h1>
        <p className="text-gray-600">
          Your insurance enrollment has been successfully submitted. You will receive a confirmation email shortly.
        </p>
      </div>

      {/* Success Actions */}
      <div className="flex justify-center space-x-4 mb-8">
        <button
          onClick={handleDownloadSummary}
          className="btn-primary flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Download Summary</span>
        </button>
        
        <button
          onClick={handlePrintSummary}
          className="btn-secondary flex items-center space-x-2"
        >
          <FileText className="h-4 w-4" />
          <span>Print Summary</span>
        </button>
      </div>

      {/* Enrollment Summary */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium">Your Enrollment Summary</h3>
        </div>
        
        <div className="card-body">
          <div className="enrollment-summary">
            {/* Employee Information */}
            <div className="summary-section">
              <h4 className="summary-title">Employee Information</h4>
              <div className="summary-item">
                <span className="summary-label">Name:</span>
                <span className="summary-value">{currentEmployee.name}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Employee ID:</span>
                <span className="summary-value">{currentEmployee.emp_id}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Email:</span>
                <span className="summary-value">{currentEmployee.email}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Department:</span>
                <span className="summary-value">{currentEmployee.department || 'N/A'}</span>
              </div>
            </div>
            
            {/* Base Group Medical Coverage */}
            <div className="summary-section">
              <h4 className="summary-title">Base Group Medical Coverage</h4>
              <div className="summary-item">
                <span className="summary-label">Sum Insured:</span>
                <span className="summary-value">₹10 Lakhs</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Premium:</span>
                <span className="summary-value">₹0 (Company Paid)</span>
              </div>
              <div className="mt-3">
                <h5 className="font-medium text-gray-800 mb-2">Covered Members:</h5>
                <div className="space-y-1 text-sm">
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="font-medium">{currentEmployee.name} (Self)</div>
                    <div className="text-xs text-gray-600 mt-1">
                      DOB: {formatDateWithMonthName(currentEmployee.date_of_birth)} | 
                      Gender: {currentEmployee.gender} | 
                      Age: {calculateAge(currentEmployee.date_of_birth)} years
                    </div>
                  </div>
                  {familyMembers.map((member, index) => (
                    <div key={index} className="bg-gray-50 p-2 rounded">
                      <div className="font-medium">{member.name} ({member.relationship})</div>
                      <div className="text-xs text-gray-600 mt-1">
                        DOB: {formatDateWithMonthName(member.date_of_birth)} | 
                        Gender: {member.gender} | 
                        Age: {calculateAge(member.date_of_birth)} years
                      </div>
                    </div>
                  ))}
                  {familyMembers.length === 0 && (
                    <div className="text-gray-500 italic">No family members added</div>
                  )}
                </div>
              </div>
            </div>

            {/* Parental Group Medical Coverage */}
            {parentalCoverage.selected && parents.length > 0 && (
              <div className="summary-section">
                <h4 className="summary-title">Parental Group Medical Coverage</h4>
                <div className="summary-item">
                  <span className="summary-label">Sum Insured:</span>
                  <span className="summary-value">₹10 Lakhs</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Annual Premium:</span>
                  <span className="summary-value">₹{Math.round(premiums.total).toLocaleString()}</span>
                </div>
                <div className="mt-3">
                  <h5 className="font-medium text-gray-800 mb-2">Covered Parents:</h5>
                  <div className="space-y-1 text-sm">
                    {parents.map((parent, index) => (
                      <div key={index} className="bg-gray-50 p-2 rounded">
                        <div className="font-medium">{parent.name} ({parent.relationship})</div>
                        <div className="text-xs text-gray-600 mt-1">
                          DOB: {formatDateWithMonthName(parent.date_of_birth)} | 
                          Gender: {parent.gender} | 
                          Age: {calculateAge(parent.date_of_birth)} years
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Total Premium */}
            <div className="summary-section">
              <h4 className="summary-title">Total Premium</h4>
              <div className="summary-item pt-2 border-t border-gray-200 mt-2">
                <span className="summary-label font-bold">Annual Premium:</span>
                <span className="summary-value font-bold primary-text">
                  ₹{Math.round(premiums.total).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Print Styles */}
      <style>{`
        @media print {
          .btn-primary, .btn-secondary {
            display: none !important;
          }
          .card {
            break-inside: avoid;
            box-shadow: none;
            border: 1px solid #ccc;
          }
          .card-header {
            background: #025F4C !important;
            color: white !important;
            -webkit-print-color-adjust: exact;
          }
          .card-header-blue {
            background: #3b82f6 !important;
            color: white !important;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default Success;