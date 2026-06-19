import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FiUser, FiMail, FiWallet, FiClock } from 'react-icons/fi';

export default function Profile() {
  const { profile } = useAuth();
  const [txs, setTxs] = useState([]);
  const [queue, setQueue] = useState(null);

  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, 'transactions'), where('userId', '==', profile.id), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => setTxs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, [profile]);

  useEffect(() => {
    api.get('/transactions/queue').then(({ data }) => setQueue(data)).catch(() => {});
  }, []);

  const formatEstimate = (mins) => {
    if (mins >= 120) return '> 2 jam';
    if (mins >= 60) return `~${Math.round(mins / 60)} jam`;
    return `~${mins} menit`;
  };

  const hasPending = txs.some(t => t.status === 'pending' || t.status === 'processing');

  const statusBadge = (s) => {
    const m = { pending: 'bg-yellow-100 text-yellow-700', success: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700' };
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m[s] || 'bg-gray-100 text-gray-500'}`}>{s}</span>;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Profil Saya</h1>

      <div className="card space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center"><FiUser className="w-6 h-6 text-primary-600" /></div>
          <div>
            <p className="font-semibold text-lg">{profile?.name || 'User'}</p>
            <p className="text-sm text-gray-500 flex items-center gap-1"><FiMail className="w-3 h-3" /> {profile?.email}</p>
          </div>
        </div>
        <div className="bg-primary-50 rounded-lg p-4">
          <p className="text-sm text-primary-600">Saldo IDR</p>
          <p className="text-2xl font-bold text-primary-700">Rp {(profile?.balance || 0).toLocaleString('id-ID')}</p>
        </div>
      </div>

      {hasPending && queue && queue.total > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4 flex items-start gap-3">
          <FiClock className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Antrian: {queue.total} transaksi (estimasi {formatEstimate(queue.estimatedMinutes)})</p>
            <p className="text-xs text-amber-600 mt-0.5">Rata-rata {queue.avgMinutesPerTx} menit per transaksi</p>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><FiClock className="w-4 h-4" /> Semua Transaksi</h2>
        {txs.length === 0 ? (
          <p className="text-center py-6 text-gray-400">Belum ada transaksi</p>
        ) : (
          <div className="space-y-2">
            {txs.map(tx => (
              <Link key={tx.id} to={`/tracking/${tx.id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{tx.type === 'convert' ? `Convert $${tx.amount} → IDR` : `Top Up $${tx.total?.toFixed(2) || ''}`}</p>
                  <p className="text-xs text-gray-500">{tx.createdAt ? new Date(tx.createdAt).toLocaleString('id-ID') : '-'}</p>
                  {(tx.status === 'pending' || tx.status === 'processing') && queue && queue.total > 0 && (
                    <p className="text-xs text-amber-600 font-medium mt-0.5">Estimasi {formatEstimate(queue.estimatedMinutes)}</p>
                  )}
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-semibold">{tx.type === 'convert' ? `Rp ${(tx.total || 0).toLocaleString('id-ID')}` : `Rp ${(tx.amount || 0).toLocaleString('id-ID')}`}</p>
                  {statusBadge(tx.status)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
