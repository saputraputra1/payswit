import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { FiDollarSign, FiCheck, FiClock, FiCopy, FiArrowRight, FiZap, FiStar } from 'react-icons/fi'
import { BankIcon, PaymentMethodIcon } from '../components/Icons'

const PLANS = {
  standard: {
    name: 'Standard',
    fee: 15000,
    icon: FiZap,
    color: 'from-blue-500 to-cyan-500',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    desc: 'Proses 1-24 jam',
    features: ['Verifikasi manual', 'Proses 1-24 jam', 'Support CS'],
  },
  premium: {
    name: 'Premium',
    fee: 27000,
    icon: FiStar,
    color: 'from-yellow-500 to-orange-500',
    borderColor: 'border-yellow-500',
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-400',
    desc: 'Proses kilat 15-30 menit',
    features: ['Verifikasi prioritas', 'Proses 15-30 menit', 'Support CS 24/7', 'Kurs lebih baik'],
  },
}

export default function Topup() {
  const { user } = useAuth()
  const [amountIDR, setAmountIDR] = useState('')
  const [rates, setRates] = useState(null)
  const [paypalEmail, setPaypalEmail] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [plan, setPlan] = useState('standard')
  const [bankAccounts, setBankAccounts] = useState([])
  const [selectedBank, setSelectedBank] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [txData, setTxData] = useState(null)
  const [copied, setCopied] = useState('')

  useEffect(() => {
    api.get('/rates').then((res) => setRates(res.data)).catch(() => {})
    api.get('/bank-accounts').then((res) => {
      setBankAccounts(res.data)
      if (res.data.length > 0) setSelectedBank(res.data[0])
    }).catch(() => {})
  }, [])

  const selectedPlan = PLANS[plan]
  const estimatedUSD = amountIDR && rates ? (parseFloat(amountIDR) / rates.usdToIdr).toFixed(2) : '0'
  const totalPay = amountIDR ? (parseFloat(amountIDR) + selectedPlan.fee).toLocaleString('id-ID') : '0'

  function copyText(text, field) {
    navigator.clipboard.writeText(text)
    setCopied(field)
    toast.success('Disalin!')
    setTimeout(() => setCopied(''), 2000)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!amountIDR || parseFloat(amountIDR) < 50000) { toast.error('Minimal Rp 50.000'); return }
    if (!selectedBank) { toast.error('Pilih rekening tujuan'); return }
    setLoading(true)
    try {
      const res = await api.post('/transactions', {
        type: 'topup', amountIDR: parseFloat(amountIDR),
        amountUSD: parseFloat(amountIDR) / rates.usdToIdr,
        paypalEmail, paymentMethod, plan,
        adminFee: selectedPlan.fee,
        totalPay: parseFloat(amountIDR) + selectedPlan.fee,
        bankName: selectedBank.bankName,
        bankAccount: selectedBank.accountNumber,
        bankHolder: selectedBank.accountHolder,
      })
      setTxData({
        ...res.data,
        bankName: selectedBank.bankName,
        bankAccount: selectedBank.accountNumber,
        bankHolder: selectedBank.accountHolder,
        amountIDR: parseFloat(amountIDR),
        plan, adminFee: selectedPlan.fee,
        totalPay: parseFloat(amountIDR) + selectedPlan.fee,
      })
      setSubmitted(true)
      toast.success('Pesanan dibuat!')
    } catch (err) { toast.error(err.response?.data?.error || 'Gagal') }
    setLoading(false)
  }

  if (submitted && txData) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="text-center mb-6">
            <div className={`w-16 h-16 ${PLANS[txData.plan].bgColor} border ${PLANS[txData.plan].borderColor} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
              <FiClock size={32} className={PLANS[txData.plan].textColor} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Menunggu Pembayaran</h2>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${PLANS[txData.plan].bgColor} ${PLANS[txData.plan].textColor}`}>
              {txData.plan === 'premium' ? <FiStar size={14} /> : <FiZap size={14} />}
              Paket {PLANS[txData.plan].name}
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6 mb-4">
            <h3 className="font-bold text-white mb-4 text-sm">Transfer Ke</h3>
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <BankIcon bankName={txData.bankName} size="lg" />
                <div>
                  <p className="font-bold text-white text-lg">{txData.bankName}</p>
                  <p className="text-xs text-gray-500">a.n {txData.bankHolder}</p>
                </div>
              </div>
              <div className="flex items-center justify-between bg-white/[0.03] rounded-lg p-3">
                <p className="font-mono text-xl font-bold text-white tracking-wider">{txData.bankAccount}</p>
                <button onClick={() => copyText(txData.bankAccount, 'acc')}
                  className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
                  {copied === 'acc' ? <FiCheck size={18} className="text-green-400" /> : <FiCopy size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6 mb-4">
            <h3 className="font-bold text-white mb-4 text-sm">Detail Pesanan</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Jumlah</span><span className="text-white font-medium">Rp {txData.amountIDR?.toLocaleString('id-ID')}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Biaya Admin ({PLANS[txData.plan].name})</span><span className="text-white font-medium">Rp {txData.adminFee?.toLocaleString('id-ID')}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Estimasi USD</span><span className="text-white font-medium">${(txData.amountIDR / rates?.usdToIdr).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">PayPal</span><span className="text-white font-medium">{txData.paypalEmail}</span></div>
              <div className="flex justify-between pt-3 border-t border-white/[0.06]"><span className="text-gray-400 font-medium">Total Bayar</span><span className="text-white font-bold text-lg">Rp {txData.totalPay?.toLocaleString('id-ID')}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">Status</span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-lg text-xs font-medium">
                  <FiClock size={12} /> Menunggu Pembayaran
                </span>
              </div>
            </div>
          </div>

          <button onClick={() => { setSubmitted(false); setTxData(null); setAmountIDR(''); setPaypalEmail('') }}
            className="w-full py-3.5 bg-white/[0.03] border border-white/10 text-white font-medium rounded-xl hover:bg-white/[0.06] transition-colors text-sm">
            Buat Pesanan Baru
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20 flex-shrink-0">
              <FiDollarSign size={20} className="text-white sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-white">Top Up PayPal</h1>
              <p className="text-gray-500 text-xs sm:text-sm">Pilih paket dan isi saldo</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
          {Object.entries(PLANS).map(([key, p]) => {
            const Icon = p.icon
            const isSelected = plan === key
            return (
              <button key={key} type="button" onClick={() => setPlan(key)}
                className={`relative p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 text-left ${
                  isSelected
                    ? `${p.borderColor} ${p.bgColor}`
                    : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
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
                  Rp {p.fee.toLocaleString('id-ID')}
                </p>
                <p className={`text-xs ${isSelected ? p.textColor : 'text-gray-500'}`}>{p.desc}</p>
                <ul className="mt-3 space-y-1.5">
                  {p.features.map((f, i) => (
                    <li key={i} className={`flex items-center gap-2 text-xs ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                      <FiCheck size={12} className={isSelected ? p.textColor : 'text-gray-600'} />
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>

        {rates && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
            <FiDollarSign className="text-green-400 flex-shrink-0" />
            <p className="text-xs sm:text-sm text-green-300">Kurs: <span className="font-bold">1 USD = Rp {rates.usdToIdr?.toLocaleString('id-ID')}</span></p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6 space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1.5">Jumlah (IDR)</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-gray-500 text-sm">Rp</span>
                <input type="number" step="1000" min="50000" value={amountIDR} onChange={(e) => setAmountIDR(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                  placeholder="Minimal Rp 50.000" required />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Jumlah</p>
                <p className="font-bold text-white text-sm">Rp {parseFloat(amountIDR || 0).toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Biaya {selectedPlan.name}</p>
                <p className={`font-bold text-sm ${selectedPlan.textColor}`}>Rp {selectedPlan.fee.toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Total Bayar</p>
                <p className="font-black text-white text-sm">Rp {totalPay}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1.5">Email PayPal Tujuan</label>
              <input type="email" value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                placeholder="paypal@email.com" required />
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6">
            <h3 className="font-bold text-white mb-2 text-sm">Pilih Rekening Admin</h3>
            <p className="text-xs text-gray-500 mb-4">Transfer ke salah satu rekening admin di bawah ini</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bankAccounts.map((bank) => (
                <button key={bank.id} type="button" onClick={() => setSelectedBank(bank)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedBank?.id === bank.id ? 'border-green-500 bg-green-500/10' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                  }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <BankIcon bankName={bank.bankName} size="md" />
                    <div>
                      <p className="font-bold text-white text-sm">{bank.bankName}</p>
                      <p className="text-xs text-gray-500">a.n {bank.accountHolder}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-white/[0.03] rounded-lg p-2.5">
                    <p className="font-mono text-white text-sm">{bank.accountNumber}</p>
                    <button type="button" onClick={(e) => { e.stopPropagation(); copyText(bank.accountNumber, bank.id) }}
                      className="p-1 text-gray-400 hover:text-white rounded">
                      {copied === bank.id ? <FiCheck size={14} className="text-green-400" /> : <FiCopy size={14} />}
                    </button>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6">
            <h3 className="font-bold text-white mb-4 text-sm">Metode Pembayaran</h3>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {['bank_transfer', 'credit_card', 'ewallet'].map((m) => (
                <button key={m} type="button" onClick={() => setPaymentMethod(m)}
                  className={`p-3 sm:p-4 rounded-xl border-2 text-center transition-all ${
                    paymentMethod === m ? 'border-green-500 bg-green-500/10' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                  }`}>
                  <PaymentMethodIcon method={m} size="sm" />
                  <p className="font-medium text-white text-xs mt-2">
                    {m === 'bank_transfer' ? 'Bank' : m === 'credit_card' ? 'CC' : 'E-Wallet'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading}
            className={`w-full py-4 bg-gradient-to-r ${selectedPlan.color} text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300 disabled:opacity-50 text-sm flex items-center justify-center gap-2 active:scale-[0.98]`}>
            {loading ? 'Memproses...' : `Bayar Rp ${totalPay}`}
            <FiArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  )
}
