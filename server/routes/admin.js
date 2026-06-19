const express = require('express')
const admin = require('firebase-admin')
const authMiddleware = require('../middleware/auth')
const { adminOnly } = require('../middleware/auth')
const { normalizeTx } = require('./transactions')

module.exports = function (db) {
  const router = express.Router()
  const auth = authMiddleware(db)

  router.get('/stats', auth, adminOnly, async (req, res) => {
    try {
      // Ambil semua users & transaksi sekali, hitung statistik in-memory
      // (menghindari multiple .where() yang butuh composite index Firestore)
      const [usersSnap, txSnap] = await Promise.all([
        db.collection('users').get(),
        db.collection('transactions').get(),
      ])

      // Helper konversi createdAt (bisa Timestamp Firestore atau ISO string)
      const toDate = (v) => {
        if (!v) return new Date(0)
        if (typeof v.toDate === 'function') {
          try { return v.toDate() } catch { return new Date(0) }
        }
        const d = new Date(v)
        return isNaN(d.getTime()) ? new Date(0) : d
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const allTx = txSnap.docs.map((d) => normalizeTx(d))
      let pending = 0
      let completed = 0
      let todayVolume = 0
      allTx.forEach((d) => {
        if (d.status === 'pending' || d.status === 'processing') {
          pending++
        } else if (d.status === 'completed' || d.status === 'success') {
          completed++
          if (toDate(d.createdAt) >= today) todayVolume += d.amountIDR || 0
        }
      })

      // Urutkan transaksi terbaru (createdAt desc)
      allTx.sort((a, b) => toDate(b.createdAt) - toDate(a.createdAt))
      const recentTransactions = allTx.slice(0, 6)

      // User baru hari ini + user terbaru
      const allUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
      let newUsersToday = 0
      allUsers.forEach((d) => {
        if (toDate(d.createdAt) >= today) newUsersToday++
      })
      allUsers.sort((a, b) => toDate(b.createdAt) - toDate(a.createdAt))
      const recentUsers = allUsers.slice(0, 6)

      res.json({
        totalUsers: usersSnap.size,
        totalTransactions: txSnap.size,
        pendingTransactions: pending,
        completedTransactions: completed,
        newUsersToday,
        todayVolume,
        recentTransactions,
        recentUsers,
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
      const transactions = snapshot.docs.map((doc) => normalizeTx(doc))
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
