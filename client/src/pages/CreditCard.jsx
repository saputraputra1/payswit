import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { FiCreditCard, FiCheck, FiLock, FiGlobe, FiClock, FiShield, FiZap, FiStar, FiArrowRight, FiCopy } from 'react-icons/fi'
import { BankIcon } from '../components/Icons'

const PLANS = {
  standard: {
    name: 'Standard',
    fee: 15000,
    kursBonus: 0,
    icon: FiZap,
    color: 'from-blue-500 to-cyan-500',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    desc: 'Proses 1-24 jam',
  },
  premium: {
    name: 'Premium',
    fee: 20000,
    kursBonus: 1000,
    icon: FiStar,
    color: 'from-yellow-500 to-orange-500',
    borderColor: 'border-yellow-500',
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-400',
    desc: 'Proses 15-30 menit',
  },
}

export default function CreditCard() {
  const { user } = useAuth()
  const [merchantName, setMerchantName] = useState('')
  const [merchantUrl, setMerchantUrl] = useState('')
  const [amountUSD, setAmountUSD] = useState('')
  const [description, setDescription] = useState('')
  const [cardType, setCardType] = useState('visa')
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [plan, setPlan] = useState('standard')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [rates, setRates] = useState(null)
  const [bankAccounts, setBankAccounts] = useState([])
  const [selectedBank, setSelectedBank] = useState(null)
  const [copied, setCopied] = useState('')

  useEffect(() => {
    api.get('/rates').then((res) => setRates(res.data)).catch(() => {})
    api.get('/bank-accounts').then((res) => {
      setBankAccounts(res.data)
      if (res.data.length > 0) setSelectedBank(res.data[0])
    }).catch(() => {})
  }, [])

  function copyText(text, field) {
    navigator.clipboard.writeText(text)
    setCopied(field)
    toast.success('Disalin!')
    setTimeout(() => setCopied(''), 2000)
  }

  const selectedPlan = PLANS[plan]
  const effectiveKurs = rates ? rates.usdToIdr + selectedPlan.kursBonus : 0
  const ccFee = amountUSD ? (parseFloat(amountUSD) * 0.04) : 0
  const totalUSD = amountUSD ? (parseFloat(amountUSD) + ccFee) : 0
  const totalIDR = rates ? (totalUSD * effectiveKurs) + selectedPlan.fee : selectedPlan.fee

  async function handleSubmit(e) {
    e.preventDefault()
    if (!amountUSD || parseFloat(amountUSD) < 5) { toast.error('Minimal $5'); return }
    setLoading(true)
    try {
      await api.post('/transactions', {
        type: 'credit_card', amountUSD: parseFloat(amountUSD),
        amountIDR: totalIDR,
        merchantName, merchantUrl, description, cardType, paymentMethod,
        plan, adminFee: selectedPlan.fee,
        ccFee, totalUSD,
      })
      toast.success('Permintaan berhasil!')
      setSubmitted(true)
    } catch (err) { toast.error(err.response?.data?.error || 'Gagal') }
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className={`w-16 h-16 ${selectedPlan.bgColor} border ${selectedPlan.borderColor} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
            <FiCheck size={32} className={selectedPlan.textColor} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Terkirim!</h2>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${selectedPlan.bgColor} ${selectedPlan.textColor}`}>
            {plan === 'premium' ? <FiStar size={14} /> : <FiZap size={14} />}
            Paket {selectedPlan.name}
          </div>
          <p className="text-gray-400 mt-4 mb-6 text-sm">Pembayaran ke {merchantName} sedang diproses.</p>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6 mb-6 text-left space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Merchant</span><span className="text-white">{merchantName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Jumlah</span><span className="text-white">${amountUSD}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Biaya CC (4%)</span><span className="text-white">${ccFee.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Biaya Admin</span><span className={`font-medium ${selectedPlan.textColor}`}>Rp {selectedPlan.fee.toLocaleString('id-ID')}</span></div>
            <div className="flex justify-between pt-2 border-t border-white/[0.06]"><span className="text-gray-400 font-medium">Total</span><span className="text-white font-bold">Rp {totalIDR.toLocaleString('id-ID')}</span></div>
          </div>
          <button onClick={() => { setSubmitted(false); setAmountIDR(''); setMerchantName('') }}
            className="px-8 py-3 bg-white/[0.03] border border-white/10 text-white font-medium rounded-xl hover:bg-white/[0.06] transition-colors text-sm">
            Transaksi Baru
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 flex-shrink-0">
              <FiCreditCard size={20} className="text-white sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-white">Jasa Pembayaran CC</h1>
              <p className="text-gray-500 text-xs sm:text-sm">Pilih paket dan bayar merchant</p>
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
                  Rp {p.fee.toLocaleString('id-ID')}
                </p>
                <p className={`text-xs ${isSelected ? p.textColor : 'text-gray-500'}`}>{p.desc}</p>
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Merchant</label>
                <input type="text" value={merchantName} onChange={(e) => setMerchantName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm"
                  placeholder="Amazon, Netflix" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">URL Merchant <span className="text-gray-600">(opsional)</span></label>
                <input type="text" value={merchantUrl} onChange={(e) => setMerchantUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm"
                  placeholder="https://merchant.com (tidak wajib)" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Jumlah (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-gray-500">$</span>
                  <input type="number" step="0.01" min="5" value={amountUSD} onChange={(e) => setAmountUSD(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm"
                    placeholder="0.00" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Deskripsi</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none text-sm"
                  placeholder="Jelaskan item" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Tipe Kartu</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ id: 'visa', label: 'Visa', color: 'from-blue-600 to-blue-800' }, { id: 'mastercard', label: 'MC', color: 'from-orange-600 to-red-600' }, { id: 'amex', label: 'Amex', color: 'from-green-600 to-emerald-700' }].map((c) => (
                    <button key={c.id} type="button" onClick={() => setCardType(c.id)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${cardType === c.id ? 'border-orange-500 bg-orange-500/10' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'}`}>
                      <div className={`w-8 h-5 bg-gradient-to-br ${c.color} rounded-md mx-auto mb-1.5`} />
                      <p className="text-xs font-medium text-white">{c.label}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Bayar Pakai</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ id: 'bank_transfer', label: 'Bank' }, { id: 'ewallet', label: 'E-Wallet' }, { id: 'balance', label: 'Saldo' }].map((m) => (
                    <button key={m.id} type="button" onClick={() => setPaymentMethod(m.id)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${paymentMethod === m.id ? 'border-orange-500 bg-orange-500/10' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'}`}>
                      <p className="text-xs font-medium text-white">{m.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6">
              <h3 className="font-bold text-white mb-2 text-sm">Pilih Rekening Admin</h3>
              <p className="text-xs text-gray-500 mb-4">Transfer ke salah satu rekening admin di bawah ini</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {bankAccounts.map((bank) => (
                  <button key={bank.id} type="button" onClick={() => setSelectedBank(bank)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedBank?.id === bank.id ? 'border-orange-500 bg-orange-500/10' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
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
              {loading ? 'Memproses...' : 'Ajukan Pembayaran'}
              <FiArrowRight size={18} />
            </button>
          </form>

          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6">
              <h3 className="font-bold text-white mb-4 text-sm">Ringkasan</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Jumlah</span><span className="text-white">${amountUSD || '0'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Biaya CC (4%)</span><span className="text-white">${ccFee.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Total USD</span><span className="text-white">${totalUSD.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Kurs</span><span className="text-white">Rp {rates?.usdToIdr?.toLocaleString('id-ID') || '...'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Biaya {selectedPlan.name}</span><span className={`font-medium ${selectedPlan.textColor}`}>Rp {selectedPlan.fee.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between pt-3 border-t border-white/[0.06]"><span className="text-gray-400 font-medium">Total</span><span className="text-white font-bold">Rp {totalIDR.toLocaleString('id-ID')}</span></div>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6 space-y-3">
              <h3 className="font-bold text-white text-sm">Info</h3>
              {[{ icon: FiClock, text: selectedPlan.desc }, { icon: FiShield, text: 'Garansi uang kembali' }, { icon: FiGlobe, text: 'Merchant global' }, { icon: FiLock, text: 'Data terenkripsi' }].map((info, i) => {
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
