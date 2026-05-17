export type Role = 'admin' | 'manager' | 'accountant' | 'auditor';

export interface StaffAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'manager' | 'accountant' | 'auditor';
  phone?: string;
  branch?: string;
  location?: string;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface AuthSession {
  id: string;
  name: string;
  email: string;
  role: Role;
}

const ACCOUNTS_KEY = 'staffAccounts';
const SESSION_KEY = 'staffAuth';
const TOKEN_KEY = 'authToken';

export function getAccounts(): StaffAccount[] {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAccounts(accounts: StaffAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const { apiClient } = await import('./api-client');
  const response = await apiClient.login(email, password);
  
  console.log('Login response:', response);
  
  if (!response.access_token || !response.user) {
    throw new Error('Invalid login response from server');
  }

  const roleMap: Record<string, Role> = {
    'ADMIN': 'admin',
    'MANAGER': 'manager',
    'ACCOUNTANT': 'accountant',
    'AUDITOR': 'auditor',
  };
  
  const role = roleMap[response.user.role] || 'accountant';
  
  const session: AuthSession = {
    id: response.user.id,
    name: response.user.name || email,
    email: response.user.email,
    role,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(TOKEN_KEY, response.access_token);
  return session;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function getSession(): AuthSession | null {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function createAccount(account: Omit<StaffAccount, 'id' | 'createdAt'>): StaffAccount {
  const accounts = getAccounts();
  const created: StaffAccount = {
    ...account,
    id: String(Date.now()),
    createdAt: new Date().toISOString().split('T')[0],
  };
  saveAccounts([...accounts, created]);
  return created;
}

export function deleteAccount(id: string) {
  saveAccounts(getAccounts().filter((a) => a.id !== id));
}

export function toggleAccountStatus(id: string) {
  saveAccounts(
    getAccounts().map((a) =>
      a.id === id ? { ...a, status: a.status === 'active' ? 'suspended' : 'active' } : a
    )
  );
}

export function updateProfile(id: string, data: { name?: string; phone?: string }): boolean {
  const accounts = getAccounts();
  const idx = accounts.findIndex((a) => a.id === id);
  if (idx === -1) return false;
  accounts[idx] = { ...accounts[idx], ...data };
  saveAccounts(accounts);
  return true;
}

export function changePassword(id: string, newPassword: string): boolean {
  const accounts = getAccounts();
  const idx = accounts.findIndex((a) => a.id === id);
  if (idx === -1) return false;
  accounts[idx].password = newPassword;
  saveAccounts(accounts);
  return true;
}

export function routeForRole(role: Role): string {
  const routes: Record<Role, string> = {
    admin: '/staff/admin/dashboard',
    manager: '/staff/manager/dashboard',
    accountant: '/staff/accountant/dashboard',
    auditor: '/staff/auditor/dashboard',
  };
  return routes[role];
}
