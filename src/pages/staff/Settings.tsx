import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { logout } from '../../lib/auth';
import { toast } from 'sonner';
import {
  User,
  Bell,
  Shield,
  Building2,
  Eye,
  EyeOff,
  Save,
  Check,
  ShieldCheck,
  CheckCheck,
  BellOff,
} from 'lucide-react';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getActivityLog,
  addActivityLog,
  type AppNotification,
  type ActivityLogEntry,
} from '../../lib/store';

type Tab = 'profile' | 'notifications' | 'system' | 'security';

// ── Reusable sub-components ──────────────────────────────────────────────────

function SectionCard({ title, description, children }: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <div className="mb-6">
        <h3 className="text-white font-bold text-lg">{title}</h3>
        <p className="text-gray-400 text-sm mt-1">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-500 mt-1.5">{hint}</p>}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled,
  autoComplete,
}: {
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete={autoComplete}
      className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
    />
  );
}

function Toggle({ checked, onChange, label, description }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start justify-between py-4 border-b border-gray-700 last:border-0">
      <div className="pr-4">
        <p className="text-white text-sm font-medium">{label}</p>
        <p className="text-gray-400 text-xs mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-800 ${
          checked ? 'bg-primary' : 'bg-gray-600'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function SaveButton({ onClick, saved }: { onClick: () => void; saved: boolean }) {
  return (
    <div className="flex justify-end pt-2">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
      >
        {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? 'Saved' : 'Save Changes'}
      </button>
    </div>
  );
}

// ── Tab Sections ─────────────────────────────────────────────────────────────

const ADMIN_PROFILE_KEY = 'adminProfile';
const ADMIN_PASSWORD_KEY = 'fredviv_admin_pwd';

function getAdminPassword(): string {
  return localStorage.getItem(ADMIN_PASSWORD_KEY) || 'Admin@2024';
}

function ProfileSection() {
  const stored = (() => { try { return JSON.parse(localStorage.getItem(ADMIN_PROFILE_KEY) || '{}'); } catch { return {}; } })();

  const [phone, setPhone] = useState(stored.phone ?? '');
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [currentPwdVerified, setCurrentPwdVerified] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [pwdSaved, setPwdSaved] = useState(false);

  const handleSaveProfile = () => {
    localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify({ phone }));
    setProfileSaved(true);
    toast.success('Profile updated successfully');
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleVerifyCurrentPwd = () => {
    if (!currentPwd) {
      toast.error('Please enter your current password');
      return;
    }
    if (currentPwd !== getAdminPassword()) {
      toast.error('Current password is incorrect');
      return;
    }
    setCurrentPwdVerified(true);
    toast.success('Password verified — enter your new password below');
  };

  const handleSavePassword = () => {
    if (!newPwd || !confirmPwd) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPwd.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    localStorage.setItem(ADMIN_PASSWORD_KEY, newPwd);
    addActivityLog({ action: 'Admin password changed', type: 'security' });
    setPwdSaved(true);
    toast.success('Password changed successfully');
    setCurrentPwd('');
    setNewPwd('');
    setConfirmPwd('');
    setCurrentPwdVerified(false);
    setTimeout(() => setPwdSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title="Personal Information"
        description="Update your account name, email address, and contact details."
      >
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <Field label="Full Name">
            <TextInput value="Administrator" disabled autoComplete="off" />
          </Field>
          <Field label="Email Address" hint="Admin email cannot be changed here.">
            <TextInput value="admin@fredvivoil.com" type="email" disabled autoComplete="off" />
          </Field>
          <Field label="Phone Number">
            <TextInput value={phone} onChange={setPhone} type="tel" placeholder="Enter phone number" autoComplete="off" />
          </Field>
          <Field label="Role">
            <TextInput value="Super Administrator" disabled />
          </Field>
        </div>
        <SaveButton onClick={handleSaveProfile} saved={profileSaved} />
      </SectionCard>

      <SectionCard
        title="Change Password"
        description="Choose a strong password that is at least 8 characters long."
      >
        <div className="space-y-4 mb-6">
          {/* Step 1: Verify current password */}
          <Field label="Current Password">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <TextInput
                  value={currentPwd}
                  onChange={(v) => { setCurrentPwd(v); setCurrentPwdVerified(false); }}
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="Enter current password"
                  autoComplete="off"
                  disabled={currentPwdVerified}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {currentPwdVerified ? (
                <div className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm flex-shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                  Verified
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleVerifyCurrentPwd}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-lg transition-colors flex-shrink-0"
                >
                  Verify
                </button>
              )}
            </div>
          </Field>

          {/* Step 2: New password fields — only shown after verification */}
          {currentPwdVerified && (
            <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-gray-700">
              <Field label="New Password">
                <div className="relative">
                  <TextInput
                    value={newPwd}
                    onChange={setNewPwd}
                    type={showNew ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
              <Field label="Confirm New Password">
                <TextInput
                  value={confirmPwd}
                  onChange={setConfirmPwd}
                  type="password"
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                />
              </Field>
            </div>
          )}
        </div>
        {currentPwdVerified && <SaveButton onClick={handleSavePassword} saved={pwdSaved} />}
      </SectionCard>
    </div>
  );
}

function NotificationsSection() {
  const ADMIN_ID = 'admin';
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    getNotifications(ADMIN_ID)
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = (id: string) => {
    markNotificationRead(id);
    setNotifications(getNotifications(ADMIN_ID));
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead(ADMIN_ID);
    setNotifications(getNotifications(ADMIN_ID));
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-NG', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title="Notifications"
        description="System notifications generated by staff actions across the portal."
      >
        {notifications.length > 0 && unreadCount > 0 && (
          <div className="flex justify-end mb-4">
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all as read
            </button>
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
              <BellOff className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-gray-400 font-medium text-sm">No notifications yet</p>
            <p className="text-gray-500 text-xs text-center">
              You'll see alerts here when managers submit reports, expenses, or balance requests.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.read && handleMarkRead(notif.id)}
                className={`flex items-start gap-3 p-3.5 rounded-lg border transition-colors ${
                  notif.read
                    ? 'border-gray-700 bg-transparent opacity-60'
                    : 'border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10'
                }`}
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${notif.read ? 'bg-gray-600' : 'bg-primary'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${notif.read ? 'text-gray-400' : 'text-white'}`}>
                      {notif.title}
                    </p>
                    {!notif.read && (
                      <span className="text-xs px-1.5 py-0.5 bg-primary/20 text-primary rounded-full flex-shrink-0">NEW</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{notif.body}</p>
                  <p className="text-xs text-gray-600 mt-1">{formatTime(notif.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function SystemSection() {
  const [companyName, setCompanyName] = useState('Fredviv Oil and Gas Limited');
  const [reportDeadline, setReportDeadline] = useState('18:00');
  const [balanceDuration, setBalanceDuration] = useState('30');
  const [pinLength, setPinLength] = useState('6');
  const [timezone, setTimezone] = useState('Africa/Lagos');
  const [currency, setCurrency] = useState('NGN');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    toast.success('System settings saved');
    setTimeout(() => setSaved(false), 2000);
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

function SecuritySection() {
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [requirePinForBalance, setRequirePinForBalance] = useState(true);
  const [logActivity, setLogActivity] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>(getActivityLog);

  const typeColors: Record<string, string> = {
    security: 'text-red-400',
    user: 'text-blue-400',
    price: 'text-yellow-400',
    balance: 'text-green-400',
    expense: 'text-purple-400',
  };

  const handleSave = () => {
    setSaved(true);
    toast.success('Security settings saved');
    setTimeout(() => setSaved(false), 2000);
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
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Alert preferences' },
  { id: 'system', label: 'System', icon: Building2, description: 'Operational rules' },
  { id: 'security', label: 'Security', icon: Shield, description: 'Access & activity log' },
];

export function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const handleLogout = () => { logout(); navigate('/staff/login'); };

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role="admin" onLogout={handleLogout} />

      <div className="flex-1 overflow-x-hidden">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-gray-400 text-sm">Manage your account, notifications, and system configuration</p>
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
              {activeTab === 'profile' && <ProfileSection />}
              {activeTab === 'notifications' && <NotificationsSection />}
              {activeTab === 'system' && <SystemSection />}
              {activeTab === 'security' && <SecuritySection />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
