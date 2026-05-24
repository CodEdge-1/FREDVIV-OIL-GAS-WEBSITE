import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { getSession, logout, Role } from '../../lib/auth'; // Import Role
import { type AppNotification } from '../../lib/store'; // Keep type for now, will replace with backend type
import { toast } from 'sonner';
import {
  // useEffect is now imported from 'react'
  User,
  Bell,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Save,
  Check,
  ShieldCheck,
  CheckCheck,
  BellOff,
} from 'lucide-react';
import { api } from '../../lib/api';
import { ProfileSection } from './ProfileSection';

type Tab = 'profile' | 'notifications' | 'preferences';


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

function NotificationsInbox({ recipientId }: { recipientId: string }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const fetchNotifications = async () => {
    if (!recipientId) return;
    try {
      const data = await api.get(`/users/${recipientId}/notifications`);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications.');
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [recipientId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (id: string) => {
    try {
      await api.patch(`/users/${recipientId}/notifications/${id}`, { read: true });
      fetchNotifications(); // Re-fetch to update UI
    } catch (error) {
      toast.error('Failed to mark notification as read.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch(`/users/${recipientId}/notifications/mark-all-read`);
      fetchNotifications(); // Re-fetch to update UI
    } catch (error) {
      toast.error('Failed to mark all notifications as read.');
    }
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
        description="Alerts and updates from admin about your account and requests."
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
              You'll be notified here when admin approves your balance requests or sends updates.
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

function AccountantPreferences() {
  const [defaultFilter, setDefaultFilter] = useState('all');
  const [dateFormat, setDateFormat] = useState('dd-mm-yyyy');
  const [showRunningBalance, setShowRunningBalance] = useState(false);
  const [groupByDate, setGroupByDate] = useState(true);
  const [confirmPinRequest, setConfirmPinRequest] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    toast.success('Preferences saved');
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title="Transaction View"
        description="Customise how the transaction feed and financial data are displayed."
      >
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <Field
            label="Default Transaction Filter"
            hint="Which transactions are shown when you first open the feed"
          >
            <select
              value={defaultFilter}
              onChange={(e) => setDefaultFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Transactions</option>
              <option value="credit">Credits Only</option>
              <option value="debit">Debits Only</option>
            </select>
          </Field>

          <Field
            label="Date Format"
            hint="How dates are displayed across the portal"
          >
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="dd-mm-yyyy">DD-MM-YYYY (e.g. 06-03-2026)</option>
              <option value="mm-dd-yyyy">MM-DD-YYYY (e.g. 03-06-2026)</option>
              <option value="yyyy-mm-dd">YYYY-MM-DD (e.g. 2026-03-06)</option>
            </select>
          </Field>
        </div>

        <div className="divide-y divide-gray-700 mb-4">
          <Toggle
            checked={showRunningBalance}
            onChange={setShowRunningBalance}
            label="Show Running Balance Column"
            description="Add a cumulative balance column alongside each entry in the transaction table"
          />
          <Toggle
            checked={groupByDate}
            onChange={setGroupByDate}
            label="Group Transactions by Date"
            description="Organise the transaction feed into date groups for easier scanning"
          />
          <Toggle
            checked={confirmPinRequest}
            onChange={setConfirmPinRequest}
            label="Confirm Before Sending Balance Request"
            description="Show a confirmation prompt before submitting your PIN for balance visibility"
          />
        </div>
        <SaveButton onClick={handleSave} saved={saved} />
      </SectionCard>
    </div>
  );
}

function AuditorPreferences() {
  const [defaultPeriod, setDefaultPeriod] = useState('daily');
  const [dateFormat, setDateFormat] = useState('dd-mm-yyyy');
  const [highlightDiscrepancies, setHighlightDiscrepancies] = useState(true);
  const [showBranchComparison, setShowBranchComparison] = useState(true);
  const [confirmPinRequest, setConfirmPinRequest] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    toast.success('Preferences saved');
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title="Audit View"
        description="Customise how reports and audit data are displayed for review."
      >
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <Field
            label="Default Audit Period"
            hint="The time range pre-selected when you open the reports view"
          >
            <select
              value={defaultPeriod}
              onChange={(e) => setDefaultPeriod(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </Field>

          <Field
            label="Date Format"
            hint="How dates are displayed across the portal"
          >
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="dd-mm-yyyy">DD-MM-YYYY (e.g. 06-03-2026)</option>
              <option value="mm-dd-yyyy">MM-DD-YYYY (e.g. 03-06-2026)</option>
              <option value="yyyy-mm-dd">YYYY-MM-DD (e.g. 2026-03-06)</option>
            </select>
          </Field>
        </div>

        <div className="divide-y divide-gray-700 mb-4">
          <Toggle
            checked={highlightDiscrepancies}
            onChange={setHighlightDiscrepancies}
            label="Highlight Discrepancies Automatically"
            description="Flag and visually mark any mismatch between declared sales and payment totals in branch reports"
          />
          <Toggle
            checked={showBranchComparison}
            onChange={setShowBranchComparison}
            label="Show Branch Comparison"
            description="Display a side-by-side performance comparison across all branches in the reports view"
          />
          <Toggle
            checked={confirmPinRequest}
            onChange={setConfirmPinRequest}
            label="Confirm Before Sending Balance Request"
            description="Show a confirmation prompt before submitting your PIN for balance visibility"
          />
        </div>
        <SaveButton onClick={handleSave} saved={saved} />
      </SectionCard>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'profile', label: 'Profile', icon: User, description: 'Personal info & password' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Alert preferences' },
  { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal, description: 'View & display settings' },
];

export function FinanceSettings() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const role: Role = location.pathname.includes('/auditor/') ? 'AUDITOR' : 'ACCOUNTANT';
  const roleLabel = role === 'AUDITOR' ? 'Auditor' : 'Accountant';

  const handleLogout = () => { logout(); navigate('/staff/login'); };

  return (
    <div className="flex min-h-screen bg-gray-900"> {/* Sidebar role prop updated to uppercase */}
      <Sidebar role={role} onLogout={handleLogout} />

      <div className="flex-1 overflow-x-hidden">
        <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-gray-400 text-sm">
              Manage your {roleLabel.toLowerCase()} account and display preferences
            </p>
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
              {activeTab === 'profile' && <ProfileSection roleLabel={roleLabel} />}
              {activeTab === 'notifications' && (
                <NotificationsInbox recipientId={getSession()?.id ?? ''} />
              )}
              {activeTab === 'preferences' && (
                role === 'ACCOUNTANT'
                  ? <AccountantPreferences />
                  : <AuditorPreferences />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
