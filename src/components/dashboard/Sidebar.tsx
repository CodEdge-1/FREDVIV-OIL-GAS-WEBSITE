import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  FileText,
  CheckSquare,
  CreditCard,
  MessageSquare,
  Settings,
  LogOut,
  TrendingUp,
  Receipt,
  Menu,
  X,
  Bell,
} from 'lucide-react';
import { getSession, Role } from '../../lib/auth'; // Import Role type
import { api } from '../../lib/api'; // Import api

interface SidebarProps {
  role: Role; // Use the uppercase Role enum
  onLogout: () => void;
}

export function Sidebar({ role, onLogout }: SidebarProps) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0); // This will be fetched from API
  const [chatCount, setChatCount] = useState(0); // This will be fetched from API

  const session = getSession();
  const userId = session?.id ?? '';

  // Fetch notification and chat unread counts from API
  useEffect(() => {
    const fetchCounts = async () => {
      if (!userId) return;
      try {
        const [notifData, chatData] = await Promise.all([
          api.get(`/users/${userId}/notifications/unread-count`), // Assuming this endpoint exists
          api.get(`/chat/unread-count/${userId}`), // Assuming this endpoint exists
        ]);
        setNotifCount(notifData.count);
        setChatCount(chatData.count);
      } catch (error) {
        console.error('Failed to fetch unread counts:', error);
      }
    };

    fetchCounts();
    const intervalId = setInterval(fetchCounts, 5000); // Poll every 5 seconds
    return () => clearInterval(intervalId);
  }, [userId, location.pathname]); // Re-fetch if user or path changes

  // Convert role to lowercase for path construction
  const lowerCaseRole = role.toLowerCase();
  const chatPath = `/staff/${lowerCaseRole}/chat`;
  const isOnChat = location.pathname === chatPath;

  // Poll every 5 seconds for new messages/notifications
  useEffect(() => {
    function refresh() {
      if (!userId) return;
      // These are now handled by the API fetch in the useEffect above
      // setNotifCount(getUnreadCount(userId));
      // setChatCount(isOnChat ? 0 : getChatUnreadCount(userId));
    }
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [userId, isOnChat]);

  const isActive = (path: string) => location.pathname === path;

  const adminLinks = [ // Use lowercase paths for consistency
    { path: '/staff/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', role: 'ADMIN' },
    { path: '/staff/admin/users', icon: Users, label: 'User Management', role: 'ADMIN' },
    { path: '/staff/admin/prices', icon: DollarSign, label: 'Price Management', role: 'ADMIN' },
    { path: '/staff/admin/reports', icon: FileText, label: 'Branch Reports', role: 'ADMIN' },
    { path: '/staff/admin/expenses', icon: CheckSquare, label: 'Expense Approvals', role: 'ADMIN' },
    { path: '/staff/admin/balance-requests', icon: CreditCard, label: 'Balance Requests', role: 'ADMIN' },
    { path: '/staff/admin/chat', icon: MessageSquare, label: 'Chat Center', role: 'ADMIN' },
    { path: '/staff/admin/settings', icon: Settings, label: 'Settings', role: 'ADMIN' },
  ];

  const managerLinks = [ // Use lowercase paths for consistency
    { path: '/staff/manager/dashboard', icon: LayoutDashboard, label: 'Dashboard', role: 'MANAGER' },
    { path: '/staff/manager/sales', icon: TrendingUp, label: 'Daily Sales', role: 'MANAGER' },
    { path: '/staff/manager/expenses', icon: Receipt, label: 'Expenses', role: 'MANAGER' },
    { path: '/staff/manager/chat', icon: MessageSquare, label: 'Chat', role: 'MANAGER' },
    { path: '/staff/manager/settings', icon: Settings, label: 'Settings', role: 'MANAGER' },
  ];

  const accountantLinks = [ // Use lowercase paths for consistency
    { path: '/staff/accountant/dashboard', icon: LayoutDashboard, label: 'Dashboard', role: 'ACCOUNTANT' },
    { path: '/staff/accountant/transactions', icon: TrendingUp, label: 'Transactions', role: 'ACCOUNTANT' },
    { path: '/staff/accountant/reports', icon: FileText, label: 'Sales Reports', role: 'ACCOUNTANT' },
    { path: '/staff/accountant/chat', icon: MessageSquare, label: 'Chat', role: 'ACCOUNTANT' },
    { path: '/staff/accountant/settings', icon: Settings, label: 'Settings', role: 'ACCOUNTANT' },
  ];

  const auditorLinks = [ // Use lowercase paths for consistency
    { path: '/staff/auditor/dashboard', icon: LayoutDashboard, label: 'Dashboard', role: 'AUDITOR' },
    { path: '/staff/auditor/transactions', icon: TrendingUp, label: 'Transactions', role: 'AUDITOR' },
    { path: '/staff/auditor/reports', icon: FileText, label: 'Sales Reports', role: 'AUDITOR' },
    { path: '/staff/auditor/chat', icon: MessageSquare, label: 'Chat', role: 'AUDITOR' },
    { path: '/staff/auditor/settings', icon: Settings, label: 'Settings', role: 'AUDITOR' },
  ];

  const links =
    role === 'ADMIN' ? adminLinks :
    role === 'MANAGER' ? managerLinks :
    role === 'ACCOUNTANT' ? accountantLinks :
    auditorLinks;

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="/assets/logo1.png" 
            alt="Fredviv Oil & Gas Logo" 
            className="w-10 h-10 object-contain flex-shrink-0"
          />
          <div>
            <h2 className="text-white font-bold">Fredviv Oil & Gas</h2>
            <p className="text-xs text-gray-400 capitalize">{role} Portal</p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden text-gray-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {links.map((link) => {
            const active = isActive(link.path);
            const isChat = link.path === chatPath;
            const badge = isChat ? chatCount : 0;
            return (
              <li key={link.path}>
                <Link
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    active
                      ? 'bg-primary text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <link.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1">{link.label}</span>
                  {badge > 0 && (
                    <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Notification summary + Logout */}
      <div className="p-4 border-t border-gray-700 space-y-1">
        {/* Notification bell row */}
        {notifCount > 0 && (
          <Link
            to={`/staff/${lowerCaseRole}/settings`} // Use lowerCaseRole for path
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-yellow-400 hover:bg-gray-700 transition-colors"
          >
            <Bell className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1 text-sm font-medium">Notifications</span>
            <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {notifCount > 99 ? '99+' : notifCount}
            </span>
          </Link>
        )}
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:text-white"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 border-r border-gray-700 flex flex-col transform transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-gray-800 border-r border-gray-700 flex-col h-screen sticky top-0">
        {sidebarContent}
      </aside>
    </>
  );
}
