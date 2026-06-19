const express = require('express')
const admin = require('firebase-admin')
const authMiddleware = require('../middleware/auth')
const { adminOnly } = require('../middleware/auth')

/**
 * Normalisasi field transaksi agar konsisten di semua consumer
 * (admin panel, tracking, profile). Kompatibel dengan data lama.
 *
 * Skema kanonik:
 *  - amountUSD   : jumlah dalam USD
 *  - amountIDR   : jumlah dalam IDR
 *  - paypalEmail : email paypal pengirim/penerima
 *  - bankName, bankAccount, bankHolder : rekening bank user (untuk convert)
 *
 * Data lama yang ditangani:
 *  - convert (dulu): amount=USD, total=IDR, paypal_email
 *  - topup   (dulu): amount=IDR, total=USD
 *  - credit_card: sudah pakai amountUSD/amountIDR
 */
function normalizeTx(doc) {
  const d = doc.data ? doc.data() : doc
  const type = d.type
  let amountUSD = d.amountUSD
  let amountIDR = d.amountIDR

  if (type === 'convert') {
    if (amountUSD === undefined) amountUSD = d.amount
    if (amountIDR === undefined) amountIDR = d.total
  } else if (type === 'topup') {
    if (amountIDR === undefined) amountIDR = d.amount
    if (amountUSD === undefined) amountUSD = d.total
  } else if (type === 'credit_card') {
    if (amountUSD === undefined) amountUSD = d.amount
  }

  const num = (v) => (typeof v === 'number' ? v : typeof v === 'string' && v !== '' ? Number(v) : 0)

  return {
    id: doc.id,
    ...d,
    amountUSD: num(amountUSD),
    amountIDR: num(amountIDR),
    paypalEmail: d.paypalEmail || d.paypal_email || '',
    bankName: d.bankName || '',
    bankAccount: d.bankAccount || '',
    bankHolder: d.bankHolder || '',
    paymentMethod: d.paymentMethod || '',
    merchantName: d.merchantName || '',
    status: d.status || 'pending',
  }
}

// Factory route. Module ini mengekspos factory function sebagai default
// dan normalizeTx sebagai property (dipakai ulang di admin.js).
function transactionsRouter(db) {
  const router = express.Router()
  const auth = authMiddleware(db)

  router.get('/', auth, async (req, res) => {
    try {
      let query = db.collection('transactions')
      if (req.userData?.role !== 'admin') query = query.where('userId', '==', req.user.uid)
      query = query.orderBy('createdAt', 'desc')
      const snap = await query.get()
      res.json(snap.docs.map(normalizeTx))
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  router.get('/queue', auth, async (req, res) => {
    try {
      const snap = await db.collection('transactions').get()
      let pending = 0, processing = 0
      snap.forEach((doc) => {
        const d = doc.data()
        if (d.status === 'pending') pending++
        else if (d.status === 'processing') processing++
      })
      const total = pending + processing
      const avgMinutesPerTx = 15
      const estimatedMinutes = Math.min(total * avgMinutesPerTx, 120)
      res.json({ pending, processing, total, estimatedMinutes, avgMinutesPerTx })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // Menerima SEMUA field dari client (convert/topup/credit_card) dan disimpan apa adanya
  router.post('/', auth, async (req, res) => {
    try {
      const b = req.body || {}
      const type = b.type
      if (!type) return res.status(400).json({ error: 'type wajib diisi' })

      const profile = req.userData || {}
      const now = new Date().toISOString()

      // Kumpulkan semua field canonical + ekstra sesuai jenis transaksi
      const tx = {
        userId: req.user.uid,
        userName: profile.name || b.userName || '',
        userEmail: profile.email || b.userEmail || req.user.email || '',
        type,
        from_currency: b.from_currency || (type === 'convert' ? 'PAYPAL' : type === 'topup' ? 'IDR' : 'IDR'),
        to_currency: b.to_currency || (type === 'convert' ? 'IDR' : type === 'topup' ? 'PAYPAL' : 'USD'),

        // Field kanonik jumlah
        amountUSD: Number(b.amountUSD) || 0,
        amountIDR: Number(b.amountIDR) || 0,

        // Kompatibilitas legacy (agar tracking/dashboard lama tetap jalan)
        amount: Number(b.amount) || (type === 'convert' ? Number(b.amountUSD) : Number(b.amountIDR)) || 0,
        total: Number(b.total) || (type === 'convert' ? Number(b.amountIDR) : Number(b.amountUSD)) || 0,
        rate: Number(b.rate) || 0,

        // PayPal & bank
        paypalEmail: b.paypalEmail || b.paypal_email || profile.paypal_email || '',
        bankName: b.bankName || '',
        bankAccount: b.bankAccount || '',
        bankHolder: b.bankHolder || '',
        paymentMethod: b.paymentMethod || '',

        // Credit card extras
        merchantName: b.merchantName || '',
        merchantUrl: b.merchantUrl || '',
        description: b.description || '',
        cardType: b.cardType || '',
        plan: b.plan || '',
        adminFee: Number(b.adminFee) || 0,
        serviceFee: Number(b.serviceFee) || 0,
        totalFee: Number(b.totalFee) || 0,
        ccFee: Number(b.ccFee) || 0,
        totalUSD: Number(b.totalUSD) || 0,

        note: b.note || '',
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      }

      const ref = await db.collection('transactions').add(tx)
      res.json({ id: ref.id, success: true })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  router.put('/:id/status', auth, adminOnly, async (req, res) => {
    try {
      const { status, adminNote } = req.body
      if (!['pending', 'processing', 'success', 'failed', 'completed', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Status tidak valid' })
      }
      const updateData = { status, updatedAt: new Date().toISOString() }
      if (adminNote) updateData.adminNote = adminNote

      await db.collection('transactions').doc(req.params.id).update(updateData)

      if (status === 'success' || status === 'completed') {
        const txSnap = await db.collection('transactions').doc(req.params.id).get()
        const tx = txSnap.data()
        if (tx && tx.type === 'topup') {
          await db.collection('users').doc(tx.userId).update({
            balance: admin.firestore.FieldValue.increment(tx.total || tx.amountIDR || 0),
          })
        }
      }
      res.json({ success: true })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  return router
}

module.exports = transactionsRouter
module.exports.normalizeTx = normalizeTx
module.exports.default = transactionsRouter
