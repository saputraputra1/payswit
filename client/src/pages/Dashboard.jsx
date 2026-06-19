import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { FiRepeat, FiCreditCard, FiTrendingUp, FiDollarSign, FiActivity, FiMessageSquare, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi'
import { TransactionIcon, BankIcon } from '../components/Icons'

function AnimatedCounter({ end, duration = 1500, prefix = '', suffix = '' }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let startTime = null
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      setCount(Math.floor((1 - Math.pow(1 - progress, 3)) * end))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [end, duration])
  return <span className="tabular-nums">{prefix}{count.toLocaleString('id-ID')}{suffix}</span>
}

export default function Dashboard() {
  const { user, userData, fetchUserData } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [rates, setRates] = useState(null)

  useEffect(() => {
    if (user) {
      fetchUserData(user.uid)
      api.get('/transactions').then((res) => setTransactions(res.data.slice(0, 10))).catch(() => {})
    }
    api.get('/rates').then((res) => setRates(res.data)).catch(() => {})
  }, [])

  const displayName = userData?.name || user?.displayName || 'User'

  const stats = [
    { label: 'Transaksi', value: transactions.length, icon: FiActivity, iconBg: 'bg-green-500/10' },
    { label: 'Pending', value: transactions.filter(t => t.status === 'pending').length, icon: FiClock, iconBg: 'bg-yellow-500/10' },
    { label: 'Selesai', value: transactions.filter(t => t.status === 'completed').length, icon: FiCheckCircle, iconBg: 'bg-blue-500/10' },
    { label: 'Kurs USD', value: rates?.usdToIdr, prefix: 'Rp ', icon: FiTrendingUp, iconBg: 'bg-purple-500/10' },
  ]

  const quickActions = [
    { to: '/convert', icon: FiRepeat, label: 'Convert', desc: 'PayPal → IDR', gradient: 'from-blue-600 to-cyan-600', border: 'border-blue-500/20' },
    { to: '/topup', icon: FiDollarSign, label: 'Top Up', desc: 'Isi PayPal', gradient: 'from-green-600 to-emerald-600', border: 'border-green-500/20' },
    { to: '/credit-card', icon: FiCreditCard, label: 'Jasa CC', desc: 'Bayar CC', gradient: 'from-orange-600 to-red-600', border: 'border-orange-500/20' },
    { to: '/chat', icon: FiMessageSquare, label: 'Chat CS', desc: '24/7', gradient: 'from-purple-600 to-pink-600', border: 'border-purple-500/20' },
  ]

  function statusIcon(s) {
    if (s === 'completed') return <FiCheckCircle className="text-green-400" />
    if (s === 'pending') return <FiClock className="text-yellow-400" />
    return <FiXCircle className="text-red-400" />
  }

  function statusColor(s) {
    if (s === 'completed') return 'bg-green-500/10 text-green-400 border-green-500/20'
    if (s === 'pending') return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    return 'bg-red-500/10 text-red-400 border-red-500/20'
  }

  function statusLabel(s) {
    if (s === 'completed') return 'Selesai'
    if (s === 'pending') return 'Menunggu'
    return 'Ditolak'
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-10">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-base sm:text-lg font-bold shadow-lg shadow-blue-500/20 flex-shrink-0">
              {displayName[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate">Halo, {displayName} 👋</h1>
              <p className="text-gray-500 text-xs sm:text-sm">Selamat datang kembali</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-10">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-white/[0.02] border border-white/[0.06] rounded-xl sm:rounded-2xl p-3 sm:p-5">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 ${stat.iconBg} rounded-lg sm:rounded-xl flex items-center justify-center`}>
                    <Icon size={16} className="text-gray-300 sm:w-5 sm:h-5" />
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wider">{stat.label}</p>
                </div>
                <p className="text-lg sm:text-2xl lg:text-3xl font-black text-white truncate">
                  <AnimatedCounter end={stat.value || 0} prefix={stat.prefix || ''} />
                </p>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-10">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.to} to={action.to}
                className={`group bg-white/[0.02] border ${action.border} rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:bg-white/[0.04] active:scale-[0.98]`}>
                <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${action.gradient} rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4`}>
                  <Icon size={20} className="text-white sm:w-6 sm:h-6" />
                </div>
                <h3 className="font-bold text-white text-xs sm:text-sm mb-0.5">{action.label}</h3>
                <p className="text-[10px] sm:text-xs text-gray-500">{action.desc}</p>
              </Link>
            )
          })}
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl sm:rounded-2xl overflow-hidden">
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Status Pesanan</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 hidden sm:block">Riwayat dan status transaksi Anda</p>
            </div>
            <span className="px-2.5 sm:px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] sm:text-xs font-medium rounded-lg border border-blue-500/20">
              {transactions.length} pesanan
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="px-4 sm:px-6 py-10 sm:py-16 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/[0.03] border border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <FiActivity size={24} className="text-gray-600 sm:w-7 sm:h-7" />
              </div>
              <p className="text-gray-500 font-medium text-sm sm:text-base">Belum ada pesanan</p>
              <Link to="/convert" className="inline-flex items-center gap-2 mt-3 sm:mt-4 px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-600 text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                <FiRepeat size={14} /> Convert Sekarang
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {transactions.map((tx) => (
                <div key={tx.id} className="px-4 sm:px-6 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <TransactionIcon type={tx.type} size="md" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white text-xs sm:text-sm truncate">
                            {tx.type === 'convert' ? 'PayPal → IDR' : tx.type === 'topup' ? 'Top Up PayPal' : 'Jasa CC'}
                          </p>
                          {tx.plan && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                              tx.plan === 'premium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}>
                              {tx.plan === 'premium' ? '★ Premium' : '⚡ Standard'}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-500">
                          {tx.createdAt?.toDate?.().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) || '-'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <p className="font-semibold text-white text-xs sm:text-sm text-right">
                        {tx.type === 'convert' ? `$${tx.amountUSD}` : `Rp ${tx.amountIDR?.toLocaleString('id-ID')}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {statusIcon(tx.status)}
                      <span className={`text-[10px] sm:text-xs px-2 py-1 rounded-full border font-medium ${statusColor(tx.status)}`}>
                        {statusLabel(tx.status)}
                      </span>
                    </div>

                    {tx.status === 'pending' && (
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500">
                        <FiClock size={12} />
                        <span>Menunggu verifikasi admin</span>
                      </div>
                    )}

                    {tx.status === 'completed' && (
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs text-green-400">
                        <FiCheckCircle size={12} />
                        <span>Dana telah dikirim</span>
                      </div>
                    )}

                    {tx.status === 'rejected' && (
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs text-red-400">
                        <FiXCircle size={12} />
                        <span>Transaksi ditolak</span>
                      </div>
                    )}
                  </div>

                  {tx.type === 'topup' && tx.bankName && (
                    <div className="mt-2 bg-white/[0.03] rounded-lg p-2.5 text-xs flex items-center gap-2">
                      <BankIcon bankName={tx.bankName} size="sm" />
                      <div className="flex-1">
                        <div className="flex justify-between text-gray-500">
                          <span>Transfer ke</span>
                          <span className="text-white font-medium">{tx.bankName} - {tx.bankAccount}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
