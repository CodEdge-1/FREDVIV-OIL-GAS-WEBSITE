import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { logout, getSession } from '../../lib/auth';
import { CountdownTimer } from '../../components/dashboard/CountdownTimer';
import {
  getSalesReports,
  saveBalanceRequest,
  getPendingBalanceRequest,
  getApprovedBalanceRequest,
  updateBalanceRequest,
  addNotification,
  type BalanceRequest,
} from '../../lib/store';
import { Eye, Lock, KeyRound } from 'lucide-react';

export function AccountantDashboard() {
  const navigate = useNavigate();
  const session = getSession();

  const accountBalance = getSalesReports().reduce((sum, r) => sum + r.totalSales, 0);

  const [pendingRequest, setPendingRequest] = useState<BalanceRequest | null>(
    () => session ? getPendingBalanceRequest(session.id) : null
  );
  const [approvedRequest, setApprovedRequest] = useState<BalanceRequest | null>(
    () => session ? getApprovedBalanceRequest(session.id) : null
  );
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [balanceVisible, setBalanceVisible] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll localStorage every 3s while a pending request exists
  useEffect(() => {
    if (!session) return;

    if (pendingRequest) {
      pollRef.current = setInterval(() => {
        const approved = getApprovedBalanceRequest(session.id);
        if (approved) {
          setPendingRequest(null);
          setApprovedRequest(approved);
          setShowPinEntry(true);
          clearInterval(pollRef.current!);
        }
      }, 3000);
    }

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [pendingRequest]);

  const handleRequestBalance = () => {
    if (!session) return;
    const now = new Date().toLocaleString('en-US', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
    const req: BalanceRequest = {
      id: `BAL-${Date.now()}`,
      requesterId: session.id,
      requester: session.name,
      role: 'accountant',
      requestTime: now,
      status: 'pending',
    };
    saveBalanceRequest(req);
    addNotification({
      recipientId: 'admin',
      title: 'Balance Request Submitted',
      body: `${session.name} (Accountant) has requested access to view the account balance.`,
    });
    setPendingRequest(req);
  };

  const handlePinSubmit = () => {
    if (!approvedRequest) return;
    if (pinInput === approvedRequest.adminPin) {
      updateBalanceRequest(approvedRequest.id, { pinUsed: true });
      setShowPinEntry(false);
      setPinInput('');
      setPinError('');
      setApprovedRequest(null);
      setPendingRequest(null);
      setBalanceVisible(true);
    } else {
      setPinError('Incorrect PIN. Please check with admin and try again.');
    }
  };

  const handleBalanceExpire = () => {
    setBalanceVisible(false);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role="accountant" onLogout={() => { logout(); navigate('/staff/login'); }} />

      <div className="flex-1 overflow-x-hidden">
        <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Accountant Dashboard</h1>
            <p className="text-gray-400 text-sm">Financial overview</p>
          </div>
        </header>

        <main className="p-6">
          {/* Balance Card */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Account Balance</p>
                {balanceVisible ? (
                  <p className="text-4xl font-bold text-white">{formatCurrency(accountBalance)}</p>
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
                  Request Balance
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

            {balanceVisible && (
              <CountdownTimer seconds={30} onExpire={handleBalanceExpire} />
            )}
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
