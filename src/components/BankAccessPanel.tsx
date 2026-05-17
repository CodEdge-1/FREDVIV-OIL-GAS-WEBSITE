import { Lock, Building2, AlertCircle, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { 
  getBankAccessRequests, 
  saveBankAccessRequest, 
  getApprovedBankAccessRequest,
  AVAILABLE_BANKS,
  type BankAccessRequest 
} from '../lib/store';
import { getSession } from '../lib/auth';

interface BankAccessPanelProps {
  role: 'accountant' | 'auditor';
  onBankSelect?: (bankId: 'uba' | 'zenith') => void;
}

export function BankAccessPanel({ role, onBankSelect }: BankAccessPanelProps) {
  const session = getSession();
  const userId = session?.id ?? '';
  const userName = session?.name ?? 'User';

  const allRequests = getBankAccessRequests();
  const userRequests = allRequests.filter((r) => r.requesterId === userId);

  const handleRequestAccess = (bankId: 'uba' | 'zenith') => {
    const bankName = AVAILABLE_BANKS.find((b) => b.id === bankId)?.name || '';
    
    // Check if already has pending or approved request
    const existing = userRequests.find((r) => r.bankId === bankId);
    if (existing?.status === 'pending') {
      alert('You already have a pending request for this bank.');
      return;
    }
    
    const newRequest: BankAccessRequest = {
      id: `BAR-${Date.now()}`,
      requesterId: userId,
      requester: userName,
      role: role,
      bankId: bankId,
      bankName: bankName,
      requestTime: new Date().toLocaleString('en-NG'),
      status: 'pending',
    };

    saveBankAccessRequest(newRequest);
    alert('Request sent to Admin. You will be notified once approved.');
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
            const request = userRequests.find((r) => r.bankId === bank.id);
            const approved = getApprovedBankAccessRequest(userId, bank.id);
            
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
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        {request.status === 'pending' && (
                          <>
                            <Clock className="w-3 h-3 text-yellow-400" />
                            <span className="text-yellow-400">Pending approval</span>
                          </>
                        )}
                        {request.status === 'rejected' && (
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
