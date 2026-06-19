import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firebase';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiPlus, FiCopy, FiCheck, FiHome, FiWallet, FiClock } from 'react-icons/fi';

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
      const txRef = await addDoc(collection(db, 'transactions'), {
        userId: profile.id,
        userName: profile.name,
        type: 'topup',
        from_currency: 'IDR',
        to_currency: 'PAYPAL',
        amount: parseFloat(nominal),
        rate: rate.sell,
        total: usd,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setLastTx({ id: txRef.id, nominal: parseFloat(nominal), usd });
      api.get('/transactions/queue').then(({ data }) => setQueue(data)).catch(() => {});
      toast.success('Permintaan top-up berhasil dibuat!');
    } catch { toast.error('Gagal membuat permintaan'); }
    finally { setLoading(false); }
  };

  const copyText = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Top Up PayPal</h1>
        <p className="text-gray-500">Isi saldo PayPal menggunakan transfer bank Indonesia</p>
      </div>

      {!lastTx ? (
        <div className="card space-y-4">
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
            <p>Kurs jual saat ini: <strong>1 USD = Rp {rate.sell.toLocaleString('id-ID')}</strong></p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Pilih nominal</label>
            <div className="grid grid-cols-3 gap-2">
              {nominalList.map(n => (
                <button key={n} onClick={() => setNominal(n.toString())} className={`py-2.5 rounded-lg border text-sm font-medium transition ${nominal === n.toString() ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 hover:border-primary-300'}`}>
                  {n >= 1000000 ? `${n / 1000000}jt` : `${n / 1000}rb`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Atau masukkan nominal (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400 text-sm font-medium">Rp</span>
              <input type="number" className="input-field pl-10" placeholder="Minimal 50.000" value={nominal} onChange={e => setNominal(e.target.value)} min="50000" />
            </div>
          </div>

          {nominal > 0 && (
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-sm text-green-600">Kamu akan mendapatkan</p>
              <p className="text-3xl font-bold text-green-700">${usd.toFixed(2)} USD</p>
              <p className="text-xs text-green-600 mt-1">Saldo PayPal akan masuk setelah admin verifikasi</p>
            </div>
          )}

          <button onClick={handleTopup} disabled={loading || !nominal} className="btn-primary w-full flex items-center justify-center gap-2">
            <FiPlus className="w-4 h-4" /> {loading ? 'Memproses...' : 'Buat Permintaan Top Up'}
          </button>
        </div>
      ) : (
        <div className="card space-y-4">
          <div className="text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiCheck className="w-7 h-7 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-green-700">Permintaan Dibuat!</h2>
            <p className="text-sm text-gray-500 mt-1">Transfer ke rekening admin di bawah ini</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Transfer ke:</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Bank</p>
                  <p className="font-semibold">BCA</p>
                </div>
                <button onClick={() => copyText('BCA', 'bank')} className="text-primary-600 hover:text-primary-700">
                  {copied === 'bank' ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Nomor Rekening</p>
                  <p className="font-mono font-bold text-lg tracking-wider">1234567890</p>
                </div>
                <button onClick={() => copyText('1234567890', 'norek')} className="text-primary-600 hover:text-primary-700">
                  {copied === 'norek' ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                </button>
              </div>
              <div>
                <p className="text-xs text-gray-500">Atas Nama</p>
                <p className="font-semibold">PT PAYSWIT INDONESIA</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-3 text-xs text-yellow-700 space-y-1">
            <p className="font-medium">Petunjuk:</p>
            <ol className="list-decimal ml-4 space-y-0.5">
              <li>Transfer sejumlah <strong>Rp {lastTx.nominal.toLocaleString('id-ID')}</strong> ke rekening di atas</li>
              <li>Simpan bukti transfer</li>
              <li>Kirim bukti transfer via <strong>Chat CS</strong> di menu bawah</li>
              <li>Admin akan memverifikasi dan saldo PayPal akan masuk ke akun kamu</li>
            </ol>
          </div>

          {queue && queue.total > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-sm text-amber-800">
              <FiClock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Antrian: {queue.total} transaksi</p>
                <p className="text-xs text-amber-600">Estimasi diproses dalam ~{queue.estimatedMinutes} menit</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => { setLastTx(null); setNominal(''); }} className="btn-outline flex-1">Buat Lagi</button>
            <Link to={`/tracking/${lastTx.id}`} className="px-4 py-2.5 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/[0.08] transition-colors text-sm text-center">Lihat Tracking</Link>
            <a href="/chat" className="btn-primary flex-1 text-center flex items-center justify-center gap-1">
              <FiHome className="w-4 h-4" /> Chat CS
            </a>
          </div>
        </div>
      )}

      {profile && (
        <div className="card flex items-center gap-3">
          <FiWallet className="w-5 h-5 text-primary-600" />
          <div>
            <p className="text-xs text-gray-500">Saldo kamu</p>
            <p className="font-bold">${(profile.balance || 0).toFixed(2)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
