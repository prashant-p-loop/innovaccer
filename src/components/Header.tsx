// src/components/Header.tsx - Updated with properly sized Loop logo
import React from 'react';
import { useUser } from '../contexts/UserContext';
import { LogOut, User } from 'lucide-react';

interface HeaderProps {
  onAdminClick: () => void;
  onLogout: () => void;
  currentPath: string;
}

const Header: React.FC<HeaderProps> = ({ onAdminClick, onLogout, currentPath }) => {
  const { currentEmployee } = useUser();

  const getPageTitle = () => {
    switch (currentPath) {
      case '/login':
        return 'Employee Login';
      case '/enrollment':
        return 'Health Insurance Enrollment';
      case '/success':
        return 'Enrollment Complete';
      case '/admin':
        return 'Admin Dashboard';
      default:
        return 'Health Insurance Enrollment Portal';
    }
  };

  const showAdminButton = currentEmployee?.role === 'admin' && currentPath !== '/admin';
  const showUserInfo = currentEmployee && currentPath !== '/login';

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="flex items-center justify-between">
          {/* Loop Logo and Company Title */}
          <div className="flex items-center">
            {/* Loop Logo - Properly sized and stretched */}
            <div className="h-12 flex items-center justify-center">
              <img 
                src="https://cdn.prod.website-files.com/619b33946e0527b5a12bec15/61f8edaecca71a1ae15ec68b_loop-logo-moss.svg"
                alt="Loop Logo"
                className="h-10 w-16 object-contain"
                onError={(e) => {
                  // Fallback if logo fails to load
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              {/* Fallback icon */}
              <div className="w-12 h-10 bg-green-600 rounded-lg hidden items-center justify-center">
                <span className="text-white font-bold text-xs">L</span>
              </div>
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* User Info */}
            {showUserInfo && (
              <div className="flex items-center space-x-2 text-gray-700">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{currentEmployee.name}</span>
                {currentEmployee.role === 'admin' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Admin
                  </span>
                )}
              </div>
            )}

            {/* Admin Button */}
            {showAdminButton && (
              <button
                onClick={onAdminClick}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Admin Dashboard
              </button>
            )}

            {/* Logout Button */}
            {showUserInfo && (
              <button
                onClick={onLogout}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;