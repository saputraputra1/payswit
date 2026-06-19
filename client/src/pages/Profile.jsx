import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FiUser, FiMail, FiDollarSign, FiClock, FiSend, FiPlus, FiArrowRight } from 'react-icons/fi';

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
    const m = {
      pending: ['text-yellow-400 bg-yellow-500/10 border-yellow-500/20', 'Menunggu'],
      processing: ['text-blue-400 bg-blue-500/10 border-blue-500/20', 'Diproses'],
      success: ['text-green-400 bg-green-500/10 border-green-500/20', 'Selesai'],
      completed: ['text-green-400 bg-green-500/10 border-green-500/20', 'Selesai'],
      failed: ['text-red-400 bg-red-500/10 border-red-500/20', 'Gagal'],
    };
    const [c, label] = m[s] || ['text-gray-500 bg-gray-500/10 border-gray-500/20', s];
    return <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border ${c}`}>{label}</span>;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-white">Profil Saya</h1>

      {/* Profile Info Card */}
      <div className="card space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <FiUser className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg text-white truncate">{profile?.name || 'User'}</p>
            <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
              <FiMail className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{profile?.email}</span>
            </p>
          </div>
        </div>

        {/* Balance */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <FiDollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-blue-100">Saldo IDR</p>
              <p className="text-2xl font-black text-white">Rp {(profile?.balance || 0).toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Queue Warning */}
      {hasPending && queue && queue.total > 0 && (
        <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <FiClock className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-300">Antrian: {queue.total} transaksi</p>
            <p className="text-xs text-amber-400/60">Estimasi {formatEstimate(queue.estimatedMinutes)} • Rata-rata {queue.avgMinutesPerTx} menit/transaksi</p>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
          <FiClock className="w-4 h-4 text-gray-400" />
          <h2 className="font-bold text-white">Semua Transaksi</h2>
        </div>

        {txs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
              <FiClock className="w-6 h-6 text-gray-600" />
            </div>
            <p className="text-sm text-gray-500">Belum ada transaksi</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {txs.map(tx => (
              <Link
                key={tx.id}
                to={`/tracking/${tx.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    tx.type === 'convert' ? 'bg-blue-500/10' : tx.type === 'topup' ? 'bg-green-500/10' : 'bg-orange-500/10'
                  }`}>
                    {tx.type === 'convert'
                      ? <FiSend className="w-4 h-4 text-blue-400" />
                      : tx.type === 'topup'
                        ? <FiPlus className="w-4 h-4 text-green-400" />
                        : <FiArrowRight className="w-4 h-4 text-orange-400" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-white truncate">
                      {tx.type === 'convert' ? `Convert $${tx.amount} → IDR` : tx.type === 'topup' ? `Top Up $${tx.total?.toFixed(2) || ''}` : 'Jasa CC'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </p>
                    {(tx.status === 'pending' || tx.status === 'processing') && queue && queue.total > 0 && (
                      <p className="text-xs text-amber-400 font-medium mt-0.5">~{formatEstimate(queue.estimatedMinutes)}</p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="font-bold text-white text-sm">
                    {tx.type === 'convert' ? `Rp ${(tx.total || 0).toLocaleString('id-ID')}` : `Rp ${(tx.amount || 0).toLocaleString('id-ID')}`}
                  </p>
                  <div className="mt-1">
                    {statusBadge(tx.status)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}