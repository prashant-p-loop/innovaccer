import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { X } from 'lucide-react';
import { Employee } from '../types';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, employee }) => {
  const { addEmployee, updateEmployee } = useUser();
  const [formData, setFormData] = useState({
    emp_id: '',
    name: '',
    email: '',
    date_of_birth: '',
    gender: 'Male',
    mobile: '',
    joining_date: '',
    department: '',
    designation: '',
    salary: '',
    policy_start: '01/04/2024',
    policy_end: '31/03/2025',
    enrollmentDueDate: '31/03/2025',
    role: 'employee'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (employee) {
        // Edit mode
        setFormData({
          emp_id: employee.emp_id,
          name: employee.name,
          email: employee.email,
          date_of_birth: employee.date_of_birth,
          gender: employee.gender,
          mobile: employee.mobile,
          joining_date: employee.joining_date,
          department: employee.department || '',
          designation: employee.designation || '',
          salary: employee.salary?.toString() || '',
          policy_start: employee.policy_start,
          policy_end: employee.policy_end,
          enrollmentDueDate: employee.enrollmentDueDate || '31/03/2025',
          role: employee.role || 'employee'
        });
      } else {
        // Add mode
        setFormData({
          emp_id: '',
          name: '',
          email: '',
          date_of_birth: '',
          gender: 'Male',
          mobile: '',
          joining_date: '',
          department: '',
          designation: '',
          salary: '',
          policy_start: '01/04/2024',
          policy_end: '31/03/2025',
          enrollmentDueDate: '31/03/2025',
          role: 'employee'
        });
      }
      setErrors({});
    }
  }, [isOpen, employee]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.emp_id.trim()) {
      newErrors.emp_id = 'Employee ID is required';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.date_of_birth.trim()) {
      newErrors.date_of_birth = 'Date of birth is required';
    }
    
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number';
    }
    
    if (!formData.joining_date.trim()) {
      newErrors.joining_date = 'Joining date is required';
    }
    
    if (!formData.enrollmentDueDate.trim()) {
      newErrors.enrollmentDueDate = 'Enrollment due date is required';
    }
    
    if (formData.salary && isNaN(Number(formData.salary))) {
      newErrors.salary = 'Please enter a valid salary amount';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const employeeData = {
      emp_id: formData.emp_id.trim(),
      name: formData.name.trim(),
      email: formData.email.trim(),
      date_of_birth: formData.date_of_birth,
      gender: formData.gender as 'Male' | 'Female',
      mobile: formData.mobile.trim(),
      joining_date: formData.joining_date,
      department: formData.department.trim() || undefined,
      designation: formData.designation.trim() || undefined,
      salary: formData.salary ? Number(formData.salary) : undefined,
      policy_start: formData.policy_start,
      policy_end: formData.policy_end,
      enrollmentDueDate: formData.enrollmentDueDate,
      role: formData.role as 'employee' | 'admin'
    };
    
    if (employee) {
      updateEmployee(employee.id, employeeData);
    } else {
      addEmployee(employeeData);
    }
    
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop active" onClick={handleBackdropClick}>
      <div className="modal-container">
        <div className="modal-header">
          <h3 className="modal-title">
            {employee ? 'Edit Employee' : 'Add New Employee'}
          </h3>
          <button onClick={onClose} className="modal-close">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Employee ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID *
                </label>
                <input
                  type="text"
                  value={formData.emp_id}
                  onChange={(e) => handleChange('emp_id', e.target.value)}
                  placeholder="Enter employee ID"
                  className={`w-full ${errors.emp_id ? 'border-red-500' : ''}`}
                />
                {errors.emp_id && <p className="validation-error">{errors.emp_id}</p>}
              </div>
              
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter full name"
                  className={`w-full ${errors.name ? 'border-red-500' : ''}`}
                />
                {errors.name && <p className="validation-error">{errors.name}</p>}
              </div>
              
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Enter email address"
                  className={`w-full ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && <p className="validation-error">{errors.email}</p>}
              </div>
              
              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleChange('date_of_birth', e.target.value)}
                  className={`w-full ${errors.date_of_birth ? 'border-red-500' : ''}`}
                />
                {errors.date_of_birth && <p className="validation-error">{errors.date_of_birth}</p>}
              </div>
              
              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="w-full"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              
              {/* Mobile */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => handleChange('mobile', e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  className={`w-full ${errors.mobile ? 'border-red-500' : ''}`}
                />
                {errors.mobile && <p className="validation-error">{errors.mobile}</p>}
              </div>
              
              {/* Joining Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Joining Date *
                </label>
                <input
                  type="date"
                  value={formData.joining_date}
                  onChange={(e) => handleChange('joining_date', e.target.value)}
                  className={`w-full ${errors.joining_date ? 'border-red-500' : ''}`}
                />
                {errors.joining_date && <p className="validation-error">{errors.joining_date}</p>}
              </div>
              
              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  placeholder="Enter department"
                  className="w-full"
                />
              </div>
              
              {/* Designation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Designation
                </label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => handleChange('designation', e.target.value)}
                  placeholder="Enter designation"
                  className="w-full"
                />
              </div>
              
              {/* Salary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Salary
                </label>
                <input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => handleChange('salary', e.target.value)}
                  placeholder="Enter monthly salary"
                  className={`w-full ${errors.salary ? 'border-red-500' : ''}`}
                />
                {errors.salary && <p className="validation-error">{errors.salary}</p>}
              </div>
              
              {/* Policy Start */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Policy Start Date
                </label>
                <input
                  type="date"
                  value={formData.policy_start}
                  onChange={(e) => handleChange('policy_start', e.target.value)}
                  className="w-full"
                />
              </div>
              
              {/* Policy End */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Policy End Date
                </label>
                <input
                  type="date"
                  value={formData.policy_end}
                  onChange={(e) => handleChange('policy_end', e.target.value)}
                  className="w-full"
                />
              </div>
              
              {/* Enrollment Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enrollment Due Date *
                </label>
                <input
                  type="date"
                  value={formData.enrollmentDueDate}
                  onChange={(e) => handleChange('enrollmentDueDate', e.target.value)}
                  className={`w-full ${errors.enrollmentDueDate ? 'border-red-500' : ''}`}
                />
                {errors.enrollmentDueDate && <p className="validation-error">{errors.enrollmentDueDate}</p>}
              </div>
              
              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  className="w-full"
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {employee ? 'Update Employee' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;