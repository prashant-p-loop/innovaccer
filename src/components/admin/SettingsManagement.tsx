// src/components/admin/SettingsManagement.tsx
import React, { useState, useEffect } from 'react';
import { AdminService } from '../../services/adminService';
import { 
  Settings, 
  Save, 
  RefreshCcw, 
  Calendar, 
  DollarSign, 
  Users, 
  Building, 
  Mail,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface SettingsManagementProps {
  adminService: AdminService;
}

interface AdminSettings {
  enrollment_due_date: string;
  policy_start_date: string;
  policy_end_date: string;
  gst_rate: string;
  parental_single_rate: string;
  parental_double_rate: string;
  company_name: string;
  max_children: string;
  enable_pro_rata: string;
  notification_email: string;
  enrollment_window_days: string;
  reminder_frequency_days: string;
}

interface EnrollmentPeriod {
  id: string;
  period_name: string;
  start_date: string;
  end_date: string;
  policy_start_date: string;
  policy_end_date: string;
  is_active: boolean;
}

const SettingsManagement: React.FC<SettingsManagementProps> = ({ adminService }) => {
  const [settings, setSettings] = useState<AdminSettings>({
    enrollment_due_date: '',
    policy_start_date: '',
    policy_end_date: '',
    gst_rate: '',
    parental_single_rate: '',
    parental_double_rate: '',
    company_name: '',
    max_children: '',
    enable_pro_rata: '',
    notification_email: '',
    enrollment_window_days: '',
    reminder_frequency_days: ''
  });

  const [enrollmentPeriods, setEnrollmentPeriods] = useState<EnrollmentPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'premium' | 'periods' | 'notifications'>('general');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
    loadEnrollmentPeriods();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAdminSettings();
      setSettings(data as AdminSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      showMessage('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const loadEnrollmentPeriods = async () => {
    try {
      const data = await adminService.getEnrollmentPeriods();
      setEnrollmentPeriods(data);
    } catch (error) {
      console.error('Error loading enrollment periods:', error);
    }
  };

  const handleSettingChange = (key: keyof AdminSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        await adminService.updateAdminSetting(key, value);
      }
      showMessage('success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      showMessage('error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      try {
        await adminService.resetSettingsToDefaults();
        await loadSettings();
        showMessage('info', 'Settings reset to defaults');
      } catch (error) {
        console.error('Error resetting settings:', error);
        showMessage('error', 'Failed to reset settings');
      }
    }
  };

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const createEnrollmentPeriod = async () => {
    // This would open a modal to create new enrollment period
    // Implementation similar to the forms above
  };

  const activateEnrollmentPeriod = async (periodId: string) => {
    try {
      await adminService.activateEnrollmentPeriod(periodId);
      await loadEnrollmentPeriods();
      showMessage('success', 'Enrollment period activated');
    } catch (error) {
      console.error('Error activating period:', error);
      showMessage('error', 'Failed to activate enrollment period');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settings Management</h2>
          <p className="text-gray-600">Configure system settings and enrollment parameters</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={resetToDefaults}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
          >
            <RefreshCcw className="h-4 w-4" />
            <span>Reset</span>
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save All'}</span>
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800' 
            : message.type === 'error'
            ? 'bg-red-100 text-red-800'
            : 'bg-blue-100 text-blue-800'
        }`}>
          {message.type === 'success' && <CheckCircle className="h-5 w-5" />}
          {message.type === 'error' && <AlertCircle className="h-5 w-5" />}
          {message.type === 'info' && <Clock className="h-5 w-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'general'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>General</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('premium')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'premium'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Premium Rates</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('periods')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'periods'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Enrollment Periods</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'notifications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>Notifications</span>
            </div>
          </button>
        </nav>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">General Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building className="inline h-4 w-4 mr-1" />
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={settings.company_name}
                    onChange={(e) => handleSettingChange('company_name', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="inline h-4 w-4 mr-1" />
                    Maximum Children per Employee
                  </label>
                  <input
                    type="number"
                    value={settings.max_children}
                    onChange={(e) => handleSettingChange('max_children', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Policy Start Date
                  </label>
                  <input
                    type="date"
                    value={settings.policy_start_date}
                    onChange={(e) => handleSettingChange('policy_start_date', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Policy End Date
                  </label>
                  <input
                    type="date"
                    value={settings.policy_end_date}
                    onChange={(e) => handleSettingChange('policy_end_date', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Enrollment Due Date
                  </label>
                  <input
                    type="date"
                    value={settings.enrollment_due_date}
                    onChange={(e) => handleSettingChange('enrollment_due_date', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.enable_pro_rata === 'true'}
                      onChange={(e) => handleSettingChange('enable_pro_rata', e.target.checked ? 'true' : 'false')}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable Pro-rata Calculation</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Calculate premiums based on enrollment date and remaining policy period
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Premium Rates */}
          {activeTab === 'premium' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Premium Rate Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="inline h-4 w-4 mr-1" />
                    Single Parent Coverage Rate (₹)
                  </label>
                  <input
                    type="number"
                    value={settings.parental_single_rate}
                    onChange={(e) => handleSettingChange('parental_single_rate', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Annual premium for covering one parent
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="inline h-4 w-4 mr-1" />
                    Double Parent Coverage Rate (₹)
                  </label>
                  <input
                    type="number"
                    value={settings.parental_double_rate}
                    onChange={(e) => handleSettingChange('parental_double_rate', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Annual premium for covering two parents
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="inline h-4 w-4 mr-1" />
                    GST Rate (%)
                  </label>
                  <input
                    type="number"
                    value={settings.gst_rate}
                    onChange={(e) => handleSettingChange('gst_rate', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    step="0.01"
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    GST percentage applied to premiums (e.g., 18 for 18%)
                  </p>
                </div>

                <div className="md:col-span-2">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Premium Calculation Preview</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Single Parent: ₹{Number(settings.parental_single_rate).toLocaleString()}</div>
                      <div>Double Parent: ₹{Number(settings.parental_double_rate).toLocaleString()}</div>
                      <div>GST Rate: {settings.gst_rate}%</div>
                      <div className="border-t pt-1 mt-2">
                        <strong>Single Parent + GST: ₹{(Number(settings.parental_single_rate) * (1 + Number(settings.gst_rate) / 100)).toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enrollment Periods */}
          {activeTab === 'periods' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Enrollment Periods</h3>
                <button
                  onClick={createEnrollmentPeriod}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Create New Period
                </button>
              </div>

              <div className="space-y-4">
                {enrollmentPeriods.map((period) => (
                  <div key={period.id} className={`border rounded-lg p-4 ${
                    period.is_active ? 'border-green-200 bg-green-50' : 'border-gray-200'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{period.period_name}</h4>
                        <div className="text-sm text-gray-600 mt-1">
                          <div>Enrollment: {period.start_date} to {period.end_date}</div>
                          <div>Policy: {period.policy_start_date} to {period.policy_end_date}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {period.is_active && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            Active
                          </span>
                        )}
                        {!period.is_active && (
                          <button
                            onClick={() => activateEnrollmentPeriod(period.id)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Notification Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="inline h-4 w-4 mr-1" />
                    Admin Notification Email
                  </label>
                  <input
                    type="email"
                    value={settings.notification_email}
                    onChange={(e) => handleSettingChange('notification_email', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="admin@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Enrollment Window (Days)
                  </label>
                  <input
                    type="number"
                    value={settings.enrollment_window_days}
                    onChange={(e) => handleSettingChange('enrollment_window_days', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    min="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Days before due date to start sending reminders
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Reminder Frequency (Days)
                  </label>
                  <input
                    type="number"
                    value={settings.reminder_frequency_days}
                    onChange={(e) => handleSettingChange('reminder_frequency_days', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    min="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How often to send reminder emails
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SettingsManagement;