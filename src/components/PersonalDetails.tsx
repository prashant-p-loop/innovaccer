import React from 'react';
import { Employee } from '../types';
import { User, Mail, Phone, Calendar, MapPin } from 'lucide-react';

interface PersonalDetailsProps {
  employee: Employee;
}

const PersonalDetails: React.FC<PersonalDetailsProps> = ({ employee }) => {
  return (
    <div className="card mb-8">
      <div className="card-header">
        <h3 className="text-lg font-medium flex items-center">
          <User className="h-5 w-5 mr-2" />
          Personal Details
        </h3>
      </div>
      
      <div className="card-body">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <span className="field-label block">Employee ID</span>
            <span className="field-value block">{employee.emp_id}</span>
          </div>
          
          <div>
            <span className="field-label block">Name</span>
            <span className="field-value block">{employee.name}</span>
          </div>
          
          <div>
            <span className="field-label block flex items-center">
              <Mail className="h-4 w-4 mr-1" />
              Email
            </span>
            <span className="field-value block">{employee.email}</span>
          </div>
          
          <div>
            <span className="field-label block flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Date of Birth
            </span>
            <span className="field-value block">{employee.date_of_birth}</span>
          </div>
          
          <div>
            <span className="field-label block">Gender</span>
            <span className="field-value block">{employee.gender}</span>
          </div>
          
          <div>
            <span className="field-label block flex items-center">
              <Phone className="h-4 w-4 mr-1" />
              Mobile
            </span>
            <span className="field-value block">{employee.mobile}</span>
          </div>
          
          <div>
            <span className="field-label block">Joining Date</span>
            <span className="field-value block">{employee.joining_date}</span>
          </div>
          
          <div>
            <span className="field-label block">Department</span>
            <span className="field-value block">{employee.department || '—'}</span>
          </div>
          
          <div>
            <span className="field-label block">Policy Period</span>
            <span className="field-value block">
              {employee.policy_start} to {employee.policy_end}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalDetails;