const admin = require('firebase-admin')

module.exports = function authMiddleware(db) {
  return async (req, res, next) => {
    const token = req.headers.authorization?.split('Bearer ')[1]
    if (!token) {
      return res.status(401).json({ error: 'Token tidak ditemukan' })
    }
    try {
      const decoded = await admin.auth().verifyIdToken(token)
      req.user = decoded
      const userDoc = await db.collection('users').doc(decoded.uid).get()
      if (userDoc.exists) {
        req.userData = userDoc.data()
      }
      next()
    } catch (err) {
      return res.status(401).json({ error: 'Token tidak valid' })
    }
  }
}

module.exports.adminOnly = function adminOnly(req, res, next) {
  if (req.userData?.role !== 'admin') {
    return res.status(403).json({ error: 'Akses ditolak. Hanya admin.' })
  }
  next()
}
