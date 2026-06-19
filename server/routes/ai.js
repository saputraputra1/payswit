const express = require('express')
const authMiddleware = require('../middleware/auth')

module.exports = function (db) {
  const router = express.Router()
  const auth = authMiddleware(db)

  const knowledge = {
    'convert': {
      keywords: ['convert', 'paypal ke rupiah', 'tarik', 'withdraw', 'cair'],
      reply: 'Untuk convert PayPal ke Rupiah:\n\n1. Login ke Payswit\n2. Klik menu "Convert"\n3. Pilih paket Standard (Rp 15.000) atau Premium (Rp 27.000)\n4. Masukkan jumlah USD\n5. Isi email PayPal\n6. Pilih rekening tujuan\n7. Klik "Ajukan Convert"\n\nProses verifikasi 1-24 jam (Standard) atau 15-30 menit (Premium).',
    },
    'topup': {
      keywords: ['top up', 'topup', 'isi saldo', 'tambah saldo', 'paypal'],
      reply: 'Untuk Top Up PayPal:\n\n1. Login ke Payswit\n2. Klik menu "Top Up"\n3. Pilih paket Standard atau Premium\n4. Masukkan jumlah IDR (minimal Rp 50.000)\n5. Isi email PayPal tujuan\n6. Pilih rekening admin\n7. Transfer ke rekening yang dipilih\n8. Klik "Buat Pesanan"\n\nAdmin akan verifikasi pembayaran Anda.',
    },
    'kurs': {
      keywords: ['kurs', 'rate', 'harga', 'nilai tukar', 'dollar', 'usd'],
      reply: 'Kurs di Payswit update otomatis setiap jam dari API internasional.\n\nUntuk cek kurs terbaru:\n- Lihat di dashboard utama\n- Atau di halaman Convert/Top Up\n\nKurs saat ini bisa dilihat di bagian atas halaman transaksi.',
    },
    'biaya': {
      keywords: ['biaya', 'fee', 'admin', 'potongan', 'charge'],
      reply: 'Biaya admin Payswit:\n\n📦 Paket Standard: Rp 15.000 per transaksi\n   - Proses 1-24 jam\n   - Verifikasi manual\n\n⭐ Paket Premium: Rp 27.000 per transaksi\n   - Proses 15-30 menit\n   - Verifikasi prioritas\n   - Kurs lebih baik',
    },
    'cc': {
      keywords: ['credit card', 'cc', 'kartu kredit', 'bayar', 'merchant'],
      reply: 'Jasa Pembayaran Credit Card:\n\n1. Login ke Payswit\n2. Klik menu "Jasa CC"\n3. Pilih paket Standard/Premium\n4. Isi nama merchant & URL\n5. Masukkan jumlah USD\n6. Pilih tipe kartu (Visa/MC/Amex)\n7. Transfer ke rekening admin\n\nProses 1-24 jam. Mendukung Visa, Mastercard, Amex.',
    },
    'status': {
      keywords: ['status', 'pesanan', 'transaksi', 'proses', 'pending', 'selesai'],
      reply: 'Cek status transaksi:\n\n1. Login ke Payswit\n2. Lihat di Dashboard utama\n3. Status ada 3:\n   🟡 Menunggu - Admin belum verifikasi\n   🟢 Selesai - Dana sudah dikirim\n   🔴 Ditolak - Transaksi ditolak\n\nAnda juga dapat notifikasi saat status berubah.',
    },
    'bank': {
      keywords: ['bank', 'rekening', 'bca', 'bri', 'bni', 'mandiri', 'transfer'],
      reply: 'Bank yang didukung Payswit:\n\n✅ BCA\n✅ BRI\n✅ BNI\n✅ Mandiri\n✅ BSI\n✅ CIMB Niaga\n✅ Danamon\n✅ Permata\n\nE-Wallet: Dana, OVO, GoPay, ShopeePay',
    },
    'daftar': {
      keywords: ['daftar', 'register', 'buat akun', 'signup', 'gabung'],
      reply: 'Cara daftar Payswit:\n\n1. Buka payswit.com\n2. Klik "Daftar Gratis"\n3. Isi nama, email, password\n4. Klik "Daftar"\n5. Langsung bisa digunakan!\n\nGratis tanpa biaya pendaftaran.',
    },
    'login': {
      keywords: ['login', 'masuk', 'lupa password', 'ganti password'],
      reply: 'Cara login Payswit:\n\n1. Buka payswit.com\n2. Klik "Masuk"\n3. Masukkan email & password\n4. Klik "Masuk"\n\nJika lupa password, hubungi admin via chat.',
    },
    'aman': {
      keywords: ['aman', 'terpercaya', 'scam', 'penipuan', 'resmi', 'legal'],
      reply: 'Payswit adalah platform terpercaya:\n\n🔒 Transaksi diverifikasi manual oleh admin\n🔒 Menggunakan Firebase (Google) untuk keamanan data\n🔒 Enkripsi SSL untuk semua transaksi\n🔒 Garansi uang kembali jika transaksi gagal\n🔒 Sudah melayani 5000+ transaksi',
    },
    'cs': {
      keywords: ['cs', 'customer service', 'bantuan', 'help', 'kontak'],
      reply: 'Hubungi Customer Service Payswit:\n\n💬 Chat langsung di platform (menu Chat)\n⏰ AI Assistant online 24/7\n👨‍💼 Admin merespon dalam 15-30 menit\n\nAnda bisa chat kapan saja, kami siap membantu!',
    },
  }

  function findBestReply(message) {
    const msg = message.toLowerCase()
    let bestMatch = null
    let bestScore = 0

    for (const [key, data] of Object.entries(knowledge)) {
      let score = 0
      for (const keyword of data.keywords) {
        if (msg.includes(keyword)) {
          score += keyword.split(' ').length
        }
      }
      if (score > bestScore) {
        bestScore = score
        bestMatch = data
      }
    }

    if (bestMatch && bestScore > 0) {
      return bestMatch.reply
    }

    return null
  }

  async function callMiMoAPI(messages) {
    try {
      const endpoints = [
        { url: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama3-8b-8192', key: process.env.GROQ_API_KEY },
        { url: 'https://api.together.xyz/v1/chat/completions', model: 'meta-llama/Llama-3-8b-chat-hf', key: process.env.TOGETHER_API_KEY },
      ]

      for (const ep of endpoints) {
        if (!ep.key) continue
        try {
          const response = await fetch(ep.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + ep.key,
            },
            body: JSON.stringify({
              model: ep.model,
              messages: [
                { role: 'system', content: 'Kamu adalah customer service Payswit, platform convert PayPal ke Rupiah dan top up PayPal. Jawab dengan ramah dalam Bahasa Indonesia.' },
                ...messages,
              ],
              max_tokens: 500,
              temperature: 0.7,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            return data.choices?.[0]?.message?.content || null
          }
        } catch (e) {}
      }

      return null
    } catch (err) {
      return null
    }
  }

  router.post('/chat', auth, async (req, res) => {
    try {
      const { message, history = [] } = req.body

      if (!message) {
        return res.status(400).json({ error: 'Pesan tidak boleh kosong' })
      }

      const localReply = findBestReply(message)

      if (localReply) {
        return res.json({
          reply: localReply,
          source: 'local',
          model: 'payswit-knowledge',
        })
      }

      const aiReply = await callMiMoAPI(
        history.slice(-10).map(h => ({ role: h.role, content: h.content }))
          .concat([{ role: 'user', content: message }])
      )

      if (aiReply) {
        return res.json({
          reply: aiReply,
          source: 'ai',
          model: 'external',
        })
      }

      return res.json({
        reply: 'Maaf, saya belum bisa menjawab pertanyaan itu. Silakan tunggu admin membalas pesan Anda, atau coba tanyakan tentang:\n\n- Cara convert PayPal\n- Cara top up PayPal\n- Kurs dan biaya admin\n- Jasa pembayaran CC\n- Status transaksi\n- Cara daftar/login',
        source: 'fallback',
      })
    } catch (err) {
      console.error('[AI Chat Error]', err)
      res.status(500).json({ error: 'Terjadi kesalahan' })
    }
  })

  router.get('/settings', auth, async (req, res) => {
    try {
      const settingsDoc = await db.collection('settings').doc('ai_chat').get()
      const settings = settingsDoc.exists ? settingsDoc.data() : { enabled: true, autoReply: true }
      res.json(settings)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  router.put('/settings', auth, async (req, res) => {
    try {
      if (req.userData?.role !== 'admin') {
        return res.status(403).json({ error: 'Akses ditolak' })
      }
      const { enabled, autoReply } = req.body
      await db.collection('settings').doc('ai_chat').set({
        enabled: enabled !== false,
        autoReply: autoReply !== false,
        updatedAt: new Date().toISOString(),
      }, { merge: true })
      res.json({ message: 'Pengaturan AI diperbarui' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  return router
}
