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
  const [existingReport, setExistingReport] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [customProductEntries, setCustomProductEntries] = useState<any[]>([]);

  // Cash management states
  const [previousCashAtHand, setPreviousCashAtHand] = useState('');
  const [cashToBank, setCashToBank] = useState('');
  const [actualCashAtHand, setActualCashAtHand] = useState('');

  const today = getLocalDateString();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

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
        const [userData, priceData, salesReportData, customProductsData] = await Promise.all([
          api.get(`/users/${session.id}`),
          api.get('/fuel-prices/current'),
          api.get(`/sales-reports/today/${session.id}?date=${localToday}`),
          api.get('/custom-products'),
        ]);
        setAccount(userData);
        setPrices(priceData);
        setExistingReport(salesReportData);

        if (salesReportData) {
          if (salesReportData.customProducts) {
            const parsed = typeof salesReportData.customProducts === 'string'
              ? JSON.parse(salesReportData.customProducts)
              : salesReportData.customProducts;
            setCustomProductEntries(parsed || []);
          } else {
            setCustomProductEntries([]);
          }
          setPreviousCashAtHand(String(salesReportData.previousCashAtHand ?? '0'));
          setCashToBank(String(salesReportData.cashToBank ?? '0'));
          setActualCashAtHand(String(salesReportData.actualCashAtHand ?? '0'));
        } else {
          // New report: pre-populate custom products from catalog
          setCustomProductEntries((customProductsData || []).map((cp: any) => ({
            id: cp.id,
            name: cp.name,
            code: cp.code,
            price: cp.price,
            opening: '',
            sold: '',
            remaining: '',
            overage: '0',
          })));
          setPreviousCashAtHand('');
          setCashToBank('');
          setActualCashAtHand('');
        }

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

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [openingPMS, setOpeningPMS] = useState('');
  const [openingAGO, setOpeningAGO] = useState('');
  const [soldPMS, setSoldPMS] = useState('');
  const [soldAGO, setSoldAGO] = useState('');
  const [remainingPMS, setRemainingPMS] = useState('');
  const [remainingAGO, setRemainingAGO] = useState('');
  const [overagePMS, setOveragePMS] = useState('0');
  const [overageAGO, setOverageAGO] = useState('0');
  const [cardPayments, setCardPayments] = useState('');
  const [bankTransfers, setBankTransfers] = useState('');
  const [cashPayments, setCashPayments] = useState('');

  useEffect(() => {
    if (existingReport) {
      setIsSubmitted(existingReport.status === 'APPROVED' || existingReport.status === 'SUBMITTED');
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
      setPreviousCashAtHand(String(existingReport.previousCashAtHand ?? '0'));
      setCashToBank(String(existingReport.cashToBank ?? '0'));
      setActualCashAtHand(String(existingReport.actualCashAtHand ?? '0'));

      if (existingReport.customProducts) {
        const parsed = typeof existingReport.customProducts === 'string'
          ? JSON.parse(existingReport.customProducts)
          : existingReport.customProducts;
        setCustomProductEntries(parsed || []);
      }
    } else {
      setIsSubmitted(false);
    }
  }, [existingReport]);

  const previousUnapproved = history.find(
    (r) => r.date < today && (r.status === 'REJECTED' || r.status === 'SUBMITTED' || r.status === 'PENDING')
  );

  const isLocked = isSubmitted || !!previousUnapproved;

  const totalCustomSales = customProductEntries.reduce((sum, cp) => {
    return sum + (Number(cp.sold) || 0) * (Number(cp.price) || 0);
  }, 0);

  const totalPMSSales = Number(soldPMS) * pmsPrice;
  const totalAGOSales = Number(soldAGO) * agoPrice;
  const totalDailySales = totalPMSSales + totalAGOSales + totalCustomSales;
  const totalPayments = Number(cardPayments) + Number(bankTransfers) + Number(cashPayments);

  const expectedCashLeft = (Number(previousCashAtHand) || 0) + (Number(cashPayments) || 0) - (Number(cashToBank) || 0);

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
      // New custom products and cash management data
      customProducts: customProductEntries.map(cp => ({
        id: cp.id,
        name: cp.name,
        code: cp.code,
        price: Number(cp.price),
        opening: Number(cp.opening || 0),
        sold: Number(cp.sold || 0),
        remaining: Number(cp.remaining || 0),
        overage: Number(cp.overage || 0),
      })),
      previousCashAtHand: Number(previousCashAtHand || 0),
      cashToBank: Number(cashToBank || 0),
      actualCashAtHand: Number(actualCashAtHand || 0),
    };

    try {
      await api.post('/sales-reports', reportData);
      toast.success('Sales report submitted successfully!');
      const localToday = getLocalDateString();
      const updatedReport = await api.get(`/sales-reports/today/${session.id}?date=${localToday}`);
      setExistingReport(updatedReport);
      fetchHistory();

      // Notify accountants and auditors
      const allUsers = await api.get('/users');
      const reviewers = allUsers.filter((u: any) => u.role === 'ACCOUNTANT' || u.role === 'AUDITOR');
      for (const r of reviewers) {
        await api.post('/notifications', {
          userId: r.id,
          title: 'Sales Report Submitted',
          body: `${session.name} (${branchName}) submitted a daily sales report — ${formatCurrency(totalDailySales)} total.`,
        });
      }
    } catch (error: any) {
      console.error('Failed to submit sales report:', error);
      toast.error(error.response?.data?.message || 'Failed to submit sales report.');
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

        {/* Lockout Warning Banner */}
        {previousUnapproved && (
          <div className="mx-6 mt-6 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-4 text-sm text-red-400 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Dashboard Locked (Unapproved Previous Report)</p>
              <p className="mt-1 text-gray-300">
                You cannot enter a new day's report because your report for <strong className="text-white">{previousUnapproved.date}</strong> is currently in <strong className="text-white">{previousUnapproved.status.toLowerCase()}</strong> status. You must wait for the Accountant/Auditor to approve it, or rectify it if it was flagged.
              </p>
            </div>
          </div>
        )}

        {/* Discrepancy Flag Footnote Banner */}
        {existingReport && existingReport.status === 'REJECTED' && existingReport.footnote && (
          <div className="mx-6 mt-6 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-4 text-sm text-amber-400 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Report Flagged / Discrepancy Found</p>
              <p className="mt-1 text-gray-300">
                Your report for today has been rejected with the footnote:
                <span className="block mt-1.5 p-2 bg-gray-900/50 rounded border border-gray-700/40 text-amber-300 italic">
                  "{existingReport.footnote}"
                </span>
                Please review your figures, rectify the error, and click **Resubmit Daily Report** below.
              </p>
            </div>
          </div>
        )}

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
              {existingReport && (
                <div className="flex items-center gap-2">
                  <StatusBadge status={existingReport.status || 'PENDING'} />
                  {isLocked && <Lock className="w-5 h-5 text-gray-400" />}
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
                  <input type="number" value={openingPMS} onChange={(e) => setOpeningPMS(e.target.value)} disabled={isLocked}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Litres Sold</label>
                  <input type="number" value={soldPMS} onChange={(e) => setSoldPMS(e.target.value)} disabled={isLocked}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Remaining PMS</label>
                  <input type="number" value={remainingPMS} onChange={(e) => setRemainingPMS(e.target.value)} disabled={isLocked}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">PMS Overage (if any)</label>
                  <input type="number" value={overagePMS} onChange={(e) => setOveragePMS(e.target.value)} disabled={isLocked}
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
                  <input type="number" value={openingAGO} onChange={(e) => setOpeningAGO(e.target.value)} disabled={isLocked}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Litres Sold</label>
                  <input type="number" value={soldAGO} onChange={(e) => setSoldAGO(e.target.value)} disabled={isLocked}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Remaining AGO</label>
                  <input type="number" value={remainingAGO} onChange={(e) => setRemainingAGO(e.target.value)} disabled={isLocked}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">AGO Overage (if any)</label>
                  <input type="number" value={overageAGO} onChange={(e) => setOverageAGO(e.target.value)} disabled={isLocked}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0" />
                </div>
              </div>
            </div>

            {/* Sales calculations preview */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Sales Calculation Preview
              </h3>
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">PMS Sales</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(totalPMSSales)}</p>
                  <p className="text-xs text-gray-500">{soldPMS || 0} L × {formatCurrency(pmsPrice)}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">AGO Sales</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(totalAGOSales)}</p>
                  <p className="text-xs text-gray-500">{soldAGO || 0} L × {formatCurrency(agoPrice)}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Custom Products Sales</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(totalCustomSales)}</p>
                  <p className="text-xs text-gray-500">{customProductEntries.filter(cp => Number(cp.sold) > 0).length} active products</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1 font-semibold text-primary">Total Daily Sales</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(totalDailySales)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Products Sales Entry Grid */}
          {customProductEntries.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Custom Products Sales Entry</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {customProductEntries.map((cp, idx) => (
                  <div key={cp.id || idx} className="space-y-4 bg-gray-700/30 p-5 rounded-lg border border-gray-700/60">
                    <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                      <h3 className="font-bold text-white flex items-center gap-2">
                        <Fuel className="w-5 h-5 text-primary" />
                        {cp.name} ({cp.code})
                      </h3>
                      <span className="text-xs text-gray-400 font-semibold bg-gray-700 px-2.5 py-1 rounded-full">
                        {formatCurrency(cp.price)}/L
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">Opening (Litres)</label>
                        <input
                          type="number"
                          value={cp.opening}
                          onChange={(e) => {
                            const newEntries = [...customProductEntries];
                            newEntries[idx].opening = e.target.value;
                            setCustomProductEntries(newEntries);
                          }}
                          disabled={isLocked}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">Litres Sold</label>
                        <input
                          type="number"
                          value={cp.sold}
                          onChange={(e) => {
                            const newEntries = [...customProductEntries];
                            newEntries[idx].sold = e.target.value;
                            setCustomProductEntries(newEntries);
                          }}
                          disabled={isLocked}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">Remaining</label>
                        <input
                          type="number"
                          value={cp.remaining}
                          onChange={(e) => {
                            const newEntries = [...customProductEntries];
                            newEntries[idx].remaining = e.target.value;
                            setCustomProductEntries(newEntries);
                          }}
                          disabled={isLocked}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">Overage (if any)</label>
                        <input
                          type="number"
                          value={cp.overage}
                          onChange={(e) => {
                            const newEntries = [...customProductEntries];
                            newEntries[idx].overage = e.target.value;
                            setCustomProductEntries(newEntries);
                          }}
                          disabled={isLocked}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    {Number(cp.sold) > 0 && (
                      <div className="text-right text-xs text-gray-400 mt-2">
                        Calculated Revenue: <strong className="text-white">{formatCurrency(Number(cp.sold) * cp.price)}</strong>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment & Cash Section */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Payment Declaration */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold text-white mb-6">Payment Declaration</h2>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Card Payments</label>
                    <input type="number" value={cardPayments} onChange={(e) => setCardPayments(e.target.value)} disabled={isLocked}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Bank Transfers</label>
                    <input type="number" value={bankTransfers} onChange={(e) => setBankTransfers(e.target.value)} disabled={isLocked}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Cash Payments</label>
                    <input type="number" value={cashPayments} onChange={(e) => setCashPayments(e.target.value)} disabled={isLocked}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0" />
                  </div>
                </div>
              </div>
              <div className="bg-gray-750 rounded-lg p-4 border border-gray-700/40">
                <p className="text-gray-400 text-sm mb-1">Total Payments Received</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(totalPayments)}</p>
              </div>
            </div>

            {/* Cash & Bank Management */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
              <h2 className="text-xl font-bold text-white mb-2">Cash & Bank Management</h2>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Previous Cash at Hand</label>
                <input type="number" value={previousCashAtHand} onChange={(e) => setPreviousCashAtHand(e.target.value)} disabled={isLocked}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Cash Taken to Bank</label>
                  <input type="number" value={cashToBank} onChange={(e) => setCashToBank(e.target.value)} disabled={isLocked}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm text-gray-300">Cash Left at Hand</label>
                    {!isLocked && (
                      <button
                        onClick={() => setActualCashAtHand(String(expectedCashLeft))}
                        className="text-xs text-primary hover:underline"
                        type="button"
                      >
                        Auto-calc
                      </button>
                    )}
                  </div>
                  <input type="number" value={actualCashAtHand} onChange={(e) => setActualCashAtHand(e.target.value)} disabled={isLocked}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary font-bold text-primary" placeholder="0" />
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-2 bg-gray-900/40 p-2.5 rounded border border-gray-750">
                Expected Leftover Cash: <strong className="text-white">{formatCurrency(expectedCashLeft)}</strong> (Previous + Declared Cash - Deposited)
              </div>
            </div>
          </div>

          {/* Form Actions / Submission Banners */}
          {!isLocked ? (
            <button
              onClick={handleSubmit}
              className="w-full py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-3 text-lg font-medium shadow-lg hover:shadow-primary/20"
            >
              <Save className="w-6 h-6" />
              {existingReport ? 'Resubmit Daily Report' : 'Submit Daily Report'}
            </button>
          ) : (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center">
              <p className="text-green-500 font-bold mb-2">Report Locked & Under Review</p>
              <p className="text-gray-400 text-sm">
                Your report has been submitted and is currently locked. It will remain locked unless flagged by the Accountant/Auditor.
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
                          {formatCurrency(report.totalSales)}
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {formatCurrency(report.cardPayments + report.bankTransfers + report.cashPayments)}
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
