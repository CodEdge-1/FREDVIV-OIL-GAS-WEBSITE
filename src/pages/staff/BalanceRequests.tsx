import { useState, useEffect } from 'react'; // Import useEffect
import { useNavigate } from 'react-router';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { RoleBadge } from '../../components/dashboard/RoleBadge';
import { StatusBadge } from '../../components/dashboard/StatusBadge'; // Keep for now, will update to use backend Status enum
import { logout, getSession } from '../../lib/auth';
import {
  type BalanceRequest, // Keep type for now, will replace with backend type from lib/store
} from '../../lib/store'; // Import BalanceRequest type
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { Check, Clock, Inbox, KeyRound, RefreshCw, X } from 'lucide-react';

const getPeriodLabel = (period?: string) => {
  switch (period) {
    case 'DAILY': return 'Today';
    case 'MONTHLY': return 'This Month';
    case 'YEARLY': return 'This Year';
    case 'ALL_TIME':
    default: return 'All Time';
  }
};

export function BalanceRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<BalanceRequest[]>([]); // Initialize with empty array
  const session = getSession(); // Assuming getSession still works for current user ID

  const fetchRequests = async () => {
    try {
      const data = await api.get('/balance-requests'); // Assuming an endpoint for balance requests
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch balance requests:', error);
      toast.error('Failed to load balance requests.');
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const [pinModalId, setPinModalId] = useState<string | null>(null);
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState('');

  const openPinModal = (id: string) => {
    setAdminPin('');
    setPinError('');
    setPinModalId(id);
  };

  const generatePin = () => {
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    setAdminPin(pin);
    setPinError('');
  };

  const handleApprove = async () => {
    if (adminPin.length < 4 || adminPin.length > 6) {
      setPinError('PIN must be 4–6 digits.');
      return;
    }
    if (!/^\d+$/.test(adminPin)) {
      setPinError('PIN must contain digits only.');
      return;
    }
    const req = requests.find((r) => r.id === pinModalId);
    if (!req) return;

    try {
      await api.patch(`/balance-requests/${req.id}/approve`, { adminPin }); // Assuming an endpoint to approve and set PIN
      // Send notification via API
      await api.post(`/notifications`, {
        userId: req.requesterId,
        title: 'Balance Request Approved',
        body: `Your request to view the account balance has been approved. Use the PIN provided by admin to unlock the balance. It will be visible for 30 seconds.`,
      });
      // Add activity log via API
      await api.post(`/activity-logs`, {
        userId: session?.id, // Admin's ID
        action: `Balance request approved — ${req.requester} (${req.role})`,
        type: 'balance',
        details: `Request ID: ${req.id}`,
      });

      toast.success('Balance request approved and PIN set.');
      setPinModalId(null);
      setAdminPin('');
      fetchRequests(); // Reload requests
    } catch (error) {
      console.error('Failed to approve balance request:', error);
      toast.error('Failed to approve balance request.');
    }
  };

  const handleReject = async (id: string, requesterId: string, requester: string) => {
    try {
      await api.patch(`/balance-requests/${id}/reject`, {});
      // Send notification via API
      await api.post(`/notifications`, {
        userId: requesterId,
        title: 'Balance Request Rejected',
        body: 'Your request to view the account balance has been rejected by the admin.',
      });
      // Add activity log via API
      await api.post(`/activity-logs`, {
        userId: session?.id, // Admin's ID
        action: `Balance request rejected — ${requester}`,
        type: 'balance',
        details: `Request ID: ${id}`,
      });

      toast.success('Balance request rejected.');
      fetchRequests(); // Reload requests
    } catch (error) {
      console.error('Failed to reject balance request:', error);
      toast.error('Failed to reject balance request.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/staff/login');
  };

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const hasRequests = requests.length > 0;

  return (
    <div className="flex min-h-screen bg-gray-900"> {/* Sidebar role prop updated to uppercase */}
      <Sidebar role="ADMIN" onLogout={handleLogout} />

      <div className="flex-1 overflow-x-hidden">
        <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Balance Requests</h1>
              <p className="text-gray-400 text-sm">Review and approve balance visibility requests</p>
            </div>
            <button // Reload button now calls fetchRequests
              onClick={fetchRequests}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="p-6">
          {/* Info Banner */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
            <p className="text-blue-400 text-sm">
              🔐 When you approve a balance request, you set a secure PIN. Give this PIN directly to the requester — they must enter it to unlock the balance for 30 seconds.
            </p>
          </div>

          {/* Summary cards */}
          {hasRequests && (
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">Pending Requests</p>
                <p className="text-3xl font-bold text-yellow-500">{pendingRequests.length}</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">Total Requests</p>
                <p className="text-3xl font-bold text-white">{requests.length}</p>
              </div>
            </div>
          )}

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="bg-gray-800 border border-yellow-500/20 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-6 h-6 text-yellow-500" />
                Pending Balance Requests
              </h2>

              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-gray-700/50 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-bold text-lg">
                          {request.requester.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{request.requester}</p>
                          <RoleBadge role={request.role} size="sm" />
                          <span className="text-xs px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full font-medium">
                            {getPeriodLabel(request.period)}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm">Requested at {request.requestTime}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReject(request.id, request.requesterId, request.requester)}
                        className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <X className="w-5 h-5" />
                        Reject
                      </button>
                      <button
                        onClick={() => openPinModal(request.id)}
                        className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                      >
                        <KeyRound className="w-5 h-5" />
                        Approve &amp; Set PIN
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Request History */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Request History</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Request ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Requester</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Request Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Approved Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                            <Inbox className="w-6 h-6 text-gray-500" />
                          </div>
                          <p className="text-gray-400 font-medium">No balance requests yet</p>
                          <p className="text-gray-500 text-sm">Requests from accountants and auditors will appear here.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    requests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono text-primary">{request.id}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white font-medium">{request.requester}</span>
                        </td>
                        <td className="px-6 py-4">
                          <RoleBadge role={request.role} size="sm" />
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-300 text-sm font-medium">{getPeriodLabel(request.period)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-400 text-sm">{request.requestTime}</span>
                        </td>
                        <td className="px-6 py-4">
                          {request.approvedTime ? (
                            <span className="text-gray-400 text-sm">{request.approvedTime}</span>
                          ) : (
                            <span className="text-gray-500 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={request.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Admin PIN Modal */}
      {pinModalId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <KeyRound className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Set Approval PIN</h2>
                <p className="text-gray-400 text-sm">This PIN must be given to the requester</p>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-5">
              <p className="text-xs text-yellow-500">
                ⚠️ Write down or verbally communicate this PIN to the requester. They must enter it to unlock the balance view for 30 seconds.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">Enter or Generate a 4–6 Digit PIN</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={adminPin}
                  onChange={(e) => { setAdminPin(e.target.value.replace(/\D/g, '')); setPinError(''); }}
                  className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="••••••"
                />
                <button
                  onClick={generatePin}
                  className="px-4 py-3 bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white rounded-lg transition-colors text-sm whitespace-nowrap flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Generate
                </button>
              </div>
              {pinError && <p className="text-red-400 text-xs mt-2">{pinError}</p>}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setPinModalId(null); setAdminPin(''); setPinError(''); }}
                className="flex-1 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={adminPin.length < 4}
                className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Approve &amp; Send PIN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
