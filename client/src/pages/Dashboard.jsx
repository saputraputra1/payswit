import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Repeat, PlusCircle, ArrowUpDown, Clock, CheckCircle, XCircle, Wallet, Hourglass } from 'lucide-react';

export default function Dashboard() {
  const { profile } = useAuth();
  const [txs, setTxs] = useState([]);
  const [queue, setQueue] = useState(null);
  const [rate, setRate] = useState({ buy: 15000, sell: 14500 });

  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, 'transactions'), where('userId', '==', profile.id), orderBy('createdAt', 'desc'), limit(10));
    const unsub = onSnapshot(q, (snap) => setTxs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, [profile]);

  useEffect(() => {
    const fetch = () => api.get('/transactions/queue').then(({ data }) => setQueue(data)).catch(() => {});
    fetch();
    const t = setInterval(fetch, 15000);
    return () => clearInterval(t);
  }, []);

  const formatEstimate = (mins) => {
    if (mins >= 120) return '> 2 jam';
    if (mins >= 60) return `~${Math.round(mins / 60)} jam`;
    return `~${mins} menit`;
  };

  const hasPending = txs.some(t => t.status === 'pending' || t.status === 'processing');
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );

  const statusBadge = (s) => {
    const m = { pending: ['bg-yellow-100 text-yellow-700', '⏳'], success: ['bg-green-100 text-green-700', '✅'], failed: ['bg-red-100 text-red-700', '❌'] };
    const [c, i] = m[s] || ['bg-gray-100 text-gray-500', '❓'];
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c}`}>{i} {s}</span>;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {profile && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statCard('Saldo IDR', `Rp ${(profile.balance || 0).toLocaleString('id-ID')}`, <Wallet className="w-6 h-6 text-white" />, 'bg-primary-600')}
          {statCard('Kurs Beli (USD→IDR)', `Rp ${(rate.buy || 0).toLocaleString('id-ID')}`, <ArrowUpDown className="w-6 h-6 text-white" />, 'bg-green-600')}
          {statCard('Kurs Jual (IDR→USD)', `Rp ${(rate.sell || 0).toLocaleString('id-ID')}`, <ArrowUpDown className="w-6 h-6 text-white" />, 'bg-orange-600')}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/convert" className="card flex items-center gap-4 hover:shadow-md transition border-l-4 border-primary-500">
          <Repeat className="w-8 h-8 text-primary-600" />
          <div><h3 className="font-semibold">Convert PayPal → IDR</h3><p className="text-sm text-gray-500">Tukar saldo PayPal ke Rupiah</p></div>
        </Link>
        <Link to="/topup" className="card flex items-center gap-4 hover:shadow-md transition border-l-4 border-green-500">
          <PlusCircle className="w-8 h-8 text-green-600" />
          <div><h3 className="font-semibold">Top Up PayPal</h3><p className="text-sm text-gray-500">Isi saldo PayPal via bank</p></div>
        </Link>
      </div>

      {hasPending && queue && queue.total > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4 flex items-start gap-3">
          <Hourglass className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Antrian: {queue.total} transaksi (estimasi {formatEstimate(queue.estimatedMinutes)})</p>
            <p className="text-xs text-amber-600 mt-0.5">Proses berdasarkan urutan masuk, rata-rata {queue.avgMinutesPerTx} menit per transaksi</p>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Riwayat Transaksi</h2>
          {txs.length > 0 && <Link to="/profile" className="text-sm text-primary-600 hover:underline">Lihat semua</Link>}
        </div>
        {txs.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Clock className="w-10 h-10 mx-auto mb-2" />
            <p>Belum ada transaksi</p>
          </div>
        ) : (
          <div className="space-y-2">
            {txs.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{tx.type === 'convert' ? 'Convert PayPal → IDR' : 'Top Up PayPal'}</p>
                  <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString('id-ID')}</p>
                  {(tx.status === 'pending' || tx.status === 'processing') && queue && queue.total > 0 && (
                    <p className="text-xs text-amber-600 font-medium mt-0.5">Estimasi {formatEstimate(queue.estimatedMinutes)}</p>
                  )}
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="font-semibold">{tx.type === 'convert' ? `$${tx.amount}` : `Rp ${(tx.amount || 0).toLocaleString('id-ID')}`}</p>
                  {statusBadge(tx.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
