// src/components/admin/BulkImport.tsx - Enhanced with batch support
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { AdminService } from '../../services/adminService';
import { 
  Upload, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText
} from 'lucide-react';

interface BulkImportProps {
  adminService: AdminService;
  onImportComplete: () => void;
}

interface ImportResult {
  success: boolean;
  message: string;
  employeeId?: string;
}

const BulkImport: React.FC<BulkImportProps> = ({ adminService, onImportComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [batchName, setBatchName] = useState('');
  const [batchDescription, setBatchDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleData = `emp_id,name,email,date_of_birth,gender,mobile,joining_date,department,designation,salary,policy_start,policy_end,enrollment_due_date
EMP001,John Doe,john.doe@company.com,1990-01-15,Male,9876543210,2023-01-01,Engineering,Software Developer,75000,2024-04-01,2025-03-31,2025-03-31
EMP002,Jane Smith,jane.smith@company.com,1988-05-20,Female,9876543211,2022-06-15,HR,HR Manager,65000,2024-04-01,2025-03-31,2025-03-31
EMP003,Mike Johnson,mike.johnson@company.com,1992-08-10,Male,9876543212,2023-03-01,Finance,Financial Analyst,60000,2024-04-01,2025-03-31,2025-03-31`;

  const handleFileSelect = (selectedFile: File) => {
    const fileName = selectedFile.name.toLowerCase();
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      alert('Please select a CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }
    setFile(selectedFile);
    setImportResults([]);
  };

  const processImport = async () => {
    if (!file) return;

    // Validate batch information
    if (!batchName.trim()) {
      alert('Please enter a batch name');
      return;
    }

    setImporting(true);
    setImportResults([]);

    try {
      // Get current user info for batch creation
      const currentUser = localStorage.getItem('currentEmployee');
      let uploaderName = 'Admin';
      
      if (currentUser) {
        try {
          const employee = JSON.parse(currentUser);
          uploaderName = employee.name || 'Admin';
        } catch (e) {
          console.warn('Could not parse current employee');
        }
      }

      // Create upload batch first
      const batchId = await adminService.createUploadBatch(
        batchName.trim(),
        batchDescription.trim() || `Bulk import from ${file.name}`,
        uploaderName // Use actual user name, but UUID will be used internally
      );

      let data: any[][] = [];
      
      // Handle different file formats
      if (file.name.toLowerCase().endsWith('.csv')) {
        // Process CSV file
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        data = lines.map(line => line.split(',').map(cell => cell.trim()));
      } else {
        // Process Excel file
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      }
      
      if (data.length === 0) {
        setImportResults([{
          success: false,
          message: 'File appears to be empty'
        }]);
        return;
      }
      
      const headers = data[0].map((h: any) => String(h || '').trim().toLowerCase());
      
      const requiredFields = ['emp_id', 'name', 'email', 'date_of_birth', 'gender', 'mobile', 'joining_date', 'department'];
      const missingFields = requiredFields.filter(field => !headers.includes(field));
      
      if (missingFields.length > 0) {
        setImportResults([{
          success: false,
          message: `Missing required columns: ${missingFields.join(', ')}`
        }]);
        setImporting(false);
        return;
      }

      const results: ImportResult[] = [];

      for (let i = 1; i < data.length; i++) {
        const values = data[i].map((v: any) => String(v || '').trim());
        
        // Skip empty rows
        if (values.every(v => !v)) continue;
        
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        // Basic validation
        if (!row.emp_id || !row.name || !row.email) {
          results.push({
            success: false,
            message: `Row ${i + 1}: Missing required fields (emp_id, name, or email)`,
            employeeId: row.emp_id
          });
          continue;
        }

        try {
          await adminService.createEmployee({
            emp_id: row.emp_id,
            name: row.name,
            email: row.email,
            date_of_birth: row.date_of_birth,
            gender: row.gender === 'Female' ? 'Female' : 'Male',
            mobile: row.mobile,
            joining_date: row.joining_date,
            department: row.department,
            designation: row.designation || '',
            salary: parseFloat(row.salary) || 0,
            policy_start: row.policy_start || '2024-04-01',
            policy_end: row.policy_end || '2025-03-31',
            enrollment_due_date: row.enrollment_due_date || '2025-03-31'
          }, batchId); // Pass batchId to createEmployee

          results.push({
            success: true,
            message: `Successfully imported ${row.name}`,
            employeeId: row.emp_id
          });
        } catch (error: any) {
          results.push({
            success: false,
            message: `Failed to import ${row.name}: ${error.message}`,
            employeeId: row.emp_id
          });
        }
      }

      setImportResults(results);
      const successCount = results.filter(r => r.success).length;
      
      if (successCount > 0) {
        onImportComplete();
        // Clear form after successful import
        setBatchName('');
        setBatchDescription('');
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }

    } catch (error: any) {
      setImportResults([{
        success: false,
        message: `Import failed: ${error.message}`
      }]);
    } finally {
      setImporting(false);
    }
  };

  const downloadSample = () => {
    // Create Excel file with sample data
    const headers = ['emp_id', 'name', 'email', 'date_of_birth', 'gender', 'mobile', 'joining_date', 'department', 'designation', 'salary', 'policy_start', 'policy_end', 'enrollment_due_date'];
    
    const sampleRows = [
      ['EMP001', 'John Doe', 'john.doe@company.com', '1985-01-15', 'Male', '9876543210', '2024-01-01', 'Engineering', 'Developer', '75000', '2024-04-01', '2025-03-31', '2025-03-31'],
      ['EMP002', 'Jane Smith', 'jane.smith@company.com', '1990-03-22', 'Female', '9876543211', '2024-02-15', 'HR', 'Manager', '65000', '2024-04-01', '2025-03-31', '2025-03-31'],
      ['EMP003', 'Mike Johnson', 'mike.johnson@company.com', '1992-08-10', 'Male', '9876543212', '2024-03-01', 'Finance', 'Analyst', '60000', '2024-04-01', '2025-03-31', '2025-03-31']
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    
    // Set column widths for better readability
    const colWidths = [
      { wch: 10 }, // emp_id
      { wch: 15 }, // name
      { wch: 25 }, // email
      { wch: 12 }, // date_of_birth
      { wch: 8 },  // gender
      { wch: 12 }, // mobile
      { wch: 12 }, // joining_date
      { wch: 15 }, // department
      { wch: 15 }, // designation
      { wch: 10 }, // salary
      { wch: 12 }, // policy_start
      { wch: 12 }, // policy_end
      { wch: 15 }  // enrollment_due_date
    ];
    worksheet['!cols'] = colWidths;
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Template');
    
    // Download as Excel file
    XLSX.writeFile(workbook, 'employee-import-template.xlsx');
  };

  const successCount = importResults.filter(r => r.success).length;
  const errorCount = importResults.filter(r => !r.success).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bulk Import Employees</h2>
          <p className="text-gray-600">Upload a CSV or Excel file to add multiple employees in a batch</p>
        </div>
        <button
          onClick={downloadSample}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Download Sample Template</span>
        </button>
      </div>

      {/* Batch Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Batch Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batch Name *
            </label>
            <input
              type="text"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              placeholder="e.g., Q1 2024 New Hires"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <input
              type="text"
              value={batchDescription}
              onChange={(e) => setBatchDescription(e.target.value)}
              placeholder="Brief description of this batch"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <p className="text-lg font-medium text-gray-900">
              {file ? file.name : 'Select CSV or Excel file to upload'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              or{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-500"
              >
                browse to choose a file
              </button>
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />
        </div>

        {file && batchName.trim() && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={processImport}
              disabled={importing}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {importing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing Import...</span>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  <span>Import Employees</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Import Results */}
      {importResults.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Import Results</h3>
            <div className="flex items-center space-x-4 mt-2 text-sm">
              <span className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                {successCount} successful
              </span>
              <span className="flex items-center text-red-600">
                <XCircle className="h-4 w-4 mr-1" />
                {errorCount} failed
              </span>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {importResults.map((result, index) => (
              <div
                key={index}
                className={`px-6 py-3 border-b border-gray-100 flex items-center space-x-3 ${
                  result.success ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                    {result.message}
                  </p>
                  {result.employeeId && (
                    <p className="text-xs text-gray-500">Employee ID: {result.employeeId}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">CSV Format Requirements</h4>
            <div className="text-sm text-blue-700 space-y-2">
              <p><strong>Required columns:</strong> emp_id, name, email, date_of_birth, gender, mobile, joining_date, department</p>
              <p><strong>Optional columns:</strong> designation, salary, policy_start, policy_end, enrollment_due_date</p>
              <p><strong>Supported formats:</strong> CSV (.csv), Excel (.xlsx, .xls)</p>
              <div className="space-y-1">
                <p><strong>Format guidelines:</strong></p>
                <ul className="ml-4 space-y-1">
                  <li>• <strong>Date Format:</strong> Use YYYY-MM-DD format (e.g., 2024-01-15 for January 15, 2024)</li>
                  <li>• Gender should be "Male" or "Female"</li>
                  <li>• Employee IDs must be unique</li>
                  <li>• Email addresses must be valid</li>
                  <li>• Mobile numbers should be 10 digits</li>
                  <li>• All date columns: date_of_birth, joining_date, policy_start, policy_end, enrollment_due_date</li>
                </ul>
              </div>
              <div className="mt-3 p-3 bg-blue-100 rounded">
                <p className="font-medium text-blue-800">Batch Management:</p>
                <p className="text-blue-700">Each upload creates a new batch that can be tracked and reported on separately. This helps you manage different groups of employees (e.g., quarterly hires, department transfers, etc.)</p>
              </div>
              <p className="mt-3 text-blue-600">
                <strong>Important:</strong> Download the sample Excel template to see the correct date format (YYYY-MM-DD). Both CSV and Excel formats are supported, but dates must always be in YYYY-MM-DD format.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkImport;