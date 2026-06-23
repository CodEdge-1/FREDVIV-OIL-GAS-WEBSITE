import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { StatusBadge } from '../../components/dashboard/StatusBadge';
import { logout, getSession, StaffAccount } from '../../lib/auth';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { type SalesReport } from '../../lib/store';
import { Fuel, Droplet, Lock, Save, Calculator, TrendingUp, AlertCircle } from 'lucide-react';

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function ManagerSales() {
  const navigate = useNavigate();

  const session = getSession();
  const [account, setAccount] = useState<StaffAccount | null>(null);
  const [prices, setPrices] = useState({ pms: 0, ago: 0 });
  const [existingReport, setExistingReport] = useState<SalesReport | null>(null);
  const [history, setHistory] = useState<SalesReport[]>([]);

  const today = getLocalDateString();

  const fetchHistory = async () => {
    if (!session?.id) return;
    try {
      const data = await api.get(`/sales-reports?managerId=${session.id}`);
      setHistory(data);
    } catch (error) {
      console.error('Failed to fetch sales history:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.id) return;
      try {
        const localToday = getLocalDateString();
        const [userData, priceData, salesReportData] = await Promise.all([
          api.get(`/users/${session.id}`),
          api.get('/fuel-prices/current'),
          api.get(`/sales-reports/today/${session.id}?date=${localToday}`),
        ]);
        setAccount(userData);
        setPrices(priceData);
        setExistingReport(salesReportData);
        fetchHistory();
      } catch (error) {
        console.error('Failed to fetch sales data:', error);
        toast.error('Failed to load sales data.');
      }
    };
    fetchData();
  }, [session?.id]);

  const branchName = account?.branch || 'N/A';
  const branchLocation = account?.location || 'N/A';

  const pmsPrice = prices.pms;
  const agoPrice = prices.ago;

  const [isSubmitted, setIsSubmitted] = useState(!!existingReport);
  const [openingPMS, setOpeningPMS] = useState(String(existingReport?.openingPMS ?? ''));
  const [openingAGO, setOpeningAGO] = useState(String(existingReport?.openingAGO ?? ''));
  const [soldPMS, setSoldPMS] = useState(String(existingReport?.soldPMS ?? ''));
  const [soldAGO, setSoldAGO] = useState(String(existingReport?.soldAGO ?? ''));
  const [remainingPMS, setRemainingPMS] = useState(String(existingReport?.remainingPMS ?? ''));
  const [remainingAGO, setRemainingAGO] = useState(String(existingReport?.remainingAGO ?? ''));
  const [overagePMS, setOveragePMS] = useState(String(existingReport?.overagePMS ?? '0'));
  const [overageAGO, setOverageAGO] = useState(String(existingReport?.overageAGO ?? '0'));
  const [cardPayments, setCardPayments] = useState(String(existingReport?.cardPayments ?? ''));
  const [bankTransfers, setBankTransfers] = useState(String(existingReport?.bankTransfers ?? ''));
  const [cashPayments, setCashPayments] = useState(String(existingReport?.cashPayments ?? ''));

  useEffect(() => {
    if (existingReport) {
      setIsSubmitted(true);
      setOpeningPMS(String(existingReport.openingPMS ?? ''));
      setOpeningAGO(String(existingReport.openingAGO ?? ''));
      setSoldPMS(String(existingReport.soldPMS ?? ''));
      setSoldAGO(String(existingReport.soldAGO ?? ''));
      setRemainingPMS(String(existingReport.remainingPMS ?? ''));
      setRemainingAGO(String(existingReport.remainingAGO ?? ''));
      setOveragePMS(String(existingReport.overagePMS ?? '0'));
      setOverageAGO(String(existingReport.overageAGO ?? '0'));
      setCardPayments(String(existingReport.cardPayments ?? ''));
      setBankTransfers(String(existingReport.bankTransfers ?? ''));
      setCashPayments(String(existingReport.cashPayments ?? ''));
    }
  }, [existingReport]);

  const totalPMSSales = Number(soldPMS) * pmsPrice;
  const totalAGOSales = Number(soldAGO) * agoPrice;
  const totalDailySales = totalPMSSales + totalAGOSales;
  const totalPayments = Number(cardPayments) + Number(bankTransfers) + Number(cashPayments);

  const handleSubmit = async () => {
    if (!session) return;
    if (!account?.branchId) {
      toast.error('You must be assigned to a branch to submit sales reports.');
      return;
    }

    const reportData = {
      branchId: account.branchId,
      date: today,
      openingPMS: Number(openingPMS),
      soldPMS: Number(soldPMS),
      remainingPMS: Number(remainingPMS),
      openingAGO: Number(openingAGO),
      soldAGO: Number(soldAGO),
      remainingAGO: Number(remainingAGO),
      overage: Number(overagePMS) + Number(overageAGO),
      overagePMS: Number(overagePMS),
      overageAGO: Number(overageAGO),
      cardPayments: Number(cardPayments),
      bankTransfers: Number(bankTransfers),
      cashPayments: Number(cashPayments),
    };

    try {
      await api.post('/sales-reports', reportData);
      toast.success('Sales report submitted successfully!');
      setIsSubmitted(true);
      const localToday = getLocalDateString();
      const updatedReport = await api.get(`/sales-reports/today/${session.id}?date=${localToday}`);
      setExistingReport(updatedReport);
      fetchHistory();
      await api.post('/notifications', { userId: 'admin', title: 'Sales Report Submitted', body: `${session.name} (${branchName}) submitted their daily sales report — ₦${totalDailySales.toLocaleString()} total.` });
    } catch (error) {
      console.error('Failed to submit sales report:', error);
      toast.error('Failed to submit sales report.');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role="MANAGER" onLogout={() => { logout(); navigate('/staff/login'); }} />

      <div className="flex-1 overflow-x-hidden">
        <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Daily Sales</h1>
              <p className="text-gray-400 text-sm">{branchName}{branchLocation ? ` Branch, ${branchLocation}` : ''}</p>
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <TrendingUp className="w-4 h-4" />
              {new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </header>

        {prices.pms === 0 && prices.ago === 0 && (
          <div className="mx-6 mt-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-3 text-sm text-yellow-400">
            Prices have not been set by the admin yet. PMS and AGO prices will be 0 until the admin sets them.
          </div>
        )}

        <main className="p-6 space-y-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Daily Sales Entry</h2>
                <p className="text-gray-400 text-sm">Record today's sales data</p>
              </div>
              {isSubmitted && (
                <div className="flex items-center gap-2">
                  <StatusBadge status={existingReport?.status || 'PENDING'} />
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Fuel className="w-5 h-5 text-blue-500" />
                  Premium Motor Spirit (PMS)
                </h3>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Opening PMS (Litres)</label>
                  <input type="number" value={openingPMS} onChange={(e) => setOpeningPMS(e.target.value)} disabled={isSubmitted}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Litres Sold</label>
                  <input type="number" value={soldPMS} onChange={(e) => setSoldPMS(e.target.value)} disabled={isSubmitted}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Remaining PMS</label>
                  <input type="number" value={remainingPMS} onChange={(e) => setRemainingPMS(e.target.value)} disabled={isSubmitted}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">PMS Overage (if any)</label>
                  <input type="number" value={overagePMS} onChange={(e) => setOveragePMS(e.target.value)} disabled={isSubmitted}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0" />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-green-500" />
                  Automotive Gas Oil (AGO)
                </h3>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Opening AGO (Litres)</label>
                  <input type="number" value={openingAGO} onChange={(e) => setOpeningAGO(e.target.value)} disabled={isSubmitted}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Litres Sold</label>
                  <input type="number" value={soldAGO} onChange={(e) => setSoldAGO(e.target.value)} disabled={isSubmitted}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Remaining AGO</label>
                  <input type="number" value={remainingAGO} onChange={(e) => setRemainingAGO(e.target.value)} disabled={isSubmitted}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">AGO Overage (if any)</label>
                  <input type="number" value={overageAGO} onChange={(e) => setOverageAGO(e.target.value)} disabled={isSubmitted}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0" />
                </div>
              </div>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Sales Calculation Preview
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">Total PMS Sales</p>
                  <p className="text-xl font-bold text-white">₦{totalPMSSales.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{soldPMS || 0} L × ₦{pmsPrice}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Total AGO Sales</p>
                  <p className="text-xl font-bold text-white">₦{totalAGOSales.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{soldAGO || 0} L × ₦{agoPrice}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Total Daily Sales</p>
                  <p className="text-2xl font-bold text-primary">₦{totalDailySales.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Payment Declaration</h2>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Card Payments</label>
                <input type="number" value={cardPayments} onChange={(e) => setCardPayments(e.target.value)} disabled={isSubmitted}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Bank Transfers</label>
                <input type="number" value={bankTransfers} onChange={(e) => setBankTransfers(e.target.value)} disabled={isSubmitted}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Cash Payments</label>
                <input type="number" value={cashPayments} onChange={(e) => setCashPayments(e.target.value)} disabled={isSubmitted}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0" />
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Total Payments Received</p>
              <p className="text-3xl font-bold text-white">₦{totalPayments.toLocaleString()}</p>
            </div>
          </div>

          {!isSubmitted ? (
            <button
              onClick={handleSubmit}
              className="w-full py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-3 text-lg font-medium"
            >
              <Save className="w-6 h-6" />
              Submit Daily Report
            </button>
          ) : (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center">
              <p className="text-green-500 font-bold mb-2">Report Submitted Successfully</p>
              <p className="text-gray-400 text-sm">
                Your daily sales report has been locked and sent to admin for review.
              </p>
            </div>
          )}

          {/* Previous Reports History */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Previous Sales Reports
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">PMS Sold</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">AGO Sold</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Total Sales</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Total Payments</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-500 text-sm">
                        No historical reports found.
                      </td>
                    </tr>
                  ) : (
                    history.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-700/30 transition-colors text-sm">
                        <td className="px-6 py-4 text-white font-medium">
                          {report.date.includes('-') ? (
                            (() => {
                              const parts = report.date.split('-');
                              if (parts.length === 3) {
                                const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                                return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
                              }
                              return report.date;
                            })()
                          ) : report.date}
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {report.soldPMS?.toLocaleString()} L
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {report.soldAGO?.toLocaleString()} L
                        </td>
                        <td className="px-6 py-4 text-white font-semibold">
                          ₦{report.totalSales?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          ₦{report.totalPayments?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={report.status} />
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
    </div>
  );
}
