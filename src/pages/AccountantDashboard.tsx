import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  LogOut,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Filter,
  Search,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export function AccountantDashboard() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState('today');

  const handleLogout = () => {
    navigate('/staff/login');
  };

  // Mock data for transactions
  const transactions = [
    {
      id: 'TXN001',
      date: '2026-02-06',
      time: '09:23 AM',
      description: 'PMS Supply - Victoria Island Station',
      amount: 2500000,
      type: 'credit',
      status: 'completed',
    },
    {
      id: 'TXN002',
      date: '2026-02-06',
      time: '10:15 AM',
      description: 'AGO Bulk Order - Industrial Client',
      amount: 4750000,
      type: 'credit',
      status: 'completed',
    },
    {
      id: 'TXN003',
      date: '2026-02-06',
      time: '11:45 AM',
      description: 'Operational Expenses - Logistics',
      amount: 350000,
      type: 'debit',
      status: 'completed',
    },
    {
      id: 'TXN004',
      date: '2026-02-06',
      time: '01:30 PM',
      description: 'LPG Distribution - Retail Network',
      amount: 1850000,
      type: 'credit',
      status: 'completed',
    },
    {
      id: 'TXN005',
      date: '2026-02-06',
      time: '02:45 PM',
      description: 'Equipment Maintenance',
      amount: 425000,
      type: 'debit',
      status: 'pending',
    },
    {
      id: 'TXN006',
      date: '2026-02-06',
      time: '03:20 PM',
      description: 'PMS Supply - Lekki Station',
      amount: 1950000,
      type: 'credit',
      status: 'completed',
    },
  ];

  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch =
      txn.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || txn.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const totalRevenue = transactions
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalRevenue - totalExpenses;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img 
                src="/assets/logo1.png" 
                alt="Fredviv Oil & Gas Logo" 
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="text-white font-bold">Fredviv Oil & Gas</h1>
                <p className="text-gray-400 text-xs">Accountant Dashboard</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <span className="text-xs text-gray-400">Today</span>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Total Revenue</h3>
            <p className="text-2xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
            <div className="flex items-center gap-1 mt-2 text-green-500 text-sm">
              <ArrowUpRight className="w-4 h-4" />
              <span>+12.5%</span>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                <ArrowDownRight className="w-6 h-6 text-red-500" />
              </div>
              <span className="text-xs text-gray-400">Today</span>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Total Expenses</h3>
            <p className="text-2xl font-bold text-white">{formatCurrency(totalExpenses)}</p>
            <div className="flex items-center gap-1 mt-2 text-red-500 text-sm">
              <ArrowDownRight className="w-4 h-4" />
              <span>-3.2%</span>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs text-gray-400">Net Balance</span>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Daily Net</h3>
            <p className="text-2xl font-bold text-white">{formatCurrency(netBalance)}</p>
            <div className="flex items-center gap-1 mt-2 text-gray-400 text-sm">
              <RefreshCw className="w-4 h-4" />
              <span>Last sync: 2 mins ago</span>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search transactions..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="pl-10 pr-8 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="pl-10 pr-8 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              <button className="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
                <Download className="w-5 h-5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">Transaction Ledger</h2>
            <p className="text-gray-400 text-sm">
              Showing {filteredTransactions.length} transactions
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-300">{transaction.id}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{transaction.date}</div>
                      <div className="text-xs text-gray-500">{transaction.time}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-300">{transaction.description}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-semibold ${
                          transaction.type === 'credit' ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {transaction.type === 'credit' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          transaction.type === 'credit'
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-red-500/10 text-red-500'
                        }`}
                      >
                        {transaction.type === 'credit' ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {transaction.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          transaction.status === 'completed'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-yellow-500/10 text-yellow-500'
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Session will auto-logout after 15 minutes of inactivity</p>
        </div>
      </div>
    </div>
  );
}