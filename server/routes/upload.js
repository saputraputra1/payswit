const express = require('express')
const fs = require('fs')
const path = require('path')

module.exports = function () {
  const router = express.Router()
  const UPLOAD_DIR = path.join(__dirname, '..', 'uploads')

  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

  router.post('/upload', async (req, res) => {
    try {
      const { image } = req.body
      if (!image) return res.status(400).json({ error: 'Image required' })

      const buf = Buffer.from(image, 'base64')
      const filename = Date.now() + '-' + Math.random().toString(36).substring(2, 8) + '.jpg'
      const filepath = path.join(UPLOAD_DIR, filename)
      fs.writeFileSync(filepath, buf)

      const host = req.headers.host || 'localhost:5000'
      const protocol = req.headers['x-forwarded-proto'] || 'http'
      res.json({ url: `${protocol}://${host}/uploads/${filename}` })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  return router
}
