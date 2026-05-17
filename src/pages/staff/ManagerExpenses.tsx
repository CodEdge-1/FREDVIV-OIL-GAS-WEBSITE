import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { StatusBadge } from '../../components/dashboard/StatusBadge';
import { logout, getSession, getAccounts } from '../../lib/auth';
import { getExpenses, saveExpense, addNotification, type Expense } from '../../lib/store';
import { Plus, Receipt } from 'lucide-react';

export function ManagerExpenses() {
  const navigate = useNavigate();

  const session = getSession();
  const account = session ? getAccounts().find((a) => a.id === session.id) : null;
  const branchName = account?.branch || 'My Branch';

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newExpense, setNewExpense] = useState({ type: 'Equipment Maintenance', description: '', amount: '' });

  // Only show this manager's expenses
  const [expenses, setExpenses] = useState<Expense[]>(() =>
    session ? getExpenses().filter((e) => e.managerId === session.id) : []
  );

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount || !session) return;
    const expense: Expense = {
      id: `EXP-${Date.now()}`,
      managerId: session.id,
      managerName: session.name,
      branch: branchName,
      type: newExpense.type,
      description: newExpense.description,
      amount: Number(newExpense.amount),
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
    };
    saveExpense(expense);
    addNotification({
      recipientId: 'admin',
      title: 'New Expense Request',
      body: `${session.name} (${branchName}) submitted a ${expense.type} expense for ${formatCurrency(expense.amount)}`,
    });
    setExpenses(getExpenses().filter((ex) => ex.managerId === session.id));
    toast.success('Expense submitted', { description: 'Awaiting admin approval.' });
    setShowCreateModal(false);
    setNewExpense({ type: 'Equipment Maintenance', description: '', amount: '' });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role="manager" onLogout={() => { logout(); navigate('/staff/login'); }} />

      <div className="flex-1 overflow-x-hidden">
        <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Expense Declarations</h1>
              <p className="text-gray-400 text-sm">Submit and track expense requests</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Expense
            </button>
          </div>
        </header>

        <main className="p-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                        No expenses submitted yet.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4"><span className="text-sm font-mono text-primary">{expense.id}</span></td>
                        <td className="px-6 py-4 text-white">{expense.type}</td>
                        <td className="px-6 py-4 text-gray-300">{expense.description}</td>
                        <td className="px-6 py-4 text-white font-bold">{formatCurrency(expense.amount)}</td>
                        <td className="px-6 py-4 text-gray-400">{expense.date}</td>
                        <td className="px-6 py-4"><StatusBadge status={expense.status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-lg w-full p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Declare New Expense</h2>
            <form className="space-y-4" onSubmit={handleSubmitExpense}>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Expense Type</label>
                <select
                  value={newExpense.type}
                  onChange={(e) => setNewExpense({ ...newExpense, type: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option>Equipment Maintenance</option>
                  <option>Utilities</option>
                  <option>Staff Welfare</option>
                  <option>Security</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Description *</label>
                <textarea
                  required
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={3}
                  placeholder="Describe the expense..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Amount (₦) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setNewExpense({ type: 'Equipment Maintenance', description: '', amount: '' }); }}
                  className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
