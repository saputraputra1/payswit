import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider } from './contexts/LanguageContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Convert from './pages/Convert'
import Topup from './pages/Topup'
import CreditCard from './pages/CreditCard'
import Chat from './pages/Chat'
import Profile from './pages/Profile'
import Tracking from './pages/Tracking'
import AdminLayout from './pages/admin/Layout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminTransactions from './pages/admin/Transactions'
import AdminUsers from './pages/admin/Users'
import AdminBankAccounts from './pages/admin/BankAccounts'
import AdminRates from './pages/admin/Rates'
import AdminChat from './pages/admin/Chat'

function AppRoutes() {
  const { user, userData, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  const isAdmin = userData?.role === 'admin'

  return (
    <Router>
      {user && <Navbar />}
      <div className={user ? 'pt-16' : ''}>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to={isAdmin ? '/admin' : '/'} />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to={isAdmin ? '/admin' : '/'} />} />
          <Route path="/" element={!user ? <Landing /> : isAdmin ? <Navigate to="/admin" /> : <ProtectedRoute><Dashboard /></ProtectedRoute>} />

          <Route path="/convert" element={isAdmin ? <Navigate to="/admin" /> : <ProtectedRoute><Convert /></ProtectedRoute>} />
          <Route path="/topup" element={isAdmin ? <Navigate to="/admin" /> : <ProtectedRoute><Topup /></ProtectedRoute>} />
          <Route path="/credit-card" element={isAdmin ? <Navigate to="/admin" /> : <ProtectedRoute><CreditCard /></ProtectedRoute>} />
          <Route path="/chat" element={isAdmin ? <Navigate to="/admin" /> : <ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/profile" element={isAdmin ? <Navigate to="/admin" /> : <ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/tracking/:id" element={isAdmin ? <Navigate to="/admin" /> : <ProtectedRoute><Tracking /></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="transactions" element={<AdminTransactions />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="bank-accounts" element={<AdminBankAccounts />} />
            <Route path="rates" element={<AdminRates />} />
            <Route path="chat" element={<AdminChat />} />
          </Route>

          <Route path="*" element={<Navigate to={isAdmin ? '/admin' : '/'} />} />
        </Routes>
      </div>
    </Router>
  )
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1a1a2e',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
              },
            }}
          />
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App
