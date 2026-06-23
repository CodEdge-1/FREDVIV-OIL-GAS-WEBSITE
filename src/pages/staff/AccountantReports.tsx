import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { type SalesReport } from '../../lib/store';
import { FileBarChart2, FileText, CheckCircle, AlertTriangle, ClipboardCheck } from 'lucide-react';

type AuditStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUBMITTED';

function AuditStatusBadge({ status }: { status: AuditStatus }) {
  const displayStatus = status === 'SUBMITTED' ? 'PENDING' : status;
  const styles: Record<string, string> = {
    PENDING: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    APPROVED: 'bg-green-500/10 text-green-400 border border-green-500/20',
    REJECTED: 'bg-red-500/10 text-red-400 border border-red-500/20',
  };
  const labels: Record<string, string> = { PENDING: 'Pending Review', APPROVED: 'Audited', REJECTED: 'Flagged' };
  
  const currentStyle = styles[displayStatus] || styles.PENDING;
  const currentLabel = labels[displayStatus] || 'Pending Review';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${currentStyle}`}>
      {displayStatus === 'PENDING' && <ClipboardCheck className="w-3 h-3" />}
      {displayStatus === 'APPROVED' && <CheckCircle className="w-3 h-3" />}
      {displayStatus === 'REJECTED' && <AlertTriangle className="w-3 h-3" />}
      {currentLabel}
    </span>
  );
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);

export function AccountantReports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<SalesReport[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await api.get('/sales-reports');
        setReports(data);
      } catch (error) {
        console.error('Failed to fetch sales reports:', error);
        toast.error('Failed to load sales reports.');
      }
    };
    fetchReports();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role="ACCOUNTANT" onLogout={() => navigate('/staff/login')} />

      <div className="flex-1 overflow-x-hidden">
        <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Sales Reports</h1>
            <p className="text-gray-400 text-sm">Daily submitted branch sales</p>
          </div>
        </header>

        <main className="p-6">
          <div className="bg-gray-800 border border-gray-700 border-t-2 border-t-emerald-500 rounded-xl">
            <div className="p-5 border-b border-gray-700 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <FileBarChart2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">Branch Sales Reports</h2>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">DAILY</span>
                </div>
                <p className="text-gray-400 text-sm">Daily submitted sales from all branches</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-emerald-500/10">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-emerald-300 uppercase tracking-wider">Branch</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-emerald-300 uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-emerald-300 uppercase tracking-wider">Declared Sales</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-emerald-300 uppercase tracking-wider">Total Received</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-emerald-300 uppercase tracking-wider">Variance</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-emerald-300 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                            <FileText className="w-6 h-6 text-gray-500" />
                          </div>
                          <p className="text-gray-400 font-medium">No sales reports yet</p>
                          <p className="text-gray-500 text-sm">Reports will appear here once branch managers submit their daily sales.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    reports.map((r) => {
                      const totalPayments = r.cardPayments + r.bankTransfers + r.cashPayments;
                      const variance = r.totalSales - totalPayments;
                      const isClean = variance === 0;
                      return (
                        <tr key={r.id} className="hover:bg-gray-700/30 transition-colors">
                          <td className="px-5 py-4">
                            <p className="text-white font-medium text-sm">{r.branch}</p>
                            <p className="text-gray-500 text-xs">{r.location}</p>
                            <p className="text-gray-600 text-xs font-mono">{r.id}</p>
                          </td>
                          <td className="px-5 py-4 text-gray-300 text-sm">{r.date}</td>
                          <td className="px-5 py-4 text-right">
                            <p className="text-white font-semibold text-sm">{formatCurrency(r.totalSales)}</p>
                            <p className="text-gray-500 text-xs">{(r.soldPMS + r.soldAGO).toLocaleString()} L total</p>
                          </td>
                          <td className="px-5 py-4 text-right text-sm">
                            <p className="text-white font-bold">{formatCurrency(totalPayments)}</p>
                            <div className="text-xs text-gray-500 space-y-0.5 mt-1">
                              <p>Card: {formatCurrency(r.cardPayments)}</p>
                              <p>Transfer: {formatCurrency(r.bankTransfers)}</p>
                              <p>Cash: {formatCurrency(r.cashPayments)}</p>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className={`text-sm font-bold ${isClean ? 'text-green-400' : variance > 0 ? 'text-red-400' : 'text-orange-400'}`}>
                              {isClean ? '—' : variance > 0 ? `-${formatCurrency(variance)}` : `+${formatCurrency(Math.abs(variance))}`}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <AuditStatusBadge status={r.status} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
