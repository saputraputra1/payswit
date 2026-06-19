const express = require('express')
const authMiddleware = require('../middleware/auth')

module.exports = function () {
  const router = express.Router()

  router.post('/upload', async (req, res) => {
    try {
      const { image } = req.body
      if (!image) {
        return res.status(400).json({ error: 'Image required' })
      }

      const API_KEY = process.env.IMGBB_API_KEY || '5068538056696953c7738c0499cb062d'
      const params = new URLSearchParams()
      params.append('key', API_KEY)
      params.append('image', image)

      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: params,
      })

      const data = await response.json()

      if (data.success) {
        res.json({ url: data.data.url })
      } else {
        res.status(400).json({ error: 'Upload failed: ' + (data.error?.message || 'unknown') })
      }
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  return router
}
