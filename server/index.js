require('dotenv').config()
const express = require('express')
const cors = require('cors')
const admin = require('firebase-admin')

const app = express()
const PORT = process.env.PORT || 5000

try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/^"(.*)"$/, '$1'),
      }),
    })
    console.log('[Firebase] Initialized successfully')
  } else {
    console.log('[Firebase] Missing credentials - running in demo mode')
  }
} catch (err) {
  console.error('[Firebase] Init error:', err.message)
}

const db = admin.apps.length ? admin.firestore() : null

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Payswit API' })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

if (db) {
  app.use('/api/auth', require('./routes/auth')(db))
  app.use('/api/transactions', require('./routes/transactions')(db))
  app.use('/api/rates', require('./routes/rates')(db))
  app.use('/api/admin', require('./routes/admin')(db))
  app.use('/api/bank-accounts', require('./routes/bank_accounts')(db))
  app.use('/api/ai', require('./routes/ai')(db))
} else {
  app.use('/api/*', (req, res) => {
    res.json({ message: 'Demo mode - Firebase not configured' })
  })
}

app.use((err, req, res, next) => {
  console.error('[Error]', err.message)
  res.status(500).json({ error: 'Server error' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Payswit server running on port ${PORT}`)
})
