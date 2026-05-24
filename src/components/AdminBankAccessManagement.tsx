import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, X, Key, User, RefreshCw } from 'lucide-react';
import { AVAILABLE_BANKS, type BankAccessRequest } from '../lib/store';
import { api } from '../lib/api';
import { toast } from 'sonner';

export function AdminBankAccessManagement() {
  const [requests, setRequests] = useState<BankAccessRequest[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Record<string, { username: string; password: string }>>({});
  const [isLoading, setIsLoading] = useState(true);

  const refreshRequests = async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/bank-access-requests/pending');
      setRequests(data);
    } catch (error) {
      toast.error('Failed to load pending bank requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshRequests();
  }, []);

  const handleApproveRequest = async (request: BankAccessRequest) => {
    const creds = credentials[request.id];
    if (!creds?.username || !creds?.password) {
      toast.error('Please provide both username and password');
      return;
    }

    try {
      await api.patch(`/bank-access-requests/${request.id}/approve`, {
        username: creds.username,
        password: creds.password
      });

      setCredentials((prev) => {
        const next = { ...prev };
        delete next[request.id];
        return next;
      });
      setExpandedId(null);
      refreshRequests();
      toast.success(`Access approved for ${request.requester}`);
    } catch (error) {
      toast.error('Failed to approve request');
    }
  };

  const handleRejectRequest = async (request: BankAccessRequest) => {
    if (window.confirm(`Reject access request from ${request.requester} for ${request.bankName}?`)) {
      try {
        await api.patch(`/bank-access-requests/${request.id}/reject`, {
          status: 'REJECTED'
        });
        refreshRequests();
        toast.success(`Request rejected for ${request.requester}`);
      } catch (error) {
        toast.error('Failed to reject request');
      }
    }
  };

  const bankName = (bankId: string) => AVAILABLE_BANKS.find((b) => b.id === bankId)?.name || bankId;

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
            <Key className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Bank Portal Access Requests</h2>
            <p className="text-gray-400 text-sm">Approve or reject staff requests for bank account access</p>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-500/30 mx-auto mb-3" />
            <p className="text-gray-400">No pending requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-gray-700/50 border border-gray-600 rounded-lg overflow-hidden"
              >
                {/* Request Header */}
                <button
                  onClick={() =>
                    setExpandedId(expandedId === request.id ? null : request.id)
                  }
                  className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 text-left">
                    <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-gray-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white">{request.requester}</h3>
                      <p className="text-sm text-gray-400">
                        Requested access to <span className="font-medium">{request.bankName}</span> •{' '}
                        <span className="capitalize text-xs">{request.role}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{request.requestTime}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 text-xs rounded font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  </div>
                </button>

                {/* Expanded Form */}
                {expandedId === request.id && (
                  <div className="border-t border-gray-600 bg-gray-800 px-4 py-4 space-y-4">
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 flex gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-200">
                        Provide the login credentials for {request.bankName}. These will be shown to{' '}
                        <span className="font-semibold">{request.requester}</span> to use for this session.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Username / Customer ID
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., FREDVIV123 or username@bank"
                          value={
                            credentials[request.id]?.username || ''
                          }
                          onChange={(e) =>
                            setCredentials((prev) => ({
                              ...prev,
                              [request.id]: {
                                ...(prev[request.id] || { password: '' }),
                                username: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Password
                        </label>
                        <input
                          type="password"
                          placeholder="Bank portal password"
                          value={
                            credentials[request.id]?.password || ''
                          }
                          onChange={(e) =>
                            setCredentials((prev) => ({
                              ...prev,
                              [request.id]: {
                                ...(prev[request.id] || { username: '' }),
                                password: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="bg-gray-700/50 border border-gray-600 rounded p-3 text-xs text-gray-400 space-y-1">
                      <p>📋 <span className="font-semibold">Access Duration:</span> 24 hours from approval</p>
                      <p>🔐 <span className="font-semibold">Security:</span> Access shown in private iframe</p>
                      <p>📝 <span className="font-semibold">Note:</span> No browser history will be kept</p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApproveRequest(request)}
                        className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve & Send Access
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request)}
                        className="flex-1 px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                      <button
                        onClick={() => setExpandedId(null)}
                        className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
