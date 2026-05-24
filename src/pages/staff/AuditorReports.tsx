import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { type SalesReport } from '../../lib/store'; // Keep type for now, will replace with backend type
import {
  ClipboardCheck,
  AlertTriangle,
  CheckCircle,
  Flag,
  Search,
  Filter,
  Download,
  FileBarChart2,
  FileText,
} from 'lucide-react';

type AuditStatus = 'PENDING' | 'APPROVED' | 'REJECTED'; // Align with Prisma Status enum

interface AuditReport extends SalesReport { // This type will need to be aligned with backend AuditReport
  auditStatus: AuditStatus;
  auditNote?: string;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);

function AuditStatusBadge({ status }: { status: AuditStatus }) {
  const styles: Record<AuditStatus, string> = { // Explicitly type styles
    PENDING: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    APPROVED: 'bg-green-500/10 text-green-400 border border-green-500/20',
    REJECTED: 'bg-red-500/10 text-red-400 border border-red-500/20',
  };
  const labels: Record<AuditStatus, string> = { PENDING: 'Pending Review', APPROVED: 'Audited', REJECTED: 'Flagged' }; // Update labels
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status === 'PENDING' && <ClipboardCheck className="w-3 h-3" />}
      {status === 'APPROVED' && <CheckCircle className="w-3 h-3" />}
      {status === 'REJECTED' && <AlertTriangle className="w-3 h-3" />}
      {labels[status]}
    </span>
  );
}

export function AuditorReports() {
  const navigate = useNavigate();

  const [reports, setReports] = useState<AuditReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AuditStatus>('all');
  const [flagModal, setFlagModal] = useState<AuditReport | null>(null);
  const [flagNote, setFlagNote] = useState('');

  const fetchReports = async () => {
    try {
      const data = await api.get('/sales-reports/audit'); // Assuming an endpoint for audit reports
      // Map backend status to frontend AuditStatus if necessary
      setReports(data.map((r: any) => ({ ...r, auditStatus: r.auditStatus || 'PENDING' }))); // Update default status
    } catch (error) {
      console.error('Failed to fetch audit reports:', error);
      toast.error('Failed to load audit reports.');
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleMarkAudited = async (id: string) => {
    try {
      await api.patch(`/sales-reports/${id}/audit`, { auditStatus: 'APPROVED' }); // Update status to APPROVED
      fetchReports(); // Re-fetch to update UI
    } catch (error) {
      toast.error('Failed to mark report as audited.');
    }
  };

  const handleFlag = async () => {
    if (!flagModal) return;
    try {
      await api.patch(`/sales-reports/${flagModal.id}/audit`, { auditStatus: 'REJECTED', auditNote: flagNote }); // Update status to REJECTED
      toast.success('Report flagged successfully.');
      setFlagModal(null);
      setFlagNote('');
      fetchReports(); // Re-fetch to update UI
    } catch (error) {
      toast.error('Failed to flag report.');
    }
  };

  const filtered = reports.filter((r) => {
    const matchesSearch =
      r.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.managerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.auditStatus === statusFilter; // Status filter will use uppercase
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex min-h-screen bg-gray-900"> {/* Updated role prop below */}
      <Sidebar role="AUDITOR" onLogout={() => navigate('/staff/login')} />

      <div className="flex-1 overflow-x-hidden">
        <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Sales Reports</h1>
            <p className="text-gray-400 text-sm">Verify declared sales against payment records</p>
          </div>
        </header>

        <main className="p-6">
          <div className="bg-gray-800 border border-gray-700 border-t-2 border-t-emerald-500 rounded-xl">
            <div className="p-5 border-b border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <FileBarChart2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-white">Branch Sales Reports</h2>
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">AUDIT</span>
                    </div>
                    <p className="text-gray-400 text-sm">Verify declared sales against payment records</p>
                  </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 border border-gray-600 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by branch, manager or report ID…"
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                    className="px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">All Statuses</option>
                    <option value="PENDING">Pending Review</option>
                    <option value="APPROVED">Audited</option>
                    <option value="REJECTED">Flagged</option>
                  </select>
                </div>
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
                    <th className="px-5 py-3 text-left text-xs font-medium text-emerald-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                            <FileText className="w-6 h-6 text-gray-500" />
                          </div>
                          <p className="text-gray-400 font-medium">No reports to audit yet</p>
                          <p className="text-gray-500 text-sm">Sales reports submitted by branch managers will appear here for review.</p>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-gray-500 text-sm">
                        No reports match your search or filter.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((report) => {
                      const totalPayments = report.cardPayments + report.bankTransfers + report.cashPayments;
                      const variance = report.totalSales - totalPayments;
                      const isClean = variance === 0;
                      return (
                        <tr key={report.id} className="hover:bg-gray-700/30 transition-colors">
                          <td className="px-5 py-4">
                            <p className="text-white font-medium text-sm">{report.branch}</p>
                            <p className="text-gray-500 text-xs">{report.managerName}</p>
                            <p className="text-gray-600 text-xs font-mono">{report.id}</p>
                          </td>
                          <td className="px-5 py-4 text-gray-300 text-sm">{report.date}</td>
                          <td className="px-5 py-4 text-right">
                            <p className="text-white font-semibold text-sm">{formatCurrency(report.totalSales)}</p>
                            <p className="text-gray-500 text-xs">{(report.soldPMS + report.soldAGO).toLocaleString()} L total</p>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <p className="text-white text-sm">{formatCurrency(totalPayments)}</p>
                            <div className="text-xs text-gray-500 space-y-0.5 mt-0.5">
                              <p>Card: {formatCurrency(report.cardPayments)}</p>
                              <p>Bank: {formatCurrency(report.bankTransfers)}</p>
                              <p>Cash: {formatCurrency(report.cashPayments)}</p>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className={`text-sm font-bold ${isClean ? 'text-green-400' : variance > 0 ? 'text-red-400' : 'text-orange-400'}`}>
                              {isClean ? '—' : variance > 0 ? `-${formatCurrency(variance)}` : `+${formatCurrency(Math.abs(variance))}`}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <AuditStatusBadge status={report.auditStatus} />
                            {report.auditNote && (
                              <p className="text-xs text-gray-500 mt-1 max-w-[160px] truncate" title={report.auditNote}>
                                {report.auditNote}
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            {report.auditStatus === 'PENDING' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleMarkAudited(report.id)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-medium rounded-lg hover:bg-green-500/20 transition-colors"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => { setFlagModal(report); setFlagNote(''); }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-medium rounded-lg hover:bg-red-500/20 transition-colors"
                                >
                                  <Flag className="w-3.5 h-3.5" />
                                  Flag
                                </button>
                              </div>
                            )}
                            {report.auditStatus === 'APPROVED' && (
                              <span className="text-xs text-gray-500">No action needed</span>
                            )}
                            {report.auditStatus === 'REJECTED' && (
                              <button
                                onClick={() => handleMarkAudited(report.id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 text-gray-300 border border-gray-600 text-xs font-medium rounded-lg hover:bg-gray-600 transition-colors"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Clear Flag
                              </button>
                            )}
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

      {/* Flag Modal */}
      {flagModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-2 mb-1">
              <Flag className="w-5 h-5 text-red-400" />
              <h2 className="text-white font-bold text-lg">Flag Report</h2>
            </div>
            <p className="text-gray-400 text-sm mb-5">
              {flagModal.branch} · {flagModal.id} · {flagModal.date}
            </p>
            <div className="bg-gray-700/50 rounded-lg p-4 mb-5 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Declared Sales</span>
                <span className="text-white font-medium">{formatCurrency(flagModal.totalSales)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Received</span>
                <span className="text-white font-medium">
                  {formatCurrency(flagModal.cardPayments + flagModal.bankTransfers + flagModal.cashPayments)}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-600 pt-1 mt-1">
                <span className="text-gray-400">Variance</span>
                <span className="text-red-400 font-bold">
                  {formatCurrency(Math.abs(flagModal.totalSales - (flagModal.cardPayments + flagModal.bankTransfers + flagModal.cashPayments)))}
                </span>
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Audit Note <span className="text-gray-500 font-normal">(required)</span>
              </label>
              <textarea
                value={flagNote}
                onChange={(e) => setFlagNote(e.target.value)}
                rows={3}
                placeholder="Describe the discrepancy or reason for flagging…"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setFlagModal(null)}
                className="flex-1 py-2.5 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFlag}
                disabled={!flagNote.trim()}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Flag className="w-4 h-4" />
                Confirm Flag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
