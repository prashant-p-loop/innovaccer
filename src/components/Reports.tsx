// src/components/admin/Reports.tsx
import React, { useState, useEffect } from 'react';
import { AdminService, EnrollmentReport, PremiumAnalytics } from '../../services/adminService';
import { Download, FileText, BarChart3, Users, Calendar, Filter } from 'lucide-react';

interface ReportsProps {
  adminService: AdminService;
}

const Reports: React.FC<ReportsProps> = ({ adminService }) => {
  const [enrollmentReport, setEnrollmentReport] = useState<EnrollmentReport[]>([]);
  const [premiumAnalytics, setPremiumAnalytics] = useState<PremiumAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeReport, setActiveReport] = useState<'enrollment' | 'premium' | 'department'>('enrollment');
  const [filters, setFilters] = useState({
    department: 'all',
    status: 'all',
    dateRange: 'all'
  });

  useEffect(() => {
    loadReports();
  }, [activeReport, filters]);

  const loadReports = async () => {
    setLoading(true);
    try {
      if (activeReport === 'enrollment') {
        const data = await adminService.getEnrollmentReport();
        setEnrollmentReport(applyFilters(data));
      } else if (activeReport === 'premium') {
        const data = await adminService.getPremiumAnalytics();
        setPremiumAnalytics(data);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (data: EnrollmentReport[]): EnrollmentReport[] => {
    let filtered = [...data];

    if (filters.department !== 'all') {
      filtered = filtered.filter(item => item.department === filters.department);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(item => item.enrollmentStatus === filters.status);
    }

    return filtered;
  };

  const exportToCsv = async () => {
    try {
      const csvContent = await adminService.exportEnrollmentReport();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `enrollment-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const generatePDF = () => {
    window.print();
  };

  const departments = [...new Set(enrollmentReport.map(item => item.department))];

  return (
    <div className="space-y-6">
      {/* Report Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveReport('enrollment')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              activeReport === 'enrollment'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Enrollment Report</span>
          </button>
          
          <button
            onClick={() => setActiveReport('premium')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              activeReport === 'premium'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Premium Analytics</span>
          </button>
          
          <button
            onClick={() => setActiveReport('department')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              activeReport === 'department'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Department Wise</span>
          </button>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={exportToCsv}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          
          <button
            onClick={generatePDF}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      {activeReport === 'enrollment' && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-700">Filters:</span>
            
            <select
              value={filters.department}
              onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Enrollment Report */}
          {activeReport === 'enrollment' && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Enrollment Report</h3>
                <p className="text-sm text-gray-500">
                  Showing {enrollmentReport.length} employees
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Family
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Parents
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Premium
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monthly
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pro-rata
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {enrollmentReport.map((employee) => (
                      <tr key={employee.employeeId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {employee.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {employee.empId}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            employee.enrollmentStatus === 'submitted'
                              ? 'bg-green-100 text-green-800'
                              : employee.enrollmentStatus === 'approved'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {employee.enrollmentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.familyMembersCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.parentsCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{employee.totalPremium.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{employee.monthlyDeduction.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.proRataFactor ? 
                            `${(employee.proRataFactor * 100).toFixed(1)}%` : 
                            'N/A'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Premium Analytics */}
          {activeReport === 'premium' && premiumAnalytics && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Premium</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        ₹{premiumAnalytics.totalPremiumCollected.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Average Premium</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        ₹{Math.round(premiumAnalytics.averagePremiumPerEmployee).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-purple-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Pro-rata Savings</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        ₹{Math.round(premiumAnalytics.proRataSavings).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <FileText className="h-4 w-4 text-orange-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Single Parent</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {premiumAnalytics.parentalCoverageStats.singleParent.count}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Department-wise breakdown */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Department-wise Premium Analysis</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employees
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Premium
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Average Premium
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {premiumAnalytics.departmentWisePremiums.map((dept) => (
                        <tr key={dept.department}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {dept.department}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {dept.employeeCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{dept.totalPremium.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{Math.round(dept.averagePremium).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;