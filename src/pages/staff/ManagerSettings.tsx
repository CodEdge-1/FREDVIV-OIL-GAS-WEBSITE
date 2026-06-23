import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { getSession, logout, StaffAccount, Role } from '../../lib/auth'; // Import Role
import { toast } from 'sonner';
import {
  User,
  Building2,
  Eye,
  EyeOff,
  Save,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../lib/api';
import { ProfileSection } from './ProfileSection';

type Tab = 'profile' | 'branch';

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

function BranchSection() {
  const session = getSession(); // Assuming getSession still works for current user ID
  const [account, setAccount] = useState<StaffAccount | null>(null);
  const [prices, setPrices] = useState({ pms: 0, ago: 0 });

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.id) return;
      try {
        const [userData, priceData] = await Promise.all([
          api.get(`/users/${session.id}`),
          api.get('/fuel-prices/current'), // Assuming an endpoint for global prices
        ]);
        setAccount(userData);
        setPrices(priceData);
      } catch (error) {
        console.error('Failed to fetch branch data:', error);
        toast.error('Failed to load branch data.');
      }
    };
    fetchData();
  }, [session?.id]);
  const [defaultView, setDefaultView] = useState('pms-ago');
  const [showOverageWarning, setShowOverageWarning] = useState(true);
  const [autoCalc, setAutoCalc] = useState(true);
  const [confirmBeforeSubmit, setConfirmBeforeSubmit] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    toast.success('Branch preferences saved');
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Read-only branch info */}
      <SectionCard
        title="Branch Information"
        description="Your assigned branch details. Contact admin to update this information."
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Branch Name">
            <TextInput value={account?.branch ?? ''} placeholder="Not assigned" disabled />
          </Field>
          <Field label="Location">
            <TextInput value={account?.location ?? ''} placeholder="Not assigned" disabled />
          </Field>
          <Field label="Assigned Manager">
            <TextInput value={account?.name ?? ''} disabled />
          </Field>
          <Field label="Current PMS Price">
            <TextInput value={prices.pms > 0 ? `₦${prices.pms} / Litre` : 'Not set by admin'} disabled />
          </Field>
          <Field label="Current AGO Price">
            <TextInput value={prices.ago > 0 ? `₦${prices.ago} / Litre` : 'Not set by admin'} disabled />
          </Field>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Prices are set by admin. To request a price review, use the Chat Center.
        </p>
      </SectionCard>

      {/* Dashboard preferences */}
      <SectionCard
        title="Dashboard Preferences"
        description="Customise how your daily sales entry form behaves."
      >
        <div className="mb-6">
          <Field
            label="Default Product View"
            hint="Which product section is expanded first when you open the sales entry form"
          >
            <select
              value={defaultView}
              onChange={(e) => setDefaultView(e.target.value)}
              className="w-full sm:w-64 px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary mt-1.5"
            >
              <option value="pms-ago">PMS & AGO (both visible)</option>
              <option value="pms">PMS first</option>
              <option value="ago">AGO first</option>
            </select>
          </Field>

          <div className="mt-4 divide-y divide-gray-700">
            <Toggle
              checked={autoCalc}
              onChange={setAutoCalc}
              label="Auto-Calculate Remaining Stock"
              description="Automatically compute remaining litres when you enter opening stock and litres sold"
            />
            <Toggle
              checked={showOverageWarning}
              onChange={setShowOverageWarning}
              label="Overage Warning"
              description="Show a warning prompt if the overage value you enter seems unusually high"
            />
            <Toggle
              checked={confirmBeforeSubmit}
              onChange={setConfirmBeforeSubmit}
              label="Confirm Before Submitting Report"
              description="Show a confirmation dialog before locking and submitting the daily report"
            />
          </div>
        </div>
        <SaveButton onClick={handleSave} saved={saved} />
      </SectionCard>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'profile', label: 'Profile', icon: User, description: 'Personal info & password' },
  { id: 'branch', label: 'Branch', icon: Building2, description: 'Branch info & preferences' },
];

export function ManagerSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const handleLogout = () => { logout(); navigate('/staff/login'); };

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role="MANAGER" onLogout={handleLogout} />

      <div className="flex-1 overflow-x-hidden">
        <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-gray-400 text-sm">Manage your account and branch preferences</p>
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
              {activeTab === 'profile' && <ProfileSection roleLabel="Branch Manager" />}
              {activeTab === 'branch' && <BranchSection />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
