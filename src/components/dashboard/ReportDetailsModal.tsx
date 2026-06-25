import { X, Fuel, Droplet, Calculator, DollarSign, FileText, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface CustomProductSales {
  id: string;
  name: string;
  code: string;
  price: number;
  opening: number;
  sold: number;
  remaining: number;
  sales: number;
}

interface SalesReport {
  id: string;
  date: string;
  status: string;
  submittedAt: string;
  openingPMS: number;
  soldPMS: number;
  remainingPMS: number;
  openingAGO: number;
  soldAGO: number;
  remainingAGO: number;
  overagePMS: number;
  overageAGO: number;
  pmsPrice: number;
  agoPrice: number;
  totalSales: number;
  cardPayments: number;
  bankTransfers: number;
  cashPayments: number;
  totalPayments: number;
  branch: string;
  location: string;
  managerName: string;
  // New fields
  customProducts?: CustomProductSales[] | string;
  previousCashAtHand?: number;
  cashToBank?: number;
  actualCashAtHand?: number;
  footnote?: string;
  reviewedBy?: {
    id: string;
    name: string;
    role: string;
  };
}

interface ReportDetailsModalProps {
  report: SalesReport;
  onClose: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
};

export function ReportDetailsModal({ report, onClose }: ReportDetailsModalProps) {
  const customProductsList: CustomProductSales[] = typeof report.customProducts === 'string'
    ? JSON.parse(report.customProducts || '[]')
    : report.customProducts || [];

  const totalPayments = report.cardPayments + report.bankTransfers + report.cashPayments;
  const variance = report.totalSales - totalPayments;
  const isClean = variance === 0;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-700 bg-gray-800/80 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Sales Report Details
            </h2>
            <p className="text-gray-400 text-xs mt-1">
              {report.branch} Branch · Manager: {report.managerName} · ID: {report.id}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={report.status} />
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5.5 h-5.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Status Note / Footnote if Flagged */}
          {report.status === 'REJECTED' && report.footnote && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-red-400 font-bold text-sm">Flag Footnote</h4>
                <p className="text-gray-300 text-sm mt-1">{report.footnote}</p>
                {report.reviewedBy && (
                  <p className="text-gray-500 text-xs mt-1.5">
                    Flagged by {report.reviewedBy.name} ({report.reviewedBy.role.toLowerCase()})
                  </p>
                )}
              </div>
            </div>
          )}

          {report.status === 'APPROVED' && report.reviewedBy && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex gap-3 items-start">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-green-400 font-bold text-sm">Report Audited & Approved</h4>
                <p className="text-gray-500 text-xs mt-1">
                  Approved by {report.reviewedBy.name} ({report.reviewedBy.role.toLowerCase()})
                </p>
              </div>
            </div>
          )}

          {/* Standard Products Grid (PMS / AGO) */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* PMS Section */}
            <div className="bg-gray-750 border border-gray-700/60 rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-white flex items-center gap-2 border-b border-gray-700 pb-2">
                <Fuel className="w-5 h-5 text-blue-500" />
                Premium Motor Spirit (PMS)
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Opening Volume</p>
                  <p className="text-white font-medium mt-0.5">{report.openingPMS?.toLocaleString()} L</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Volume Sold</p>
                  <p className="text-white font-medium mt-0.5">{report.soldPMS?.toLocaleString()} L</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Remaining Volume</p>
                  <p className="text-white font-medium mt-0.5">{report.remainingPMS?.toLocaleString()} L</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Overage</p>
                  <p className="text-white font-medium mt-0.5">{report.overagePMS?.toLocaleString() || 0} L</p>
                </div>
              </div>
              <div className="bg-gray-800/40 rounded-lg p-3 flex justify-between items-center text-sm border border-gray-800">
                <span className="text-gray-400">PMS Sales (₦{report.pmsPrice}/L)</span>
                <span className="text-white font-semibold">{formatCurrency(report.soldPMS * report.pmsPrice)}</span>
              </div>
            </div>

            {/* AGO Section */}
            <div className="bg-gray-750 border border-gray-700/60 rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-white flex items-center gap-2 border-b border-gray-700 pb-2">
                <Droplet className="w-5 h-5 text-green-500" />
                Automotive Gas Oil (AGO)
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Opening Volume</p>
                  <p className="text-white font-medium mt-0.5">{report.openingAGO?.toLocaleString()} L</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Volume Sold</p>
                  <p className="text-white font-medium mt-0.5">{report.soldAGO?.toLocaleString()} L</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Remaining Volume</p>
                  <p className="text-white font-medium mt-0.5">{report.remainingAGO?.toLocaleString()} L</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Overage</p>
                  <p className="text-white font-medium mt-0.5">{report.overageAGO?.toLocaleString() || 0} L</p>
                </div>
              </div>
              <div className="bg-gray-800/40 rounded-lg p-3 flex justify-between items-center text-sm border border-gray-800">
                <span className="text-gray-400">AGO Sales (₦{report.agoPrice}/L)</span>
                <span className="text-white font-semibold">{formatCurrency(report.soldAGO * report.agoPrice)}</span>
              </div>
            </div>
          </div>

          {/* Custom Products Section */}
          {customProductsList.length > 0 && (
            <div className="bg-gray-750 border border-gray-700/60 rounded-xl p-5">
              <h3 className="font-bold text-white flex items-center gap-2 mb-4 border-b border-gray-700 pb-2">
                <Fuel className="w-5 h-5 text-primary" />
                Custom Products Sales
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase">
                      <th className="py-2">Product Name</th>
                      <th className="py-2 text-right">Price</th>
                      <th className="py-2 text-right">Opening (L)</th>
                      <th className="py-2 text-right">Sold (L)</th>
                      <th className="py-2 text-right">Remaining (L)</th>
                      <th className="py-2 text-right">Sales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {customProductsList.map((cp, idx) => (
                      <tr key={cp.id || idx} className="text-gray-300">
                        <td className="py-2.5 font-medium text-white">{cp.name} ({cp.code})</td>
                        <td className="py-2.5 text-right">{formatCurrency(cp.price)}</td>
                        <td className="py-2.5 text-right">{(Number(cp.opening) || 0).toLocaleString()}</td>
                        <td className="py-2.5 text-right">{(Number(cp.sold) || 0).toLocaleString()}</td>
                        <td className="py-2.5 text-right">{(Number(cp.remaining) || 0).toLocaleString()}</td>
                        <td className="py-2.5 text-right font-semibold text-white">
                          {formatCurrency((Number(cp.sold) || 0) * (Number(cp.price) || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cash Management Summary */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Payments Declaration */}
            <div className="bg-gray-750 border border-gray-700/60 rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-white flex items-center gap-2 border-b border-gray-700 pb-2">
                <DollarSign className="w-5 h-5 text-amber-500" />
                Payments Declaration
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-gray-700/40">
                  <span className="text-gray-400">Card Payments</span>
                  <span className="text-white font-medium">{formatCurrency(report.cardPayments)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-700/40">
                  <span className="text-gray-400">Bank Transfers</span>
                  <span className="text-white font-medium">{formatCurrency(report.bankTransfers)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-700/40">
                  <span className="text-gray-400">Cash Payments</span>
                  <span className="text-white font-medium">{formatCurrency(report.cashPayments)}</span>
                </div>
                <div className="flex justify-between pt-2 text-base font-semibold">
                  <span className="text-gray-200">Total Payments Received</span>
                  <span className="text-white">{formatCurrency(totalPayments)}</span>
                </div>
              </div>
            </div>

            {/* Cash at Hand & Bank Tracking */}
            <div className="bg-gray-750 border border-gray-700/60 rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-white flex items-center gap-2 border-b border-gray-700 pb-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                Cash & Bank Management
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-gray-700/40">
                  <span className="text-gray-400">Previous Cash at Hand</span>
                  <span className="text-white font-medium">{formatCurrency(report.previousCashAtHand ?? 0)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-700/40">
                  <span className="text-gray-400">Cash Taken to Bank</span>
                  <span className="text-white font-medium">{formatCurrency(report.cashToBank ?? 0)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-700/40">
                  <span className="text-gray-400">Actual Cash Left at Hand</span>
                  <span className="text-white font-medium">{formatCurrency(report.actualCashAtHand ?? 0)}</span>
                </div>
                <div className="bg-gray-800/40 rounded-lg p-2.5 mt-2 text-xs text-gray-400 border border-gray-800/50">
                  <p className="font-medium text-gray-300">Cash Flow Check:</p>
                  <p className="mt-1">
                    (Previous: {formatCurrency(report.previousCashAtHand ?? 0)} + Declared Cash: {formatCurrency(report.cashPayments)}) 
                    - Deposited: {formatCurrency(report.cashToBank ?? 0)} = Expected Cash: {formatCurrency((report.previousCashAtHand ?? 0) + report.cashPayments - (report.cashToBank ?? 0))}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Calculation & Variance */}
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Final Reconciliation Summary
            </h3>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div>
                <p className="text-gray-400 mb-1">Declared Product Revenue</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(report.totalSales)}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Declared Payments Received</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalPayments)}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Variance</p>
                <p className={`text-2xl font-bold ${isClean ? 'text-green-400' : variance > 0 ? 'text-red-400' : 'text-orange-400'}`}>
                  {isClean ? '₦0 (Balanced)' : variance > 0 ? `-${formatCurrency(variance)} (Shortage)` : `+${formatCurrency(Math.abs(variance))} (Overage)`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-700/80 flex justify-between items-center text-xs text-gray-500">
          <span>Submitted on: {new Date(report.submittedAt).toLocaleString('en-NG')}</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors text-sm"
          >
            Close Detail
          </button>
        </div>
      </div>
    </div>
  );
}
