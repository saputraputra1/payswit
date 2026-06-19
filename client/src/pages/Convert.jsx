import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Repeat, Send, DollarSign, Check, Copy, Hourglass } from 'lucide-react';

export default function Convert() {
  const { profile } = useAuth();
  const [usd, setUsd] = useState('');
  const [rate, setRate] = useState({ buy: 15500 });
  const [paypalEmail, setPaypalEmail] = useState('');
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
    setLoading(true);
    try {
      const txRef = await addDoc(collection(db, 'transactions'), {
        userId: profile.id,
        userName: profile.name,
        type: 'convert',
        from_currency: 'PAYPAL',
        to_currency: 'IDR',
        amount: parseFloat(usd),
        rate: rate.buy,
        total: idr,
        paypal_email: paypalEmail || profile?.paypal_email,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setLastTx({ id: txRef.id, usd: parseFloat(usd), idr, adminPaypal: rate.adminPaypalEmail || 'admin@payswit.com' });
      api.get('/transactions/queue').then(({ data }) => setQueue(data)).catch(() => {});
      toast.success('Permintaan convert terkirim!');
      setUsd('');
    } catch { toast.error('Gagal kirim permintaan'); }
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
        <h1 className="text-2xl font-bold">Convert PayPal → IDR</h1>
        <p className="text-gray-500">Tukar saldo PayPal kamu ke Rupiah</p>
      </div>

      {!lastTx ? (
        <div className="card space-y-4">
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
            Kurs beli saat ini: <strong>1 USD = Rp {rate.buy.toLocaleString('id-ID')}</strong>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Jumlah USD yang ingin ditukar</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input type="number" className="input-field pl-10" placeholder="Minimal $1" value={usd} onChange={e => setUsd(e.target.value)} min="1" step="0.01" />
            </div>
          </div>

          {usd > 0 && (
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-sm text-green-600">Kamu akan menerima</p>
              <p className="text-3xl font-bold text-green-700">Rp {idr.toLocaleString('id-ID', { minimumFractionDigits: 0 })}</p>
              <p className="text-xs text-green-600 mt-1">Ditransfer ke rekening bank kamu setelah admin verifikasi</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email PayPal pengirim</label>
            <input type="email" className="input-field" placeholder="paypal@email.com" value={paypalEmail} onChange={e => setPaypalEmail(e.target.value)} />
            <p className="text-xs text-gray-400 mt-1">Email ini akan digunakan admin untuk verifikasi</p>
          </div>

          <button onClick={handleConvert} disabled={loading || !usd} className="btn-primary w-full flex items-center justify-center gap-2">
            <Send className="w-4 h-4" /> {loading ? 'Memproses...' : 'Kirim Permintaan Convert'}
          </button>
        </div>
      ) : (
        <div className="card space-y-4">
          <div className="text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-7 h-7 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-green-700">Permintaan Dibuat!</h2>
            <p className="text-sm text-gray-500 mt-1">Kirim PayPal ke akun admin berikut</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Kirim PayPal ke:</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Email PayPal Admin</p>
                  <p className="font-mono font-bold text-lg">{lastTx.adminPaypal}</p>
                </div>
                <button onClick={() => copyText(lastTx.adminPaypal, 'paypal')} className="text-primary-600 hover:text-primary-700">
                  {copied === 'paypal' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div>
                <p className="text-xs text-gray-500">Jumlah yang dikirim</p>
                <p className="font-bold text-lg text-primary-700">${lastTx.usd.toFixed(2)} USD</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-3 text-xs text-yellow-700 space-y-1">
            <p className="font-medium">Petunjuk:</p>
            <ol className="list-decimal ml-4 space-y-0.5">
              <li>Kirim <strong>${lastTx.usd.toFixed(2)}</strong> dari PayPal kamu ke email di atas</li>
              <li>Simpan bukti pengiriman PayPal</li>
              <li>Kirim bukti via <strong>Chat CS</strong></li>
              <li>Admin akan memverifikasi dan mengirim Rp {lastTx.idr.toLocaleString('id-ID')} ke rekening bank kamu</li>
            </ol>
          </div>

          {queue && queue.total > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-sm text-amber-800">
              <Hourglass className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Antrian: {queue.total} transaksi</p>
                <p className="text-xs text-amber-600">Estimasi diproses dalam ~{queue.estimatedMinutes} menit</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => setLastTx(null)} className="btn-outline flex-1">Convert Lagi</button>
            <a href="/chat" className="btn-primary flex-1 text-center">Chat CS</a>
          </div>
        </div>
      )}
    </div>
  );
}
