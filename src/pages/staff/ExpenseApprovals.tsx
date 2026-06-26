import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { StatusBadge } from '../../components/dashboard/StatusBadge';
import { logout, getSession } from '../../lib/auth';
import { type Expense } from '../../lib/store'; // Keep type for now, will replace with backend type
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';

export function ExpenseApprovals() {
  const navigate = useNavigate();
  const session = getSession();
  const userRole = session?.role || 'ADMIN';
  const [expenses, setExpenses] = useState<Expense[]>([]); // Initialize with empty array

  const fetchExpenses = async () => {
    try {
      const data = await api.get('/expenses'); // Assuming an endpoint for all expenses
      setExpenses(data);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
      toast.error('Failed to load expenses.');
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleApprove = async (id: string) => {
    const expenseToUpdate = expenses.find((e) => e.id === id);
    if (!expenseToUpdate) return;

    try {
      await api.patch(`/expenses/${id}/review`, { action: 'approve' }); // Use backend review endpoint
      await api.post('/notifications', { // Send notification via API
        userId: expenseToUpdate.managerId,
        title: 'Expense Approved',
        body: `Your ${expenseToUpdate.type} expense of ${formatCurrency(expenseToUpdate.amount)} has been approved by admin.`,
      });
      await api.post('/activity-logs', { // Add activity log via API
        userId: session?.id, // Admin's ID
        action: `Expense approved — ${id} (${expenseToUpdate.managerName})`,
        type: 'expense',
        details: `Expense ID: ${id}`,
      });
      toast.success('Expense approved.');
      fetchExpenses(); // Re-fetch to update UI
    } catch (error) {
      console.error('Failed to approve expense:', error);
      toast.error('Failed to approve expense.');
    }
  };

  const handleReject = async (id: string) => {
    const expenseToUpdate = expenses.find((e) => e.id === id);
    if (!expenseToUpdate) return;

    try {
      await api.patch(`/expenses/${id}/review`, { action: 'reject' }); // Use backend review endpoint
      await api.post('/notifications', { // Send notification via API
        userId: expenseToUpdate.managerId,
        title: 'Expense Rejected',
        body: `Your ${expenseToUpdate.type} expense of ${formatCurrency(expenseToUpdate.amount)} has been rejected by admin.`,
      });
      await api.post('/activity-logs', { // Add activity log via API
        userId: session?.id, // Admin's ID
        action: `Expense rejected — ${id} (${expenseToUpdate.managerName})`,
        type: 'expense',
        details: `Expense ID: ${id}`,
      });
      toast.success('Expense rejected.');
      fetchExpenses(); // Re-fetch to update UI
    } catch (error) {
      console.error('Failed to reject expense:', error);
      toast.error('Failed to reject expense.');
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);

  const pendingExpenses = expenses.filter((e) => e.status === 'PENDING'); // Status is now uppercase
  const totalPending = pendingExpenses.reduce((sum, e) => sum + e.amount, 0);
  const thisMonth = expenses.filter((e) => e.date.startsWith(new Date().toISOString().slice(0, 7)));

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role={userRole} onLogout={() => { logout(); navigate('/staff/login'); }} />

      <div className="flex-1 overflow-x-hidden">
        <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-white">
              {userRole === 'ADMIN' ? 'Expense Approvals' : 'Expense Requests'}
            </h1>
            <p className="text-gray-400 text-sm">
              {userRole === 'ADMIN' ? 'Review and approve expense requests' : 'View branch expense requests and status'}
            </p>
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
                        <td className="px-6 py-4"><StatusBadge status={expense.status.toLowerCase() as any} /></td>
                        <td className="px-6 py-4">
                          {expense.status === 'PENDING' && userRole === 'ADMIN' ? (
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

