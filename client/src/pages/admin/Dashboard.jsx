import { useState, useEffect } from 'react'
import api from '../../services/api'
import { FiUsers, FiRepeat, FiClock, FiCheckCircle } from 'react-icons/fi'
import { TransactionIcon } from '../../components/Icons'

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

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats').then((res) => setStats(res.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  const cards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: FiUsers, iconBg: 'bg-blue-500/10' },
    { label: 'Total Transaksi', value: stats?.totalTransactions || 0, icon: FiRepeat, iconBg: 'bg-green-500/10' },
    { label: 'Pending', value: stats?.pendingTransactions || 0, icon: FiClock, iconBg: 'bg-yellow-500/10' },
    { label: 'Selesai', value: stats?.completedTransactions || 0, icon: FiCheckCircle, iconBg: 'bg-purple-500/10' },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 sm:p-5">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 ${card.iconBg} rounded-lg sm:rounded-xl flex items-center justify-center`}>
                  <Icon size={16} className="text-gray-300" />
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wider">{card.label}</p>
              </div>
              <p className="text-lg sm:text-2xl lg:text-3xl font-black text-white">
                <AnimatedCounter end={card.value} prefix={card.prefix || ''} />
              </p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/[0.06]">
            <h3 className="font-bold text-white text-sm sm:text-base">Transaksi Terbaru</h3>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {(stats?.recentTransactions || []).slice(0, 5).map((tx, i) => (
              <div key={i} className="flex items-center justify-between px-4 sm:px-6 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <TransactionIcon type={tx.type} size="sm" />
                  <div className="min-w-0">
                    <p className="font-medium text-white text-xs sm:text-sm truncate">{txTypeLabel(tx.type)}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 truncate">{tx.userName}</p>
                  </div>
                </div>
                <StatusBadge status={tx.status} />
              </div>
            ))}
            {(!stats?.recentTransactions || stats.recentTransactions.length === 0) && (
              <p className="px-6 py-6 text-center text-gray-500 text-sm">Belum ada</p>
            )}
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/[0.06]">
            <h3 className="font-bold text-white text-sm sm:text-base">User Baru</h3>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {(stats?.recentUsers || []).slice(0, 5).map((u, i) => (
              <div key={i} className="flex items-center gap-3 px-4 sm:px-6 py-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {u.name?.[0] || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-white text-xs sm:text-sm truncate">{u.name}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 truncate">{u.email}</p>
                </div>
              </div>
            ))}
            {(!stats?.recentUsers || stats.recentUsers.length === 0) && (
              <p className="px-6 py-6 text-center text-gray-500 text-sm">Belum ada</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function txTypeLabel(type) {
  if (type === 'convert') return 'PayPal → IDR'
  if (type === 'topup') return 'Top Up PayPal'
  return 'Jasa CC'
}
function StatusBadge({ status }) {
  const c = status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
  return <div className={`px-2 py-1 rounded-md border text-[10px] font-medium ${c}`}>{status}</div>
}
function LoadingSpinner() {
  return <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" /></div>
}
