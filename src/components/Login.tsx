// src/components/Login.tsx - Updated with Innovaccer logo
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { AlertCircle, Mail, Car as IdCard } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [empId, setEmpId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginEmployee } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login with:', email, empId);
      
      if (!loginEmployee) {
        throw new Error('Login function not available');
      }

      const employee = await loginEmployee(email, empId);

      if (employee) {
        console.log('Login successful:', employee);
        // Navigate based on role
        if (employee.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/enrollment');
        }
      } else {
        setError('Invalid email or employee ID. Please check your credentials.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestMode = async () => {
    setError('');
    setLoading(true);
    
    try {
      // Use the admin credentials for test mode
      const employee = await loginEmployee('enrollments@loophealth.com', 'EMP01');
      if (employee) {
        setEmail('enrollments@loophealth.com');
        setEmpId('EMP01');
        // Navigate based on role
        if (employee.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/enrollment');
        }
      } else {
        setError('Test account not found.');
      }
    } catch (err: any) {
      console.error('Test mode error:', err);
      setError(err.message || 'Test mode failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto fade-in">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <img 
            src="https://cdn.brandfetch.io/idMbRL3_se/w/800/h/135/theme/dark/logo.png?c=1bxid64Mup7aczewSAYMX&t=1668070663872"
            alt="Innovaccer Logo"
            className="h-16 w-auto"
            onError={(e) => {
              // Fallback if logo fails to load
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          {/* Fallback logo */}
          <div className="w-20 h-20 bg-blue-600 rounded-full hidden items-center justify-center">
            <span className="text-white font-bold text-xl">I</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Employee Portal</h1>
        <p className="text-gray-600">Sign in to access your insurance enrollment</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-xl font-medium">Employee Login</h2>
        </div>
        
        <div>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Login Failed</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 inline mr-2" />
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
                placeholder="your.email@company.com"
              />
            </div>

            <div>
              <label htmlFor="empId" className="block text-sm font-medium text-gray-700 mb-2">
                <IdCard className="h-4 w-4 inline mr-2" />
                Employee ID
              </label>
              <input
                type="text"
                id="empId"
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
                placeholder="EMP001"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Login;