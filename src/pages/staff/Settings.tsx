import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { logout } from '../../lib/auth';
import { toast } from 'sonner';
import {
  User,
  Shield,
  Building2,
} from 'lucide-react';
import { 
  SectionCard, 
  Field, 
  TextInput, 
  Toggle, 
  SaveButton 
} from '../../components/dashboard/SettingsComponents';
import { ProfileSection } from './ProfileSection'; // Corrected import path
import {
  type ActivityLogEntry,
} from '../../lib/store';
import { api } from '../../lib/api';
import { getSession } from '../../lib/auth'; // Import getSession from lib/auth

type Tab = 'profile' | 'system' | 'security';

// ── Tab Sections ─────────────────────────────────────────────────────────────

interface SystemSectionProps {
  settings: any;
  onSave: (updated: any) => Promise<boolean>;
}

function SystemSection({ settings, onSave }: SystemSectionProps) {
  const [companyName, setCompanyName] = useState(settings?.companyName || 'Fredviv Oil and Gas Limited');
  const [reportDeadline, setReportDeadline] = useState(settings?.reportDeadline || '18:00');
  const [balanceDuration, setBalanceDuration] = useState(settings?.balanceDuration || '30');
  const [pinLength, setPinLength] = useState(settings?.pinLength || '6');
  const [timezone, setTimezone] = useState(settings?.timezone || 'Africa/Lagos');
  const [currency, setCurrency] = useState(settings?.currency || 'NGN');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.companyName || 'Fredviv Oil and Gas Limited');
      setReportDeadline(settings.reportDeadline || '18:00');
      setBalanceDuration(settings.balanceDuration || '30');
      setPinLength(settings.pinLength || '6');
      setTimezone(settings.timezone || 'Africa/Lagos');
      setCurrency(settings.currency || 'NGN');
    }
  }, [settings]);

  const handleSave = async () => {
    const ok = await onSave({
      companyName,
      reportDeadline,
      balanceDuration,
      pinLength,
      timezone,
      currency,
    });
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title="Company Information"
        description="Basic details displayed across the staff portal."
      >
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <Field label="Company Name" hint="Shown on login screen and portal headers">
            <TextInput value={companyName} onChange={setCompanyName} />
          </Field>
          <Field label="Default Currency">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="NGN">NGN — Nigerian Naira (₦)</option>
              <option value="USD">USD — US Dollar ($)</option>
              <option value="GBP">GBP — British Pound (£)</option>
            </select>
          </Field>
          <Field label="Timezone">
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Africa/Lagos">Africa/Lagos (WAT, UTC+1)</option>
              <option value="UTC">UTC</option>
            </select>
          </Field>
        </div>
        <SaveButton onClick={handleSave} saved={saved} />
      </SectionCard>

      <SectionCard
        title="Operational Rules"
        description="Configure the rules that govern daily operations across all branches."
      >
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <Field
            label="Daily Report Deadline"
            hint="Managers must submit their sales report before this time"
          >
            <input
              type="time"
              value={reportDeadline}
              onChange={(e) => setReportDeadline(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </Field>

          <Field
            label="Balance Visibility Duration (seconds)"
            hint="How long the account balance remains visible after admin approval"
          >
            <select
              value={balanceDuration}
              onChange={(e) => setBalanceDuration(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="15">15 seconds</option>
              <option value="30">30 seconds</option>
              <option value="60">60 seconds</option>
              <option value="120">2 minutes</option>
            </select>
          </Field>

          <Field
            label="Balance Request PIN Length"
            hint="Number of digits required in the accountant / auditor PIN"
          >
            <select
              value={pinLength}
              onChange={(e) => setPinLength(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="4">4 digits</option>
              <option value="6">6 digits</option>
            </select>
          </Field>
        </div>
        <SaveButton onClick={handleSave} saved={saved} />
      </SectionCard>
    </div>
  );
}

interface SecuritySectionProps {
  settings: any;
  onSave: (updated: any) => Promise<boolean>;
}

function SecuritySection({ settings, onSave }: SecuritySectionProps) {
  const [sessionTimeout, setSessionTimeout] = useState(settings?.sessionTimeout || '60');
  const [requirePinForBalance, setRequirePinForBalance] = useState(settings?.requirePinForBalance !== false);
  const [logActivity, setLogActivity] = useState(settings?.logActivity !== false);
  const [twoFactor, setTwoFactor] = useState(!!settings?.twoFactor);
  const [saved, setSaved] = useState(false);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);

  useEffect(() => {
    if (settings) {
      setSessionTimeout(settings.sessionTimeout || '60');
      setRequirePinForBalance(settings.requirePinForBalance !== false);
      setLogActivity(settings.logActivity !== false);
      setTwoFactor(!!settings.twoFactor);
    }
  }, [settings]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await api.get('/activity-logs');
        setActivityLog(data);
      } catch (error) {
        console.error('Failed to fetch activity logs');
      }
    };
    fetchLogs();
  }, []);

  const typeColors: Record<string, string> = {
    security: 'text-red-400',
    user: 'text-blue-400',
    price: 'text-yellow-400',
    balance: 'text-green-400',
    expense: 'text-purple-400',
  };

  const handleSave = async () => {
    const ok = await onSave({
      sessionTimeout,
      requirePinForBalance,
      logActivity,
      twoFactor,
    });
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title="Access & Session"
        description="Control how sessions and sensitive actions are handled across the portal."
      >
        <div className="mb-6">
          <div className="mb-4">
            <Field
              label="Session Timeout"
              hint="Automatically log out inactive users after this period"
            >
              <select
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="w-full sm:w-64 px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
                <option value="480">8 hours</option>
              </select>
            </Field>
          </div>

          <div className="divide-y divide-gray-700">
            <Toggle
              checked={requirePinForBalance}
              onChange={setRequirePinForBalance}
              label="Require PIN for Balance Requests"
              description="Accountants and auditors must enter a PIN before balance visibility is granted"
            />
            <Toggle
              checked={logActivity}
              onChange={setLogActivity}
              label="Log Admin Activity"
              description="Keep a record of all admin actions including approvals, user changes, and price updates"
            />
            <Toggle
              checked={twoFactor}
              onChange={setTwoFactor}
              label="Two-Factor Authentication"
              description="Require an OTP in addition to password when logging in to the admin portal"
            />
          </div>
        </div>
        <SaveButton onClick={handleSave} saved={saved} />
      </SectionCard>

      <SectionCard
        title="Recent Admin Activity"
        description="A log of actions taken in the portal by this admin account."
      >
        {activityLog.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No activity recorded yet.</p>
        ) : (
          <div className="space-y-0 divide-y divide-gray-700">
            {activityLog.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-3">
                <p className={`text-sm font-medium ${typeColors[entry.type] ?? 'text-gray-300'}`}>
                  {entry.action}
                </p>
                <span className="text-xs text-gray-500 text-right flex-shrink-0 ml-4">
                  {entry.time}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ── Main Settings Page ────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'profile', label: 'Profile', icon: User, description: 'Personal info & password' },
  { id: 'system', label: 'System', icon: Building2, description: 'Operational rules' },
  { id: 'security', label: 'Security', icon: Shield, description: 'Access & activity log' },
];

export function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [settings, setSettings] = useState<any>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const fetchSettings = async () => {
    try {
      const data = await api.get('/settings');
      setSettings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (updated: any) => {
    try {
      const data = await api.patch('/settings', updated);
      setSettings(data);
      toast.success('Settings saved successfully');
      return true;
    } catch (e) {
      toast.error('Failed to save settings');
      return false;
    }
  };

  const handleLogout = () => { logout(); navigate('/staff/login'); };

  if (loadingSettings) {
    return <div className="animate-pulse space-y-4 p-6"><div className="h-32 bg-gray-800 rounded-xl" /></div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role="ADMIN" onLogout={handleLogout} />

      <div className="flex-1 overflow-x-hidden">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-gray-400 text-sm">Manage your account and system configuration</p>
          </div>
        </header>

        <main className="p-6">
          <div className="max-w-5xl mx-auto flex gap-6 items-start">
            {/* Tab Nav */}
            <nav className="w-56 flex-shrink-0 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden sticky top-24">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-gray-700 last:border-0 ${
                      isActive
                        ? 'bg-primary/10 border-r-2 border-r-primary text-white'
                        : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight">{tab.label}</p>
                      <p className="text-xs text-gray-500 leading-tight mt-0.5">{tab.description}</p>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Tab Content */}
            <div className="flex-1 min-w-0">
              {activeTab === 'profile' && <ProfileSection roleLabel="Super Administrator" isAdmin={true} />}
              {activeTab === 'system' && <SystemSection settings={settings} onSave={handleSaveSettings} />}
              {activeTab === 'security' && <SecuritySection settings={settings} onSave={handleSaveSettings} />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
