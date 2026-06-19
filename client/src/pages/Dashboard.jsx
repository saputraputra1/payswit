import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { FiRepeat, FiPlus, FiArrowUp, FiArrowDown, FiClock, FiCheck, FiX, FiWallet } from 'react-icons/fi'

export default function Dashboard() {
  const { profile } = useAuth()
  const [txs, setTxs] = useState([])
  const [queue, setQueue] = useState(null)
  const [rate, setRate] = useState({ buy: 15000, sell: 14500 })

  useEffect(() => {
    if (!profile) return
    const q = query(collection(db, 'transactions'), where('userId', '==', profile.id), orderBy('createdAt', 'desc'), limit(10))
    const unsub = onSnapshot(q, (snap) => setTxs(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    return unsub
  }, [profile])

  useEffect(() => {
    const fetch = () => api.get('/transactions/queue').then(({ data }) => setQueue(data)).catch(() => {})
    fetch()
    const t = setInterval(fetch, 15000)
    return () => clearInterval(t)
  }, [])

  const formatEstimate = (mins) => {
    if (mins >= 120) return '> 2 jam'
    if (mins >= 60) return `~${Math.round(mins / 60)} jam`
    return `~${mins} menit`
  }

  const hasPending = txs.some(t => t.status === 'pending' || t.status === 'processing')

  const statCard = (label, value, icon, color) => (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
      </div>
    </div>
  )

  const statusBadge = (s) => {
    const m = {
      pending: ['text-yellow-400 bg-yellow-500/10 border-yellow-500/20', '🕐'],
      success: ['text-green-400 bg-green-500/10 border-green-500/20', '✅'],
      failed: ['text-red-400 bg-red-500/10 border-red-500/20', '❌'],
    }
    const [c, i] = m[s] || ['text-gray-500 bg-gray-500/10 border-gray-500/20', '❓']
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${c}`}>{i} {s}</span>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      {profile && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statCard('Saldo IDR', `Rp ${(profile.balance || 0).toLocaleString('id-ID')}`, <FiWallet className="w-6 h-6 text-white" />, 'bg-primary-600')}
          {statCard('Kurs Beli (USD→IDR)', `Rp ${(rate.buy || 0).toLocaleString('id-ID')}`, <FiArrowDown className="w-6 h-6 text-white" />, 'bg-green-600')}
          {statCard('Kurs Jual (IDR→USD)', `Rp ${(rate.sell || 0).toLocaleString('id-ID')}`, <FiArrowUp className="w-6 h-6 text-white" />, 'bg-orange-600')}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/convert" className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-5 flex items-center gap-4 hover:bg-white/[0.04] transition border-l-4 border-blue-500">
          <FiRepeat className="w-8 h-8 text-blue-400" />
          <div><h3 className="font-semibold text-white">Convert PayPal → IDR</h3><p className="text-sm text-gray-500">Tukar saldo PayPal ke Rupiah</p></div>
        </Link>
        <Link to="/topup" className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-5 flex items-center gap-4 hover:bg-white/[0.04] transition border-l-4 border-green-500">
          <FiPlus className="w-8 h-8 text-green-400" />
          <div><h3 className="font-semibold text-white">Top Up PayPal</h3><p className="text-sm text-gray-500">Isi saldo PayPal via bank</p></div>
        </Link>
      </div>

      {hasPending && queue && queue.total > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 sm:p-4 flex items-start gap-3">
          <FiClock className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-200">
            <p className="font-medium">Antrian: {queue.total} transaksi (estimasi {formatEstimate(queue.estimatedMinutes)})</p>
            <p className="text-xs text-amber-400/70 mt-0.5">Proses berdasarkan urutan masuk, rata-rata {queue.avgMinutesPerTx} menit per transaksi</p>
          </div>
        </div>
      )}

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Riwayat Transaksi</h2>
          {txs.length > 0 && <Link to="/profile" className="text-sm text-blue-400 hover:underline">Lihat semua</Link>}
        </div>
        {txs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FiClock className="w-10 h-10 mx-auto mb-2" />
            <p>Belum ada transaksi</p>
          </div>
        ) : (
          <div className="space-y-2">
            {txs.map(tx => (
              <Link key={tx.id} to={`/tracking/${tx.id}`} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg hover:bg-white/[0.04] transition-colors border border-white/[0.04]">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-white">{tx.type === 'convert' ? 'Convert PayPal → IDR' : 'Top Up PayPal'}</p>
                  <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString('id-ID')}</p>
                  {(tx.status === 'pending' || tx.status === 'processing') && queue && queue.total > 0 && (
                    <p className="text-xs text-amber-400 font-medium mt-0.5">Estimasi {formatEstimate(queue.estimatedMinutes)}</p>
                  )}
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="font-semibold text-white">{tx.type === 'convert' ? `$${tx.amount}` : `Rp ${(tx.amount || 0).toLocaleString('id-ID')}`}</p>
                  {statusBadge(tx.status)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
