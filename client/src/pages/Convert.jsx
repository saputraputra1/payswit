import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { FiRepeat, FiDollarSign, FiCheck, FiZap, FiStar, FiArrowRight, FiCopy } from 'react-icons/fi'
import { BankIcon } from '../components/Icons'

const PLANS = {
  standard: {
    name: 'Standard',
    fee: 20000,
    kursBonus: 0,
    icon: FiZap,
    color: 'from-blue-500 to-cyan-500',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    desc: 'Proses 1-24 jam',
    features: ['Verifikasi manual', 'Proses 1-24 jam', 'Biaya Rp 20.000'],
  },
  premium: {
    name: 'Priority',
    fee: 15000,
    kursBonus: 1000,
    icon: FiStar,
    color: 'from-yellow-500 to-orange-500',
    borderColor: 'border-yellow-500',
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-400',
    desc: 'Proses 15-30 menit',
    features: ['Verifikasi prioritas', 'Proses 15-30 menit', 'Biaya Rp 15.000', 'Kurs +Rp 1.000/USD'],
  },
}

export default function Convert() {
  const { user } = useAuth()
  const [amountUSD, setAmountUSD] = useState('')
  const [rates, setRates] = useState(null)
  const [paypalEmail, setPaypalEmail] = useState('')
  const [plan, setPlan] = useState('standard')
  const [bankAccounts, setBankAccounts] = useState([])
  const [selectedBank, setSelectedBank] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState('')

  useEffect(() => {
    api.get('/rates').then((res) => setRates(res.data)).catch(() => {})
    api.get('/bank-accounts').then((res) => {
      setBankAccounts(res.data)
      if (res.data.length > 0) setSelectedBank(res.data[0])
    }).catch(() => {})
  }, [])

  const selectedPlan = PLANS[plan]
  const effectiveKurs = rates ? rates.usdToIdr + selectedPlan.kursBonus : 0
  const estimatedIDR = amountUSD && rates ? (parseFloat(amountUSD) * effectiveKurs) : 0
  const totalReceive = estimatedIDR - selectedPlan.fee

  function copyText(text, field) {
    navigator.clipboard.writeText(text)
    setCopied(field)
    toast.success('Disalin!')
    setTimeout(() => setCopied(''), 2000)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!amountUSD || parseFloat(amountUSD) < 1) { toast.error('Minimal convert $1'); return }
    setLoading(true)
    try {
      await api.post('/transactions', {
        type: 'convert', amountUSD: parseFloat(amountUSD),
        amountIDR: estimatedIDR,
        paypalEmail, bankName: selectedBank?.bankName, bankAccount: selectedBank?.accountNumber, bankHolder: selectedBank?.accountHolder,
        plan, adminFee: selectedPlan.fee, totalReceive,
      })
      toast.success('Permintaan convert berhasil!')
      setAmountUSD(''); setPaypalEmail('')
    } catch (err) { toast.error(err.response?.data?.error || 'Gagal') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
              <FiRepeat size={20} className="text-white sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-white">Convert PayPal → IDR</h1>
              <p className="text-gray-500 text-xs sm:text-sm">Pilih paket dan tarik saldo</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4 sm:gap-6">
          <div className="space-y-4 sm:space-y-6 animate-slide-in-left">
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
              {Object.entries(PLANS).map(([key, p]) => {
                const Icon = p.icon
                const isSelected = plan === key
                return (
                  <button key={key} type="button" onClick={() => setPlan(key)}
                    className={`relative p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 text-left ${
                      isSelected ? `${p.borderColor} ${p.bgColor}` : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                    }`}>
                    {key === 'premium' && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[10px] font-bold rounded-full">POPULER</div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={20} className={isSelected ? p.textColor : 'text-gray-500'} />
                      <span className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-gray-400'}`}>{p.name}</span>
                    </div>
                    <p className={`text-2xl sm:text-3xl font-black mb-1 ${isSelected ? 'text-white' : 'text-gray-400'}`}>Rp {p.fee.toLocaleString('id-ID')}</p>
                    <p className={`text-xs ${isSelected ? p.textColor : 'text-gray-500'}`}>{p.desc}</p>
                    <ul className="mt-3 space-y-1.5">
                      {p.features.map((f, i) => (
                        <li key={i} className={`flex items-center gap-2 text-xs ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                          <FiCheck size={12} className={isSelected ? p.textColor : 'text-gray-600'} />{f}
                        </li>
                      ))}
                    </ul>
                  </button>
                )
              })}
            </div>

            {rates && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                <FiDollarSign className="text-blue-400 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-blue-300">Kurs: <span className="font-bold">1 USD = Rp {effectiveKurs?.toLocaleString('id-ID')}</span> {selectedPlan.kursBonus > 0 && <span className="text-green-400">(+{selectedPlan.kursBonus.toLocaleString('id-ID')})</span>}</p>
              </div>
            )}
          </div>

          <div className="animate-slide-in-right">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6 space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1.5">Jumlah (USD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-gray-500">$</span>
                    <input type="number" step="0.01" min="1" value={amountUSD} onChange={(e) => setAmountUSD(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                      placeholder="0.00" required />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Estimasi</p>
                    <p className="font-bold text-white text-sm">Rp {estimatedIDR.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Biaya</p>
                    <p className={`font-bold text-sm ${selectedPlan.textColor}`}>-Rp {selectedPlan.fee.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Terima</p>
                    <p className="font-black text-green-400 text-sm">Rp {totalReceive.toLocaleString('id-ID')}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1.5">Email PayPal</label>
                  <input type="email" value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    placeholder="paypal@email.com" required />
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6">
                <h3 className="font-bold text-white mb-2 text-sm">Rekening Tujuan</h3>
                <p className="text-xs text-gray-500 mb-4">Pilih rekening admin untuk menerima dana</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {bankAccounts.map((bank) => (
                    <button key={bank.id} type="button" onClick={() => setSelectedBank(bank)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedBank?.id === bank.id ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
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

              <button type="submit" disabled={loading}
                className={`w-full py-4 bg-gradient-to-r ${selectedPlan.color} text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300 disabled:opacity-50 text-sm flex items-center justify-center gap-2 active:scale-[0.98]`}>
                {loading ? 'Memproses...' : 'Ajukan Convert'}
                <FiArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
