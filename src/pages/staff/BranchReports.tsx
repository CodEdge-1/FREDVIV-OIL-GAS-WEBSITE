import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { StatusBadge } from '../../components/dashboard/StatusBadge';
import { logout } from '../../lib/auth';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { type SalesReport } from '../../lib/store'; // Keep type for now, will replace with backend type
import { ReportDetailsModal } from '../../components/dashboard/ReportDetailsModal';
import { Filter, Download, Calendar, FileText, Eye } from 'lucide-react';

export function BranchReports() {
  const navigate = useNavigate();
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [reports, setReports] = useState<SalesReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await api.get('/sales-reports'); // Assuming an endpoint for all sales reports
        setReports(data);
      } catch (error) {
        console.error('Failed to fetch sales reports:', error);
        toast.error('Failed to load sales reports.');
      }
    };
    fetchReports();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/staff/login');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const branches = Array.from(new Set(reports.map((r) => r.branch)));

  const filteredReports = selectedBranch === 'all'
    ? reports // Filtered reports should be based on the fetched reports
    : reports.filter((r) => r.branch === selectedBranch);

  const hasData = filteredReports.length > 0;
  const totalSales = filteredReports.reduce((sum, r) => sum + r.totalSales, 0);
  const totalPMS = filteredReports.reduce((sum, r) => sum + r.soldPMS, 0);
  const totalAGO = filteredReports.reduce((sum, r) => sum + r.soldAGO, 0);

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role="ADMIN" onLogout={handleLogout} /> {/* Sidebar role prop updated to uppercase */}

      <div className="flex-1 overflow-x-hidden">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Branch Reports</h1>
            <p className="text-gray-400 text-sm">Daily sales and inventory overview</p>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm text-gray-300 mb-2">Filter by Branch</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Branches</option>
                {branches.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Date Range</label>
              <button className="px-6 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Today
              </button>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">&nbsp;</label>
              <button className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export
              </button>
            </div>
          </div>

          {/* Summary Cards — only when there is data */}
          {hasData && (
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">Total Sales</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalSales)}</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">PMS Sold</p>
                <p className="text-2xl font-bold text-white">{totalPMS.toLocaleString()} L</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">AGO Sold</p>
                <p className="text-2xl font-bold text-white">{totalAGO.toLocaleString()} L</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">Branches Reporting</p>
                <p className="text-2xl font-bold text-white">{filteredReports.length}</p>
              </div>
            </div>
          )}

          {/* Reports Table */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Branch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">PMS Sold / Remaining</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">AGO Sold / Remaining</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Total Sales</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                            <FileText className="w-6 h-6 text-gray-500" />
                          </div>
                          <p className="text-gray-400 font-medium">No reports submitted yet</p>
                          <p className="text-gray-500 text-sm">Branch reports will appear here once managers submit their daily sales.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-white font-medium">{report.branch}</p>
                            <p className="text-gray-400 text-sm">{report.location}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-300 text-sm">{report.date}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="text-white">{report.soldPMS.toLocaleString()} L sold</p>
                            <p className="text-gray-400">{report.remainingPMS.toLocaleString()} L remaining</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="text-white">{report.soldAGO.toLocaleString()} L sold</p>
                            <p className="text-gray-400">{report.remainingAGO.toLocaleString()} L remaining</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white font-bold">{formatCurrency(report.totalSales)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={report.status as any} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-xs font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Details
                          </button>
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

      {selectedReport && (
        <ReportDetailsModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
}
