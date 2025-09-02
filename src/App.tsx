// src/App.tsx - Fixed routing logic
import React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { UserProvider, useUser } from './contexts/UserContext';
import { EnrollmentProvider } from './contexts/EnrollmentContext';
import Header from './components/Header';
import Login from './components/Login';
import Enrollment from './components/Enrollment';
import Success from './components/Success';
import AdminDashboard from './components/AdminDashboard';
import { AdminService } from './services/adminService';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

const AppContent: React.FC = () => {
  const { currentEmployee, isLoading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('currentEmployee');
    navigate('/login');
    // Force reload to reset all state
    window.location.reload();
  };

  const handleAdminClick = () => {
    navigate('/admin');
  };

  // Show loading spinner while initializing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-indicator mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        onAdminClick={handleAdminClick}
        onLogout={handleLogout}
        currentPath={location.pathname}
      />
      
      <main className="container mx-auto py-8 px-4 max-w-6xl">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              currentEmployee ? 
                (currentEmployee.role === 'admin' ? 
                  <Navigate to="/admin" replace /> : 
                  <Navigate to="/enrollment" replace />
                ) : 
                <Login />
            } 
          />
          
          {/* Protected Routes - Require Login */}
          <Route 
            path="/enrollment" 
            element={
              <ProtectedRoute>
                <Enrollment onSuccess={() => navigate('/success')} isTestMode={false} />
              </ProtectedRoute>
            }
          />
          
          <Route 
            path="/success" 
            element={
              <ProtectedRoute>
                <Success onBackToLogin={() => navigate('/login')} />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin Routes - Require Admin Role */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard adminService={new AdminService()} />
              </ProtectedRoute>
            } 
          />
          
          {/* Default redirect based on authentication */}
          <Route 
            path="/" 
            element={
              currentEmployee ? 
                (currentEmployee.role === 'admin' ? 
                  <Navigate to="/admin" replace /> : 
                  <Navigate to="/enrollment" replace />
                ) : 
                <Navigate to="/login" replace />
            } 
          />
          
          {/* Catch all - redirect based on authentication */}
          <Route 
            path="*" 
            element={
              currentEmployee ? 
                (currentEmployee.role === 'admin' ? 
                  <Navigate to="/admin" replace /> : 
                  <Navigate to="/enrollment" replace />
                ) : 
                <Navigate to="/login" replace />
            } 
          />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <UserProvider>
      <EnrollmentProvider>
        <AppContent />
      </EnrollmentProvider>
    </UserProvider>
  );
}

export default App;