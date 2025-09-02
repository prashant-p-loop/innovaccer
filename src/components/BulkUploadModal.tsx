import React, { useState, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import { X, Upload, Download, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Employee } from '../types';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ isOpen, onClose }) => {
  const { bulkUploadEmployees } = useUser();
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | 'processing' | null;
    message: string;
    count?: number;
  }>({ type: null, message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadSampleTemplate = () => {
    const csvHeaders = [
      'emp_id', 'name', 'email', 'date_of_birth', 'gender', 'mobile', 
      'joining_date', 'department', 'designation', 'salary', 
      'policy_start', 'policy_end', 'role'
    ];
    
    const sampleData = [
      'EMP001,John Doe,john.doe@company.com,15/01/1985,Male,9876543210,01/01/2024,Engineering,Developer,75000,01/04/2024,31/03/2025,employee',
      'EMP002,Jane Smith,jane.smith@company.com,22/03/1990,Female,9876543211,15/02/2024,HR,Manager,65000,01/04/2024,31/03/2025,employee',
      'EMP003,Admin User,admin@company.com,01/01/1980,Male,9999999999,01/01/2020,IT,Administrator,100000,01/04/2024,31/03/2025,admin'
    ];
    
    const csvContent = [csvHeaders.join(','), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const processCSVFile = (file: File) => {
    setUploadStatus({ type: 'processing', message: 'Processing file...' });
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          setUploadStatus({ 
            type: 'error', 
            message: 'File appears to be empty or has no data rows.' 
          });
          return;
        }
        
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const requiredFields = ['emp_id', 'name', 'email', 'date_of_birth', 'gender', 'mobile', 'joining_date'];
        
        const missingFields = requiredFields.filter(field => !headers.includes(field));
        if (missingFields.length > 0) {
          setUploadStatus({ 
            type: 'error', 
            message: `Missing required columns: ${missingFields.join(', ')}` 
          });
          return;
        }
        
        const employees: Omit<Employee, 'id'>[] = [];
        const errors: string[] = [];
        
        lines.slice(1).forEach((line, index) => {
          if (!line.trim()) return;
          
          const values = line.split(',').map(v => v.trim());
          const rowNum = index + 2;
          
          try {
            const emp: Omit<Employee, 'id'> = {
              emp_id: values[headers.indexOf('emp_id')] || '',
              name: values[headers.indexOf('name')] || '',
              email: values[headers.indexOf('email')] || '',
              date_of_birth: values[headers.indexOf('date_of_birth')] || '',
              gender: (values[headers.indexOf('gender')] === 'Female' ? 'Female' : 'Male') as 'Male' | 'Female',
              mobile: values[headers.indexOf('mobile')] || '',
              joining_date: values[headers.indexOf('joining_date')] || '',
              department: values[headers.indexOf('department')] || undefined,
              designation: values[headers.indexOf('designation')] || undefined,
              salary: values[headers.indexOf('salary')] ? Number(values[headers.indexOf('salary')]) : undefined,
              policy_start: values[headers.indexOf('policy_start')] || '01/04/2024',
              policy_end: values[headers.indexOf('policy_end')] || '31/03/2025',
              role: (values[headers.indexOf('role')] === 'admin' ? 'admin' : 'employee') as 'employee' | 'admin',
              enrolled: false,
              enrollmentStatus: 'pending',
              enrollmentDueDate: '31/03/2025'
            };
            
            // Validate required fields
            if (!emp.emp_id || !emp.name || !emp.email || !emp.mobile) {
              errors.push(`Row ${rowNum}: Missing required data`);
              return;
            }
            
            // Validate email format
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emp.email)) {
              errors.push(`Row ${rowNum}: Invalid email format`);
              return;
            }
            
            // Validate mobile format
            if (!/^\d{10}$/.test(emp.mobile)) {
              errors.push(`Row ${rowNum}: Invalid mobile number (must be 10 digits)`);
              return;
            }
            
            employees.push(emp);
          } catch (error) {
            errors.push(`Row ${rowNum}: Error processing data`);
          }
        });
        
        if (errors.length > 0) {
          setUploadStatus({ 
            type: 'error', 
            message: `Found ${errors.length} errors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...and more' : ''}` 
          });
          return;
        }
        
        if (employees.length === 0) {
          setUploadStatus({ 
            type: 'error', 
            message: 'No valid employee records found in the file.' 
          });
          return;
        }
        
        // Upload employees
        bulkUploadEmployees(employees);
        setUploadStatus({ 
          type: 'success', 
          message: `Successfully uploaded ${employees.length} employees!`,
          count: employees.length 
        });
        
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
      } catch (error) {
        setUploadStatus({ 
          type: 'error', 
          message: 'Error processing file. Please check the format and try again.' 
        });
      }
    };
    
    reader.onerror = () => {
      setUploadStatus({ 
        type: 'error', 
        message: 'Error reading file. Please try again.' 
      });
    };
    
    reader.readAsText(file);
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadStatus({ 
        type: 'error', 
        message: 'Please upload a CSV file only.' 
      });
      return;
    }
    
    processCSVFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileUpload(e.dataTransfer.files);
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
          <h3 className="modal-title">Bulk Upload Employees</h3>
          <button onClick={onClose} className="modal-close">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="modal-body">
          {/* Instructions */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Instructions:</h4>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Download the sample template to see the required format</li>
              <li>Fill in your employee data in the CSV file</li>
              <li>Upload the completed CSV file below</li>
              <li>Review any validation errors and fix them</li>
            </ol>
          </div>

          {/* Download Template Button */}
          <div className="mb-6">
            <button
              onClick={downloadSampleTemplate}
              className="btn-secondary flex items-center space-x-2 w-full justify-center"
            >
              <Download className="h-4 w-4" />
              <span>Download Sample Template</span>
            </button>
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop your CSV file here, or click to browse
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Only CSV files are supported
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Choose File
            </button>
          </div>

          {/* Upload Status */}
          {uploadStatus.type && (
            <div className={`mt-4 p-4 rounded-lg border ${
              uploadStatus.type === 'success' 
                ? 'bg-green-50 border-green-200' 
                : uploadStatus.type === 'error'
                ? 'bg-red-50 border-red-200'
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-start space-x-3">
                <AlertCircle className={`h-5 w-5 mt-0.5 ${
                  uploadStatus.type === 'success' 
                    ? 'text-green-600' 
                    : uploadStatus.type === 'error'
                    ? 'text-red-600'
                    : 'text-blue-600'
                }`} />
                <div>
                  <p className={`font-medium ${
                    uploadStatus.type === 'success' 
                      ? 'text-green-800' 
                      : uploadStatus.type === 'error'
                      ? 'text-red-800'
                      : 'text-blue-800'
                  }`}>
                    {uploadStatus.type === 'success' ? 'Success!' 
                     : uploadStatus.type === 'error' ? 'Error' 
                     : 'Processing...'}
                  </p>
                  <p className={`text-sm whitespace-pre-line ${
                    uploadStatus.type === 'success' 
                      ? 'text-green-700' 
                      : uploadStatus.type === 'error'
                      ? 'text-red-700'
                      : 'text-blue-700'
                  }`}>
                    {uploadStatus.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            {uploadStatus.type === 'success' ? 'Done' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;