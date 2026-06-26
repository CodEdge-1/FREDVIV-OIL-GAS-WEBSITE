import { BrowserRouter, Routes, Route, Link } from 'react-router';
import { Toaster } from 'sonner';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ServicesPage } from './pages/ServicesPage';
import { ContactPage } from './pages/ContactPage';
import { StaffLoginPage } from './pages/StaffLoginPage';
import { AccountantDashboard as OldAccountantDashboard } from './pages/AccountantDashboard';
import { AdminDashboard } from './pages/staff/AdminDashboard';
import { UserManagement } from './pages/staff/UserManagement';
import { PriceManagement } from './pages/staff/PriceManagement';
import { BranchReports } from './pages/staff/BranchReports';
import { ExpenseApprovals } from './pages/staff/ExpenseApprovals';
import { BalanceRequests } from './pages/staff/BalanceRequests';
import { ChatCenter } from './pages/staff/ChatCenter';
import { Settings } from './pages/staff/Settings';
import { ManagerSettings } from './pages/staff/ManagerSettings';
import { FinanceSettings } from './pages/staff/FinanceSettings';
import { ManagerDashboard } from './pages/staff/ManagerDashboard';
import { ManagerSales } from './pages/staff/ManagerSales';
import { ManagerExpenses } from './pages/staff/ManagerExpenses';
import { AccountantDashboard } from './pages/staff/AccountantDashboard';
import { AccountantTransactions } from './pages/staff/AccountantTransactions';
import { AccountantReports } from './pages/staff/AccountantReports';
import { AuditorDashboard } from './pages/staff/AuditorDashboard';
import { AuditorTransactions } from './pages/staff/AuditorTransactions';
import { AuditorReports } from './pages/staff/AuditorReports';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Public Routes with Header & Footer */}
          <Route
            path="/"
            element={
              <>
                <Header />
                <HomePage />
                <Footer />
              </>
            }
          />
          <Route
            path="/about"
            element={
              <>
                <Header />
                <AboutPage />
                <Footer />
              </>
            }
          />
          <Route
            path="/services"
            element={
              <>
                <Header />
                <ServicesPage />
                <Footer />
              </>
            }
          />
          <Route
            path="/contact"
            element={
              <>
                <Header />
                <ContactPage />
                <Footer />
              </>
            }
          />

          {/* Staff Portal Routes (No Header/Footer) */}
          <Route path="/staff/login" element={<StaffLoginPage />} />

          {/* Admin Routes */}
          <Route path="/staff/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/staff/admin/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
          <Route path="/staff/admin/prices" element={<ProtectedRoute><PriceManagement /></ProtectedRoute>} />
          <Route path="/staff/admin/reports" element={<ProtectedRoute><BranchReports /></ProtectedRoute>} />
          <Route path="/staff/admin/expenses" element={<ProtectedRoute><ExpenseApprovals /></ProtectedRoute>} />
          <Route path="/staff/admin/balance-requests" element={<ProtectedRoute><BalanceRequests /></ProtectedRoute>} />
          <Route path="/staff/admin/chat" element={<ProtectedRoute><ChatCenter /></ProtectedRoute>} />
          <Route path="/staff/admin/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* Manager Routes */}
          <Route path="/staff/manager/dashboard" element={<ProtectedRoute><ManagerDashboard /></ProtectedRoute>} />
          <Route path="/staff/manager/sales" element={<ProtectedRoute><ManagerSales /></ProtectedRoute>} />
          <Route path="/staff/manager/expenses" element={<ProtectedRoute><ManagerExpenses /></ProtectedRoute>} />
          <Route path="/staff/manager/chat" element={<ProtectedRoute><ChatCenter /></ProtectedRoute>} />
          <Route path="/staff/manager/settings" element={<ProtectedRoute><ManagerSettings /></ProtectedRoute>} />

          {/* Accountant Routes */}
          <Route path="/staff/accountant/dashboard" element={<ProtectedRoute><AccountantDashboard /></ProtectedRoute>} />
          <Route path="/staff/accountant/transactions" element={<ProtectedRoute><AccountantTransactions /></ProtectedRoute>} />
          <Route path="/staff/accountant/reports" element={<ProtectedRoute><AccountantReports /></ProtectedRoute>} />
          <Route path="/staff/accountant/expenses" element={<ProtectedRoute><ExpenseApprovals /></ProtectedRoute>} />
          <Route path="/staff/accountant/chat" element={<ProtectedRoute><ChatCenter /></ProtectedRoute>} />
          <Route path="/staff/accountant/settings" element={<ProtectedRoute><FinanceSettings /></ProtectedRoute>} />

          {/* Auditor Routes */}
          <Route path="/staff/auditor/dashboard" element={<ProtectedRoute><AuditorDashboard /></ProtectedRoute>} />
          <Route path="/staff/auditor/transactions" element={<ProtectedRoute><AuditorTransactions /></ProtectedRoute>} />
          <Route path="/staff/auditor/reports" element={<ProtectedRoute><AuditorReports /></ProtectedRoute>} />
          <Route path="/staff/auditor/expenses" element={<ProtectedRoute><ExpenseApprovals /></ProtectedRoute>} />
          <Route path="/staff/auditor/chat" element={<ProtectedRoute><ChatCenter /></ProtectedRoute>} />
          <Route path="/staff/auditor/settings" element={<ProtectedRoute><FinanceSettings /></ProtectedRoute>} />

          {/* Legacy route - keep for compatibility */}
          <Route path="/staff/dashboard" element={<ProtectedRoute><OldAccountantDashboard /></ProtectedRoute>} />

          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white px-4">
                <p className="text-8xl font-black text-primary mb-4">404</p>
                <h1 className="text-2xl font-bold mb-2">Page not found</h1>
                <p className="text-gray-400 mb-8">The page you are looking for does not exist.</p>
                <Link to="/" className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                  Back to Home
                </Link>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}

export default App;