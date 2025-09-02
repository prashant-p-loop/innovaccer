import React from 'react';
import { useUser } from '../contexts/UserContext';
import { useEnrollment } from '../contexts/EnrollmentContext';
import { X, AlertCircle } from 'lucide-react';
import { calculateAge, formatDateWithMonthName } from '../utils/dateUtils';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const { currentEmployee } = useUser();
  const { familyMembers, parents, parentalCoverage, premiums } = useEnrollment();

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop active" onClick={handleBackdropClick}>
      <div className="modal-container">
        <div className="modal-header">
          <h3 className="modal-title">Confirm Enrollment</h3>
          <button onClick={onClose} className="modal-close">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="mb-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-800">Review Your Enrollment</p>
              <p className="text-sm text-gray-600">
                Please review your insurance enrollment details before submitting
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Base Group Medical Coverage Confirmation */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="font-medium text-green-700 mb-3">Base Group Medical Coverage (₹10 Lakhs):</div>
              
              {/* Employee Details */}
              <div className="space-y-3 text-sm">
                <div className="bg-white p-3 rounded border border-green-100">
                  <div className="font-medium text-green-800">{currentEmployee?.name} (Self)</div>
                  <div className="text-green-600 text-xs mt-1 space-y-1">
                    <div>DOB: {formatDateWithMonthName(currentEmployee?.date_of_birth || '')}</div>
                    <div>Gender: {currentEmployee?.gender}</div>
                    <div>Age: {calculateAge(currentEmployee?.date_of_birth || '')} years</div>
                  </div>
                </div>
                
                {/* Family Members Details */}
                {familyMembers.map((member, index) => (
                  <div key={index} className="bg-white p-3 rounded border border-green-100">
                    <div className="font-medium text-green-800">{member.name} ({member.relationship})</div>
                    <div className="text-green-600 text-xs mt-1 space-y-1">
                      <div>DOB: {formatDateWithMonthName(member.date_of_birth)}</div>
                      <div>Gender: {member.gender}</div>
                      <div>Age: {calculateAge(member.date_of_birth)} years</div>
                    </div>
                  </div>
                ))}
                
                {familyMembers.length === 0 && (
                  <div className="text-green-600 italic text-xs">No family members added</div>
                )}
              </div>
              
              <div className="text-sm font-medium text-green-600 mt-3 pt-2 border-t border-green-200">
                Premium: ₹0 (Company Paid)
              </div>
            </div>
            
            {/* Parental Policy Confirmation */}
            {parentalCoverage.selected && parents.length > 0 && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="font-medium text-purple-700 mb-3">Parental Group Medical Coverage (₹10 Lakhs):</div>
                
                {/* Parents Details */}
                <div className="space-y-3 text-sm">
                  {parents.map((parent, index) => (
                    <div key={index} className="bg-white p-3 rounded border border-purple-100">
                      <div className="font-medium text-purple-800">{parent.name} ({parent.relationship})</div>
                      <div className="text-purple-600 text-xs mt-1 space-y-1">
                        <div>DOB: {formatDateWithMonthName(parent.date_of_birth)}</div>
                        <div>Gender: {parent.gender}</div>
                        <div>Age: {calculateAge(parent.date_of_birth)} years</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="text-sm mt-3 pt-2 border-t border-purple-200 space-y-1">
                  <div className="flex justify-between">
                    <span>Base Premium:</span>
                    <span>₹{premiums.parentalPolicy.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (18%):</span>
                    <span>₹{Math.round(premiums.gst).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Total Premium:</span>
                    <span>₹{Math.round(premiums.total).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Total Premium */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between font-semibold">
                <span className="text-gray-800">Total Annual Premium:</span>
                <span className="primary-text">₹{Math.round(premiums.total).toLocaleString()}</span>
              </div>
              {premiums.total > 0 && (
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>Monthly Deduction:</span>
                  <span>₹{Math.round(premiums.total / 12).toLocaleString()}</span>
                </div>
              )}
            </div>
            
            {/* Important Notice */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium">Important:</p>
              <p className="text-sm text-yellow-700 mt-1">
                Once submitted, you cannot modify your enrollment. Please ensure all details are correct.
              </p>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Back to Edit
          </button>
          <button onClick={onConfirm} className="btn-primary">
            Confirm & Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;