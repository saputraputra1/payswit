import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import {
  FiRepeat, FiSend, FiDollarSign, FiCheck, FiCopy, FiArrowRight,
  FiInfo, FiClock, FiShield, FiLock, FiGlobe, FiRefreshCw, FiCreditCard,
  FiZap, FiStar, FiChevronDown,
} from 'react-icons/fi'
import { BankIcon } from '../components/Icons'

// Plan Standard & Priority — selaras dengan CreditCard
const PLANS = {
  standard: {
    name: 'Standard',
    serviceFee: 10000,
    adminFee: 10000,
    totalFee: 20000,
    kursBonus: 0,
    icon: FiZap,
    color: 'from-blue-500 to-blue-600',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    desc: 'Proses 1-24 jam',
  },
  premium: {
    name: 'Priority',
    serviceFee: 15000,
    adminFee: 15000,
    totalFee: 30000,
    kursBonus: 500,
    icon: FiStar,
    color: 'from-yellow-500 to-orange-500',
    borderColor: 'border-yellow-500',
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-400',
    desc: 'Proses 15-30 menit',
  },
}

const BUY_SPREAD = 100

export default function Convert() {
  const { profile } = useAuth()
  const [usd, setUsd] = useState('')
  const [baseRate, setBaseRate] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [paypalEmail, setPaypalEmail] = useState('')
  const [plan, setPlan] = useState('standard')
  const [loading, setLoading] = useState(false)
  const [lastTx, setLastTx] = useState(null)
  const [queue, setQueue] = useState(null)
  const [copied, setCopied] = useState('')
  const [adminAccounts, setAdminAccounts] = useState([])
  const [selectedAccountId, setSelectedAccountId] = useState('')

  // Fetch rekening admin
  useEffect(() => {
    api.get('/bank-accounts').then(({ data }) => setAdminAccounts(data)).catch(() => {})
  }, [])

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

  const selectedPlan = PLANS[plan]
  const effectiveRate = baseRate ? (baseRate - BUY_SPREAD + selectedPlan.kursBonus) : 15500
  const usdNum = usd ? parseFloat(usd) : 0
  const idrRaw = usdNum * effectiveRate
  const idrAfterFee = Math.max(idrRaw - selectedPlan.totalFee, 0)

  const handleConvert = async (e) => {
    e?.preventDefault?.()
    if (!usdNum || usdNum < 1) return toast.error('Minimal $1')
    if (!paypalEmail && !profile?.paypal_email) return toast.error('Masukkan email PayPal kamu')
    if (!selectedAccountId) return toast.error('Pilih rekening bank penerima')
    const selectedAccount = adminAccounts.find(a => a.id === selectedAccountId)
    if (!selectedAccount) return toast.error('Rekening tidak ditemukan')
    setLoading(true)
    try {
      const { data } = await api.post('/transactions', {
        type: 'convert',
        amountUSD: usdNum,
        amountIDR: idrRaw,
        rate: effectiveRate,
        paypalEmail: paypalEmail || profile?.paypal_email,
        bankName: selectedAccount.bankName,
        bankAccount: selectedAccount.accountNumber,
        bankHolder: selectedAccount.accountHolder,
        plan, serviceFee: selectedPlan.serviceFee, adminFee: selectedPlan.adminFee, totalFee: selectedPlan.totalFee,
      })
      setLastTx({ id: data?.id, usd: usdNum, idr: idrAfterFee, adminPaypal: 'admin@payswit.com', plan })
      api.get('/transactions/queue').then(({ data }) => setQueue(data)).catch(() => {})
      toast.success('Permintaan convert terkirim!')
      setUsd('')
      setSelectedAccountId('')
    } catch (e) {
      toast.error('Gagal kirim permintaan: ' + (e.response?.data?.error || ''))
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
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
              <FiRepeat size={20} className="text-white sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-white">Convert PayPal → IDR</h1>
              <p className="text-gray-500 text-xs sm:text-sm">Tukar saldo PayPal kamu ke Rupiah</p>
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
              <p className="text-sm text-gray-500 mt-2">Kirim PayPal ke akun admin berikut</p>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6 space-y-4">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Kirim PayPal ke</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Email PayPal Admin</p>
                    <p className="font-mono font-bold text-lg text-white">{lastTx.adminPaypal}</p>
                  </div>
                  <button onClick={() => copyText(lastTx.adminPaypal, 'paypal')}
                    className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 hover:bg-blue-500/20 transition-colors">
                    {copied === 'paypal' ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="h-px bg-white/[0.06]" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Jumlah yang dikirim</p>
                    <p className="font-bold text-lg text-blue-400">${lastTx.usd.toFixed(2)} USD</p>
                  </div>
                  <button onClick={() => copyText(lastTx.usd.toFixed(2), 'amount')}
                    className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 hover:bg-blue-500/20 transition-colors">
                    {copied === 'amount' ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 sm:p-6 space-y-2">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Petunjuk</p>
              <ol className="list-decimal ml-4 space-y-1.5 text-sm text-amber-200/80">
                <li>Kirim <strong className="text-amber-300">${lastTx.usd.toFixed(2)}</strong> dari PayPal kamu ke email di atas</li>
                <li>Simpan bukti pengiriman PayPal</li>
                <li>Kirim bukti via <strong className="text-amber-300">Chat CS</strong></li>
                <li>Admin akan memverifikasi dan mengirim Rp {lastTx.idr.toLocaleString('id-ID')} ke rekening bank kamu</li>
              </ol>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6">
              <h3 className="font-bold text-white mb-4 text-sm">Ringkasan</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Jumlah</span><span className="text-white">${lastTx.usd.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Kurs beli</span><span className="text-white">Rp {effectiveRate.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Biaya Layanan</span><span className={`font-medium ${PLANS[lastTx.plan]?.textColor}`}>Rp {PLANS[lastTx.plan]?.serviceFee.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Biaya Admin</span><span className={`font-medium ${PLANS[lastTx.plan]?.textColor}`}>Rp {PLANS[lastTx.plan]?.adminFee.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between pt-3 border-t border-white/[0.06]"><span className="text-gray-400 font-medium">Kamu terima</span><span className="text-green-400 font-bold">Rp {lastTx.idr.toLocaleString('id-ID')}</span></div>
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
              <button onClick={() => setLastTx(null)} className="btn-outline text-center text-xs py-3">Convert Lagi</button>
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
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
              <FiRepeat size={20} className="text-white sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-white">Convert PayPal → IDR</h1>
              <p className="text-gray-500 text-xs sm:text-sm">Tukar saldo PayPal kamu ke Rupiah</p>
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
          <form onSubmit={handleConvert} className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Kurs realtime */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <FiInfo className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-400/70 font-medium">Kurs beli saat ini</p>
                    <p className="text-sm font-bold text-blue-400">
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

            {/* Form */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Jumlah USD</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-gray-500">$</span>
                  <input type="number" step="0.01" min="1" value={usd} onChange={(e) => setUsd(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    placeholder="0.00" required />
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimal $1.00</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Email PayPal pengirim</label>
                <input type="email" value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  placeholder="paypal@email.com" />
              </div>
            </div>

            {/* Bank account - selector dari list rekening admin */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6 space-y-4">
              <h3 className="font-bold text-white text-sm">Rekening bank penerima (IDR)</h3>
              <p className="text-xs text-gray-500 -mt-2">Pilih rekening admin untuk menerima pembayaran Rupiah</p>

              {adminAccounts.length === 0 ? (
                <div className="bg-white/[0.02] border border-white/10 rounded-xl px-4 py-8 text-center">
                  <FiCreditCard size={28} className="mx-auto text-gray-600 mb-2" />
                  <p className="text-gray-500 text-sm">Belum ada rekening tersedia</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {adminAccounts.map((acc) => {
                    const isSelected = selectedAccountId === acc.id
                    return (
                      <button key={acc.id} type="button"
                        onClick={() => setSelectedAccountId(acc.id)}
                        className={`w-full flex items-center gap-3 p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-white/[0.06] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                        }`}>
                        <BankIcon bankName={acc.bankName} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm ${isSelected ? 'text-blue-400' : 'text-white'}`}>{acc.bankName}</p>
                          <p className="font-mono text-gray-400 text-xs sm:text-sm">{acc.accountNumber}</p>
                          <p className="text-[10px] sm:text-xs text-gray-500">a.n {acc.accountHolder}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? 'border-blue-500 bg-blue-500' : 'border-white/20'
                        }`}>
                          {isSelected && <FiCheck size={12} className="text-white" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 disabled:opacity-50 text-sm flex items-center justify-center gap-2 active:scale-[0.98]">
              <FiSend size={18} />
              {loading ? 'Memproses...' : 'Kirim Permintaan Convert'}
              <FiArrowRight size={18} />
            </button>
          </form>

          {/* Right sidebar */}
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6">
              <h3 className="font-bold text-white mb-4 text-sm">Ringkasan</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Jumlah</span><span className="text-white">${usdNum ? usdNum.toFixed(2) : '0.00'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Kurs beli</span><span className="text-white">Rp {effectiveRate.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Biaya Layanan</span><span className={`font-medium ${selectedPlan.textColor}`}>Rp {selectedPlan.serviceFee.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Biaya Admin</span><span className={`font-medium ${selectedPlan.textColor}`}>Rp {selectedPlan.adminFee.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between pt-3 border-t border-white/[0.06]"><span className="text-gray-400 font-medium">Kamu terima</span><span className="text-green-400 font-bold">Rp {idrAfterFee.toLocaleString('id-ID')}</span></div>
              </div>
              {usdNum > 0 && (
                <div className="mt-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/15 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <FiArrowRight className="w-3.5 h-3.5 text-green-400" />
                    <p className="text-[10px] text-green-400/80 font-medium uppercase tracking-wider">Hasil konversi</p>
                  </div>
                  <p className="text-2xl font-black text-green-400">Rp {idrAfterFee.toLocaleString('id-ID')}</p>
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

            {profile && (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <FiCreditCard className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Saldo kamu</p>
                  <p className="font-bold text-white">${(profile.balance || 0).toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
