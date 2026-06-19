import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from '../contexts/AuthContext'
import { FiArrowLeft, FiCheck, FiX, FiClock, FiRefreshCw, FiMessageSquare, FiDollarSign, FiRepeat, FiSend, FiPlus } from 'react-icons/fi'

const STEPS = {
  pending: { label: 'Permintaan Dibuat', icon: FiClock, desc: 'Menunggu admin memproses' },
  processing: { label: 'Diproses Admin', icon: FiRefreshCw, desc: 'Admin sedang memverifikasi' },
  success: { label: 'Selesai', icon: FiCheck, desc: 'Transaksi berhasil' },
  failed: { label: 'Ditolak', icon: FiX, desc: 'Transaksi ditolak' },
}

function Step({ step, icon: Icon, label, desc, active, completed, failed }) {
  const color = failed ? 'red' : completed ? 'green' : active ? 'blue' : 'gray'
  const bgMap = { red: 'bg-red-500', green: 'bg-green-500', blue: 'bg-blue-500', gray: 'bg-gray-600' }
  const ringMap = { red: 'ring-red-500/20', green: 'ring-green-500/20', blue: 'ring-blue-500/20', gray: 'ring-gray-500/20' }
  const textMap = { red: 'text-red-400', green: 'text-green-400', blue: 'text-blue-400', gray: 'text-gray-500' }
  const lineMap = { red: 'bg-red-500/20', green: 'bg-green-500/20', blue: 'bg-blue-500/20', gray: 'bg-white/[0.06]' }

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bgMap[color]} ring-4 ${ringMap[color]} transition-all duration-500 ${active ? 'scale-110' : ''}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {step < 3 && <div className={`w-0.5 h-12 ${lineMap[color]}`} />}
      </div>
      <div className="pb-6">
        <p className={`font-semibold text-sm ${active || completed || failed ? 'text-white' : 'text-gray-500'}`}>{label}</p>
        <p className={`text-xs mt-0.5 ${textMap[color]}`}>{desc}</p>
      </div>
    </div>
  )
}

export default function Tracking() {
  const { id } = useParams()
  const { profile } = useAuth()
  const [tx, setTx] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) return
    const unsub = onSnapshot(doc(db, 'transactions', id), (snap) => {
      if (!snap.exists()) { setError(true); return }
      const raw = { id: snap.id, ...snap.data() }
      // Normalisasi field lama -> kanonik (selaras dengan server)
      const t = raw.type
      const amountUSD = raw.amountUSD ?? (t === 'convert' ? raw.amount : t === 'topup' ? raw.total : raw.amount)
      const amountIDR = raw.amountIDR ?? (t === 'convert' ? raw.total : t === 'topup' ? raw.amount : undefined)
      setTx({
        ...raw,
        amountUSD: Number(amountUSD) || 0,
        amountIDR: Number(amountIDR) || 0,
        paypalEmail: raw.paypalEmail || raw.paypal_email || '',
      })
    })
    return unsub
  }, [id])

  if (error) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <FiX className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Transaksi Tidak Ditemukan</h2>
        <Link to="/" className="text-sm text-blue-400 hover:text-blue-300 font-medium">Kembali ke Dashboard</Link>
      </div>
    )
  }

  if (!tx) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  const isOwner = profile?.id === tx.userId
  const isPending = tx.status === 'pending'
  const isProcessing = tx.status === 'processing'
  const isSuccess = tx.status === 'success' || tx.status === 'completed'
  const isFailed = tx.status === 'failed'

  const statusConfig = {
    pending: { color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', label: 'Menunggu' },
    processing: { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', label: 'Diproses' },
    success: { color: 'text-green-400 bg-green-500/10 border-green-500/20', label: 'Selesai' },
    completed: { color: 'text-green-400 bg-green-500/10 border-green-500/20', label: 'Selesai' },
    failed: { color: 'text-red-400 bg-red-500/10 border-red-500/20', label: 'Ditolak' },
  }
  const { color: statusColor, label: statusLabel } = statusConfig[tx.status] || statusConfig.pending

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Back Button */}
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <FiArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
      </Link>

      {/* Main Card */}
      <div className="card space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Tracking Transaksi</h1>
            <p className="text-xs text-gray-500 font-mono mt-1">#{tx.id?.slice(0, 8)}</p>
          </div>
          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border ${statusColor}`}>
            {statusLabel}
          </span>
        </div>

        {/* Transaction Summary */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              tx.type === 'convert' ? 'bg-blue-500/10' : tx.type === 'topup' ? 'bg-green-500/10' : 'bg-orange-500/10'
            }`}>
              {tx.type === 'convert'
                ? <FiSend className="w-4 h-4 text-blue-400" />
                : tx.type === 'topup'
                  ? <FiPlus className="w-4 h-4 text-green-400" />
                  : <FiRepeat className="w-4 h-4 text-orange-400" />
              }
            </div>
            <div>
              <p className="font-semibold text-sm text-white">
                {tx.type === 'convert' ? 'Convert PayPal → IDR' : tx.type === 'topup' ? 'Top Up PayPal' : 'Jasa CC'}
              </p>
              <p className="text-xs text-gray-500">
                {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
              </p>
            </div>
          </div>

          <div className="h-px bg-white/[0.06]" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Jumlah</p>
              <p className="text-sm font-bold text-white mt-0.5">
                {tx.type === 'convert' || tx.type === 'credit_card'
                  ? `$${(tx.amountUSD ?? 0).toFixed(2)}`
                  : `Rp ${(tx.amountIDR ?? 0).toLocaleString('id-ID')}`}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{tx.type === 'convert' ? 'Hasil' : 'Dapat'}</p>
              <p className="text-sm font-bold text-white mt-0.5">
                {tx.type === 'convert' || tx.type === 'credit_card'
                  ? `Rp ${(tx.amountIDR ?? 0).toLocaleString('id-ID')}`
                  : `$${(tx.amountUSD ?? 0).toFixed(2)}`}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Kurs</p>
              <p className="text-sm font-bold text-white mt-0.5">Rp {tx.rate?.toLocaleString('id-ID') || '-'}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Tanggal</p>
              <p className="text-sm font-bold text-white mt-0.5">
                {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="pt-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Progress</p>
          <Step step={1} {...STEPS.pending} completed />
          <Step step={2} {...STEPS.processing} completed={isProcessing || isSuccess || isFailed} active={isProcessing} />
          {isFailed ? (
            <Step step={3} {...STEPS.failed} active failed />
          ) : (
            <Step step={3} {...STEPS.success} completed={isSuccess} active={isSuccess} />
          )}
        </div>

        {/* Admin Note */}
        {tx.adminNote && (
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Catatan Admin</p>
            <p className="text-sm text-gray-300">{tx.adminNote}</p>
          </div>
        )}

        {/* Pending/Processing CTA */}
        {(isPending || isProcessing) && (
          <div className="rounded-xl bg-blue-500/5 border border-blue-500/10 p-4 space-y-2">
            <p className="text-sm font-medium text-blue-300">Butuh bantuan?</p>
            <Link to="/chat" className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium">
              <FiMessageSquare className="w-4 h-4" /> Chat Customer Service
            </Link>
          </div>
        )}

        {/* Success State */}
        {isSuccess && (
          <div className="rounded-xl bg-green-500/5 border border-green-500/10 p-4">
            <p className="text-sm font-medium text-green-300">Transaksi selesai!</p>
            <p className="text-xs text-green-400/70 mt-1">Terima kasih telah menggunakan Payswit.</p>
          </div>
        )}

        {/* Failed State */}
        {isFailed && (
          <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-4 space-y-2">
            <p className="text-sm font-medium text-red-300">Transaksi ditolak</p>
            <p className="text-xs text-red-400/70">Silakan hubungi CS untuk informasi lebih lanjut.</p>
            <Link to="/chat" className="inline-flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors font-medium">
              <FiMessageSquare className="w-4 h-4" /> Hubungi CS
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}