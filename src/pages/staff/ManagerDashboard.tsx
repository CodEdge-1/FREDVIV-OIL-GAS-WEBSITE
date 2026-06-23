import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { logout, getSession, StaffAccount } from '../../lib/auth'; // Keep StaffAccount type for now
import { ChatPanel } from '../../components/dashboard/ChatPanel';
import { api } from '../../lib/api';
import { StatCard } from '../../components/dashboard/StatCard';
import { toast } from 'sonner';
import { Fuel, Droplet, MessageSquare, TrendingUp, Receipt, CheckCircle, Building2, Calendar } from 'lucide-react';

export function ManagerDashboard() {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const session = getSession();
  const [account, setAccount] = useState<StaffAccount | null>(null);
  const [prices, setPrices] = useState({ pms: 0, ago: 0 });
  const [todaySales, setTodaySales] = useState<any | null>(null); // Replace 'any' with actual SalesReport type
  const [pendingExpensesCount, setPendingExpensesCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.id) return;
      try {
        const [userData, priceData, salesData, expensesData] = await Promise.all([
          api.get(`/users/${session.id}`),
          api.get('/fuel-prices/current').catch(() => ({ pms: 0, ago: 0 })),
          api.get(`/sales-reports`),
          api.get(`/expenses`),
        ]);

        const managerSales = salesData.filter((s: any) => s.manager?.id === session.id);
        const todayStr = new Date().toISOString().split('T')[0];
        const todaySales = managerSales.find((s: any) => s.date === todayStr) || null;
        const managerExpenses = expensesData.filter((e: any) => e.manager?.id === session.id);

        setAccount(userData);
        setPrices(priceData);
        setTodaySales(todaySales);
        setPendingExpensesCount(managerExpenses.filter((e: any) => e.status === 'PENDING').length);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast.error('Failed to load dashboard data.');
      }
    };
    fetchData();
  }, [session?.id]);

  const branchName = account?.branch || 'N/A';
  const branchLocation = account?.location || 'N/A';

  const pendingExpenses = pendingExpensesCount;

  const quickLinks = [
    { label: 'Enter Daily Sales', desc: "Record today's PMS and AGO sales", icon: TrendingUp, path: '/staff/manager/sales', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Submit Expense', desc: 'Log a new branch expense for approval', icon: Receipt, path: '/staff/manager/expenses', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { label: 'Chat with Admin', desc: 'Send a message to head office', icon: MessageSquare, path: '/staff/manager/chat', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role="MANAGER" onLogout={() => { logout(); navigate('/staff/login'); }} />

      <div className="flex-1 overflow-x-hidden">
        <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Manager Dashboard</h1>
              <p className="text-gray-400 text-sm">
                {branchName}{branchLocation ? ` Branch, ${branchLocation}` : ''}
              </p>
            </div>
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <MessageSquare className="w-6 h-6" />
            </button>
          </div>
        </header>

        <main className="p-6 space-y-6">
          {/* Price & Branch Summary */}
          <div className="grid md:grid-cols-4 gap-4">
            <StatCard
              variant="manager"
              icon={Fuel}
              color="text-blue-500"
              label="PMS Price"
              value={prices.pms > 0 ? `₦${prices.pms}/L` : <span className="text-gray-500 text-lg">Not set</span>}
              subtext="Set by Admin"
            />
            <StatCard
              variant="manager"
              icon={Droplet}
              color="text-green-500"
              label="AGO Price"
              value={prices.ago > 0 ? `₦${prices.ago}/L` : <span className="text-gray-500 text-lg">Not set</span>}
              subtext="Set by Admin"
            />
            <StatCard
              variant="manager"
              label="Branch"
              value={branchName}
              subtext={branchLocation || undefined}
            />
            <StatCard
              variant="manager"
              label="Date"
              value={new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
              subtext="Today"
            />
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {quickLinks.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`bg-gray-800 border rounded-xl p-5 text-left hover:bg-gray-700/60 transition-colors ${item.bg}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${item.bg}`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <p className="text-white font-semibold text-sm">{item.label}</p>
                  <p className="text-gray-400 text-xs mt-1">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Today's Status */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <h2 className="text-lg font-bold text-white mb-4">Today's Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400 text-sm">Daily Sales Report</span>
                {todaySales ? (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                    <CheckCircle className="w-3 h-3" />
                    Submitted
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-yellow-400 bg-yellow-500/10 px-2.5 py-1 rounded-full border border-yellow-500/20">
                    Pending Entry
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400 text-sm">Pending Expenses</span>
                {pendingExpenses > 0 ? (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                    {pendingExpenses} Awaiting Approval
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                    <CheckCircle className="w-3 h-3" />
                    None pending
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-400 text-sm">Price Update</span>
                {prices.pms > 0 && prices.ago > 0 ? (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                    <CheckCircle className="w-3 h-3" />
                    Up to date
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-yellow-400 bg-yellow-500/10 px-2.5 py-1 rounded-full border border-yellow-500/20">
                    Awaiting admin
                  </span>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} currentUserRole="manager" />
    </div>
  );
}
