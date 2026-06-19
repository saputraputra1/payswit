import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../services/firebase';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiPlus, FiCopy, FiCheck, FiClock, FiInfo, FiArrowRight, FiCreditCard } from 'react-icons/fi';

const nominalList = [100000, 250000, 500000, 1000000, 2500000, 5000000];

export default function Topup() {
  const { profile } = useAuth();
  const [nominal, setNominal] = useState('');
  const [rate, setRate] = useState({ sell: 15000 });
  const [loading, setLoading] = useState(false);
  const [lastTx, setLastTx] = useState(null);
  const [queue, setQueue] = useState(null);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, 'rates'));
      const r = snap.docs[0]?.data();
      if (r) setRate(r);
    })();
  }, []);

  const usd = nominal ? parseFloat(nominal) / rate.sell : 0;

  const handleTopup = async () => {
    if (!nominal || parseFloat(nominal) < 50000) return toast.error('Minimal Rp 50.000');
    setLoading(true);
    try {
      const idrNum = parseFloat(nominal);
      const usdNum = idrNum / rate.sell;
      const { data } = await api.post('/transactions', {
        type: 'topup',
        amountIDR: idrNum,
        amountUSD: usdNum,
        rate: rate.sell,
        paymentMethod: 'bank_transfer',
      });
      setLastTx({ id: data?.id, nominal: idrNum, usd: usdNum });
      api.get('/transactions/queue').then(({ data }) => setQueue(data)).catch(() => {});
      toast.success('Permintaan top-up berhasil dibuat!');
    } catch (e) {
      toast.error('Gagal membuat permintaan: ' + (e.response?.data?.error || ''));
    }
    finally { setLoading(false); }
  };

  const copyText = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
          <FiPlus className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Top Up PayPal</h1>
          <p className="text-sm text-gray-500">Isi saldo PayPal menggunakan transfer bank</p>
        </div>
      </div>

      {!lastTx ? (
        <div className="card space-y-5">
          {/* Rate Badge */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/5 border border-green-500/10">
            <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <FiInfo className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-green-400/70 font-medium">Kurs jual saat ini</p>
              <p className="text-sm font-bold text-green-400">1 USD = Rp {rate.sell.toLocaleString('id-ID')}</p>
            </div>
          </div>

          {/* Nominal Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">Pilih nominal</label>
            <div className="grid grid-cols-3 gap-2">
              {nominalList.map(n => (
                <button
                  key={n}
                  onClick={() => setNominal(n.toString())}
                  className={`py-3 rounded-xl border text-sm font-semibold transition-all ${
                    nominal === n.toString()
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-500 shadow-lg shadow-green-500/20'
                      : 'border-white/[0.08] text-gray-300 hover:border-green-500/30 hover:bg-green-500/5'
                  }`}
                >
                  {n >= 1000000 ? `${n / 1000000}jt` : `${n / 1000}rb`}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Atau masukkan nominal (Rp)</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <span className="text-gray-400 text-sm font-bold">Rp</span>
              </div>
              <input
                type="number"
                className="input-field pl-14 text-lg font-semibold"
                placeholder="50.000"
                value={nominal}
                onChange={e => setNominal(e.target.value)}
                min="50000"
              />
            </div>
            <p className="text-xs text-gray-500">Minimal Rp 50.000</p>
          </div>

          {/* Conversion Result */}
          {nominal > 0 && (
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/15 p-5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <FiArrowRight className="w-4 h-4 text-blue-400" />
                  <p className="text-xs text-blue-400/80 font-medium uppercase tracking-wider">Kamu akan mendapatkan</p>
                </div>
                <p className="text-3xl font-black text-blue-400">
                  ${usd.toFixed(2)} USD
                </p>
                <p className="text-xs text-blue-400/60 mt-2">
                  Saldo PayPal akan masuk setelah admin verifikasi
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleTopup}
            disabled={loading || !nominal}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
          >
            <FiPlus className="w-4 h-4" />
            {loading ? 'Memproses...' : 'Buat Permintaan Top Up'}
          </button>
        </div>
      ) : (
        <div className="card space-y-5">
          {/* Success Header */}
          <div className="text-center py-2">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
              <FiCheck className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Permintaan Dibuat!</h2>
            <p className="text-sm text-gray-500 mt-1">Transfer ke rekening admin di bawah ini</p>
          </div>

          {/* Bank Info */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 space-y-4">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Transfer ke</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Bank</p>
                  <p className="font-semibold text-white">BCA</p>
                </div>
                <button
                  onClick={() => copyText('BCA', 'bank')}
                  className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 hover:bg-blue-500/20 transition-colors"
                >
                  {copied === 'bank' ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                </button>
              </div>
              <div className="h-px bg-white/[0.06]" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Nomor Rekening</p>
                  <p className="font-mono font-bold text-lg text-white tracking-wider">1234567890</p>
                </div>
                <button
                  onClick={() => copyText('1234567890', 'norek')}
                  className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 hover:bg-blue-500/20 transition-colors"
                >
                  {copied === 'norek' ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                </button>
              </div>
              <div className="h-px bg-white/[0.06]" />
              <div>
                <p className="text-xs text-gray-500">Atas Nama</p>
                <p className="font-semibold text-white">PT PAYSWIT INDONESIA</p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-4 space-y-2">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Petunjuk</p>
            <ol className="list-decimal ml-4 space-y-1.5 text-sm text-amber-200/80">
              <li>Transfer sejumlah <strong className="text-amber-300">Rp {lastTx.nominal.toLocaleString('id-ID')}</strong> ke rekening di atas</li>
              <li>Simpan bukti transfer</li>
              <li>Kirim bukti transfer via <strong className="text-amber-300">Chat CS</strong> di menu bawah</li>
              <li>Admin akan memverifikasi dan saldo PayPal akan masuk ke akun kamu</li>
            </ol>
          </div>

          {/* Queue Info */}
          {queue && queue.total > 0 && (
            <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-3 flex items-start gap-3">
              <FiClock className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-300">Antrian: {queue.total} transaksi</p>
                <p className="text-xs text-amber-400/60">Estimasi diproses dalam ~{queue.estimatedMinutes} menit</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => { setLastTx(null); setNominal(''); }} className="btn-outline text-center text-xs py-3">Buat Lagi</button>
            <Link to={`/tracking/${lastTx.id}`} className="px-3 py-3 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/[0.08] transition-colors text-xs text-center">Tracking</Link>
            <a href="/chat" className="btn-primary text-center text-xs py-3">Chat CS</a>
          </div>
        </div>
      )}

      {/* Balance Card */}
      {profile && (
        <div className="card flex items-center gap-4">
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
  );
}
