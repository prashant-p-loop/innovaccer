// src/components/ProtectedRoute.tsx - Fixed authentication checks
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { currentEmployee, isLoading } = useUser();

  // Show loading while checking authentication
  if (isLoading) {
    console.log('[ProtectedRoute] Still loading...');
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-indicator mx-auto mb-4"></div>
          <p className="text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  console.log('[ProtectedRoute] Loading complete. currentEmployee:', currentEmployee?.name, 'requireAdmin:', requireAdmin);

  // Not logged in - redirect to login
  if (!currentEmployee) {
    console.log('[ProtectedRoute] No current employee, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Admin route but user is not admin
  if (requireAdmin && currentEmployee.role !== 'admin') {
    console.log('[ProtectedRoute] Admin required but user is not admin');
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to access the admin dashboard. Admin privileges are required.
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check enrollment due date for regular users (not admins)
  if (!requireAdmin && currentEmployee.role !== 'admin' && currentEmployee.enrollmentStatus !== 'submitted') {
    const dueDate = new Date(currentEmployee.enrollmentDueDate || '31/03/2025');
    const currentDate = new Date();
    
    if (currentDate > dueDate) {
      console.log('[ProtectedRoute] Enrollment period ended, redirecting to login');
      return <Navigate to="/login" replace />;
    }
  }

  console.log('[ProtectedRoute] All checks passed, rendering protected component');
  // All checks passed - render the protected component
  return <>{children}</>;
};

export default ProtectedRoute;