import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiRepeat, FiCheck, FiX } from 'react-icons/fi'
import { TransactionIcon, BankIcon } from '../../components/Icons'

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchTx() }, [])

  async function fetchTx() {
    try { const res = await api.get('/admin/transactions'); setTransactions(res.data) } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function handleVerify(id, status) {
    try {
      await api.put(`/admin/transactions/${id}`, { status })
      toast.success(`Transaksi ${status === 'completed' ? 'disetujui' : 'ditolak'}`)
      fetchTx()
    } catch (e) {
      toast.error('Gagal: ' + (e.response?.data?.error || ''))
    }
  }

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.status === filter)

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" /></div>

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
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
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-6 py-12 text-center">
          <p className="text-gray-500 text-sm">Tidak ada transaksi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(tx => (
            <div key={tx.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <TransactionIcon type={tx.type} size="md" />
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

function txTypeLabel(type) {
  if (type === 'convert') return 'PayPal → IDR'
  if (type === 'topup') return 'Top Up PayPal'
  return 'Jasa CC'
}
function StatusBadge({ status }) {
  const c = status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
  return <div className={`px-2 py-1 rounded-md border text-[10px] font-medium ${c}`}>{status}</div>
}
function InfoBox({ label, value }) {
  return (
    <div className="bg-white/[0.03] rounded-lg p-2">
      <p className="text-[10px] text-gray-500 mb-0.5">{label}</p>
      <p className="font-medium text-white text-xs truncate">{value}</p>
    </div>
  )
}
