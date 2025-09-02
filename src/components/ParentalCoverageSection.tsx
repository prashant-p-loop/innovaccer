import React, { useState } from 'react';
import { useEnrollment } from '../contexts/EnrollmentContext';
import { useUser } from '../contexts/UserContext';
import { Users, Plus, Trash2 } from 'lucide-react';
import ParentModal from './ParentModal';
import { calculateAge, formatDateWithMonthName } from '../utils/dateUtils';

const ParentalCoverageSection: React.FC = () => {
  const { currentEmployee } = useUser();
  const { 
    parents, 
    parentalCoverage, 
    setParentalCoverage, 
    removeParent 
  } = useEnrollment();
  const [showModal, setShowModal] = useState(false);

  const handleCoverageToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[ParentalCoverageSection] Coverage toggle clicked:', e.target.checked);
    const selected = e.target.checked;
    setParentalCoverage(selected);
  };

  const handleParentSetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[ParentalCoverageSection] Parent set change:', e.target.value);
    const parentSet = e.target.value as 'parents' | 'parents-in-law';
    setParentalCoverage(true, parentSet);
  };

  const handleRemoveParent = (index: number) => {
    if (confirm('Are you sure you want to remove this parent?')) {
      console.log('[ParentalCoverageSection] Removing parent at index:', index);
      removeParent(index);
    }
  };

  return (
    <div className={`parental-coverage-section mb-8 ${parentalCoverage.selected ? 'selected' : ''}`}>
      <div className="card-header-purple">
        <h3 className="text-lg font-medium flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Voluntary Parental Group Medical Coverage
        </h3>
      </div>
      
      <div className="card-body">
        <div className="mb-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={parentalCoverage.selected}
              onChange={handleCoverageToggle}
              className="mr-3 h-5 w-5"
            />
            <span className="font-medium">I want to add parental coverage</span>
          </label>
          <p className="text-sm text-gray-600 mt-2">
            Optional coverage for your parents or parents-in-law. Separate policy with ₹10 Lakhs sum insured.
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Note: Premium for this policy is 100% borne by the employee.
            </p>
        </div>
        
        {parentalCoverage.selected && (
          <div className="space-y-6">

             {/* Parent Set Selection */}
            <div>
              <h4 className="font-medium mb-4 text-gray-800">Select Parent Set</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`relative cursor-pointer group ${parentalCoverage.parentSet === 'parents' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="parent-set"
                    value="parents"
                    checked={parentalCoverage.parentSet === 'parents'}
                    onChange={handleParentSetChange}
                    className="sr-only"
                    disabled={!parentalCoverage.selected}
                  />
                  <div className={`parental-option p-5 transition-all duration-200 ${
                    parentalCoverage.parentSet === 'parents' 
                      ? 'border-purple-500 bg-purple-50 shadow-md' 
                      : 'hover:border-purple-300 hover:shadow-sm'
                  }`}>
                    <div className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        parentalCoverage.parentSet === 'parents'
                          ? 'border-purple-500 bg-purple-500'
                          : 'border-gray-300 group-hover:border-purple-400'
                      }`}>
                        {parentalCoverage.parentSet === 'parents' && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 mb-1">My Parents</div>
                        <div className="text-sm text-gray-600">Coverage for your father and/or mother</div>
                      </div>
                    </div>
                  </div>
                </label>
                
                <label className={`relative cursor-pointer group ${parentalCoverage.parentSet === 'parents-in-law' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="parent-set"
                    value="parents-in-law"
                    checked={parentalCoverage.parentSet === 'parents-in-law'}
                    onChange={handleParentSetChange}
                    className="sr-only"
                    disabled={!parentalCoverage.selected}
                  />
                  <div className={`parental-option p-5 transition-all duration-200 ${
                    parentalCoverage.parentSet === 'parents-in-law' 
                      ? 'border-purple-500 bg-purple-50 shadow-md' 
                      : 'hover:border-purple-300 hover:shadow-sm'
                  }`}>
                    <div className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        parentalCoverage.parentSet === 'parents-in-law'
                          ? 'border-purple-500 bg-purple-500'
                          : 'border-gray-300 group-hover:border-purple-400'
                      }`}>
                        {parentalCoverage.parentSet === 'parents-in-law' && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 mb-1">My Parents-in-law</div>
                        <div className="text-sm text-gray-600">Coverage for your spouse's father and/or mother</div>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Parent List */}
            {parents.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Added Parents</h4>
                <div className="space-y-3">
                  {parents.map((parent, index) => (
                    <div key={index} className="dependent-display-card">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h4 className="font-medium text-gray-800 text-lg">{parent.name}</h4>
                            <span className="ml-3 px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                              {parent.relationship}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Gender:</span> {parent.gender}
                            </div>
                            <div>
                              <span className="font-medium">Date of Birth:</span> {formatDateWithMonthName(parent.date_of_birth)}
                            </div>
                            <div>
                              <span className="font-medium">Age:</span> {calculateAge(parent.date_of_birth)} years
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveParent(index)}
                          className="ml-4 text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                          title="Remove parent"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Parent Button */}
            {parentalCoverage.parentSet && (
              <button
                onClick={() => setShowModal(true)}
                className="btn-success flex items-center py-3 px-5 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Parent
              </button>
            )}
          </div>
        )}

        <ParentModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          parentSet={parentalCoverage.parentSet}
        />
      </div>
    </div>
  );
};

export default ParentalCoverageSection;