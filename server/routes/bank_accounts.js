const express = require('express')
const admin = require('firebase-admin')
const authMiddleware = require('../middleware/auth')

module.exports = function (db) {
  const router = express.Router()
  const auth = authMiddleware(db)

  router.get('/', async (req, res) => {
    try {
      const snap = await db.collection('bank_accounts').where('active', '==', true).get()
      const accounts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      res.json(accounts)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  router.post('/', auth, async (req, res) => {
    try {
      if (req.userData?.role !== 'admin') {
        return res.status(403).json({ error: 'Akses ditolak' })
      }
      const { bankName, accountNumber, accountHolder, logo } = req.body
      const docRef = await db.collection('bank_accounts').add({
        bankName, accountNumber, accountHolder, logo: logo || bankName.toLowerCase(),
        active: true, createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })
      res.status(201).json({ id: docRef.id, bankName, accountNumber, accountHolder })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  router.put('/:id', auth, async (req, res) => {
    try {
      if (req.userData?.role !== 'admin') {
        return res.status(403).json({ error: 'Akses ditolak' })
      }
      await db.collection('bank_accounts').doc(req.params.id).update({
        ...req.body, updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
      res.json({ message: 'Rekening diperbarui' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  router.delete('/:id', auth, async (req, res) => {
    try {
      if (req.userData?.role !== 'admin') {
        return res.status(403).json({ error: 'Akses ditolak' })
      }
      await db.collection('bank_accounts').doc(req.params.id).update({
        active: false, updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
      res.json({ message: 'Rekening dinonaktifkan' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  return router
}
