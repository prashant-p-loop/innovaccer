// src/components/PremiumSummary.tsx - Simplified version without pro-rata details
import React from 'react';
import { Calculator } from 'lucide-react';
import { useEnrollment } from '../contexts/EnrollmentContext';
import { formatPremium } from '../utils/premiumUtils';

const PremiumSummary: React.FC = () => {
  const { 
    parents, 
    parentalCoverage, 
    premiums
  } = useEnrollment();

  return (
    <div className="card mb-8">
      <div className="card-header-blue">
        <h3 className="text-lg font-medium flex items-center">
          <Calculator className="h-5 w-5 mr-2" />
          Premium Summary
        </h3>
      </div>
      
      <div className="card-body">
        <div className="space-y-6">
          {/* Base Group Medical Coverage Summary */}
          <div className="flex justify-between items-center p-4 bg-green-50 border border-green-200 rounded-lg">
            <div>
              <h4 className="font-medium text-green-800 flex items-center">
                <span className="h-3 w-3 bg-green-600 rounded-full mr-2"></span>
                Base Group Medical Coverage
              </h4>
              <p className="text-sm text-green-700 mt-1">
                Self + Spouse + Children (₹10 Lakhs)
              </p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-green-600">₹0</div>
              <div className="text-sm text-green-600">Fully covered by company</div>
            </div>
          </div>
          
          {/* Parental Coverage Summary */}
          <div className="flex justify-between items-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div>
              <h4 className="font-medium text-purple-800 flex items-center">
                <span className="h-3 w-3 bg-purple-600 rounded-full mr-2"></span>
                Parental Group Medical Coverage
              </h4>
              <p className="text-sm text-purple-700 mt-1">
                {parentalCoverage.selected && parents.length > 0
                  ? `${parentalCoverage.parentSet === 'parents' ? 'Parents' : 'Parents-in-law'} (₹10 Lakhs)`
                  : 'Not selected'
                }
              </p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-purple-600">
                {formatPremium(premiums.total)}
              </div>
              <div className="text-sm text-purple-600">
                {premiums.total > 0 ? 'Annual premium' : 'No premium'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Total Premium */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <div className="font-bold text-lg text-gray-800">Total Annual Premium:</div>
            <div className="font-bold text-2xl primary-text">
              {formatPremium(premiums.total)}
            </div>
          </div>
          
          {premiums.total === 0 && (
            <p className="text-sm text-gray-600 mt-1">
              No premium required - fully covered by company
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PremiumSummary;