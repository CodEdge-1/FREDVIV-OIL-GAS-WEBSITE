import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { RoleBadge } from '../../components/dashboard/RoleBadge';
import { StatusBadge } from '../../components/dashboard/StatusBadge';
import {
  Plus, Search, Ban, CheckCircle, XCircle, Trash2, Users, UserCheck, UserX, Eye, EyeOff, Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { logout, StaffAccount, Role } from '../../lib/auth'; // Import StaffAccount and Role types
import { api } from '../../lib/api';

export function UserManagement() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<StaffAccount[]>([]); // Use StaffAccount type
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmAction, setConfirmAction] = useState<
    { id: string; action: 'activate' | 'deactivate' | 'delete' } | null
  >(null);
  const [newUser, setNewUser] = useState({
    name: '', email: '', password: '', role: '' as Role | '', // Use Role enum
    branch: '', location: '',
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffAccount | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '', email: '', role: '' as Role | '',
    branch: '', location: '', phone: '',
  });

  const openEditModal = (account: StaffAccount) => {
    setEditingUser(account);
    setEditFormData({
      name: account.name || '',
      email: account.email || '',
      role: (account.role as Role) || '',
      branch: account.branch || '',
      location: account.location || '',
      phone: account.phone || '',
    });
    setShowEditModal(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await api.patch(`/users/${editingUser.id}`, editFormData);
      toast.success(`Account updated for ${editFormData.name}`);
      setShowEditModal(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/users');
      setAccounts(data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/staff/login');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password || !newUser.role) return;

    try {
      const created = await api.post('/users', {
        ...newUser,
        status: 'ACTIVE',
      });
      toast.success(`Account created for ${created.name}`);
      setShowCreateModal(false);
      setNewUser({ name: '', email: '', password: '', role: '', branch: '', location: '' });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    const { id, action } = confirmAction;
    const account = accounts.find((a) => a.id === id);
    
    try {
      if (action === 'delete') {
        await api.delete(`/users/${id}`);
        toast.success(`${account?.name}'s account has been deleted.`);
      } else {
        const newStatus = action === 'activate' ? 'ACTIVE' : 'SUSPENDED';
        await api.patch(`/users/${id}/status`, { status: newStatus });
        toast.success(`${account?.name}'s account has been ${action === 'activate' ? 'activated' : 'suspended'}.`);
      }
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Action failed');
    }
    setConfirmAction(null);
  };

  const filtered = accounts.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.branch && a.branch.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeCount = accounts.filter((a) => a.status === 'ACTIVE').length;
  const suspendedCount = accounts.filter((a) => a.status === 'SUSPENDED').length;

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role="ADMIN" onLogout={handleLogout} /> {/* Sidebar role prop updated to uppercase */}

      <div className="flex-1 overflow-x-hidden">
        <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-white">User Management</h1>
            <p className="text-gray-400 text-sm">Create and manage staff accounts</p>
          </div>
        </header>

        <main className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-white text-2xl font-bold">{accounts.length}</p>
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-center gap-3">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Active Users</p>
                <p className="text-white text-2xl font-bold">{activeCount}</p>
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-center gap-3">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <UserX className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Suspended Users</p>
                <p className="text-white text-2xl font-bold">{suspendedCount}</p>
              </div>
            </div>
          </div>

          {/* Search & Create */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              Create User
            </button>
          </div>

          {/* Table */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">User</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">Branch / Location</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                        {accounts.length === 0
                          ? 'No accounts yet. Create the first staff account above.'
                          : 'No users match your search.'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((account) => (
                      <tr key={account.id} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-white font-medium">{account.name}</p>
                          <p className="text-gray-400 text-sm">{account.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <RoleBadge role={account.role} size="sm" />
                        </td>
                        <td className="px-6 py-4">
                          {account.branch ? (
                            <div>
                              <p className="text-white text-sm">{account.branch}</p>
                              <p className="text-gray-400 text-xs">{account.location}</p>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={account.status} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              className={`p-2 rounded-lg transition-colors ${
                                account.status === 'ACTIVE'
                                  ? 'text-gray-400 hover:text-red-500 hover:bg-gray-700'
                                  : 'text-gray-400 hover:text-green-500 hover:bg-gray-700'
                              }`}
                              onClick={() =>
                                setConfirmAction({
                                  id: account.id,
                                  action: account.status === 'ACTIVE' ? 'deactivate' : 'activate',
                                })
                              }
                              title={account.status === 'ACTIVE' ? 'Suspend account' : 'Activate account'}
                            >
                              {account.status === 'ACTIVE' ? (
                                <Ban className="w-4 h-4" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-gray-700 rounded-lg transition-colors"
                              onClick={() => openEditModal(account)}
                              title="Edit account"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded-lg transition-colors"
                              onClick={() => setConfirmAction({ id: account.id, action: 'delete' })}
                              title="Delete account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white">Create New User</h2>
              <p className="text-gray-400 text-sm">Add a new staff member to the system</p>
            </div>

            <form className="p-6 space-y-5" onSubmit={handleCreateUser}>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="user@fredvivoil.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Initial Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full pr-12 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Set a password for this account"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Share this password with the staff member. They can change it in their settings.</p>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Role *</label>
                <select
                  required
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as Role })} // Use Role enum
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select role</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="AUDITOR">Auditor</option>
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Branch Name</label>
                  <input
                    type="text"
                    value={newUser.branch}
                    onChange={(e) => setNewUser({ ...newUser, branch: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Victoria Island"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Location</label>
                  <input
                    type="text"
                    value={newUser.location}
                    onChange={(e) => setNewUser({ ...newUser, location: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Lagos"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewUser({ name: '', email: '', password: '', role: '', branch: '', location: '' });
                  }}
                  className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white">Edit User</h2>
              <p className="text-gray-400 text-sm">Update staff member details and operational role</p>
            </div>

            <form className="p-6 space-y-5" onSubmit={handleEditUser}>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="user@fredvivoil.com"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Role *</label>
                  <select
                    required
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as Role })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select role</option>
                    <option value="ADMIN">Super Administrator</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ACCOUNTANT">Accountant</option>
                    <option value="AUDITOR">Auditor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Phone Number</label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Branch Name</label>
                  <input
                    type="text"
                    value={editFormData.branch}
                    onChange={(e) => setEditFormData({ ...editFormData, branch: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Victoria Island"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Location</label>
                  <input
                    type="text"
                    value={editFormData.location}
                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Lagos"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Action Modal */}
      {confirmAction && (() => {
        const account = accounts.find((a) => a.id === confirmAction.id);
        const isDelete = confirmAction.action === 'delete';
        const isDeactivate = confirmAction.action === 'deactivate';
        const isDangerous = isDelete || isDeactivate;

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${isDangerous ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                    {isDelete ? (
                      <Trash2 className="w-6 h-6 text-red-500" />
                    ) : isDeactivate ? (
                      <XCircle className="w-6 h-6 text-red-500" />
                    ) : (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    {isDelete ? 'Delete Account' : isDeactivate ? 'Suspend Account' : 'Activate Account'}
                  </h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                  <p className="text-white font-medium mb-1">{account?.name}</p>
                  <p className="text-gray-400 text-sm">{account?.email}</p>
                </div>
                <div className={`border rounded-lg p-4 text-sm ${isDangerous ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                  {isDelete
                    ? 'This account will be permanently deleted and cannot be recovered.'
                    : isDeactivate
                    ? 'This user will be immediately blocked from logging in.'
                    : 'This user will be able to log in again.'}
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmAction}
                    className={`flex-1 px-6 py-3 text-white rounded-lg transition-colors ${isDangerous ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                  >
                    {isDelete ? 'Delete' : isDeactivate ? 'Suspend' : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
