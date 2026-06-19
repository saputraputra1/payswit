require('dotenv').config()
const express = require('express')
const cors = require('cors')
const admin = require('firebase-admin')
const { startAutoUpdate } = require('./services/kurs')

const app = express()
const PORT = process.env.PORT || 5000

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
})

const db = admin.firestore()

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://payswit.up.railway.app',
  'https://payswit-client.up.railway.app',
  process.env.CLIENT_URL,
].filter(Boolean)

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true)
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(null, true)
    }
  },
  credentials: true,
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.use('/api/auth', require('./routes/auth')(db))
app.use('/api/transactions', require('./routes/transactions')(db))
app.use('/api/rates', require('./routes/rates')(db))
app.use('/api/admin', require('./routes/admin')(db))
app.use('/api/bank-accounts', require('./routes/bank_accounts')(db))
app.use('/api/ai', require('./routes/ai')(db))

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  })
})

app.use((err, req, res, next) => {
  console.error('[Error]', err.stack)
  res.status(500).json({ error: 'Terjadi kesalahan server' })
})

startAutoUpdate(db)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Payswit server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})
