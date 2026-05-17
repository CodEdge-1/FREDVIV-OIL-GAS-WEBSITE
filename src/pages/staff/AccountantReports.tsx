import { useNavigate } from 'react-router';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { getSalesReports } from '../../lib/store';
import { FileBarChart2, FileText } from 'lucide-react';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);

export function AccountantReports() {
  const navigate = useNavigate();
  const reports = getSalesReports();

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role="accountant" onLogout={() => navigate('/staff/login')} />

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
                    <th className="px-6 py-3 text-left text-xs font-medium text-emerald-300 uppercase tracking-wider">Branch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-emerald-300 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-emerald-300 uppercase tracking-wider">PMS Sold</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-emerald-300 uppercase tracking-wider">AGO Sold</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-emerald-300 uppercase tracking-wider">Total Sales</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-emerald-300 uppercase tracking-wider">Payments Received</th>
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
                      return (
                        <tr key={r.id} className="hover:bg-gray-700/30 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-white font-medium text-sm">{r.branch}</p>
                            <p className="text-gray-500 text-xs">{r.location}</p>
                          </td>
                          <td className="px-6 py-4 text-gray-300 text-sm">{r.date}</td>
                          <td className="px-6 py-4 text-right text-white text-sm">{r.soldPMS.toLocaleString()} L</td>
                          <td className="px-6 py-4 text-right text-white text-sm">{r.soldAGO.toLocaleString()} L</td>
                          <td className="px-6 py-4 text-right font-semibold text-white text-sm">{formatCurrency(r.totalSales)}</td>
                          <td className="px-6 py-4 text-right text-sm">
                            <p className="text-white font-semibold">{formatCurrency(totalPayments)}</p>
                            <p className="text-xs text-gray-500 mt-0.5">Cash · Card · Transfer</p>
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
