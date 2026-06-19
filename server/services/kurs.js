const https = require('https')
const admin = require('firebase-admin')

const FREE_APIS = [
  {
    name: 'exchangerate-api',
    url: 'https://v6.exchangerate-api.com/v6/8c9c4c0c0c0c0c0c0c0c0c0c/latest/USD',
    parse: (data) => data.conversion_rates?.IDR,
  },
  {
    name: 'open.er-api',
    url: 'https://open.er-api.com/v6/latest/USD',
    parse: (data) => data.rates?.IDR,
  },
  {
    name: 'cdn.jsdelivr',
    url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
    parse: (data) => data.usd?.idr,
  },
]

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 10000 }, (res) => {
      let body = ''
      res.on('data', (chunk) => body += chunk)
      res.on('end', () => {
        try { resolve(JSON.parse(body)) } catch (e) { reject(e) }
      })
    }).on('error', reject).on('timeout', function () { this.destroy(); reject(new Error('timeout')) })
  })
}

async function fetchRate() {
  for (const api of FREE_APIS) {
    try {
      console.log(`[Kurs] Trying ${api.name}...`)
      const data = await fetchJSON(api.url)
      const rate = api.parse(data)
      if (rate && rate > 10000 && rate < 25000) {
        console.log(`[Kurs] Got rate from ${api.name}: 1 USD = Rp ${Math.round(rate)}`)
        return Math.round(rate)
      }
    } catch (e) {
      console.log(`[Kurs] ${api.name} failed: ${e.message}`)
    }
  }
  console.log('[Kurs] All APIs failed, keeping current rate')
  return null
}

async function updateRate(db) {
  const rate = await fetchRate()
  if (!rate) return

  try {
    await db.collection('settings').doc('rates').set(
      {
        usdToIdr: rate,
        fee: 0.02,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        source: 'auto',
      },
      { merge: true }
    )
    console.log(`[Kurs] Updated: 1 USD = Rp ${rate}`)
  } catch (e) {
    console.log(`[Kurs] Update failed: ${e.message}`)
  }
}

function startAutoUpdate(db) {
  console.log('[Kurs] Starting auto-update (setiap 1 jam)')

  updateRate(db)

  setInterval(() => {
    updateRate(db)
  }, 60 * 60 * 1000)
}

module.exports = { fetchRate, updateRate, startAutoUpdate }
