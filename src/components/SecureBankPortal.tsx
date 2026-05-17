import { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { getApprovedBankAccessRequest, AVAILABLE_BANKS } from '../lib/store';

interface SecureBankPortalProps {
  userId: string;
  bankId: 'uba' | 'zenith';
  onClose: () => void;
}

export function SecureBankPortal({ userId, bankId, onClose }: SecureBankPortalProps) {
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentialsCopied, setCredentialsCopied] = useState(false);

  const approved = getApprovedBankAccessRequest(userId, bankId);
  const bank = AVAILABLE_BANKS.find((b) => b.id === bankId);

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCredentialsCopied(true);
    setTimeout(() => setCredentialsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col z-50">
      {/* Header - Minimal to avoid drawing attention */}
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
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Credentials Panel - appears above iframe */}
        {!showCredentials ? (
          <div className="bg-gray-700/50 border-b border-gray-600 p-4 flex items-center justify-between">
            <div className="text-sm text-gray-300">
              <p className="font-semibold mb-1">Login Credentials Provided</p>
              <p className="text-xs text-gray-400">Click the button below to view your login details</p>
            </div>
            <button
              onClick={() => setShowCredentials(true)}
              className="ml-4 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View Credentials
            </button>
          </div>
        ) : (
          <div className="bg-blue-500/20 border-b border-blue-500/40 p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-blue-300">Login Credentials</span>
              <button
                onClick={() => setShowCredentials(false)}
                className="text-blue-300 hover:text-blue-200"
              >
                <EyeOff className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 bg-gray-800 rounded p-3">
              <div>
                <label className="text-xs text-gray-400">Username</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={approved.loginUsername || ''}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(approved.loginUsername || '')}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400">Password</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="password"
                    value={approved.loginPassword || ''}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(approved.loginPassword || '')}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {credentialsCopied && (
                <p className="text-xs text-green-400 text-center mt-2">✓ Copied to clipboard</p>
              )}
            </div>

            <p className="text-xs text-gray-400 border-t border-gray-600 pt-2">
              📌 Use the credentials above to log into {bank.name} portal. This session will not be saved in your browser history.
            </p>
          </div>
        )}

        {/* Iframe */}
        <iframe
          src={bank.url}
          className="flex-1 w-full border-0"
          title={`${bank.name} Bank Portal`}
          sandbox="allow-same-origin allow-forms allow-scripts allow-popups allow-popups-to-escape-sandbox"
          allow="geolocation"
        />
      </div>

      {/* Footer - Privacy Notice */}
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
