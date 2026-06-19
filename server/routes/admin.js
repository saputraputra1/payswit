const express = require('express')
const admin = require('firebase-admin')
const authMiddleware = require('../middleware/auth')
const { adminOnly } = require('../middleware/auth')

module.exports = function (db) {
  const router = express.Router()
  const auth = authMiddleware(db)

  router.get('/stats', auth, adminOnly, async (req, res) => {
    try {
      const usersSnap = await db.collection('users').get()
      const txSnap = await db.collection('transactions').get()
      const pendingSnap = await db
        .collection('transactions')
        .where('status', '==', 'pending')
        .get()

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todaySnap = await db
        .collection('transactions')
        .where('status', '==', 'completed')
        .where('createdAt', '>=', today)
        .get()

      let todayVolume = 0
      todaySnap.docs.forEach((doc) => {
        todayVolume += doc.data().amountIDR || 0
      })

      const recentTxSnap = await db
        .collection('transactions')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get()

      const recentUsersSnap = await db
        .collection('users')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get()

      res.json({
        totalUsers: usersSnap.size,
        totalTransactions: txSnap.size,
        pendingTransactions: pendingSnap.size,
        todayVolume,
        recentTransactions: recentTxSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        recentUsers: recentUsersSnap.docs.map((d) => d.data()),
      })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  router.get('/transactions', auth, adminOnly, async (req, res) => {
    try {
      const snapshot = await db
        .collection('transactions')
        .orderBy('createdAt', 'desc')
        .limit(100)
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

  router.put('/transactions/:id', auth, adminOnly, async (req, res) => {
    try {
      const { status } = req.body
      if (!['completed', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Status tidak valid' })
      }

      const txRef = db.collection('transactions').doc(req.params.id)
      const txDoc = await txRef.get()

      if (!txDoc.exists) {
        return res.status(404).json({ error: 'Transaksi tidak ditemukan' })
      }

      const txData = txDoc.data()
      await txRef.update({
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      if (status === 'completed') {
        const userRef = db.collection('users').doc(txData.userId)
        const userDoc = await userRef.get()
        if (userDoc.exists) {
          const currentBalance = userDoc.data().balance || 0
          const newBalance =
            txData.type === 'convert'
              ? currentBalance + txData.amountIDR
              : currentBalance - txData.amountIDR
          await userRef.update({ balance: newBalance })
        }
      }

      res.json({ message: `Transaksi ${status}` })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  router.get('/users', auth, adminOnly, async (req, res) => {
    try {
      const snapshot = await db.collection('users').orderBy('createdAt', 'desc').get()
      const users = snapshot.docs.map((doc) => doc.data())
      res.json(users)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  router.put('/users/:uid', auth, adminOnly, async (req, res) => {
    try {
      const { status, role } = req.body
      const updateData = { updatedAt: admin.firestore.FieldValue.serverTimestamp() }

      if (status) updateData.status = status
      if (role) updateData.role = role

      await db.collection('users').doc(req.params.uid).update(updateData)
      res.json({ message: 'User berhasil diperbarui' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  router.put('/rates', auth, adminOnly, async (req, res) => {
    try {
      const { usdToIdr, fee } = req.body
      if (!usdToIdr || fee === undefined) {
        return res.status(400).json({ error: 'Data tidak lengkap' })
      }

      await db.collection('settings').doc('rates').set(
        { usdToIdr, fee, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      )
      res.json({ message: 'Kurs berhasil diperbarui' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  return router
}
