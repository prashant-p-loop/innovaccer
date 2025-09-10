// src/utils/premiumUtils.ts - FIXED VERSION
export const BASE_PARENTAL_RATES = {
  single: 36203,
  double: 72407
};

export interface ProRataCalculation {
  basePremium: number;
  proRatedPremium: number;
  factor: number;
  remainingDays: number;
  totalPolicyDays: number;
  joiningDate: Date;
  policyEndDate: Date;
}

/**
 * FIXED: Calculate pro-rata factor using ACTUAL joining date and policy dates
 */
export const calculateProRataFactor = (joiningDate: Date, policyStartDate: Date, policyEndDate: Date): { factor: number; remainingDays: number } => {
  // Use ACTUAL policy start and end dates from employee data
  const totalPolicyDays = 365; // Use standard 365-day policy year like insurer
  
  // Calculate remaining days from JOINING DATE to policy end
  const remainingDays = Math.ceil(
  (policyEndDate.getTime() - joiningDate.getTime()) / (1000 * 60 * 60 * 24)
) + 1;
  
  // Ensure we don't have negative days
  const validRemainingDays = Math.max(0, remainingDays);
  
  // Calculate pro-rata factor (should be LESS than 1.0 for mid-year joining)
  const factor = validRemainingDays / totalPolicyDays;
  
  return {
  factor: factor,  // Don't truncate precision
  remainingDays: validRemainingDays
};
};

/**
 * FIXED: Calculate pro-rata premium using joining date and actual policy period
 */
export const calculateProRataPremium = (
  basePremium: number,
  joiningDate: Date,
  policyStartDate: Date,
  policyEndDate: Date
): ProRataCalculation => {
  const { factor, remainingDays } = calculateProRataFactor(joiningDate, policyStartDate, policyEndDate);
  
  const totalPolicyDays = Math.ceil(
    (policyEndDate.getTime() - policyStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Calculate pro-rated premium (should be LESS than base premium for mid-year joining)
  const proRatedPremium = basePremium * factor;
  
  return {
    basePremium,
    proRatedPremium: proRatedPremium,
    factor,
    remainingDays,
    totalPolicyDays,
    joiningDate,
    policyEndDate
  };
};

/**
 * FIXED: Get policy year from actual policy dates
 */
export const getPolicyYear = (policyStartDate: Date, policyEndDate: Date): string => {
  const startYear = policyStartDate.getFullYear();
  const endYear = policyEndDate.getFullYear();
  
  if (startYear === endYear) {
    return startYear.toString();
  } else {
    return `${startYear}-${endYear.toString().slice(-2)}`;
  }
};

/**
 * Format premium amount for display
 */
export const formatPremium = (amount: number): string => {
  return `₹${Math.round(amount).toLocaleString()}`;
};

/**
 * Calculate monthly deduction amount
 */
export const calculateMonthlyDeduction = (annualPremium: number): number => {
  return Math.round(annualPremium / 12);
};

/**
 * FIXED: Get premium breakdown using actual employee data
 */
export interface PremiumBreakdown {
  description: string;
  basePremium: number;
  proRatedPremium: number;
  gst: number;
  total: number;
  monthlyDeduction: number;
  factor: number;
  remainingDays: number;
}

export const getPremiumBreakdown = (
  parentCount: number,
  joiningDate: Date,
  policyStartDate: Date,
  policyEndDate: Date
): PremiumBreakdown => {
  if (parentCount === 0) {
    return {
      description: 'No parental coverage selected',
      basePremium: 0,
      proRatedPremium: 0,
      gst: 0,
      total: 0,
      monthlyDeduction: 0,
      factor: 0,
      remainingDays: 0
    };
  }
  
  const basePremium = parentCount === 1 ? BASE_PARENTAL_RATES.single : BASE_PARENTAL_RATES.double;
  const proRataCalc = calculateProRataPremium(basePremium, joiningDate, policyStartDate, policyEndDate);
  const gst = proRataCalc.proRatedPremium * 0.18;
  const total = proRataCalc.proRatedPremium + gst;
  
  return {
  description: `${parentCount} parent${parentCount > 1 ? 's' : ''} coverage`,
  basePremium,
  proRatedPremium: proRataCalc.proRatedPremium,
  gst: Math.round(gst),
  total: Math.round(total),
  monthlyDeduction: calculateMonthlyDeduction(Math.round(total)),
  factor: proRataCalc.factor,
  remainingDays: proRataCalc.remainingDays
};
};