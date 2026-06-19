import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../services/firebase';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiRepeat, FiSend, FiDollarSign, FiCheck, FiCopy, FiArrowRight, FiInfo, FiClock } from 'react-icons/fi';

export default function Convert() {
  const { profile } = useAuth();
  const [usd, setUsd] = useState('');
  const [rate, setRate] = useState({ buy: 15500 });
  const [paypalEmail, setPaypalEmail] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankHolder, setBankHolder] = useState('');
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

  const idr = usd ? parseFloat(usd) * rate.buy : 0;

  const handleConvert = async () => {
    if (!usd || parseFloat(usd) < 1) return toast.error('Minimal $1');
    if (!paypalEmail && !profile?.paypal_email) return toast.error('Masukkan email PayPal kamu');
    if (!bankName || !bankAccount || !bankHolder) return toast.error('Lengkapi data rekening bank penerima');
    setLoading(true);
    try {
      const usdNum = parseFloat(usd);
      const idrNum = usdNum * rate.buy;
      const { data } = await api.post('/transactions', {
        type: 'convert',
        amountUSD: usdNum,
        amountIDR: idrNum,
        rate: rate.buy,
        paypalEmail: paypalEmail || profile?.paypal_email,
        bankName,
        bankAccount,
        bankHolder,
      });
      const txId = data?.id;
      setLastTx({
        id: txId,
        usd: usdNum,
        idr: idrNum,
        adminPaypal: rate.adminPaypalEmail || 'admin@payswit.com'
      });
      api.get('/transactions/queue').then(({ data }) => setQueue(data)).catch(() => {});
      toast.success('Permintaan convert terkirim!');
      setUsd('');
      setBankName(''); setBankAccount(''); setBankHolder('');
    } catch (e) {
      toast.error('Gagal kirim permintaan: ' + (e.response?.data?.error || ''));
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
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <FiRepeat className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Convert PayPal → IDR</h1>
          <p className="text-sm text-gray-500">Tukar saldo PayPal kamu ke Rupiah</p>
        </div>
      </div>

      {!lastTx ? (
        <div className="card space-y-5">
          {/* Rate Badge */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <FiInfo className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-blue-400/70 font-medium">Kurs beli saat ini</p>
              <p className="text-sm font-bold text-blue-400">1 USD = Rp {rate.buy.toLocaleString('id-ID')}</p>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Jumlah USD yang ingin ditukar</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <FiDollarSign className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400 text-sm font-medium">USD</span>
              </div>
              <input
                type="number"
                className="input-field pl-20 text-lg font-semibold"
                placeholder="0.00"
                value={usd}
                onChange={e => setUsd(e.target.value)}
                min="1"
                step="0.01"
              />
            </div>
            <p className="text-xs text-gray-500">Minimal $1.00</p>
          </div>

          {/* Conversion Result */}
          {usd > 0 && (
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/15 p-5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <FiArrowRight className="w-4 h-4 text-green-400" />
                  <p className="text-xs text-green-400/80 font-medium uppercase tracking-wider">Kamu akan menerima</p>
                </div>
                <p className="text-3xl font-black text-green-400">
                  Rp {idr.toLocaleString('id-ID', { minimumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-green-400/60 mt-2">
                  Ditransfer ke rekening bank kamu setelah admin verifikasi
                </p>
              </div>
            </div>
          )}

          {/* PayPal Email */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Email PayPal pengirim</label>
            <input
              type="email"
              className="input-field"
              placeholder="paypal@email.com"
              value={paypalEmail}
              onChange={e => setPaypalEmail(e.target.value)}
            />
            <p className="text-xs text-gray-500">Email ini akan digunakan admin untuk verifikasi</p>
          </div>

          {/* Bank Account (penerima) */}
          <div className="space-y-3 rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
            <p className="text-xs font-semibold text-gray-300">Rekening bank penerima (IDR)</p>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-400">Nama Bank</label>
              <input
                type="text"
                className="input-field"
                placeholder="BCA / Mandiri / BNI / BRI ..."
                value={bankName}
                onChange={e => setBankName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-400">Nomor Rekening</label>
              <input
                type="text"
                inputMode="numeric"
                className="input-field"
                placeholder="1234567890"
                value={bankAccount}
                onChange={e => setBankAccount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-400">Atas Nama</label>
              <input
                type="text"
                className="input-field"
                placeholder="Nama sesuai buku tabungan"
                value={bankHolder}
                onChange={e => setBankHolder(e.target.value)}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleConvert}
            disabled={loading || !usd}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
          >
            <FiSend className="w-4 h-4" />
            {loading ? 'Memproses...' : 'Kirim Permintaan Convert'}
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
            <p className="text-sm text-gray-500 mt-1">Kirim PayPal ke akun admin berikut</p>
          </div>

          {/* Admin PayPal Info */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 space-y-4">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Kirim PayPal ke</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Email PayPal Admin</p>
                  <p className="font-mono font-bold text-lg text-white">{lastTx.adminPaypal}</p>
                </div>
                <button
                  onClick={() => copyText(lastTx.adminPaypal, 'paypal')}
                  className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 hover:bg-blue-500/20 transition-colors"
                >
                  {copied === 'paypal' ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                </button>
              </div>
              <div className="h-px bg-white/[0.06]" />
              <div>
                <p className="text-xs text-gray-500">Jumlah yang dikirim</p>
                <p className="font-bold text-lg text-blue-400">${lastTx.usd.toFixed(2)} USD</p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-4 space-y-2">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Petunjuk</p>
            <ol className="list-decimal ml-4 space-y-1.5 text-sm text-amber-200/80">
              <li>Kirim <strong className="text-amber-300">${lastTx.usd.toFixed(2)}</strong> dari PayPal kamu ke email di atas</li>
              <li>Simpan bukti pengiriman PayPal</li>
              <li>Kirim bukti via <strong className="text-amber-300">Chat CS</strong></li>
              <li>Admin akan memverifikasi dan mengirim Rp {lastTx.idr.toLocaleString('id-ID')} ke rekening bank kamu</li>
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
            <button onClick={() => setLastTx(null)} className="btn-outline text-center text-xs py-3">Convert Lagi</button>
            <Link to={`/tracking/${lastTx.id}`} className="px-3 py-3 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/[0.08] transition-colors text-xs text-center">Tracking</Link>
            <a href="/chat" className="btn-primary text-center text-xs py-3">Chat CS</a>
          </div>
        </div>
      )}
    </div>
  );
}
