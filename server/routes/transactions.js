import { Router } from 'express';
import { db, auth } from '../index.js';
import admin from 'firebase-admin';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, async (req, res) => {
  let query = db.collection('transactions');
  if (req.profile.role !== 'admin') query = query.where('userId', '==', req.user.uid);
  query = query.orderBy('createdAt', 'desc');
  const snap = await query.get();
  res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
});

router.get('/queue', verifyToken, async (req, res) => {
  const snap = await db.collection('transactions').get();
  let pending = 0, processing = 0;
  snap.forEach(doc => {
    const d = doc.data();
    if (d.status === 'pending') pending++;
    else if (d.status === 'processing') processing++;
  });
  const total = pending + processing;
  const avgMinutesPerTx = 15;
  const estimatedMinutes = Math.min(total * avgMinutesPerTx, 120);
  res.json({ pending, processing, total, estimatedMinutes, avgMinutesPerTx });
});

router.post('/', verifyToken, async (req, res) => {
  const { type, amount, rate, total, paypal_email, note } = req.body;
  if (!type || !amount) return res.status(400).json({ error: 'type and amount required' });
  const tx = await db.collection('transactions').add({
    userId: req.user.uid,
    userName: req.profile.name,
    type,
    from_currency: type === 'convert' ? 'PAYPAL' : 'IDR',
    to_currency: type === 'convert' ? 'IDR' : 'PAYPAL',
    amount,
    rate: rate || 0,
    total: total || 0,
    paypal_email: paypal_email || req.profile.paypal_email || '',
    note: note || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  res.json({ id: tx.id, success: true });
});

router.put('/:id/status', verifyToken, verifyAdmin, async (req, res) => {
  const { status, adminNote } = req.body;
  if (!['pending', 'processing', 'success', 'failed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const updateData = { status, updatedAt: new Date().toISOString() };
  if (adminNote) updateData.adminNote = adminNote;

  await db.collection('transactions').doc(req.params.id).update(updateData);

  if (status === 'success') {
    const txSnap = await db.collection('transactions').doc(req.params.id).get();
    const tx = txSnap.data();
    if (tx && tx.type === 'topup') {
      await db.collection('users').doc(tx.userId).update({
        balance: admin.firestore.FieldValue.increment(tx.total || 0)
      });
    }
  }

  res.json({ success: true });
});

export default router;
