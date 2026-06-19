import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from '../contexts/AuthContext'
import { FiArrowLeft, FiCheck, FiX, FiClock, FiRefreshCw, FiMessageSquare, FiDollarSign, FiRepeat } from 'react-icons/fi'

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
  const lineMap = { red: 'bg-red-500/20', green: 'bg-green-500/20', blue: 'bg-blue-500/20', gray: 'bg-gray-700' }

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bgMap[color]} ring-4 ${ringMap[color]} transition-all duration-500 ${active ? 'scale-110' : ''}`}>
          {completed || failed ? <Icon className="w-5 h-5 text-white" /> : <Icon className="w-5 h-5 text-white" />}
        </div>
        {step < 3 && <div className={`w-0.5 h-12 ${lineMap[color]}`} />}
      </div>
      <div className={`pb-6 ${active ? '' : ''}`}>
        <p className={`font-semibold text-sm ${active || completed || failed ? 'text-white' : 'text-gray-500'}`}>{label}</p>
        <p className={`text-xs ${textMap[color]}`}>{desc}</p>
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
      setTx({ id: snap.id, ...snap.data() })
    })
    return unsub
  }, [id])

  if (error) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <FiX className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Transaksi Tidak Ditemukan</h2>
        <Link to="/" className="text-blue-400 hover:underline text-sm">Kembali ke Dashboard</Link>
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
  const isSuccess = tx.status === 'success'
  const isFailed = tx.status === 'failed'
  const statusColor = isSuccess ? 'text-green-400 bg-green-500/10 border-green-500/20' : isFailed ? 'text-red-400 bg-red-500/10 border-red-500/20' : isProcessing ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <FiArrowLeft className="w-4 h-4" /> Kembali
      </Link>

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Tracking Transaksi</h1>
            <p className="text-xs text-gray-500 font-mono mt-0.5">#{tx.id?.slice(0, 8)}</p>
          </div>
          <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${statusColor}`}>
            {isPending ? 'Pending' : isProcessing ? 'Processing' : isSuccess ? 'Selesai' : 'Ditolak'}
          </span>
        </div>

        <div className="bg-white/[0.02] rounded-xl p-4 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-white font-semibold">
            {tx.type === 'convert' ? <FiRepeat className="w-4 h-4 text-blue-400" /> : <FiDollarSign className="w-4 h-4 text-green-400" />}
            {tx.type === 'convert' ? 'Convert PayPal → IDR' : 'Top Up PayPal'}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-gray-500">Jumlah</span><p className="text-white font-medium">{tx.type === 'convert' ? `$${tx.amount}` : `Rp ${(tx.amount || 0).toLocaleString('id-ID')}`}</p></div>
            <div><span className="text-gray-500">{tx.type === 'convert' ? 'Hasil' : 'Dapat'}</span><p className="text-white font-medium">{tx.type === 'convert' ? `Rp ${(tx.total || 0).toLocaleString('id-ID')}` : `$${(tx.total || 0).toFixed(2)}`}</p></div>
            <div><span className="text-gray-500">Kurs</span><p className="text-white font-medium">Rp {tx.rate?.toLocaleString('id-ID') || '-'}</p></div>
            <div><span className="text-gray-500">Tanggal</span><p className="text-white font-medium">{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('id-ID') : '-'}</p></div>
          </div>
        </div>

        <div className="pt-2">
          <Step step={1} {...STEPS.pending} completed />
          <Step step={2} {...STEPS.processing} completed={isProcessing || isSuccess || isFailed} active={isProcessing} />
          {isFailed ? (
            <Step step={3} {...STEPS.failed} active failed />
          ) : (
            <Step step={3} {...STEPS.success} completed={isSuccess} active={isSuccess} />
          )}
        </div>

        {tx.adminNote && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Catatan Admin</p>
            <p className="text-sm text-white">{tx.adminNote}</p>
          </div>
        )}

        {(isPending || isProcessing) && (
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 text-sm text-blue-300 space-y-2">
            <p className="font-medium">Butuh bantuan?</p>
            <Link to="/chat" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
              <FiMessageSquare className="w-4 h-4" /> Chat Customer Service
            </Link>
          </div>
        )}

        {isSuccess && (
          <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-4 text-sm text-green-300">
            <p className="font-medium">Transaksi selesai!</p>
            <p className="text-xs text-green-400/80 mt-1">Terima kasih telah menggunakan Payswit.</p>
          </div>
        )}

        {isFailed && (
          <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 text-sm text-red-300">
            <p className="font-medium">Transaksi ditolak</p>
            <p className="text-xs text-red-400/80 mt-1">Silakan hubungi CS untuk informasi lebih lanjut.</p>
            <Link to="/chat" className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors mt-2">
              <FiMessageSquare className="w-4 h-4" /> Hubungi CS
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
