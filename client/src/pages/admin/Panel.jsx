import { useState, useEffect, useRef } from 'react'
import api from '../../services/api'
import { db } from '../../services/firebase'
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, updateDoc, doc } from 'firebase/firestore'
import toast from 'react-hot-toast'
import {
  FiBarChart2, FiRepeat, FiUsers, FiSettings, FiMessageSquare,
  FiDollarSign, FiClock, FiCheck, FiX, FiTrendingUp, FiSend,
  FiUser, FiShield, FiShieldOff, FiPercent, FiSave, FiAlertTriangle,
  FiArrowUpRight, FiArrowDownLeft, FiCreditCard, FiCheckCircle, FiXCircle,
  FiChevronLeft, FiMenu, FiUserPlus,
} from 'react-icons/fi'

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

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: FiBarChart2 },
    { id: 'transactions', label: 'Transaksi', icon: FiRepeat },
    { id: 'users', label: 'Users', icon: FiUsers },
    { id: 'rates', label: 'Kurs', icon: FiSettings },
    { id: 'chat', label: 'Chat CS', icon: FiMessageSquare },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:sticky top-0 left-0 z-50 lg:z-0 w-64 h-screen bg-[#0d0d14] border-r border-white/5 flex flex-col transition-transform duration-300`}>
        <div className="px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <FiBarChart2 size={18} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm">Admin Panel</h2>
              <p className="text-[10px] text-gray-500">Payswit Management</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </nav>

        <div className="px-4 py-4 border-t border-white/5">
          <a href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.03] transition-all">
            <FiChevronLeft size={18} />
            Kembali ke Dashboard
          </a>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="sticky top-0 z-30 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/5 px-4 sm:px-6 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
            <FiMenu size={20} />
          </button>
          <h1 className="text-lg sm:text-xl font-bold">{tabs.find(t => t.id === activeTab)?.label}</h1>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'transactions' && <TransactionsTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'rates' && <RatesTab />}
          {activeTab === 'chat' && <ChatTab />}
        </div>
      </main>
    </div>
  )
}

function DashboardTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  // Realtime via polling (endpoint lewat server, auth adminOnly aman)
  useEffect(() => {
    let active = true
    const fetchStats = () => {
      api.get('/admin/stats')
        .then((res) => { if (active) setStats(res.data) })
        .catch(console.error)
        .finally(() => { if (active) setLoading(false) })
    }
    fetchStats()
    const t = setInterval(fetchStats, 8000) // refresh tiap 8 detik
    return () => { active = false; clearInterval(t) }
  }, [])

  if (loading) return <LoadingSpinner />

  const cards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: FiUsers, iconBg: 'bg-blue-500/10', iconColor: 'text-blue-400' },
    { label: 'Total Transaksi', value: stats?.totalTransactions || 0, icon: FiRepeat, iconBg: 'bg-green-500/10', iconColor: 'text-green-400' },
    { label: 'Pending', value: stats?.pendingTransactions || 0, icon: FiClock, iconBg: 'bg-yellow-500/10', iconColor: 'text-yellow-400' },
    { label: 'Selesai', value: stats?.completedTransactions || 0, icon: FiCheckCircle, iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-400' },
    { label: 'User Baru Hari Ini', value: stats?.newUsersToday || 0, icon: FiUserPlus, iconBg: 'bg-purple-500/10', iconColor: 'text-purple-400' },
    { label: 'Volume Hari Ini', value: stats?.todayVolume || 0, prefix: 'Rp ', icon: FiDollarSign, iconBg: 'bg-cyan-500/10', iconColor: 'text-cyan-400' },
  ]

  const fmtDate = (v) => {
    if (!v) return ''
    const d = typeof v.toDate === 'function' ? v.toDate() : new Date(v)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2 text-[10px] text-green-400">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        REALTIME
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 sm:p-5">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 ${card.iconBg} rounded-lg sm:rounded-xl flex items-center justify-center`}>
                  <Icon size={16} className={card.iconColor} />
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
            {(stats?.recentTransactions || []).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-4 sm:px-6 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${txTypeBg(tx.type)}`}>
                    {txIcon(tx.type)}
                  </div>
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
            {(stats?.recentUsers || []).map((u) => (
              <div key={u.id || u.uid} className="flex items-center gap-3 px-4 sm:px-6 py-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {u.name?.[0] || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white text-xs sm:text-sm truncate">{u.name}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 truncate">{u.email}</p>
                </div>
                {u.createdAt && (
                  <p className="text-[10px] text-gray-600 flex-shrink-0">{fmtDate(u.createdAt)}</p>
                )}
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

function TransactionsTab() {
  const [transactions, setTransactions] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  // Realtime via polling (10 detik)
  useEffect(() => {
    let active = true
    const fetchTx = async () => {
      try {
        const res = await api.get('/admin/transactions')
        if (active) setTransactions(res.data)
      } catch (e) { console.error(e) }
      if (active) setLoading(false)
    }
    fetchTx()
    const t = setInterval(fetchTx, 10000)
    return () => { active = false; clearInterval(t) }
  }, [])

  async function handleVerify(id, status) {
    try {
      await api.put(`/admin/transactions/${id}`, { status })
      toast.success(`Transaksi ${status === 'completed' ? 'disetujui' : 'ditolak'}`)
      // Update optimis agar UI langsung berubah tanpa tunggu polling
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    } catch (e) { toast.error('Gagal') }
  }

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.status === filter)

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        {[
          { key: 'all', label: 'Semua', count: transactions.length },
          { key: 'pending', label: 'Pending', count: transactions.filter(t => t.status === 'pending').length },
          { key: 'completed', label: 'Disetujui', count: transactions.filter(t => t.status === 'completed').length },
          { key: 'rejected', label: 'Ditolak', count: transactions.filter(t => t.status === 'rejected').length },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              filter === f.key ? 'bg-blue-600 text-white' : 'bg-white/[0.03] text-gray-400 border border-white/10'
            }`}>
            {f.label}
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${filter === f.key ? 'bg-white/20' : 'bg-white/5'}`}>{f.count}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FiRepeat} text="Tidak ada transaksi" />
      ) : (
        <div className="space-y-3">
          {filtered.map(tx => (
            <div key={tx.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${txTypeBg(tx.type)}`}>
                    {txIcon(tx.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm">{txTypeLabel(tx.type)}</p>
                    <p className="text-xs text-gray-500 truncate">{tx.userName} • {tx.userEmail}</p>
                  </div>
                </div>
                <StatusBadge status={tx.status} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3">
                <InfoBox label="Jumlah" value={tx.type === 'convert' ? `$${tx.amountUSD}` : `Rp ${tx.amountIDR?.toLocaleString('id-ID')}`} />
                <InfoBox label="Konversi" value={tx.type === 'convert' ? `Rp ${tx.amountIDR?.toLocaleString('id-ID')}` : `$${tx.amountUSD?.toFixed(2)}`} />
                <InfoBox label="PayPal" value={tx.paypalEmail} />
                <InfoBox label={tx.type === 'convert' ? 'Rekening' : 'Metode'} value={tx.type === 'convert' ? `${tx.bankName} ${tx.bankAccount}` : tx.paymentMethod} />
              </div>

              {tx.type === 'convert' && (
                <div className="bg-white/[0.03] rounded-lg p-2.5 mb-3">
                  <p className="text-[10px] text-gray-500">A/N</p>
                  <p className="font-medium text-white text-xs">{tx.bankHolder}</p>
                </div>
              )}

              {tx.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => handleVerify(tx.id, 'completed')}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 active:scale-[0.98]">
                    <FiCheck size={14} /> Setujui
                  </button>
                  <button onClick={() => handleVerify(tx.id, 'rejected')}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 active:scale-[0.98]">
                    <FiX size={14} /> Tolak
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function UsersTab() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  // Realtime via polling (15 detik)
  useEffect(() => {
    let active = true
    const fetchUsers = async () => {
      try {
        const res = await api.get('/admin/users')
        if (active) setUsers(res.data)
      } catch (e) { console.error(e) }
      if (active) setLoading(false)
    }
    fetchUsers()
    const t = setInterval(fetchUsers, 15000)
    return () => { active = false; clearInterval(t) }
  }, [])

  async function handleBan(uid, status) {
    const newStatus = status === 'active' ? 'banned' : 'active'
    try {
      await api.put(`/admin/users/${uid}`, { status: newStatus })
      toast.success(`User ${newStatus === 'banned' ? 'diblokir' : 'diaktifkan'}`)
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, status: newStatus } : u))
    } catch (e) { toast.error('Gagal') }
  }

  async function handleRole(uid, role) {
    try {
      await api.put(`/admin/users/${uid}`, { role })
      toast.success('Role diubah')
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role } : u))
    } catch (e) { toast.error('Gagal') }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-3">
      {users.length === 0 ? (
        <EmptyState icon={FiUsers} text="Belum ada user" />
      ) : (
        users.map(u => (
          <div key={u.uid} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0">
                  {u.name?.[0] || 'U'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-white text-sm truncate">{u.name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      u.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>{u.role}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      u.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>{u.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-1.5">
                  <p className="text-[10px] text-gray-500">Saldo</p>
                  <p className="font-bold text-white text-xs">Rp {(u.balance || 0).toLocaleString('id-ID')}</p>
                </div>
                <select value={u.role} onChange={(e) => handleRole(u.uid, e.target.value)}
                  className="bg-white/[0.03] border border-white/10 rounded-lg px-2 py-2 text-xs text-white outline-none">
                  <option value="user" className="bg-[#0a0a0f]">User</option>
                  <option value="admin" className="bg-[#0a0a0f]">Admin</option>
                </select>
                <button onClick={() => handleBan(u.uid, u.status)}
                  className={`p-2 rounded-lg text-white transition-all active:scale-[0.95] ${
                    u.status === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  }`}>
                  {u.status === 'active' ? <FiShieldOff size={16} /> : <FiShield size={16} />}
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function RatesTab() {
  const [usdToIdr, setUsdToIdr] = useState('')
  const [fee, setFee] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    api.get('/rates').then((res) => {
      setUsdToIdr(res.data.usdToIdr?.toString() || '')
      setFee((res.data.fee * 100)?.toString() || '2')
    }).catch(console.error).finally(() => setFetching(false))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.put('/admin/rates', { usdToIdr: parseFloat(usdToIdr), fee: parseFloat(fee) / 100 })
      toast.success('Kurs diperbarui')
    } catch (e) { toast.error('Gagal') }
    setLoading(false)
  }

  if (fetching) return <LoadingSpinner />

  return (
    <div className="max-w-xl">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Kurs Saat Ini</p>
          <p className="text-2xl font-black text-white">Rp {parseFloat(usdToIdr || 0).toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Biaya Admin</p>
          <p className="text-2xl font-black text-white">{fee}%</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6 space-y-5">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Kurs USD → IDR</label>
          <div className="relative">
            <FiDollarSign className="absolute left-4 top-3.5 text-gray-500 w-4 h-4" />
            <input type="number" step="1" value={usdToIdr} onChange={(e) => setUsdToIdr(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
              placeholder="16000" required />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Biaya Admin (%)</label>
          <div className="relative">
            <FiPercent className="absolute left-4 top-3.5 text-gray-500 w-4 h-4" />
            <input type="number" step="0.1" min="0" max="100" value={fee} onChange={(e) => setFee(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
              placeholder="2" required />
          </div>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-start gap-2">
          <FiAlertTriangle className="text-yellow-400 mt-0.5 flex-shrink-0 w-4 h-4" />
          <p className="text-xs text-yellow-300">Perubahan langsung berlaku untuk transaksi baru.</p>
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-purple-500/25 transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2 active:scale-[0.98]">
          <FiSave size={16} />
          {loading ? 'Menyimpan...' : 'Simpan'}
        </button>
      </form>
    </div>
  )
}

function ChatTab() {
  const [conversations, setConversations] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snapshot) => {
      const allMsgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      const userMap = {}
      allMsgs.forEach(msg => {
        if (!userMap[msg.userId]) {
          userMap[msg.userId] = { userId: msg.userId, userName: msg.userName, lastMessage: msg.text, unread: msg.sender === 'user' && !msg.read ? 1 : 0 }
        } else if (msg.sender === 'user' && !msg.read) { userMap[msg.userId].unread++ }
      })
      setConversations(Object.values(userMap))
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!selectedUser) return
    const q = query(collection(db, 'messages'), where('userId', '==', selectedUser.userId), orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
      snapshot.docs.forEach(d => {
        if (d.data().sender === 'user' && !d.data().read) updateDoc(doc(db, 'messages', d.id), { read: true })
      })
    })
    return unsub
  }, [selectedUser])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedUser) return
    setLoading(true)
    try {
      await addDoc(collection(db, 'messages'), {
        userId: selectedUser.userId, userName: selectedUser.userName,
        text: newMessage.trim(), sender: 'admin', createdAt: serverTimestamp(), read: true,
      })
      setNewMessage('')
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden flex flex-col md:flex-row" style={{ height: 'calc(100vh - 180px)', minHeight: '400px' }}>
      <div className={`${showSidebar ? 'flex' : 'hidden'} md:flex w-full md:w-72 flex-shrink-0 border-b md:border-b-0 md:border-r border-white/[0.06] flex-col max-h-[40vh] md:max-h-none`}>
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Percakapan</h3>
            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-medium rounded border border-blue-500/20">{conversations.length}</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="px-4 py-6 text-center text-gray-500 text-xs">Belum ada pesan</p>
          ) : conversations.map(conv => (
            <button key={conv.userId} onClick={() => { setSelectedUser(conv); setShowSidebar(false) }}
              className={`w-full text-left px-4 py-3 border-b border-white/[0.03] transition-colors ${selectedUser?.userId === conv.userId ? 'bg-blue-500/10' : 'hover:bg-white/[0.02]'}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiUser size={14} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-white text-xs truncate">{conv.userName}</p>
                    {conv.unread > 0 && <span className="w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">{conv.unread}</span>}
                  </div>
                  <p className="text-[10px] text-gray-500 truncate">{conv.lastMessage}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className={`${!showSidebar ? 'flex' : 'hidden'} md:flex flex-1 flex-col`}>
        {!selectedUser ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="w-12 h-12 bg-white/[0.03] border border-white/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FiMessageSquare size={22} className="text-gray-600" />
              </div>
              <p className="text-sm font-medium">Pilih percakapan</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-3">
              <button onClick={() => { setShowSidebar(true); setSelectedUser(null) }} className="md:hidden p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
                <FiChevronLeft size={18} />
              </button>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <FiUser size={14} className="text-white" />
              </div>
              <p className="font-semibold text-white text-sm">{selectedUser.userName}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl ${
                    msg.sender === 'admin' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-br-md' : 'bg-white/[0.05] text-gray-200 border border-white/10 rounded-bl-md'
                  }`}>
                    <p className="text-xs">{msg.text}</p>
                    <p className={`text-[10px] mt-1 ${msg.sender === 'admin' ? 'text-blue-200' : 'text-gray-500'}`}>
                      {msg.createdAt?.toDate?.().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) || '...'}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="p-3 border-t border-white/[0.06]">
              <div className="flex gap-2">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-xs"
                  placeholder="Ketik balasan..." disabled={loading} />
                <button type="submit" disabled={loading || !newMessage.trim()}
                  className="px-3 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl disabled:opacity-50 active:scale-[0.95]">
                  <FiSend size={16} />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

function txIcon(type) {
  if (type === 'convert') return <FiArrowUpRight className="text-blue-400 text-sm" />
  if (type === 'topup') return <FiArrowDownLeft className="text-green-400 text-sm" />
  return <FiCreditCard className="text-orange-400 text-sm" />
}

function txTypeBg(type) {
  if (type === 'convert') return 'bg-blue-500/10'
  if (type === 'topup') return 'bg-green-500/10'
  return 'bg-orange-500/10'
}

function txTypeLabel(type) {
  if (type === 'convert') return 'PayPal → IDR'
  if (type === 'topup') return 'Top Up PayPal'
  return 'Jasa CC'
}

function StatusBadge({ status }) {
  const map = {
    completed: ['bg-green-500/10 text-green-400 border-green-500/20', 'Selesai'],
    success: ['bg-green-500/10 text-green-400 border-green-500/20', 'Selesai'],
    pending: ['bg-yellow-500/10 text-yellow-400 border-yellow-500/20', 'Pending'],
    processing: ['bg-blue-500/10 text-blue-400 border-blue-500/20', 'Diproses'],
    rejected: ['bg-red-500/10 text-red-400 border-red-500/20', 'Ditolak'],
    failed: ['bg-red-500/10 text-red-400 border-red-500/20', 'Gagal'],
  }
  const [color, label] = map[status] || ['bg-gray-500/10 text-gray-400 border-gray-500/20', status]
  return <div className={`px-2 py-1 rounded-md border text-[10px] font-medium ${color}`}>{label}</div>
}

function InfoBox({ label, value }) {
  return (
    <div className="bg-white/[0.03] rounded-lg p-2">
      <p className="text-[10px] text-gray-500 mb-0.5">{label}</p>
      <p className="font-medium text-white text-xs truncate">{value}</p>
    </div>
  )
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-6 py-12 text-center">
      <div className="w-12 h-12 bg-white/[0.03] border border-white/10 rounded-xl flex items-center justify-center mx-auto mb-3">
        <Icon size={22} className="text-gray-600" />
      </div>
      <p className="text-gray-500 text-sm font-medium">{text}</p>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
    </div>
  )
}
