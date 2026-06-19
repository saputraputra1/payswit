import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { FiPlus, FiArrowUp, FiArrowDown, FiClock, FiDollarSign, FiSend, FiCreditCard } from 'react-icons/fi'

// Spread kecil membedakan kurs beli vs jual (selaras dengan Convert/Topup)
const BUY_SPREAD = 100
const SELL_SPREAD = 100

export default function Dashboard() {
  const { profile } = useAuth()
  const [txs, setTxs] = useState([])
  const [queue, setQueue] = useState(null)
  const [baseRate, setBaseRate] = useState(null) // usdToIdr realtime dari settings/rates

  // Kurs realtime via onSnapshot (di-update tiap jam oleh kurs service)
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'rates'),
      (snap) => {
        if (snap.exists()) setBaseRate(Number(snap.data().usdToIdr) || null)
      },
      () => {}
    )
    return unsub
  }, [])

  // Transaksi user via API (lebih reliable daripada Firestore client query
  // karena server sudah punya index composite untuk userId)
  useEffect(() => {
    if (!profile?.id) return
    const fetch = () => {
      api.get('/transactions')
        .then(({ data }) => {
          // Ambil 10 terakhir dan normalisasi field nominal
          const normalized = (Array.isArray(data) ? data : [])
            .map((tx) => {
              const type = tx.type
              let amountUSD = tx.amountUSD
              let amountIDR = tx.amountIDR
              if (type === 'convert') {
                if (amountUSD === undefined || amountUSD === null) amountUSD = tx.amount
                if (amountIDR === undefined || amountIDR === null) amountIDR = tx.total
              } else if (type === 'topup') {
                if (amountIDR === undefined || amountIDR === null) amountIDR = tx.amount
                if (amountUSD === undefined || amountUSD === null) amountUSD = tx.total
              } else if (type === 'credit_card') {
                if (amountUSD === undefined || amountUSD === null) amountUSD = tx.amount
              }
              return {
                ...tx,
                amountUSD: Number(amountUSD) || 0,
                amountIDR: Number(amountIDR) || 0,
              }
            })
          setTxs(normalized)
        })
        .catch(() => {})
    }
    fetch()
    const t = setInterval(fetch, 15000)
    return () => clearInterval(t)
  }, [profile?.id])

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

  // Turunkan kurs beli/jual dari base rate realtime
  const buyRate = baseRate ? Math.max(baseRate - BUY_SPREAD, 1) : 0
  const sellRate = baseRate ? baseRate + SELL_SPREAD : 0

  const hasPending = txs.some(t => t.status === 'pending' || t.status === 'processing')

  const statusBadge = (s) => {
    const m = {
      pending: ['text-yellow-400 bg-yellow-500/10 border-yellow-500/20', 'Menunggu'],
      processing: ['text-blue-400 bg-blue-500/10 border-blue-500/20', 'Diproses'],
      success: ['text-green-400 bg-green-500/10 border-green-500/20', 'Selesai'],
      completed: ['text-green-400 bg-green-500/10 border-green-500/20', 'Selesai'],
      failed: ['text-red-400 bg-red-500/10 border-red-500/20', 'Gagal'],
    }
    const [c, label] = m[s] || ['text-gray-500 bg-gray-500/10 border-gray-500/20', s]
    return <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border ${c}`}>{label}</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Selamat datang kembali, {profile?.name?.split(' ')[0] || 'User'}</p>
      </div>

      {/* Stats Cards */}
      {profile && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Balance Card - Featured */}
          <div className="sm:col-span-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-5 text-white">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <FiDollarSign className="w-4 h-4" />
                </div>
                <p className="text-xs font-medium text-blue-100">Saldo IDR</p>
              </div>
              <p className="text-2xl font-black">Rp {(profile.balance || 0).toLocaleString('id-ID')}</p>
            </div>
          </div>

          {/* Buy Rate */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <FiArrowDown className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-xs font-medium text-gray-500">Kurs Beli</p>
            </div>
            <p className="text-xl font-black text-white">
              Rp {buyRate ? buyRate.toLocaleString('id-ID') : (baseRate || 0).toLocaleString('id-ID')}
            </p>
            <p className="text-[10px] text-gray-500 mt-1">USD → IDR</p>
          </div>

          {/* Sell Rate */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <FiArrowUp className="w-4 h-4 text-orange-400" />
              </div>
              <p className="text-xs font-medium text-gray-500">Kurs Jual</p>
            </div>
            <p className="text-xl font-black text-white">
              Rp {sellRate ? sellRate.toLocaleString('id-ID') : (baseRate || 0).toLocaleString('id-ID')}
            </p>
            <p className="text-[10px] text-gray-500 mt-1">IDR → USD</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Aksi Cepat</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            to="/convert"
            className="group relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5 hover:bg-white/[0.06] hover:border-blue-500/30 transition-all"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-colors" />
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <FiSend className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white">Convert PayPal</h3>
                <p className="text-xs text-gray-500 mt-0.5">Tukar saldo PayPal ke Rupiah</p>
              </div>
              <FiArrowDown className="w-5 h-5 text-gray-600 -rotate-90 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/topup"
            className="group relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5 hover:bg-white/[0.06] hover:border-green-500/30 transition-all"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-green-500/10 transition-colors" />
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                <FiPlus className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white">Top Up PayPal</h3>
                <p className="text-xs text-gray-500 mt-0.5">Isi saldo PayPal via bank</p>
              </div>
              <FiArrowDown className="w-5 h-5 text-gray-600 -rotate-90 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Queue Warning */}
      {hasPending && queue && queue.total > 0 && (
        <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <FiClock className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-300">Antrian: {queue.total} transaksi</p>
            <p className="text-xs text-amber-400/60">Estimasi {formatEstimate(queue.estimatedMinutes)} • Rata-rata {queue.avgMinutesPerTx} menit/transaksi</p>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h2 className="font-bold text-white">Riwayat Transaksi</h2>
          {txs.length > 0 && <Link to="/profile" className="text-xs text-blue-400 hover:text-blue-300 font-medium">Lihat semua →</Link>}
        </div>

        {txs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
              <FiClock className="w-6 h-6 text-gray-600" />
            </div>
            <p className="text-sm text-gray-500">Belum ada transaksi</p>
            <p className="text-xs text-gray-600 mt-1">Mulai convert atau top up untuk melihat riwayat</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {txs.slice(0, 10).map(tx => (
              <Link
                key={tx.id}
                to={`/tracking/${tx.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    tx.type === 'convert' ? 'bg-blue-500/10' : tx.type === 'credit_card' ? 'bg-orange-500/10' : 'bg-green-500/10'
                  }`}>
                    {tx.type === 'convert'
                      ? <FiSend className="w-4 h-4 text-blue-400" />
                      : tx.type === 'credit_card'
                        ? <FiCreditCard className="w-4 h-4 text-orange-400" />
                        : <FiPlus className="w-4 h-4 text-green-400" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-white truncate">
                      {tx.type === 'convert' ? 'Convert PayPal → IDR' : tx.type === 'credit_card' ? 'Jasa CC' : 'Top Up PayPal'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    {(tx.status === 'pending' || tx.status === 'processing') && queue && queue.total > 0 && (
                      <p className="text-xs text-amber-400 font-medium mt-0.5">~{formatEstimate(queue.estimatedMinutes)}</p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="font-bold text-white">
                    {tx.type === 'convert'
                      ? `$${(tx.amountUSD ?? 0).toFixed(2)}`
                      : tx.type === 'credit_card'
                        ? `$${(tx.amountUSD ?? 0).toFixed(2)}`
                        : `Rp ${(tx.amountIDR ?? 0).toLocaleString('id-ID')}`}
                  </p>
                  <div className="mt-1">
                    {statusBadge(tx.status)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
