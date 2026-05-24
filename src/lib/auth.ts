import { api } from './api'; // Import api for fetching user data

// Define roles as they come from the backend (Prisma enum)
export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  ACCOUNTANT = 'ACCOUNTANT',
  AUDITOR = 'AUDITOR'
}

// StaffAccount will be fetched from the backend, so its structure should match the User model
export interface StaffAccount { // This should ideally be a shared type from backend
  id: string;
  email: string;
  name: string;
  role: Role;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING'; // Assuming these are the statuses from backend
  branch?: string;
  location?: string;
  phone?: string;
}

export interface AuthSession {
  id: string;
  name: string;
  email: string;
  role: Role;
  token: string; // Add token to AuthSession
}

const ACCOUNTS_KEY = 'staffAccounts';
const SESSION_KEY = 'staffAuth';
const TOKEN_KEY = 'authToken';

export async function login(email: string, password: string): Promise<AuthSession> {
  const { apiClient } = await import('./api-client');
  const response = await apiClient.login(email, password);
  
  console.log('Login response:', response);
  
  if (!response.access_token || !response.user) {
    throw new Error('Invalid login response from server');
  }
  // Backend should return the role as uppercase, directly assignable to Role type
  const role: Role = response.user.role;
  
  const session: AuthSession = {
    id: response.user.id,
    name: response.user.name || email,
    email: response.user.email,
    role,
    token: response.access_token, // Store the token in the session
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

export function routeForRole(role: Role): string {
  const routes: Record<Role, string> = {
    ADMIN: '/staff/admin/dashboard',
    MANAGER: '/staff/manager/dashboard',
    ACCOUNTANT: '/staff/accountant/dashboard',
    AUDITOR: '/staff/auditor/dashboard',
  };
  // Ensure the role is converted to lowercase for the path if needed,
  // or ensure your routing system handles uppercase roles.
  // For now, let's assume the routes are defined with lowercase paths.
  return routes[role].toLowerCase();
}
