import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import {
  FiPlus, FiCopy, FiCheck, FiClock, FiInfo, FiArrowRight, FiCreditCard,
  FiShield, FiLock, FiGlobe, FiRefreshCw, FiZap, FiStar,
} from 'react-icons/fi'
import { BankIcon } from '../components/Icons'

const nominalList = [100000, 250000, 500000, 1000000, 2500000, 5000000]

const PLANS = {
  standard: {
    name: 'Standard',
    serviceFee: 10000,
    adminFee: 10000,
    totalFee: 20000,
    kursBonus: 0,
    icon: FiZap,
    color: 'from-green-500 to-emerald-600',
    borderColor: 'border-green-500',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-400',
    desc: 'Proses 1-24 jam',
  },
  premium: {
    name: 'Priority',
    serviceFee: 15000,
    adminFee: 15000,
    totalFee: 30000,
    kursBonus: 0,
    icon: FiStar,
    color: 'from-yellow-500 to-orange-500',
    borderColor: 'border-yellow-500',
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-400',
    desc: 'Proses 15-30 menit',
  },
}

const SELL_SPREAD = 1500

export default function Topup() {
  const { profile } = useAuth()
  const [nominal, setNominal] = useState('')
  const [baseRate, setBaseRate] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [plan, setPlan] = useState('standard')
  const [loading, setLoading] = useState(false)
  const [lastTx, setLastTx] = useState(null)
  const [queue, setQueue] = useState(null)
  const [copied, setCopied] = useState('')
  const [bankAccounts, setBankAccounts] = useState([])
  const [selectedBank, setSelectedBank] = useState(null)

  // Kurs realtime
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'rates'), (snap) => {
      if (snap.exists()) {
        const d = snap.data()
        setBaseRate(Number(d.usdToIdr) || null)
        setLastUpdated(d.lastUpdated?.toDate?.() || new Date())
      }
    }, () => {})
    return unsub
  }, [])

  // Bank accounts admin
  useEffect(() => {
    api.get('/bank-accounts').then((res) => {
      setBankAccounts(res.data)
      if (res.data.length > 0) setSelectedBank(res.data[0])
    }).catch(() => {})
  }, [])

  const selectedPlan = PLANS[plan]
  const effectiveRate = baseRate ? (baseRate + SELL_SPREAD + selectedPlan.kursBonus) : 15000
  const nominalNum = nominal ? parseFloat(nominal) : 0
  const totalCost = nominalNum + selectedPlan.totalFee
  const usd = effectiveRate > 0 ? totalCost / effectiveRate : 0

  const handleTopup = async (e) => {
    e?.preventDefault?.()
    if (!nominalNum || nominalNum < 50000) return toast.error('Minimal Rp 50.000')
    setLoading(true)
    try {
      const { data } = await api.post('/transactions', {
        type: 'topup',
        amountIDR: nominalNum,
        amountUSD: usd,
        rate: effectiveRate,
        paymentMethod: 'bank_transfer',
        plan, serviceFee: selectedPlan.serviceFee, adminFee: selectedPlan.adminFee, totalFee: selectedPlan.totalFee,
      })
      setLastTx({ id: data?.id, nominal: nominalNum, usd, plan })
      api.get('/transactions/queue').then(({ data }) => setQueue(data)).catch(() => {})
      toast.success('Permintaan top-up berhasil dibuat!')
    } catch (e) {
      toast.error('Gagal membuat permintaan: ' + (e.response?.data?.error || ''))
    } finally { setLoading(false) }
  }

  const copyText = (text, label) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 2000)
  }

  // ==================== SUCCESS STATE ====================
  if (lastTx) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20 flex-shrink-0">
              <FiPlus size={20} className="text-white sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-white">Top Up PayPal</h1>
              <p className="text-gray-500 text-xs sm:text-sm">Isi saldo PayPal menggunakan transfer bank</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
                <FiCheck className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Permintaan Dibuat!</h2>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mt-2 ${PLANS[lastTx.plan]?.bgColor} ${PLANS[lastTx.plan]?.textColor}`}>
                {lastTx.plan === 'premium' ? <FiStar size={14} /> : <FiZap size={14} />}
                Paket {PLANS[lastTx.plan]?.name}
              </div>
              <p className="text-sm text-gray-500 mt-2">Transfer ke rekening admin di bawah ini</p>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6 space-y-4">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Transfer ke</p>
              {selectedBank ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BankIcon bankName={selectedBank.bankName} size="md" />
                      <div>
                        <p className="text-xs text-gray-500">Bank</p>
                        <p className="font-bold text-white">{selectedBank.bankName}</p>
                      </div>
                    </div>
                    <button onClick={() => copyText(selectedBank.bankName, 'bank')}
                      className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 hover:bg-green-500/20 transition-colors">
                      {copied === 'bank' ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="h-px bg-white/[0.06]" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Nomor Rekening</p>
                      <p className="font-mono font-bold text-lg text-white tracking-wider">{selectedBank.accountNumber}</p>
                    </div>
                    <button onClick={() => copyText(selectedBank.accountNumber, 'norek')}
                      className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 hover:bg-green-500/20 transition-colors">
                      {copied === 'norek' ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="h-px bg-white/[0.06]" />
                  <div>
                    <p className="text-xs text-gray-500">Atas Nama</p>
                    <p className="font-semibold text-white">{selectedBank.accountHolder}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Rekening admin belum tersedia, hubungi CS.</p>
              )}
            </div>

            <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 sm:p-6 space-y-2">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Petunjuk</p>
              <ol className="list-decimal ml-4 space-y-1.5 text-sm text-amber-200/80">
                <li>Transfer sejumlah <strong className="text-amber-300">Rp {lastTx.nominal.toLocaleString('id-ID')}</strong> ke rekening di atas</li>
                <li>Simpan bukti transfer</li>
                <li>Kirim bukti transfer via <strong className="text-amber-300">Chat CS</strong></li>
                <li>Admin akan memverifikasi dan saldo PayPal akan masuk ke akun kamu</li>
              </ol>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6">
              <h3 className="font-bold text-white mb-4 text-sm">Ringkasan</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Bayar</span><span className="text-white">Rp {lastTx.nominal.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Kurs jual</span><span className="text-white">Rp {effectiveRate.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Biaya Layanan</span><span className={`font-medium ${PLANS[lastTx.plan]?.textColor}`}>Rp {PLANS[lastTx.plan]?.serviceFee.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Biaya Admin</span><span className={`font-medium ${PLANS[lastTx.plan]?.textColor}`}>Rp {PLANS[lastTx.plan]?.adminFee.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between pt-3 border-t border-white/[0.06]"><span className="text-gray-400 font-medium">PayPal masuk</span><span className="text-blue-400 font-bold">${lastTx.usd.toFixed(2)}</span></div>
              </div>
            </div>

            {queue && queue.total > 0 && (
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 flex items-start gap-3">
                <FiClock className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-300">Antrian: {queue.total} transaksi</p>
                  <p className="text-xs text-amber-400/60">Estimasi ~{queue.estimatedMinutes} menit</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2">
              <button onClick={() => { setLastTx(null); setNominal('') }} className="btn-outline text-center text-xs py-3">Buat Lagi</button>
              <Link to={`/tracking/${lastTx.id}`} className="px-3 py-3 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/[0.08] transition-colors text-xs text-center">Lacak Transaksi</Link>
              <a href="/chat" className="btn-primary text-center text-xs py-3">Chat CS</a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ==================== FORM STATE ====================
  return (
    <div>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20 flex-shrink-0">
              <FiPlus size={20} className="text-white sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-white">Top Up PayPal</h1>
              <p className="text-gray-500 text-xs sm:text-sm">Isi saldo PayPal menggunakan transfer bank</p>
            </div>
          </div>
        </div>

        {/* Plan Selector */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
          {Object.entries(PLANS).map(([key, p]) => {
            const Icon = p.icon
            const isSelected = plan === key
            return (
              <button key={key} type="button" onClick={() => setPlan(key)}
                className={`relative p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 text-left ${
                  isSelected ? `${p.borderColor} ${p.bgColor}` : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                }`}>
                {key === 'premium' && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[10px] font-bold rounded-full">
                    POPULER
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={20} className={isSelected ? p.textColor : 'text-gray-500'} />
                  <span className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-gray-400'}`}>{p.name}</span>
                </div>
                <p className={`text-2xl sm:text-3xl font-black mb-1 ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                  Rp {p.totalFee.toLocaleString('id-ID')}
                </p>
                <p className={`text-xs ${isSelected ? p.textColor : 'text-gray-500'}`}>{p.desc}</p>
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <form onSubmit={handleTopup} className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Kurs realtime */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <FiInfo className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-green-400/70 font-medium">Kurs jual saat ini</p>
                    <p className="text-sm font-bold text-green-400">
                      1 USD = Rp {effectiveRate.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-green-400 font-medium px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  REALTIME
                </div>
              </div>
              {lastUpdated && (
                <p className="text-[10px] text-gray-600 mt-2 flex items-center gap-1">
                  <FiRefreshCw className="w-3 h-3" /> Diperbarui {new Date(lastUpdated).toLocaleTimeString('id-ID')}
                </p>
              )}
            </div>

            {/* Nominal */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Pilih nominal</label>
                <div className="grid grid-cols-3 gap-2">
                  {nominalList.map((n) => (
                    <button key={n} type="button" onClick={() => setNominal(n.toString())}
                      className={`py-3 rounded-xl border text-sm font-semibold transition-all ${
                        nominal === n.toString()
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-500 shadow-lg shadow-green-500/20'
                          : 'border-white/[0.08] text-gray-300 hover:border-green-500/30 hover:bg-green-500/5'
                      }`}>
                      {n >= 1000000 ? `${n / 1000000}jt` : `${n / 1000}rb`}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Atau masukkan nominal (Rp)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-gray-500 text-sm font-bold">Rp</span>
                  <input type="number" value={nominal} onChange={(e) => setNominal(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                    placeholder="50.000" min="50000" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimal Rp 50.000</p>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300 disabled:opacity-50 text-sm flex items-center justify-center gap-2 active:scale-[0.98]">
              <FiPlus size={18} />
              {loading ? 'Memproses...' : 'Buat Permintaan Top Up'}
              <FiArrowRight size={18} />
            </button>
          </form>

          {/* Right sidebar */}
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6">
              <h3 className="font-bold text-white mb-4 text-sm">Ringkasan</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Bayar</span><span className="text-white">Rp {nominalNum ? nominalNum.toLocaleString('id-ID') : '0'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Kurs jual</span><span className="text-white">Rp {effectiveRate.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Biaya Layanan</span><span className={`font-medium ${selectedPlan.textColor}`}>Rp {selectedPlan.serviceFee.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Biaya Admin</span><span className={`font-medium ${selectedPlan.textColor}`}>Rp {selectedPlan.adminFee.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between pt-3 border-t border-white/[0.06]"><span className="text-gray-400 font-medium">PayPal masuk</span><span className="text-blue-400 font-bold">${usd.toFixed(2)}</span></div>
              </div>
              {nominalNum > 0 && (
                <div className="mt-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/15 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <FiArrowRight className="w-3.5 h-3.5 text-blue-400" />
                    <p className="text-[10px] text-blue-400/80 font-medium uppercase tracking-wider">PayPal akan masuk</p>
                  </div>
                  <p className="text-2xl font-black text-blue-400">${usd.toFixed(2)}</p>
                </div>
              )}
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6 space-y-3">
              <h3 className="font-bold text-white text-sm">Info</h3>
              {[
                { icon: FiClock, text: selectedPlan.desc },
                { icon: FiShield, text: 'Garansi uang kembali' },
                { icon: FiGlobe, text: 'Kurs update otomatis' },
                { icon: FiLock, text: 'Data terenkripsi' },
              ].map((info, i) => {
                const Icon = info.icon
                return (
                  <div key={i} className="flex items-center gap-2">
                    <Icon size={14} className="text-gray-400" />
                    <p className="text-xs text-gray-400">{info.text}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
