// Central data store — all records persisted to localStorage

import { Role } from './auth'; // Import Role enum from auth.ts

export interface SalesReport { // This interface should ideally be generated from Prisma or shared
  id: string;
  managerId: string;
  managerName: string;
  branch: string;
  location: string;
  date: string; // YYYY-MM-DD
  openingPMS: number;
  soldPMS: number;
  remainingPMS: number;
  openingAGO: number;
  soldAGO: number;
  remainingAGO: number;
  overage: number;
  overagePMS: number;
  overageAGO: number;
  pmsPrice: number;
  agoPrice: number;
  pmsSales: number;
  agoSales: number;
  totalSales: number;
  cardPayments: number;
  bankTransfers: number;
  cashPayments: number;
  totalPayments: number;
  submittedAt: string;
}

export interface Expense {
  id: string;
  managerId: string;
  managerName: string;
  branch: string;
  type: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  status: 'PENDING' | 'APPROVED' | 'REJECTED'; // Align with Prisma Status enum
}

export interface PriceRecord {
  pms: number;
  ago: number;
}

export interface PriceHistory {
  id: string;
  product: 'PMS' | 'AGO';
  oldPrice: number;
  newPrice: number;
  date: string;
}

// ── Keys ─────────────────────────────────────────────────────────────────────
// ── Helpers ──────────────────────────────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
  catch { return fallback; }
}
function save(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Notifications ─────────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  recipientId: string; // user ID, or 'admin' for the admin
  title: string;
  body: string;
  createdAt: string; // ISO timestamp
  read: boolean;
}

const NOTIFICATIONS_KEY = 'fredviv_notifications';

export function getNotifications(recipientId: string): AppNotification[] {
  return load<AppNotification[]>(NOTIFICATIONS_KEY, [])
    .filter((n) => n.recipientId === recipientId);
}

export function addNotification(notif: Pick<AppNotification, 'recipientId' | 'title' | 'body'>): void {
  const all = load<AppNotification[]>(NOTIFICATIONS_KEY, []);
  const newNotif: AppNotification = {
    ...notif,
    id: `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    read: false,
    createdAt: new Date().toISOString(),
  };
  save(NOTIFICATIONS_KEY, [newNotif, ...all]);
}

export function markNotificationRead(id: string): void {
  const all = load<AppNotification[]>(NOTIFICATIONS_KEY, []);
  save(NOTIFICATIONS_KEY, all.map((n: AppNotification) => (n.id === id ? { ...n, read: true } : n)));
}

export function markAllNotificationsRead(recipientId: string): void {
  const all = load<AppNotification[]>(NOTIFICATIONS_KEY, []);
  save(NOTIFICATIONS_KEY, all.map((n: AppNotification) => (n.recipientId === recipientId ? { ...n, read: true } : n)));
}

export function getUnreadCount(recipientId: string): number {
  return getNotifications(recipientId).filter((n) => !n.read).length;
}

// ── Admin Activity Log ────────────────────────────────────────────────────────

export type ActivityType = 'expense' | 'price' | 'balance' | 'security' | 'user';

export interface ActivityLogEntry {
  id: string;
  action: string;
  time: string; // ISO timestamp
  type: ActivityType;
  details?: string;
  ipAddress?: string;
  userId?: string; // The user who performed the action
  createdAt: string; // ISO timestamp
}

// ── Balance Requests ──────────────────────────────────────────────────────────

export interface BalanceRequest {
  id: string;
  requesterId: string;
  requester: string;
  role: Role; // Align with Prisma Role enum
  requestTime: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED'; // Align with Prisma Status enum
  approvedTime?: string;
  adminPin?: string;
  pinUsed?: boolean;
  period?: string;
}

// ── Bank Account & Transactions (populated via bank API when connected) ───────

export interface BankTransaction {
  id: string;
  date: string;         // YYYY-MM-DD
  valueDate: string;    // settlement date
  description: string;
  reference: string; // This might be optional
  type: 'CREDIT' | 'DEBIT'; // Align with Prisma enum if applicable
  amount: number;
  balance: number;      // running balance after this transaction
}

export interface BankAccount {
  accountName: string;
  accountNumber: string;
  bankName: string;
  balance: number;
  lastUpdated: string | null; // ISO timestamp of last API sync
}

// Called when the bank API pushes/syncs data
export function saveBankData(account: BankAccount, transactions: BankTransaction[]): void {
  // This function is for local storage, will be removed once backend is fully integrated
  console.warn('saveBankData is a local storage function and should be replaced by API calls.');
}

// ── Bank Portal Access Requests (for Accountant/Auditor access with login details) ──

export interface BankPortal {
  id: 'uba' | 'zenith';
  name: string;
  url: string;
}

export const AVAILABLE_BANKS: BankPortal[] = [
  {
    id: 'uba',
    name: 'UBA Bank',
    url: 'https://ibank.ubagroup.com/',
  },
  {
    id: 'zenith',
    name: 'Zenith Bank',
    url: 'https://realtime.zenithbank.com/DotNetRealtime/#/auth/login',
  },
];

export interface BankAccessRequest {
  id: string;
  requesterId: string;
  requester: string; // This should be derived from requesterId on backend
  role: Role; // Align with Prisma Role enum
  bankId: 'uba' | 'zenith';
  bankName: string; // This should be derived from bankId on backend
  requestTime: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED'; // Align with Prisma Status enum
  approvedTime?: string;
  loginUsername?: string;
  loginPassword?: string;
  expiresAt?: string; // optional expiry time
  accessToken?: string; // session token for iframe access
}
