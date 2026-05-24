import { useState, useEffect, useRef } from 'react'; // Added useEffect
import { useNavigate } from 'react-router';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { logout, getSession, StaffAccount } from '../../lib/auth'; // Keep StaffAccount type for now
import { CountdownTimer } from '../../components/dashboard/CountdownTimer';
import {
  type SalesReport, // Keep type for now, will replace with backend type
} from '../../lib/store'; // Remove local storage functions
import { api } from '../../lib/api';
import { StatCard } from '../../components/dashboard/StatCard';
import { toast } from 'sonner';
import {
  type BalanceRequest, // Keep type for now, will replace with backend type from lib/store
} from '../../lib/store';
import {
  ClipboardCheck,
  AlertTriangle,
  Eye,
  Lock,
  CheckCircle,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);

export function AuditorDashboard() {
  const navigate = useNavigate();
  const session = getSession();
  const [allReports, setAllReports] = useState<SalesReport[]>([]);
  const [users, setUsers] = useState<StaffAccount[]>([]);
  const [pendingRequest, setPendingRequest] = useState<BalanceRequest | null>(null);
  const [approvedRequest, setApprovedRequest] = useState<BalanceRequest | null>(null);
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [balanceVisible, setBalanceVisible] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const todayReports = allReports.filter((r) => r.date === today);
  const discrepancies = allReports.filter((r) => r.totalSales !== r.totalPayments);
  const branches = new Set(users.map((a) => a.branch).filter(Boolean)).size;
  const totalRevenue = allReports.reduce((sum, r) => sum + r.totalSales, 0);

  const stats = [
    { label: 'Pending Review', value: allReports.length - todayReports.length, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', icon: ClipboardCheck },
    { label: 'Audited Today', value: todayReports.length, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', icon: CheckCircle },
    { label: 'Discrepancies Found', value: discrepancies.length, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: AlertTriangle },
    { label: 'Branches Monitored', value: branches, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: ShieldCheck },
  ];

  const fetchDashboardData = async () => {
    if (!session?.id) return;
    try {
      const [reportsData, usersData, pendingReqData, approvedReqData] = await Promise.all([
        api.get('/sales-reports'), // Assuming endpoint for all sales reports
        api.get('/users'), // Assuming endpoint for all users
        api.get(`/balance-requests/pending/${session.id}`), // Assuming endpoint for user's pending balance request
        api.get(`/balance-requests/approved/${session.id}`), // Assuming endpoint for user's approved balance request
      ]);
      setAllReports(reportsData);
      setUsers(usersData);
      setPendingRequest(pendingReqData);
      setApprovedRequest(approvedReqData);
    } catch (error) {
      console.error('Failed to fetch auditor dashboard data:', error);
      toast.error('Failed to load dashboard data.');
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [session?.id]);

  // Poll localStorage every 3s while a pending request exists
  useEffect(() => {
    if (!session) return;

    if (pendingRequest) {
      pollRef.current = setInterval(() => {
        // Poll API for approved request status
        api.get(`/balance-requests/approved/${session.id}`).then(approved => {
          if (approved) {
            setPendingRequest(null);
            setApprovedRequest(approved);
            setShowPinEntry(true);
            clearInterval(pollRef.current!);
          }
        }).catch(err => console.error('Polling for approved request failed:', err));
      }, 3000);
    }

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [pendingRequest]);

  const handleRequestBalance = async () => {
    if (!session) return;
    try {
      const newRequest = await api.post('/balance-requests', {
        requesterId: session.id,
        requester: session.name,
        role: 'AUDITOR', // Ensure role matches Prisma enum
        status: 'PENDING', // Ensure status matches Prisma enum
      });
      toast.success('Balance request submitted to admin.');
      setPendingRequest(newRequest);
      // Send notification to admin via API
      await api.post('/notifications', {
        userId: 'admin', // Assuming 'admin' is the ID for the admin user
        title: 'Balance Request Submitted',
        body: `${session?.name} (Auditor) has requested access to view the account balance.`,
      });
    } catch (error) {
      console.error('Failed to submit balance request:', error);
      toast.error('Failed to submit balance request.');
    }
  };

  const handlePinSubmit = async () => {
    if (!approvedRequest) return;
    try {
      // Use the new backend validation endpoint
      await api.post(`/balance-requests/${approvedRequest.id}/validate`, { pin: pinInput });
      
      setShowPinEntry(false);
      setPinInput('');
      setPinError('');
      setApprovedRequest(null);
      setPendingRequest(null);
      setBalanceVisible(true);
      toast.success('Balance unlocked!');
    } catch (error: any) {
      setPinError(error.response?.data?.message || 'Incorrect PIN.');
    }
  };

  const handleBalanceExpire = () => {
    setBalanceVisible(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role="AUDITOR" onLogout={() => { logout(); navigate('/staff/login'); }} />

      <div className="flex-1 overflow-x-hidden">
        <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Auditor Dashboard</h1>
            <p className="text-gray-400 text-sm">Review branch reports and verify financial records</p>
          </div>
        </header>

        <main className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <StatCard
                key={i}
                variant="auditor"
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
                containerClass={stat.bg}
              />
            ))}
          </div>

          {/* Discrepancy Alerts */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h2 className="text-white font-bold">Discrepancy Alerts ({discrepancies.length})</h2>
            </div>
            {discrepancies.length === 0 ? (
              <p className="text-gray-500 text-sm">No discrepancies found. All submitted reports balance correctly.</p>
            ) : (
              <div className="space-y-3">
                {discrepancies.map((r) => {
                  const variance = r.totalSales - r.totalPayments;
                  return (
                    <div key={r.id} className="bg-gray-800 border border-red-500/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-semibold">{r.branch}</span>
                        <span className="text-xs text-gray-500">{r.id}</span>
                        <span className="text-xs text-gray-500">· {r.date}</span>
                      </div>
                      <p className="text-xs text-gray-400 mb-1">
                        Declared: <span className="text-white">{formatCurrency(r.totalSales)}</span>
                        {' · '}
                        Received: <span className="text-white">{formatCurrency(r.totalPayments)}</span>
                        {' · '}
                        Variance:{' '}
                        <span className="text-red-400 font-semibold">
                          {variance > 0 ? '-' : '+'}{formatCurrency(Math.abs(variance))}
                        </span>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Balance Card */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Revenue (All Time)</p>
                {balanceVisible ? (
                  <p className="text-4xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
                ) : (
                  <div className="flex items-center gap-3">
                    <Lock className="w-6 h-6 text-gray-500" />
                    <p className="text-2xl font-bold text-gray-500">••••••••</p>
                  </div>
                )}
              </div>

              {!balanceVisible && !pendingRequest && !approvedRequest && (
                <button
                  onClick={handleRequestBalance}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  <Eye className="w-5 h-5" />
                  View Balance
                </button>
              )}

              {pendingRequest && !approvedRequest && (
                <div className="px-6 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-yellow-400 text-sm">Awaiting admin approval…</span>
                </div>
              )}

              {approvedRequest && !showPinEntry && (
                <button
                  onClick={() => setShowPinEntry(true)}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <KeyRound className="w-5 h-5" />
                  Enter PIN
                </button>
              )}
            </div>

            {balanceVisible && <CountdownTimer seconds={30} onExpire={handleBalanceExpire} />}
          </div>
        </main>
      </div>

      {/* PIN Entry Modal — shown after admin approves */}
      {showPinEntry && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <KeyRound className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Enter Admin PIN</h2>
                <p className="text-gray-400 text-sm">Your request has been approved</p>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-5">
              <p className="text-xs text-green-400">
                ✅ Admin has approved your request. Enter the PIN they provided to unlock the balance for 30 seconds.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">PIN from Admin</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pinInput}
                onChange={(e) => { setPinInput(e.target.value.replace(/\D/g, '')); setPinError(''); }}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••"
                autoFocus
              />
              {pinError && <p className="text-red-400 text-xs mt-2">{pinError}</p>}
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-5">
              <p className="text-xs text-yellow-500">
                ⚠️ Balance will be visible for only 30 seconds after PIN entry
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowPinEntry(false); setPinInput(''); setPinError(''); }}
                className="flex-1 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePinSubmit}
                disabled={pinInput.length < 4}
                className="flex-1 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Unlock Balance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
