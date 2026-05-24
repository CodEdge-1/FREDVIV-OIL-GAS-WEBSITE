import { Lock, Building2, AlertCircle, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { 
  AVAILABLE_BANKS, // Keep for now, but should come from backend (or be a shared type)
  type BankAccessRequest, // Keep type for now, will replace with backend type
} from '../lib/store'; // Remove local storage functions
import { getSession, Role } from '../lib/auth'; // Import Role type
import { api } from '../lib/api';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

interface BankAccessPanelProps {
  role: Role; // Use the Role enum
  onBankSelect?: (bankId: 'uba' | 'zenith') => void; // Keep bankId as string literals
}

export function BankAccessPanel({ role, onBankSelect }: BankAccessPanelProps) {
  const session = getSession();
  const userId = session?.id ?? '';
  const userName = session?.name ?? 'N/A';

  const [userRequests, setUserRequests] = useState<BankAccessRequest[]>([]);

  const fetchUserRequests = async () => {
    if (!userId) return;
    try {
      const data = await api.get(`/bank-access-requests/user/${userId}`); // Assuming an endpoint for user's bank access requests
      setUserRequests(data);
    } catch (error) {
      console.error('Failed to fetch bank access requests:', error);
      toast.error('Failed to load bank access requests.');
    }
  };

  useEffect(() => {
    fetchUserRequests();
  }, [userId]);

  const handleRequestAccess = async (bankId: 'uba' | 'zenith') => {
    const bankName = AVAILABLE_BANKS.find((b) => b.id === bankId)?.name || '';
    
    // Check if already has pending or approved request
    const existing = userRequests.find((r) => r.bankId === bankId);
    if (existing?.status === 'PENDING') {
      toast.info('You already have a pending request for this bank.');
      return;
    }
    
    try {
      await api.post('/bank-access-requests', {
        requesterId: userId,
        bankId: bankId,
        status: 'PENDING', // Ensure status matches Prisma enum
      });
      toast.success('Request sent to Admin. You will be notified once approved.');
      fetchUserRequests(); // Re-fetch requests to update UI
    } catch (error) {
      console.error('Failed to submit bank access request:', error);
      toast.error('Failed to submit bank access request.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Bank Portal Access</h2>
            <p className="text-gray-400 text-sm">Request secure access to company bank accounts</p>
          </div>
        </div>

        {/* Available Banks */}
        <div className="space-y-3 mb-6">
          {AVAILABLE_BANKS.map((bank) => {
            const request = userRequests.find((r) => r.bankId === bank.id && r.status === 'APPROVED' && (!r.expiresAt || new Date(r.expiresAt) > new Date())); // Find an active approved request
            const approved = !!request; // Check if an approved request exists
            
            return (
              <div
                key={bank.id}
                className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 flex items-center justify-between hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{bank.name}</h3>
                    {request && (
                      <div className="flex items-center gap-2 mt-1 text-xs"> {/* Check request.status */}
                        {request.status === 'PENDING' && ( // Use uppercase PENDING
                          <>
                            <Clock className="w-3 h-3 text-yellow-400" />
                            <span className="text-yellow-400">Pending approval</span>
                          </>
                        )}
                        {request.status === 'REJECTED' && ( // Use uppercase REJECTED
                          <>
                            <AlertCircle className="w-3 h-3 text-red-400" />
                            <span className="text-red-400">Request rejected</span>
                          </>
                        )}
                      </div>
                    )}
                    {approved && (
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        <span className="text-green-400">Access granted - Click to access</span>
                      </div>
                    )}
                  </div>
                </div>

                {approved ? (
                  <button
                    onClick={() => onBankSelect?.(bank.id)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Access Portal
                  </button>
                ) : (
                  <button
                    onClick={() => handleRequestAccess(bank.id)}
                    disabled={!!request}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      request
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-primary hover:bg-primary/90 text-white'
                    }`}
                  >
                    {request ? 'Requested' : 'Request Access'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex gap-3">
          <Lock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-200">
            <p className="font-semibold mb-1">How it works:</p>
            <ol className="space-y-1 text-xs">
              <li>1. Request access to a bank portal above</li>
              <li>2. Admin will review and provide login details</li>
              <li>3. Access is shown in a secure, private session</li>
              <li>4. No browser history or tabs are created</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
