import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'
import { FiLogOut, FiUser, FiMessageSquare, FiRepeat, FiCreditCard, FiGrid, FiBarChart2, FiDollarSign, FiMenu, FiX, FiSun, FiMoon, FiGlobe } from 'react-icons/fi'

export default function Navbar() {
  const { user, userData, logout } = useAuth()
  const { dark, toggleTheme } = useTheme()
  const { lang, toggleLanguage, t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const isAdmin = userData?.role === 'admin'
  const [mobileOpen, setMobileOpen] = useState(false)

  const userLinks = [
    { to: '/', label: t('common.dashboard'), icon: FiGrid },
    { to: '/convert', label: 'Convert', icon: FiRepeat },
    { to: '/topup', label: 'Top Up', icon: FiDollarSign },
    { to: '/credit-card', label: 'Jasa CC', icon: FiCreditCard },
    { to: '/chat', label: 'Chat', icon: FiMessageSquare },
  ]

  const adminLinks = [
    { to: '/admin', label: t('common.admin'), icon: FiBarChart2 },
  ]

  const links = isAdmin ? adminLinks : userLinks

  async function handleLogout() {
    await logout()
    setMobileOpen(false)
    navigate('/login')
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-[#0a0a0f]/90 dark:bg-[#0a0a0f]/90 light:bg-white/90 backdrop-blur-2xl border-b border-white/5 dark:border-white/5 light:border-gray-200 z-50 safe-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link to={isAdmin ? '/admin' : '/'} className="flex items-center gap-2 sm:gap-3">
              <img src="/logo.svg" alt="Payswit" className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg" />
              <span className="font-black text-base sm:text-lg tracking-tight dark:text-white light:text-gray-900">Payswit</span>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {links.map((link) => {
                const Icon = link.icon
                const isActive = location.pathname === link.to
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'text-gray-500 hover:text-white hover:bg-white/[0.03] dark:text-gray-500 light:text-gray-600'
                    }`}
                  >
                    <Icon size={14} />
                    {link.label}
                  </Link>
                )
              })}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={toggleTheme}
                className="p-2 text-gray-400 hover:text-white dark:text-gray-400 light:text-gray-600 rounded-lg hover:bg-white/[0.03] dark:hover:bg-white/5 light:hover:bg-gray-100 transition-colors"
                title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                {dark ? <FiSun size={16} /> : <FiMoon size={16} />}
              </button>

              <button onClick={toggleLanguage}
                className="flex items-center gap-1 px-2 py-1.5 text-gray-400 hover:text-white dark:text-gray-400 light:text-gray-600 rounded-lg hover:bg-white/[0.03] dark:hover:bg-white/5 light:hover:bg-gray-100 transition-colors text-xs font-medium"
                title={lang === 'id' ? 'Switch to English' : 'Ganti ke Indonesia'}>
                <FiGlobe size={14} />
                <span className="uppercase">{lang}</span>
              </button>

              {!isAdmin && (
                <Link to="/profile" className="hidden sm:flex items-center gap-2 text-sm dark:text-gray-500 light:text-gray-600 hover:text-white dark:hover:text-white light:hover:text-gray-900 transition-colors">
                  <div className="w-8 h-8 bg-white/[0.03] dark:bg-white/[0.03] light:bg-gray-100 border border-white/10 dark:border-white/10 light:border-gray-200 rounded-lg flex items-center justify-center">
                    <FiUser size={14} />
                  </div>
                  <span className="hidden md:inline text-xs font-medium">{userData?.name || user?.email}</span>
                </Link>
              )}
              {isAdmin && (
                <span className="hidden sm:inline text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-lg font-medium">Admin</span>
              )}
              <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-medium">
                <FiLogOut size={14} />
                <span className="hidden sm:inline">{t('common.logout')}</span>
              </button>
              <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-gray-400 hover:text-white">
                {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-14 sm:top-16 left-0 right-0 bg-[#0a0a0f] dark:bg-[#0a0a0f] light:bg-white border-b border-white/5 dark:border-white/5 light:border-gray-200 max-h-[80vh] overflow-y-auto scrollbar-hide">
            <div className="px-4 py-4 space-y-1">
              {links.map((link) => {
                const Icon = link.icon
                const isActive = location.pathname === link.to
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/[0.03] dark:text-gray-400 light:text-gray-600'
                    }`}
                  >
                    <Icon size={18} />
                    {link.label}
                  </Link>
                )
              })}

              <div className="flex items-center gap-2 pt-2 mt-2 border-t border-white/5 dark:border-white/5 light:border-gray-200">
                <button onClick={toggleTheme}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white dark:text-gray-400 light:text-gray-600 hover:bg-white/[0.03] dark:hover:bg-white/5 light:hover:bg-gray-100 transition-all">
                  {dark ? <FiSun size={16} /> : <FiMoon size={16} />}
                  {dark ? 'Light Mode' : 'Dark Mode'}
                </button>
                <button onClick={toggleLanguage}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white dark:text-gray-400 light:text-gray-600 hover:bg-white/[0.03] dark:hover:bg-white/5 light:hover:bg-gray-100 transition-all">
                  <FiGlobe size={16} />
                  {lang === 'id' ? 'English' : 'Indonesia'}
                </button>
              </div>

              {!isAdmin && (
                <Link to="/profile" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white dark:text-gray-400 light:text-gray-600 hover:bg-white/[0.03]">
                  <FiUser size={18} />
                  {t('common.profile')}
                </Link>
              )}
              <button onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 w-full">
                <FiLogOut size={18} />
                {t('common.logout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
