import React, { useState, useEffect } from 'react';
import { useEnrollment } from '../contexts/EnrollmentContext';
import { X } from 'lucide-react';
import { Parent } from '../types';
import { validateParentBusinessRules } from '../utils/validation';
import { calculateAge } from '../utils/dateUtils';

interface ParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentSet: 'parents' | 'parents-in-law' | null;
}

const ParentModal: React.FC<ParentModalProps> = ({ isOpen, onClose, parentSet }) => {
  const { parents, addParent } = useEnrollment();
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    gender: 'Male',
    dobDay: '',
    dobMonth: '',
    dobYear: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);

  const getRelationshipOptions = () => {
    if (parentSet === 'parents') {
      return [
        { value: 'Father', label: 'Father' },
        { value: 'Mother', label: 'Mother' }
      ];
    } else if (parentSet === 'parents-in-law') {
      return [
        { value: 'Father-in-law', label: 'Father-in-law' },
        { value: 'Mother-in-law', label: 'Mother-in-law' }
      ];
    }
    return [];
  };

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        relationship: '',
        gender: 'Male',
        dobDay: '',
        dobMonth: '',
        dobYear: ''
      });
      setErrors({});
      setCalculatedAge(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const { dobDay, dobMonth, dobYear } = formData;
    if (dobDay && dobMonth && dobYear) {
      const dobString = `${dobDay}/${dobMonth}/${dobYear}`;
      const age = calculateAge(dobString);
      setCalculatedAge(age);
    } else {
      setCalculatedAge(null);
    }
  }, [formData.dobDay, formData.dobMonth, formData.dobYear]);

  useEffect(() => {
    // Auto-select gender based on relationship
    const rel = formData.relationship;
    if (rel === 'Father' || rel === 'Father-in-law') {
      setFormData(prev => ({ ...prev, gender: 'Male' }));
    } else if (rel === 'Mother' || rel === 'Mother-in-law') {
      setFormData(prev => ({ ...prev, gender: 'Female' }));
    }
  }, [formData.relationship]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.relationship) newErrors.relationship = 'Relationship is required';
    if (!formData.dobDay || !formData.dobMonth || !formData.dobYear)
      newErrors.dob = 'Complete date of birth is required';

    const dobString = `${formData.dobDay}/${formData.dobMonth}/${formData.dobYear}`;
    const age = calculateAge(dobString);
    if (age < 18 || age > 80) {
      newErrors.age = 'Age must be between 18 and 80 years';
    }

    // Check for duplicate relationships
    const duplicate = parents.find(p => p.relationship === formData.relationship);
    if (duplicate) {
      newErrors.duplicate = `You've already added a ${formData.relationship}`;
    }

    if (Object.keys(newErrors).length === 0) {
      const tempParent: Parent = {
        name: formData.name.trim(),
        relationship: formData.relationship as any,
        date_of_birth: dobString,
        gender: formData.gender as 'Male' | 'Female'
      };

      const allParents = [...parents, tempParent];
      const businessValidation = validateParentBusinessRules(allParents);

      if (!businessValidation.valid) {
        newErrors.business = businessValidation.errors[0];
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[ParentModal] Form submitted, validating...');
    if (validateForm()) {
      console.log('[ParentModal] Submitting parent:', formData);
      const newParent: Parent = {
        name: formData.name.trim(),
        relationship: formData.relationship as any,
        gender: formData.gender as 'Male' | 'Female',
        date_of_birth: `${formData.dobDay}/${formData.dobMonth}/${formData.dobYear}`
      };
      addParent(newParent);
      console.log('[ParentModal] Parent added successfully');
      onClose();
    } else {
      console.log('[ParentModal] Form validation failed');
    }
  };

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
          <h3 className="modal-title">Add Parent</h3>
          <button onClick={onClose} className="modal-close">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter parent's name"
                className={`w-full ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && <p className="validation-error">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Relationship */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship *
                </label>
                <select
                  value={formData.relationship}
                  onChange={(e) => handleChange('relationship', e.target.value)}
                  className={`w-full ${errors.relationship ? 'border-red-500' : ''}`}
                >
                  <option value="">Select relationship</option>
                  {getRelationshipOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.relationship && <p className="validation-error">{errors.relationship}</p>}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="w-full"
                  disabled={formData.relationship !== ''}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            {/* Date of Birth */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth *
              </label>
              <div className="grid grid-cols-3 gap-3">
                <select
                  value={formData.dobDay}
                  onChange={(e) => handleChange('dobDay', e.target.value)}
                  className={`w-full ${errors.dob ? 'border-red-500' : ''}`}
                >
                  <option value="">Day</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day.toString().padStart(2, '0')}>
                      {day}
                    </option>
                  ))}
                </select>
                
                <select
                  value={formData.dobMonth}
                  onChange={(e) => handleChange('dobMonth', e.target.value)}
                  className={`w-full ${errors.dob ? 'border-red-500' : ''}`}
                >
                  <option value="">Month</option>
                  {[
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                  ].map((month, index) => (
                    <option key={month} value={(index + 1).toString().padStart(2, '0')}>
                      {month}
                    </option>
                  ))}
                </select>
                
                <select
                  value={formData.dobYear}
                  onChange={(e) => handleChange('dobYear', e.target.value)}
                  className={`w-full ${errors.dob ? 'border-red-500' : ''}`}
                >
                  <option value="">Year</option>
                  {Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - 18 - i).map(year => (
                    <option key={year} value={year.toString()}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              {errors.dob && <p className="validation-error">{errors.dob}</p>}
              {errors.age && <p className="validation-error">{errors.age}</p>}
              {calculatedAge !== null && (
                <p className="text-sm text-blue-600 mt-1">
                  Calculated age: {calculatedAge} years
                </p>
              )}
            </div>

            {/* Display any business validation errors */}
            {(errors.duplicate || errors.business) && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  {errors.duplicate || errors.business}
                </p>
              </div>
            )}
          </div>
          
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add Parent
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ParentModal;