// src/components/AdminDashboard.tsx - Enhanced with batch-specific reports
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  UserCheck, 
  Clock, 
  Download, 
  Upload,
  RefreshCcw,
  FileText,
  Calendar,
  Package
} from 'lucide-react';
import { AdminService } from '../services/adminService';
import BulkImport from './admin/BulkImport';

interface AdminDashboardProps {
  adminService: AdminService;
}

interface DashboardStats {
  totalEmployees: number;
  enrolledEmployees: number;
  pendingEmployees: number;
  enrollmentRate: number;
  departmentBreakdown: Array<{
    department: string;
    total: number;
    enrolled: number;
    pending: number;
    enrollmentRate: number;
  }>;
}

interface UploadBatch {
  id: string;
  batchName: string;
  description: string;
  uploadedBy: string;
  uploadedAt: string;
  employeeCount: number;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ adminService }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'import' | 'reports'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [uploadBatches, setUploadBatches] = useState<UploadBatch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  useEffect(() => {
    loadDashboardStats();
    if (activeTab === 'reports') {
      loadUploadBatches();
    }
  }, [activeTab]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const dashboardStats = await adminService.getDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUploadBatches = async () => {
    try {
      setLoadingBatches(true);
      const batches = await adminService.getUploadBatches();
      setUploadBatches(batches);
    } catch (error) {
      console.error('Error loading upload batches:', error);
    } finally {
      setLoadingBatches(false);
    }
  };

  const handleImportComplete = () => {
    loadDashboardStats();
    if (activeTab === 'reports') {
      loadUploadBatches();
    }
  };

  const handleExportBatchReport = async (batchId: string, batchName: string) => {
    try {
      // Export as Excel file for the specific batch (downloads automatically)
      await adminService.exportDetailedEnrollmentReport('excel', batchId);
    } catch (error) {
      console.error('Error exporting batch report:', error);
      alert(`Failed to export report for batch "${batchName}". Please try again.`);
    }
  };

  const handleExportAllReport = async () => {
    try {
      // Export all data as Excel file (downloads automatically)
      await adminService.exportDetailedEnrollmentReport('excel');
    } catch (error) {
      console.error('Error exporting all data report:', error);
      alert('Failed to export complete report. Please try again.');
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              {/* Loop Logo - Properly sized */}
              <div className="h-10 flex items-center justify-center mr-3">
                <img 
                  src="https://cdn.prod.website-files.com/619b33946e0527b5a12bec15/61f8edaecca71a1ae15ec68b_loop-logo-moss.svg"
                  alt="Loop Logo"
                  className="h-8 w-12 object-contain"
                  onError={(e) => {
                    // Fallback if logo fails to load
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                {/* Fallback icon */}
                <div className="w-10 h-8 bg-green-600 rounded-lg hidden items-center justify-center">
                  <span className="text-white font-bold text-xs">L</span>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Innovaccer Inc. - Health Insurance Enrollment System</p>
              </div>
            </div>
            <button
              onClick={loadDashboardStats}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCcw className="h-4 w-4 mr-1" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              <span>Dashboard</span>
            </button>
            
            <button
              onClick={() => setActiveTab('import')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'import'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Upload className="h-5 w-5" />
              <span>Bulk Import</span>
            </button>
            
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'reports'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span>Batch Reports</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading dashboard data...</p>
              </div>
            ) : stats ? (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Users className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Total Employees</dt>
                            <dd className="text-lg font-medium text-gray-900">{stats.totalEmployees}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <UserCheck className="h-6 w-6 text-green-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Enrolled</dt>
                            <dd className="text-lg font-medium text-gray-900">{stats.enrolledEmployees}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Clock className="h-6 w-6 text-yellow-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                            <dd className="text-lg font-medium text-gray-900">{stats.pendingEmployees}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <BarChart3 className="h-6 w-6 text-blue-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Enrollment Rate</dt>
                            <dd className="text-lg font-medium text-gray-900">{stats.enrollmentRate.toFixed(1)}%</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Department Breakdown */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Department Breakdown</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrolled</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {stats.departmentBreakdown.map((dept) => (
                            <tr key={dept.department}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {dept.department || 'Not Specified'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.total}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{dept.enrolled}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">{dept.pending}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {dept.enrollmentRate.toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No data available</p>
              </div>
            )}
          </div>
        )}

        {/* Import Tab */}
        {activeTab === 'import' && (
          <BulkImport 
            adminService={adminService} 
            onImportComplete={handleImportComplete}
          />
        )}

        {/* Batch Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Batch Reports</h2>
                <p className="text-gray-600">Download enrollment reports for specific employee batches</p>
              </div>
              <button
                onClick={handleExportAllReport}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export All Data</span>
              </button>
            </div>

            {loadingBatches ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading batch data...</p>
              </div>
            ) : uploadBatches.length > 0 ? (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Upload Batches</h3>
                  <p className="text-sm text-gray-500">Each batch represents a separate employee upload with its own report</p>
                </div>
                <div className="divide-y divide-gray-200">
                  {uploadBatches.map((batch) => (
                    <div key={batch.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <Package className="h-5 w-5 text-blue-500" />
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">{batch.batchName}</h4>
                              {batch.description && (
                                <p className="text-sm text-gray-600">{batch.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 flex items-center space-x-6 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>Uploaded: {formatDate(batch.uploadedAt)}</span>
                            </div>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              <span>{batch.employeeCount} employees</span>
                            </div>
                            <div>
                              <span>By: {batch.uploadedBy}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleExportBatchReport(batch.id, batch.batchName)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                          >
                            <Download className="h-4 w-4" />
                            <span>Download Report</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Batches Found</h3>
                <p className="text-gray-600 mb-6">
                  No employee upload batches have been created yet. Import employees using the Bulk Import tab to create your first batch.
                </p>
                <button
                  onClick={() => setActiveTab('import')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Go to Bulk Import
                </button>
              </div>
            )}

            {/* Information Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <FileText className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">About Batch Reports</h4>
                  <div className="text-sm text-blue-700 space-y-2">
                    <p>Each batch report contains complete enrollment data for employees uploaded in that specific batch, including:</p>
                    <ul className="ml-4 space-y-1 list-disc">
                      <li>Employee details and enrollment status</li>
                      <li>Family members and parents information</li>
                      <li>Premium calculations and deductions</li>
                      <li>Relationship and age details</li>
                    </ul>
                    <p className="mt-3">
                      <strong>Tip:</strong> Use batch reports to track enrollment progress for specific groups of employees, such as quarterly hires or department transfers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;