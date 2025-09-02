import React, { useState } from 'react';
import { useEnrollment } from '../contexts/EnrollmentContext';
import { useUser } from '../contexts/UserContext';
import { Plus, Users, Trash2 } from 'lucide-react';
import FamilyMemberModal from './FamilyMemberModal';
import { calculateAge, formatDateWithMonthName } from '../utils/dateUtils';

const FamilyMemberSection: React.FC = () => {
  const { currentEmployee } = useUser();
  const { familyMembers, removeFamilyMember } = useEnrollment();
  const [showModal, setShowModal] = useState(false);

  const handleRemoveMember = (index: number) => {
    if (confirm('Are you sure you want to remove this family member?')) {
      console.log('[FamilyMemberSection] Removing family member at index:', index);
      removeFamilyMember(index);
    }
  };

  return (
    <div className="card mb-8">
      <div className="card-header">
        <h3 className="text-lg font-medium flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Base Group Medical Coverage - Family Members
        </h3>
      </div>
      
      <div className="card-body">
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            <strong>Free Coverage:</strong> Add your spouse and up to 2 children below. 
            This coverage is provided at no cost to you.
          </p>
        </div>
        
        {/* Display Added Family Members */}
        <div className="mb-6">
          {familyMembers.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 italic">
                No family members added yet. Click "Add Family Member" below to include spouse/children in your coverage.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {familyMembers.map((member, index) => (
                <div key={index} className="dependent-display-card">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="font-medium text-gray-800 text-lg">{member.name}</h4>
                        <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {member.relationship}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Gender:</span> {member.gender}
                        </div>
                        <div>
                          <span className="font-medium">Date of Birth:</span> {formatDateWithMonthName(member.date_of_birth)}
                        </div>
                        <div>
                          <span className="font-medium">Age:</span> {calculateAge(member.date_of_birth)} years
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(index)}
                      className="ml-4 text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                      title="Remove family member"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Add Family Member Button */}
        <button
          onClick={() => setShowModal(true)}
          className="btn-success flex items-center py-3 px-5 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Family Member
        </button>
      </div>
      
      <FamilyMemberModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
};

export default FamilyMemberSection;