import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { StatusBadge } from '../../components/dashboard/StatusBadge';
import { logout } from '../../lib/auth';
import { getExpenses, updateExpenseStatus, addNotification, addActivityLog, type Expense } from '../../lib/store';
import { Check, X } from 'lucide-react';

export function ExpenseApprovals() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>(getExpenses);

  const handleApprove = (id: string) => {
    const exp = expenses.find((e) => e.id === id);
    updateExpenseStatus(id, 'approved');
    if (exp) {
      addNotification({
        recipientId: exp.managerId,
        title: 'Expense Approved',
        body: `Your ${exp.type} expense of ${formatCurrency(exp.amount)} has been approved by admin.`,
      });
      addActivityLog({ action: `Expense approved — ${id} (${exp.managerName})`, type: 'expense' });
    }
    setExpenses(getExpenses());
  };

  const handleReject = (id: string) => {
    const exp = expenses.find((e) => e.id === id);
    updateExpenseStatus(id, 'rejected');
    if (exp) {
      addNotification({
        recipientId: exp.managerId,
        title: 'Expense Rejected',
        body: `Your ${exp.type} expense of ${formatCurrency(exp.amount)} has been rejected by admin.`,
      });
      addActivityLog({ action: `Expense rejected — ${id} (${exp.managerName})`, type: 'expense' });
    }
    setExpenses(getExpenses());
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);

  const pendingExpenses = expenses.filter((e) => e.status === 'pending');
  const totalPending = pendingExpenses.reduce((sum, e) => sum + e.amount, 0);
  const thisMonth = expenses.filter((e) => e.date.startsWith(new Date().toISOString().slice(0, 7)));

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role="admin" onLogout={() => { logout(); navigate('/staff/login'); }} />

      <div className="flex-1 overflow-x-hidden">
        <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Expense Approvals</h1>
            <p className="text-gray-400 text-sm">Review and approve expense requests</p>
          </div>
        </header>

        <main className="p-6">
          {expenses.length > 0 && (
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">Pending Requests</p>
                <p className="text-3xl font-bold text-yellow-500">{pendingExpenses.length}</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">Total Pending Amount</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalPending)}</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">This Month</p>
                <p className="text-2xl font-bold text-white">{thisMonth.length} request{thisMonth.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          )}

          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Expense Requests</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Request ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Branch / Manager</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                        No expense requests yet.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4"><span className="text-sm font-mono text-primary">{expense.id}</span></td>
                        <td className="px-6 py-4">
                          <p className="text-white font-medium">{expense.branch}</p>
                          <p className="text-gray-400 text-sm">{expense.managerName}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">{expense.type}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">{expense.description}</td>
                        <td className="px-6 py-4 text-white font-bold">{formatCurrency(expense.amount)}</td>
                        <td className="px-6 py-4 text-gray-400 text-sm">{expense.date}</td>
                        <td className="px-6 py-4"><StatusBadge status={expense.status} /></td>
                        <td className="px-6 py-4">
                          {expense.status === 'pending' ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleApprove(expense.id)}
                                className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg transition-colors"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(expense.id)}
                                className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">-</span>
                          )}
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
