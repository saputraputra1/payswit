const express = require('express')
const admin = require('firebase-admin')
const authMiddleware = require('../middleware/auth')

module.exports = function (db) {
  const router = express.Router()
  const auth = authMiddleware(db)

  router.get('/me', auth, async (req, res) => {
    try {
      const userDoc = await db.collection('users').doc(req.user.uid).get()
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User tidak ditemukan' })
      }
      res.json(userDoc.data())
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  router.put('/profile', auth, async (req, res) => {
    try {
      const { name, phone } = req.body
      await db.collection('users').doc(req.user.uid).update({
        name,
        phone,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
      res.json({ message: 'Profil berhasil diperbarui' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  return router
}
