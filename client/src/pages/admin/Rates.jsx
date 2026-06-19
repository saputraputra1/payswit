import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiDollarSign, FiPercent, FiSave, FiAlertTriangle } from 'react-icons/fi'

export default function AdminRates() {
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

  if (fetching) return <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" /></div>

  return (
    <div className="p-4 sm:p-6 max-w-xl">
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
