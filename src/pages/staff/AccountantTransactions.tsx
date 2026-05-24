import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { BankAccessPanel } from '../../components/BankAccessPanel';
import { SecureBankPortal } from '../../components/SecureBankPortal';
import { getSession } from '../../lib/auth';

export function AccountantTransactions() {
  const navigate = useNavigate();
  const session = getSession();
  const userId = session?.id ?? '';
  const [activePortal, setActivePortal] = useState<'uba' | 'zenith' | null>(null);

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role={session?.role || 'ACCOUNTANT'} onLogout={() => navigate('/staff/login')} /> {/* Pass actual role from session */}

      <div className="flex-1 overflow-x-hidden">
        <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Bank Portal Access</h1>
            <p className="text-gray-400 text-sm">Access company bank portal for real-time transactions</p>
          </div>
        </header>

        <main className="p-6 max-w-5xl">
          <BankAccessPanel role={session?.role || 'ACCOUNTANT'} onBankSelect={setActivePortal} /> {/* Pass actual role from session */}
        </main>
      </div>

      {/* Secure Bank Portal Modal */}
      {activePortal && (
        <SecureBankPortal
          userId={userId}
          bankId={activePortal}
          onClose={() => setActivePortal(null)}
        />
      )}
    </div>
  );
}
