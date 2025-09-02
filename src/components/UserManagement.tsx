import React, { useState, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import { useEnrollment } from '../contexts/EnrollmentContext';
import { Plus, Edit, Trash2, Users, ArrowLeft, Search, Upload, Download, FileSpreadsheet } from 'lucide-react';
import UserModal from './UserModal';
import { Employee } from '../types';

interface UserManagementProps {
  onBackToLogin: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ onBackToLogin }) => {
  const { employees, deleteEmployee, bulkUploadEmployees } = useUser();
  const { enrollments } = useEnrollment();
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setShowModal(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowModal(true);
  };

  const handleDeleteEmployee = (id: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      deleteEmployee(id);
    }
  };

  const handleBulkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const employees = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',').map(v => v.trim());
            return {
              emp_id: values[0] || '',
              name: values[1] || '',
              email: values[2] || '',
              date_of_birth: values[3] || '',
              gender: (values[4] === 'Female' ? 'Female' : 'Male') as 'Male' | 'Female',
              mobile: values[5] || '',
              joining_date: values[6] || '',
              department: values[7] || '',
              designation: values[8] || '',
              salary: values[9] ? Number(values[9]) : undefined,
              policy_start: values[10] || '01/04/2024',
              policy_end: values[11] || '31/03/2025',
              role: (values[12] === 'admin' ? 'admin' : 'employee') as 'employee' | 'admin'
            };
          })
          .filter(emp => emp.emp_id && emp.name && emp.email);

        if (employees.length > 0) {
          bulkUploadEmployees(employees);
          alert(`Successfully uploaded ${employees.length} employees`);
          setShowBulkUpload(false);
        } else {
          alert('No valid employee data found in the file');
        }
      } catch (error) {
        alert('Error processing file. Please check the format.');
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent = 'emp_id,name,email,date_of_birth,gender,mobile,joining_date,department,designation,salary,policy_start,policy_end,role\nEMP001,John Doe,john.doe@company.com,15/01/1985,Male,9876543210,01/01/2024,Engineering,Developer,75000,01/04/2024,31/03/2025,employee\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadEnrollmentReport = () => {
    const reportData = employees.map(emp => {
      const enrollment = enrollments.find(e => e.employeeId === emp.id);
      
      return {
        emp_id: emp.emp_id,
        name: emp.name,
        email: emp.email,
        department: emp.department || '',
        enrollment_status: emp.enrollmentStatus || 'pending',
        family_members_count: enrollment?.familyMembers.length || 0,
        family_members: enrollment?.familyMembers.map(fm => `${fm.name} (${fm.relationship})`).join('; ') || '',
        parental_coverage: enrollment?.parentalCoverage.selected ? 'Yes' : 'No',
        parents_count: enrollment?.parentalCoverage.parents.length || 0,
        parents: enrollment?.parentalCoverage.parents.map(p => `${p.name} (${p.relationship})`).join('; ') || '',
        annual_premium: enrollment?.premiums.total || 0,
        monthly_deduction: enrollment?.premiums.total ? Math.round(enrollment.premiums.total / 12) : 0,
        submission_date: emp.enrollment_date || ''
      };
    });

    const headers = [
      'Employee ID', 'Name', 'Email', 'Department', 'Enrollment Status',
      'Family Members Count', 'Family Members', 'Parental Coverage',
      'Parents Count', 'Parents', 'Annual Premium', 'Monthly Deduction', 'Submission Date'
    ];

    const csvContent = [
      headers.join(','),
      ...reportData.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enrollment_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.emp_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEmployeeEnrollmentDetails = (emp: Employee) => {
    const enrollment = enrollments.find(e => e.employeeId === emp.id);
    return {
      familyCount: enrollment?.familyMembers.length || 0,
      parentalCoverage: enrollment?.parentalCoverage.selected || false,
      totalPremium: enrollment?.premiums.total || 0
    };
  };

  return (
    <div className="max-w-7xl mx-auto fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">User Management</h1>
          <p className="text-gray-600">Manage employee accounts and enrollment status</p>
        </div>
        <button
          onClick={onBackToLogin}
          className="btn-secondary flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Login</span>
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-800">{employees.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Enrolled</p>
                <p className="text-2xl font-bold text-green-600">
                  {employees.filter(emp => emp.enrollmentStatus === 'submitted').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">✓</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">
                  {employees.filter(emp => emp.enrollmentStatus === 'pending').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-bold">!</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Dependents</p>
                <p className="text-2xl font-bold text-purple-600">
                  {enrollments.reduce((sum, e) => sum + e.familyMembers.length + e.parentalCoverage.parents.length, 0)}
                </p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="card mb-8">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={downloadSampleTemplate}
                className="btn-secondary flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Sample Template</span>
              </button>

              <button
                onClick={() => setShowBulkUpload(!showBulkUpload)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>Bulk Upload</span>
              </button>

              <button
                onClick={downloadEnrollmentReport}
                className="btn-success flex items-center space-x-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Download Report</span>
              </button>
              
              <button
                onClick={handleAddEmployee}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Employee</span>
              </button>
            </div>
          </div>

          {/* Bulk Upload Section */}
          {showBulkUpload && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-3">Bulk Upload Employees</h4>
              <p className="text-sm text-blue-700 mb-4">
                Upload a CSV file with employee data. Download the sample template to see the required format.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleBulkUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          )}
        </div>
      </div>

      {/* Employee List */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium">Employee List</h3>
        </div>
        
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
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
                    Dependents
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Premium
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.map((employee) => {
                  const enrollmentDetails = getEmployeeEnrollmentDetails(employee);
                  return (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                          <div className="text-sm text-gray-500">{employee.emp_id}</div>
                          <div className="text-sm text-gray-500">{employee.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{employee.department || '—'}</div>
                        <div className="text-sm text-gray-500">{employee.designation || '—'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          employee.enrollmentStatus === 'submitted'
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {employee.enrollmentStatus === 'submitted' ? 'Enrolled' : 'Pending'}
                        </span>
                        {employee.enrollment_date && (
                          <div className="text-xs text-gray-500 mt-1">{employee.enrollment_date}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Family: {enrollmentDetails.familyCount}
                        </div>
                        <div className="text-sm text-gray-500">
                          Parental: {enrollmentDetails.parentalCoverage ? 'Yes' : 'No'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ₹{Math.round(enrollmentDetails.totalPremium).toLocaleString()}
                        </div>
                        {enrollmentDetails.totalPremium > 0 && (
                          <div className="text-xs text-gray-500">
                            ₹{Math.round(enrollmentDetails.totalPremium / 12).toLocaleString()}/month
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEditEmployee(employee)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded"
                            title="Edit employee"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(employee.id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded"
                            title="Delete employee"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredEmployees.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'No employees found matching your search.' : 'No employees found.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <UserModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        employee={editingEmployee}
      />
    </div>
  );
};

export default UserManagement;