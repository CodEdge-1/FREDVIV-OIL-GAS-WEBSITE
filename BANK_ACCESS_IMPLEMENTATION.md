# Bank Portal Access Control - Implementation Guide

## ✅ What Has Been Implemented

### 1. **Data Storage Layer** (`src/lib/store.ts`)
- `BankAccessRequest` interface for tracking requests
- Bank portal definitions (UBA & Zenith)
- Functions for CRUD operations on access requests
- Automatic expiry checking (24 hours)

### 2. **Components Created**

#### For Users (Accountants/Auditors):
- **BankAccessPanel** - Request interface for bank access
  - Shows available banks
  - Request/Access buttons
  - Status indicators
  - Callback for portal access

- **SecureBankPortal** - Secure access modal
  - Full-screen iframe (no new tabs)
  - Private session with no history
  - Credential display (hide/show toggle)
  - Copy-to-clipboard for username/password
  - 24-hour access expiry

#### For Admins:
- **AdminBankAccessManagement** - Approval interface
  - Lists pending requests
  - Expandable form for credentials
  - Approve/Reject functionality
  - Auto-expiry setup (24 hours)

### 3. **Updated Pages**
- `AccountantTransactions.tsx` - Replaced transaction table with bank access panel
- `AuditorTransactions.tsx` - Replaced transaction table with bank access panel

---

## 🔧 How to Integrate into Admin Panel

### Option 1: Add to Admin Dashboard
Add to [AdminDashboard.tsx](AdminDashboard.tsx):

```tsx
import { AdminBankAccessManagement } from '../../components/AdminBankAccessManagement';

export function AdminDashboard() {
  // ... existing code ...
  
  const [activeTab, setActiveTab] = useState<'overview' | 'access-requests'>('overview');

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role="admin" onLogout={() => navigate('/staff/login')} />
      
      <div className="flex-1 overflow-x-hidden">
        {/* Tab Navigation */}
        <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
          <div className="px-6 py-4 flex gap-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2 px-4 ${activeTab === 'overview' ? 'border-b-2 border-primary text-white' : 'text-gray-400'}`}
            >
              Dashboard Overview
            </button>
            <button
              onClick={() => setActiveTab('access-requests')}
              className={`pb-2 px-4 ${activeTab === 'access-requests' ? 'border-b-2 border-primary text-white' : 'text-gray-400'}`}
            >
              Bank Access Requests
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          // ... existing dashboard content ...
        )}
        
        {activeTab === 'access-requests' && (
          <main className="p-6">
            <AdminBankAccessManagement />
          </main>
        )}
      </div>
    </div>
  );
}
```

### Option 2: Create Separate Admin Settings Page
Create `src/pages/staff/AdminSettings.tsx`:

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { AdminBankAccessManagement } from '../../components/AdminBankAccessManagement';
import { logout } from '../../lib/auth';

export function AdminSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bank-access');

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role="admin" onLogout={() => { logout(); navigate('/staff/login'); }} />
      
      <div className="flex-1 overflow-x-hidden">
        <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Admin Settings</h1>
            <p className="text-gray-400 text-sm">Manage system-wide access and approvals</p>
          </div>
        </header>

        <main className="p-6 max-w-6xl">
          <AdminBankAccessManagement />
        </main>
      </div>
    </div>
  );
}
```

Then add route in main routing file.

---

## 📋 Usage Workflow

### For Accountants/Auditors:
1. Navigate to **"Transaction Feed"** in sidebar
2. See bank portal access options
3. Click **"Request Access"** for desired bank
4. Admin reviews request and provides credentials
5. Notification sent when approved
6. Click **"Access Portal"** to open secure session
7. View credentials in expandable panel
8. Click copy buttons to get username/password
9. Paste into bank portal and login
10. Access automatically expires after 24 hours

### For Admin:
1. Go to **"Bank Access Requests"** (admin dashboard or settings)
2. See all pending requests listed
3. Click on request to expand
4. Enter bank login credentials (username/password)
5. Click **"Approve & Send Access"**
6. User gets notification of approval
7. User can now access the bank portal

---

## 🔐 Security Features

✅ **No Browser History** - Iframe prevents browser history tracking  
✅ **Private Session** - Credentials shown in modal, not in URL  
✅ **Auto-Expiry** - 24-hour automatic access expiration  
✅ **Approval Gate** - Admin controls all access  
✅ **Copy-Safe** - Username/password copy-to-clipboard (no keyboard visible)  
✅ **Sandbox Iframe** - Restricted iframe permissions  
✅ **Request Tracking** - Full audit trail of requests/approvals  

---

## 🔗 Bank Portal Links
- **UBA**: https://ibank.ubagroup.com/
- **Zenith**: https://realtime.zenithbank.com/DotNetRealtime/#/auth/login

---

## 📝 Important Notes

1. **Credentials are stored in localStorage** - Consider adding encryption for production
2. **24-hour expiry** - Can be customized in `AdminBankAccessManagement.tsx` line ~25
3. **One active request per bank** - Users must wait for approval/rejection before requesting again
4. **No automatic notifications** - Currently uses browser `alert()`, consider implementing toast notifications
5. **No email alerts** - Admin must check admin panel regularly for new requests

---

## 🚀 Testing Checklist

- [ ] User can request bank access
- [ ] Admin sees pending requests
- [ ] Admin can approve with credentials
- [ ] Portal opens in iframe
- [ ] Credentials can be copied
- [ ] Access expires after 24 hours
- [ ] User cannot access if not approved
- [ ] Rejected requests show proper status
- [ ] No browser history is created
- [ ] Mobile responsive design works

