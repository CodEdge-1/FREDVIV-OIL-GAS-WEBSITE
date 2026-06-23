import { useState, useEffect } from 'react';
import { X, ExternalLink, ShieldCheck, Lock } from 'lucide-react';
import { AVAILABLE_BANKS, type BankAccessRequest } from '../lib/store';
import { api } from '../lib/api';

interface SecureBankPortalProps {
  userId: string;
  bankId: 'uba' | 'zenith';
  onClose: () => void;
}

export function SecureBankPortal({ userId, bankId, onClose }: SecureBankPortalProps) {
  const [approved, setApproved] = useState<BankAccessRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const bank = AVAILABLE_BANKS.find((b) => b.id === bankId);

  useEffect(() => {
    const fetchAccess = async () => {
      try {
        const data = await api.get(`/bank-access-requests/user/${userId}`);
        const request = data.find((r: BankAccessRequest) => 
          r.bankId === bankId && 
          r.status === 'APPROVED' && 
          (!r.expiresAt || new Date(r.expiresAt) > new Date())
        );
        setApproved(request || null);
      } catch (e) {
        console.error('Failed to fetch bank access request:', e);
      } finally {
        setLoading(false);
      }
    };
    if (userId && bankId) {
      fetchAccess();
    } else {
      setLoading(false);
    }
  }, [userId, bankId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">Loading secure portal...</p>
        </div>
      </div>
    );
  }

  if (!approved || !bank) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Access Not Available</h2>
          <p className="text-gray-400 mb-6">Your access to {bank?.name} has expired or is not approved.</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col z-50">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">{bank.name} Portal</h2>
          <p className="text-gray-400 text-xs">Secure Session</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          title="Close portal (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Portal Container */}
      <div className="flex-1 overflow-hidden flex flex-col items-center justify-center p-6 bg-gray-950/80 relative">
        {/* Decorative background glow */}
        <div 
          className="absolute inset-0 pointer-events-none transition-all duration-300" 
          style={{
            backgroundImage: `radial-gradient(circle at center, ${
              bankId === 'uba' ? 'rgba(239,68,68,0.1)' : 'rgba(220,38,38,0.08)'
            } 0%, transparent 70%)`
          }}
        />

        <div className="max-w-md w-full bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl relative z-10 flex flex-col items-center text-center space-y-6">
          <div className={`w-16 h-16 bg-gradient-to-br ${
            bankId === 'uba' 
              ? 'from-red-500/20 to-red-600/5 border-red-500/30' 
              : 'from-red-600/20 to-red-700/5 border-red-600/30'
          } border rounded-2xl flex items-center justify-center shadow-inner`}>
            <Lock className={`w-8 h-8 ${bankId === 'uba' ? 'text-red-500' : 'text-red-600'}`} />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white tracking-tight">{bank.name} Portal Access</h3>
            <p className="text-gray-400 text-sm">
              For security reasons, bank websites cannot be embedded directly within the application. Please use the button below to launch the portal.
            </p>
          </div>

          <div className="w-full bg-gray-950/40 border border-gray-800/80 rounded-xl p-4 text-left space-y-3">
            <div className="flex gap-3 items-start">
              <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-300">
                <strong className="text-gray-200">Secure Direct Access:</strong> You will authenticate directly on the official banking platform.
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-300">
                <strong className="text-gray-200">No Credentials Logged:</strong> The application does not store, intercept, or handle your bank credentials.
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-300">
                <strong className="text-gray-200">24h Expiry:</strong> This access approval will expire automatically in 24 hours.
              </p>
            </div>
          </div>

          <button
            onClick={() => window.open(bank.url, '_blank')}
            className={`w-full py-4 px-6 bg-gradient-to-r ${
              bankId === 'uba'
                ? 'from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 shadow-red-500/20'
                : 'from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 shadow-red-700/20'
            } text-white font-semibold rounded-xl shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 group animate-pulse`}
          >
            <ExternalLink className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Open {bank.name} Portal in New Tab
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-3 text-xs text-gray-400 flex items-center justify-between">
        <span>🔒 This session is private and won't be saved in browser history</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          Press ESC to close
        </button>
      </div>
    </div>
  );
}
