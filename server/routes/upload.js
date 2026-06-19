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

      const params = new URLSearchParams()
      params.append('key', '15a5589618c85266bea80ce880176878')
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
