const express = require('express')

module.exports = function (db) {
  const router = express.Router()

  router.get('/', async (req, res) => {
    try {
      const doc = await db.collection('settings').doc('rates').get()
      if (!doc.exists) {
        const defaultRates = { usdToIdr: 16000, fee: 0.02 }
        await db.collection('settings').doc('rates').set(defaultRates)
        return res.json(defaultRates)
      }
      res.json(doc.data())
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  return router
}
