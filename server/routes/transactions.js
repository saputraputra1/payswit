const express = require('express')
const admin = require('firebase-admin')
const authMiddleware = require('../middleware/auth')

module.exports = function (db) {
  const router = express.Router()
  const auth = authMiddleware(db)

  router.get('/', auth, async (req, res) => {
    try {
      const snapshot = await db
        .collection('transactions')
        .where('userId', '==', req.user.uid)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get()

      const transactions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      res.json(transactions)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  router.post('/', auth, async (req, res) => {
    try {
      const { type, amountUSD, amountIDR, paypalEmail, bankName, bankAccount, bankHolder, paymentMethod, merchantName, merchantUrl, description, cardType, plan, adminFee, ccFee, totalUSD } = req.body

      if (!type) {
        return res.status(400).json({ error: 'Tipe transaksi wajib diisi' })
      }

      if (type === 'convert' && (!amountUSD || !paypalEmail || !bankName || !bankAccount || !bankHolder)) {
        return res.status(400).json({ error: 'Data convert tidak lengkap' })
      }

      if (type === 'topup' && (!amountIDR || !paypalEmail || !paymentMethod)) {
        return res.status(400).json({ error: 'Data top up tidak lengkap' })
      }

      if (type === 'credit_card' && (!amountUSD || !merchantName)) {
        return res.status(400).json({ error: 'Data CC tidak lengkap' })
      }

      const transaction = {
        userId: req.user.uid,
        userName: req.userData?.name || req.user.email,
        userEmail: req.user.email,
        type,
        amountUSD: amountUSD || 0,
        amountIDR: amountIDR || 0,
        paypalEmail: paypalEmail || null,
        bankName: bankName || null,
        bankAccount: bankAccount || null,
        bankHolder: bankHolder || null,
        paymentMethod: paymentMethod || null,
        merchantName: merchantName || null,
        merchantUrl: merchantUrl || null,
        description: description || null,
        cardType: cardType || null,
        plan: plan || null,
        adminFee: adminFee || 0,
        ccFee: ccFee || 0,
        totalUSD: totalUSD || 0,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }

      const docRef = await db.collection('transactions').add(transaction)
      res.status(201).json({ id: docRef.id, ...transaction })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  router.get('/:id', auth, async (req, res) => {
    try {
      const doc = await db.collection('transactions').doc(req.params.id).get()
      if (!doc.exists) {
        return res.status(404).json({ error: 'Transaksi tidak ditemukan' })
      }
      const data = doc.data()
      if (data.userId !== req.user.uid && req.userData?.role !== 'admin') {
        return res.status(403).json({ error: 'Akses ditolak' })
      }
      res.json({ id: doc.id, ...data })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  return router
}
