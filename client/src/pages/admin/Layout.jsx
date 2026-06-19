import { useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { FiBarChart2, FiRepeat, FiUsers, FiSettings, FiMessageSquare, FiChevronLeft, FiMenu, FiX, FiCreditCard } from 'react-icons/fi'

const tabs = [
  { to: '/admin', label: 'Dashboard', icon: FiBarChart2, end: true },
  { to: '/admin/transactions', label: 'Transaksi', icon: FiRepeat },
  { to: '/admin/users', label: 'Users', icon: FiUsers },
  { to: '/admin/bank-accounts', label: 'Rekening', icon: FiCreditCard },
  { to: '/admin/rates', label: 'Kurs', icon: FiSettings },
  { to: '/admin/chat', label: 'Chat', icon: FiMessageSquare },
]

export default function AdminLayout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const currentTab = tabs.find(t => t.end ? location.pathname === t.to : location.pathname.startsWith(t.to) && (t.to !== '/admin' || location.pathname === '/admin'))

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col lg:flex-row">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:sticky top-0 left-0 z-50 lg:z-0 w-64 h-screen bg-[#0d0d14] border-r border-white/5 flex flex-col transition-transform duration-300`}>
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <FiBarChart2 size={18} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm">Admin Panel</h2>
              <p className="text-[10px] text-gray-500">Payswit Management</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-gray-400 hover:text-white">
            <FiX size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = tab.end ? location.pathname === tab.to : location.pathname.startsWith(tab.to) && (tab.to !== '/admin' || location.pathname === '/admin')
            return (
              <Link
                key={tab.to}
                to={tab.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </Link>
            )
          })}
        </nav>

        <div className="px-4 py-4 border-t border-white/5">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.03] transition-all">
            <FiChevronLeft size={18} />
            Kembali ke Dashboard
          </Link>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <div className="sticky top-16 z-30 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/5 px-4 sm:px-6 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
            <FiMenu size={20} />
          </button>
          <div className="flex items-center gap-2">
            {currentTab && <currentTab.icon size={18} className="text-blue-400" />}
            <h1 className="text-base sm:text-lg font-bold">{currentTab?.label || 'Admin'}</h1>
          </div>
        </div>

        <div className="flex-1 pb-20 lg:pb-0">
          <Outlet />
        </div>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0d0d14]/95 backdrop-blur-xl border-t border-white/5 z-40 safe-bottom">
          <div className="flex items-center justify-around px-2 py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = tab.end ? location.pathname === tab.to : location.pathname.startsWith(tab.to) && (tab.to !== '/admin' || location.pathname === '/admin')
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-0 ${
                    isActive ? 'text-blue-400' : 'text-gray-500'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-[10px] font-medium truncate">{tab.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </main>
    </div>
  )
}
