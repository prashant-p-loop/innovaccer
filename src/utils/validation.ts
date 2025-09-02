import { FamilyMember, Parent, BusinessRulesValidation } from '../types';

export const validateFamilyBusinessRules = (familyMembers: FamilyMember[]): BusinessRulesValidation => {
  const errors: string[] = [];
  
  // Count by relationship type
  let spouseCount = 0;
  let childCount = 0;
  
  familyMembers.forEach(member => {
    if (member.relationship === 'Spouse') {
      spouseCount++;
    } else if (member.relationship === 'Child') {
      childCount++;
    }
  });
  
  // Check maximum limits
  if (spouseCount > 1) {
    errors.push('Only one spouse can be covered');
  }
  
  if (childCount > 2) {
    errors.push('Maximum 2 children allowed');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
};

export const validateParentBusinessRules = (parents: Parent[]): BusinessRulesValidation => {
  const errors: string[] = [];
  
  // Count by relationship type
  let fatherCount = 0;
  let motherCount = 0;
  let fatherInLawCount = 0;
  let motherInLawCount = 0;
  
  parents.forEach(parent => {
    switch (parent.relationship) {
      case 'Father':
        fatherCount++;
        break;
      case 'Mother':
        motherCount++;
        break;
      case 'Father-in-law':
        fatherInLawCount++;
        break;
      case 'Mother-in-law':
        motherInLawCount++;
        break;
    }
  });
  
  // Check maximum limits for each relationship type
  if (fatherCount > 1) {
    errors.push('Cannot add more than one Father');
  }
  
  if (motherCount > 1) {
    errors.push('Cannot add more than one Mother');
  }
  
  if (fatherInLawCount > 1) {
    errors.push('Cannot add more than one Father-in-law');
  }
  
  if (motherInLawCount > 1) {
    errors.push('Cannot add more than one Mother-in-law');
  }
  
  // Check that we don't mix parent sets
  const hasParents = fatherCount > 0 || motherCount > 0;
  const hasParentsInLaw = fatherInLawCount > 0 || motherInLawCount > 0;
  
  if (hasParents && hasParentsInLaw) {
    errors.push('Cannot add both parents and parents-in-law. Please select only one set.');
  }
  
  // Maximum 2 parents total
  const totalParents = fatherCount + motherCount + fatherInLawCount + motherInLawCount;
  if (totalParents > 2) {
    errors.push('Maximum 2 parents can be added');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
};

export const validateAgeRange = (age: number, relationship: string): string | null => {
  switch (relationship) {
    case 'Child':
      if (age < 0 || age > 25) {
        return 'Children must be between 0-25 years';
      }
      break;
    case 'Spouse':
    case 'Father':
    case 'Mother':
    case 'Father-in-law':
    case 'Mother-in-law':
      if (age < 18 || age > 80) {
        return 'Must be between 18-80 years';
      }
      break;
    default:
      return 'Invalid relationship type';
  }
  return null;
};

export const getGenderFromRelationship = (relationship: string): 'Male' | 'Female' | null => {
  switch (relationship) {
    case 'Father':
    case 'Father-in-law':
      return 'Male';
    case 'Mother':
    case 'Mother-in-law':
      return 'Female';
    case 'Spouse':
    case 'Child':
      return null; // User can choose
    default:
      return null;
  }
};