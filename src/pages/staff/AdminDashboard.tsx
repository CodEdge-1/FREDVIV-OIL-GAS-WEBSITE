import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { logout, StaffAccount } from '../../lib/auth'; // Keep StaffAccount type for now
import { ChatPanel } from '../../components/dashboard/ChatPanel';
import {
  type SalesReport, // Keep type for now
  type Expense, // Keep type for now
  AVAILABLE_BANKS, // Keep for now, will be fetched from backend
} from '../../lib/store'; // Remove local storage functions
import { api } from '../../lib/api';
import { StatCard } from '../../components/dashboard/StatCard';
import { toast } from 'sonner';
import { AdminBankAccessManagement } from '../../components/AdminBankAccessManagement';
import { Users, DollarSign, FileText, TrendingUp, MessageSquare, Bell, Building2 } from 'lucide-react';

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n.toLocaleString()}`;
}

function formatFullCurrency(n: number) {
  return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'bank-access' | 'transactions'>('overview');
  const [users, setUsers] = useState<StaffAccount[]>([]);
  const [salesReports, setSalesReports] = useState<SalesReport[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pendingExpenseCount, setPendingExpenseCount] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txSearch, setTxSearch] = useState('');
  const [txFilter, setTxFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [usersData, salesData, expensesData, logsData, txData] = await Promise.all([
          api.get('/users'),
          api.get('/sales-reports'),
          api.get('/expenses'),
          api.get('/activity-logs'),
          api.get('/transactions'),
        ]);
        setUsers(usersData);
        setSalesReports(salesData);
        setExpenses(expensesData);
        setActivityLogs(logsData || []);
        setTransactions(txData || []);

        const pendingExpenses = expensesData.filter((e: Expense) => e.status === 'PENDING').length;
        
        // Improved date handling for revenue
        const today = new Date().toISOString().split('T')[0];
        const dailyRev = salesData
          .filter((r: SalesReport) => r.date === today)
          .reduce((sum: number, r: SalesReport) => sum + r.totalSales, 0);

        setPendingExpenseCount(pendingExpenses);
        setTodayRevenue(dailyRev);
      } catch (error) {
        console.error('Failed to fetch admin dashboard data:', error);
        toast.error('Failed to load dashboard data.');
      }
    };
    fetchDashboardData();
  }, []);

  const activeUsers = users.filter((a) => a.status === 'ACTIVE').length;
  const branches = new Set(users.map((a) => a.branch).filter(Boolean)).size;
  const pendingApprovals = pendingExpenseCount;
  const dailyRevenue = todayRevenue;
  const bankPortals = AVAILABLE_BANKS; // Still using local for now, but should be fetched from backend

  // Map database activity logs directly for a complete system log feed
  const recentActivity = activityLogs
    .map((log) => {
      let detail = log.details;
      try {
        const parsed = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
        if (parsed && parsed.footnote) {
          detail = `Footnote: "${parsed.footnote}" (Manager: ${parsed.managerName || 'N/A'})`;
        } else if (parsed && parsed.managerName) {
          detail = `Manager: ${parsed.managerName}`;
        }
      } catch (e) {
        // use raw details if JSON parse fails
      }
      return {
        action: log.action,
        type: log.type,
        detail: detail,
        timestamp: new Date(log.createdAt).getTime(),
        displayTime: new Date(log.createdAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }),
      };
    })
    .slice(0, 10);

  const handleLogout = () => {
    logout();
    navigate('/staff/login');
  };

  const stats = [
    { label: 'Total Branches', value: String(branches), icon: Building2, color: 'bg-blue-500' },
    { label: 'Active Users', value: String(activeUsers), icon: Users, color: 'bg-green-500' },
    { label: 'Pending Approvals', value: String(pendingApprovals), icon: Bell, color: 'bg-yellow-500' },
    { label: 'Today\'s Revenue', value: dailyRevenue > 0 ? formatCurrency(dailyRevenue) : '₦0', icon: TrendingUp, color: 'bg-primary' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role="ADMIN" onLogout={handleLogout} />

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
          <div className="px-6 flex gap-6 mt-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-primary text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              Dashboard Overview
            </button>
            <button
              onClick={() => setActiveTab('bank-access')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'bank-access'
                  ? 'border-primary text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              Bank Access Management
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'transactions'
                  ? 'border-primary text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              Transactions Monitor
            </button>
          </div>
        </header>

        <main className="p-6">
          {activeTab === 'overview' && (
            <>
              {/* Stats Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, i) => (
                  <StatCard
                    key={i}
                    label={stat.label}
                    value={stat.value}
                    icon={stat.icon}
                    color={stat.color}
                  />
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
                        <span className="text-gray-500 text-sm">{item.displayTime}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'bank-access' && (
            <AdminBankAccessManagement />
          )}

          {activeTab === 'transactions' && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">System Ledger Transactions</h2>
                  <p className="text-gray-400 text-sm">Monitor all incoming and outgoing financial transactions</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <input
                    type="text"
                    placeholder="Search desc / reference..."
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    className="bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary w-full md:w-64"
                  />
                  <select
                    value={txFilter}
                    onChange={(e) => setTxFilter(e.target.value as any)}
                    className="bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary w-full md:w-auto"
                  >
                    <option value="ALL">All Types</option>
                    <option value="CREDIT">Credits</option>
                    <option value="DEBIT">Debits</option>
                  </select>
                </div>
              </div>

              {/* Transactions Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-xs uppercase font-semibold">Total Credit Value</p>
                  <p className="text-green-500 font-bold text-lg mt-1">
                    {formatFullCurrency(
                      transactions
                        .filter((tx) => tx.type === 'CREDIT')
                        .reduce((sum, tx) => sum + tx.amount, 0)
                    )}
                  </p>
                </div>
                <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-xs uppercase font-semibold">Total Debit Value</p>
                  <p className="text-red-400 font-bold text-lg mt-1">
                    {formatFullCurrency(
                      transactions
                        .filter((tx) => tx.type === 'DEBIT')
                        .reduce((sum, tx) => sum + tx.amount, 0)
                    )}
                  </p>
                </div>
                <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-xs uppercase font-semibold">Net Flow</p>
                  {(() => {
                    const credits = transactions.filter((tx) => tx.type === 'CREDIT').reduce((sum, tx) => sum + tx.amount, 0);
                    const debits = transactions.filter((tx) => tx.type === 'DEBIT').reduce((sum, tx) => sum + tx.amount, 0);
                    const net = credits - debits;
                    return (
                      <p className={`font-bold text-lg mt-1 ${net >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                        {net >= 0 ? '+' : ''}{formatFullCurrency(net)}
                      </p>
                    );
                  })()}
                </div>
                <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-xs uppercase font-semibold">Current Book Balance</p>
                  <p className="text-white font-bold text-lg mt-1">
                    {transactions.length > 0
                      ? formatFullCurrency(transactions[0].balance)
                      : '₦0.00'}
                  </p>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-700 text-gray-400 text-sm">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Value Date</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700 text-sm">
                    {transactions
                      .filter((tx) => {
                        const matchesSearch =
                          tx.description.toLowerCase().includes(txSearch.toLowerCase()) ||
                          (tx.reference && tx.reference.toLowerCase().includes(txSearch.toLowerCase()));
                        const matchesFilter = txFilter === 'ALL' || tx.type === txFilter;
                        return matchesSearch && matchesFilter;
                      })
                      .map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-700/30 text-white transition-colors">
                          <td className="py-3 px-4 text-gray-300">
                            {new Date(tx.date).toLocaleDateString('en-NG', { day: '2-digit', month: '2-digit', year: 'numeric' })}{' '}
                            <span className="text-xs text-gray-500">
                              {new Date(tx.date).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-400">
                            {tx.valueDate
                              ? new Date(tx.valueDate).toLocaleDateString('en-NG', { day: '2-digit', month: '2-digit', year: 'numeric' })
                              : '-'}
                          </td>
                          <td className="py-3 px-4 font-medium">{tx.description}</td>
                          <td className="py-3 px-4 text-gray-400 font-mono text-xs">{tx.reference || '-'}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                tx.type === 'CREDIT'
                                  ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}
                            >
                              {tx.type}
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-right font-bold ${tx.type === 'CREDIT' ? 'text-green-500' : 'text-red-400'}`}>
                            {tx.type === 'CREDIT' ? '+' : '-'}{formatFullCurrency(tx.amount)}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-300">
                            {formatFullCurrency(tx.balance)}
                          </td>
                        </tr>
                      ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-500">
                          No transactions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} currentUserRole="admin" />
    </div>
  );
}
