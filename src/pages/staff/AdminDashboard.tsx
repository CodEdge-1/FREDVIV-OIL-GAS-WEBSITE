import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { logout, getAccounts } from '../../lib/auth';
import { ChatPanel } from '../../components/dashboard/ChatPanel';
import {
  getTodayRevenue, getPendingExpenseCount, getSalesReports, getExpenses,
  AVAILABLE_BANKS,
} from '../../lib/store';
import { Users, DollarSign, FileText, TrendingUp, MessageSquare, Bell, Building2 } from 'lucide-react';

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n.toLocaleString()}`;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const accounts = getAccounts();
  const activeUsers = accounts.filter((a) => a.status === 'active').length;
  const branches = new Set(accounts.map((a) => a.branch).filter(Boolean)).size;
  const pendingApprovals = getPendingExpenseCount();
  const dailyRevenue = getTodayRevenue();
  const bankPortals = AVAILABLE_BANKS;

  // Recent activity: last 5 records across sales + expenses
  const recentSales = getSalesReports().slice(0, 3).map((r) => ({
    action: 'Sales report submitted',
    detail: `${r.branch} — ${formatCurrency(r.totalSales)}`,
    time: new Date(r.submittedAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }),
  }));
  const recentExpenses = getExpenses().slice(0, 3).map((e) => ({
    action: `Expense ${e.status === 'pending' ? 'submitted' : e.status}`,
    detail: `${e.branch} — ${e.type}`,
    time: e.date,
  }));
  const recentActivity = [...recentSales, ...recentExpenses]
    .slice(0, 5);

  const handleLogout = () => {
    logout();
    navigate('/staff/login');
  };

  const stats = [
    { label: 'Total Branches', value: String(branches), icon: FileText, color: 'bg-blue-500' },
    { label: 'Active Users', value: String(activeUsers), icon: Users, color: 'bg-green-500' },
    { label: 'Pending Approvals', value: String(pendingApprovals), icon: Bell, color: 'bg-yellow-500' },
    { label: 'Today\'s Revenue', value: dailyRevenue > 0 ? formatCurrency(dailyRevenue) : '₦0', icon: TrendingUp, color: 'bg-primary' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role="admin" onLogout={handleLogout} />

      <div className="flex-1 overflow-x-hidden">
        <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Super Admin Dashboard</h1>
              <p className="text-gray-400 text-sm">Welcome back, Administrator</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                <Bell className="w-6 h-6" />
                {pendingApprovals > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <MessageSquare className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
              </button>
            </div>
          </div>
        </header>

        <main className="p-6">
          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <button
              onClick={() => navigate('/staff/admin/users')}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-primary transition-colors text-left"
            >
              <Users className="w-8 h-8 text-primary mb-3" />
              <h3 className="text-white font-bold mb-1">User Management</h3>
              <p className="text-gray-400 text-sm">Create and manage users</p>
            </button>
            <button
              onClick={() => navigate('/staff/admin/prices')}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-primary transition-colors text-left"
            >
              <DollarSign className="w-8 h-8 text-primary mb-3" />
              <h3 className="text-white font-bold mb-1">Price Management</h3>
              <p className="text-gray-400 text-sm">Set PMS & AGO prices</p>
            </button>
            <button
              onClick={() => navigate('/staff/admin/reports')}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-primary transition-colors text-left"
            >
              <FileText className="w-8 h-8 text-primary mb-3" />
              <h3 className="text-white font-bold mb-1">Branch Reports</h3>
              <p className="text-gray-400 text-sm">View all branch data</p>
            </button>
            <button
              onClick={() => navigate('/staff/admin/expenses')}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-primary transition-colors text-left"
            >
              <Bell className="w-8 h-8 text-primary mb-3" />
              <h3 className="text-white font-bold mb-1">Pending Approvals</h3>
              <p className="text-gray-400 text-sm">
                {pendingApprovals > 0 ? `${pendingApprovals} expense${pendingApprovals > 1 ? 's' : ''} waiting` : 'Review expense requests'}
              </p>
            </button>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">No activity yet. Records will appear here as staff submit reports.</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0">
                    <div>
                      <p className="text-white font-medium">{item.action}</p>
                      <p className="text-gray-400 text-sm">{item.detail}</p>
                    </div>
                    <span className="text-gray-500 text-sm">{item.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Bank Portals ── */}
          <div className="space-y-6">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Company Bank Portals</h2>
                  <p className="text-gray-400 text-sm">Direct access links for the banks currently in use</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {bankPortals.map((bank) => (
                  <div key={bank.id} className="bg-gray-900 border border-gray-700 rounded-xl p-5 flex flex-col justify-between">
                    <div>
                      <p className="text-sm text-gray-400 uppercase tracking-[0.2em] mb-2">Bank Portal</p>
                      <h3 className="text-lg font-semibold text-white">{bank.name}</h3>
                      <p className="text-gray-500 text-sm mt-2">Use the secure portal for bank account access and transaction review.</p>
                    </div>
                    <a
                      href={bank.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center justify-center mt-6 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Open {bank.name}
                    </a>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-200">
                <p className="font-semibold">Note:</p>
                <p className="mt-2 text-gray-300">This dashboard no longer relies on a bank API for real-time account sync. Bank portal access is managed through secure staff requests and direct login to the supported banks.</p>
              </div>
            </div>
          </div>
        </main>
      </div>

      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} currentUserRole="admin" />
    </div>
  );
}
