// Central data store — all records persisted to localStorage

export interface SalesReport {
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
  date: string;
  status: 'pending' | 'approved' | 'rejected';
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
const SALES_KEY = 'salesReports';
const EXPENSES_KEY = 'expenses';
const PRICES_KEY = 'prices';
const PRICE_HISTORY_KEY = 'priceHistory';

// ── Helpers ──────────────────────────────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
  catch { return fallback; }
}
function save(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Sales ─────────────────────────────────────────────────────────────────────
export function getSalesReports(): SalesReport[] {
  return load<SalesReport[]>(SALES_KEY, []);
}

export function saveSalesReport(report: SalesReport) {
  const all = getSalesReports().filter((r) => r.id !== report.id);
  save(SALES_KEY, [report, ...all]);
}

export function getTodaySalesReport(managerId: string): SalesReport | null {
  const today = new Date().toISOString().split('T')[0];
  return getSalesReports().find((r) => r.managerId === managerId && r.date === today) ?? null;
}

// ── Expenses ──────────────────────────────────────────────────────────────────
export function getExpenses(): Expense[] {
  return load<Expense[]>(EXPENSES_KEY, []);
}

export function saveExpense(expense: Expense) {
  save(EXPENSES_KEY, [expense, ...getExpenses()]);
}

export function updateExpenseStatus(id: string, status: 'approved' | 'rejected') {
  save(EXPENSES_KEY, getExpenses().map((e) => e.id === id ? { ...e, status } : e));
}

// ── Prices ────────────────────────────────────────────────────────────────────
export function getPrices(): PriceRecord {
  return load<PriceRecord>(PRICES_KEY, { pms: 0, ago: 0 });
}

export function savePrices(newPrices: PriceRecord) {
  const old = getPrices();
  const history = getPriceHistory();
  const now = new Date().toLocaleString('en-NG');
  const entries: PriceHistory[] = [];
  if (old.pms !== newPrices.pms) {
    entries.push({ id: String(Date.now()), product: 'PMS', oldPrice: old.pms, newPrice: newPrices.pms, date: now });
  }
  if (old.ago !== newPrices.ago) {
    entries.push({ id: String(Date.now() + 1), product: 'AGO', oldPrice: old.ago, newPrice: newPrices.ago, date: now });
  }
  save(PRICES_KEY, newPrices);
  save(PRICE_HISTORY_KEY, [...entries, ...history]);
}

export function getPriceHistory(): PriceHistory[] {
  return load<PriceHistory[]>(PRICE_HISTORY_KEY, []);
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
  save(NOTIFICATIONS_KEY, all.map((n) => (n.id === id ? { ...n, read: true } : n)));
}

export function markAllNotificationsRead(recipientId: string): void {
  const all = load<AppNotification[]>(NOTIFICATIONS_KEY, []);
  save(NOTIFICATIONS_KEY, all.map((n) => (n.recipientId === recipientId ? { ...n, read: true } : n)));
}

export function getUnreadCount(recipientId: string): number {
  return getNotifications(recipientId).filter((n) => !n.read).length;
}

// ── Admin Activity Log ────────────────────────────────────────────────────────

export type ActivityType = 'expense' | 'price' | 'balance' | 'security' | 'user';

export interface ActivityLogEntry {
  id: string;
  action: string;
  time: string; // human-readable locale string
  type: ActivityType;
}

const ACTIVITY_LOG_KEY = 'fredviv_activity_log';
const ACTIVITY_LOG_MAX = 50;

export function getActivityLog(): ActivityLogEntry[] {
  return load<ActivityLogEntry[]>(ACTIVITY_LOG_KEY, []);
}

export function addActivityLog(entry: Pick<ActivityLogEntry, 'action' | 'type'>): void {
  const all = getActivityLog();
  const newEntry: ActivityLogEntry = {
    ...entry,
    id: `ACT-${Date.now()}`,
    time: new Date().toLocaleString('en-NG', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: true,
    }),
  };
  save(ACTIVITY_LOG_KEY, [newEntry, ...all].slice(0, ACTIVITY_LOG_MAX));
}

// ── Balance Requests ──────────────────────────────────────────────────────────

export interface BalanceRequest {
  id: string;
  requesterId: string;
  requester: string;
  role: 'accountant' | 'auditor';
  requestTime: string;
  status: 'pending' | 'approved';
  approvedTime?: string;
  adminPin?: string;
  pinUsed?: boolean;
}

const BALANCE_REQUESTS_KEY = 'fredviv_balance_requests';

export function getBalanceRequests(): BalanceRequest[] {
  try { return JSON.parse(localStorage.getItem(BALANCE_REQUESTS_KEY) || '[]'); }
  catch { return []; }
}

export function saveBalanceRequest(req: BalanceRequest): void {
  const all = getBalanceRequests().filter((r) => r.id !== req.id);
  localStorage.setItem(BALANCE_REQUESTS_KEY, JSON.stringify([req, ...all]));
}

export function updateBalanceRequest(id: string, updates: Partial<BalanceRequest>): void {
  const all = getBalanceRequests().map((r) => (r.id === id ? { ...r, ...updates } : r));
  localStorage.setItem(BALANCE_REQUESTS_KEY, JSON.stringify(all));
}

export function getPendingBalanceRequest(requesterId: string): BalanceRequest | null {
  return getBalanceRequests().find((r) => r.requesterId === requesterId && r.status === 'pending') ?? null;
}

export function getApprovedBalanceRequest(requesterId: string): BalanceRequest | null {
  return getBalanceRequests().find((r) => r.requesterId === requesterId && r.status === 'approved' && !r.pinUsed) ?? null;
}

// ── Bank Account & Transactions (populated via bank API when connected) ───────

export interface BankTransaction {
  id: string;
  date: string;         // YYYY-MM-DD
  valueDate: string;    // settlement date
  description: string;
  reference: string;
  type: 'credit' | 'debit';
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

const BANK_TRANSACTIONS_KEY = 'fredviv_bank_transactions';
const BANK_ACCOUNT_KEY = 'fredviv_bank_account';

export function getBankAccount(): BankAccount {
  return load<BankAccount>(BANK_ACCOUNT_KEY, {
    accountName: 'Fredviv Oil & Gas Ltd',
    accountNumber: '',
    bankName: '',
    balance: 0,
    lastUpdated: null,
  });
}

export function getBankTransactions(): BankTransaction[] {
  return load<BankTransaction[]>(BANK_TRANSACTIONS_KEY, []);
}

// Called when the bank API pushes/syncs data
export function saveBankData(account: BankAccount, transactions: BankTransaction[]): void {
  save(BANK_ACCOUNT_KEY, account);
  save(BANK_TRANSACTIONS_KEY, transactions);
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
  requester: string;
  role: 'accountant' | 'auditor';
  bankId: 'uba' | 'zenith';
  bankName: string;
  requestTime: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedTime?: string;
  loginUsername?: string;
  loginPassword?: string;
  expiresAt?: string; // optional expiry time
  accessToken?: string; // session token for iframe access
}

const BANK_ACCESS_REQUESTS_KEY = 'fredviv_bank_access_requests';

export function getBankAccessRequests(): BankAccessRequest[] {
  try { return JSON.parse(localStorage.getItem(BANK_ACCESS_REQUESTS_KEY) || '[]'); }
  catch { return []; }
}

export function saveBankAccessRequest(req: BankAccessRequest): void {
  const all = getBankAccessRequests().filter((r) => r.id !== req.id);
  localStorage.setItem(BANK_ACCESS_REQUESTS_KEY, JSON.stringify([req, ...all]));
}

export function updateBankAccessRequest(id: string, updates: Partial<BankAccessRequest>): void {
  const all = getBankAccessRequests().map((r) => (r.id === id ? { ...r, ...updates } : r));
  localStorage.setItem(BANK_ACCESS_REQUESTS_KEY, JSON.stringify(all));
}

export function getPendingBankAccessRequests(): BankAccessRequest[] {
  return getBankAccessRequests().filter((r) => r.status === 'pending');
}

export function getApprovedBankAccessRequest(requesterId: string, bankId: 'uba' | 'zenith'): BankAccessRequest | null {
  const req = getBankAccessRequests().find(
    (r) => r.requesterId === requesterId && r.bankId === bankId && r.status === 'approved'
  );
  
  // Check if expired
  if (req && req.expiresAt && new Date(req.expiresAt) < new Date()) {
    updateBankAccessRequest(req.id, { status: 'pending', loginUsername: undefined, loginPassword: undefined });
    return null;
  }
  
  return req ?? null;
}

// ── Computed helpers for dashboards ──────────────────────────────────────────
export function getTodayRevenue(): number {
  const today = new Date().toISOString().split('T')[0];
  return getSalesReports()
    .filter((r) => r.date === today)
    .reduce((sum, r) => sum + r.totalSales, 0);
}

export function getPendingExpenseCount(): number {
  return getExpenses().filter((e) => e.status === 'pending').length;
}

// ── Chat unread count (for sidebar badge) ────────────────────────────────────
const CHAT_LAST_READ_PREFIX = 'fredviv_chat_last_read_';
const BROADCAST_MESSAGES_KEY_REF = 'fredviv_broadcast_messages';
const PRIVATE_CHATS_KEY_REF = 'fredviv_private_chats';

export function getChatUnreadCount(userId: string): number {
  if (!userId) return 0;
  const lastRead = localStorage.getItem(CHAT_LAST_READ_PREFIX + userId);
  const since = lastRead ? new Date(lastRead).getTime() : 0;
  let count = 0;
  try {
    const broadcast = JSON.parse(localStorage.getItem(BROADCAST_MESSAGES_KEY_REF) || '[]');
    for (const m of broadcast) {
      if (m.senderId !== userId && new Date(m.timestamp).getTime() > since) count++;
    }
  } catch { /* */ }
  try {
    const chats = JSON.parse(localStorage.getItem(PRIVATE_CHATS_KEY_REF) || '{}');
    if (userId === 'admin') {
      for (const data of Object.values(chats) as { messages: { senderId: string; timestamp: string }[] }[]) {
        for (const m of data.messages) {
          if (m.senderId !== userId && new Date(m.timestamp).getTime() > since) count++;
        }
      }
    } else {
      const mine = (chats[`dm-${userId}`]?.messages ?? []) as { senderId: string; timestamp: string }[];
      for (const m of mine) {
        if (m.senderId !== userId && new Date(m.timestamp).getTime() > since) count++;
      }
    }
  } catch { /* */ }
  return count;
}

export function markChatAsRead(userId: string): void {
  if (userId) localStorage.setItem(CHAT_LAST_READ_PREFIX + userId, new Date().toISOString());
}
