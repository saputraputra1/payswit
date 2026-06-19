import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import {
  FiRepeat,
  FiCreditCard,
  FiMessageSquare,
  FiShield,
  FiArrowRight,
  FiChevronDown,
  FiChevronUp,
  FiStar,
  FiDollarSign,
  FiCheck,
  FiZap,
  FiGlobe,
  FiUsers,
  FiArrowUpRight,
  FiLock,
  FiTrendingUp,
  FiSmartphone,
  FiMenu,
  FiX,
} from 'react-icons/fi'

function useInView(threshold = 0.15) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
      { threshold }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold])
  return [ref, isVisible]
}

function AnimatedCounter({ end, duration = 2000, prefix = '', suffix = '' }) {
  const [count, setCount] = useState(0)
  const [ref, isVisible] = useInView()
  useEffect(() => {
    if (!isVisible) return
    let startTime = null
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * end))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [isVisible, end, duration])
  return <span ref={ref} className="tabular-nums">{prefix}{count.toLocaleString('id-ID')}{suffix}</span>
}

function ParticleField() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animationId
    let particles = []
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    const createParticles = () => {
      particles = []
      const count = Math.floor(window.innerWidth / 25)
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width, y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
          size: Math.random() * 2 + 0.5, opacity: Math.random() * 0.4 + 0.1,
        })
      }
    }
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(96, 165, 250, ${p.opacity})`; ctx.fill()
      })
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dist = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2)
          if (dist < 150) {
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(96, 165, 250, ${0.08 * (1 - dist / 150)})`; ctx.lineWidth = 0.5; ctx.stroke()
          }
        })
      })
      animationId = requestAnimationFrame(animate)
    }
    resize(); createParticles(); animate()
    window.addEventListener('resize', () => { resize(); createParticles() })
    return () => { cancelAnimationFrame(animationId); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ opacity: 0.5 }} />
}

function SectionHeader({ badge, title, titleGradient, desc }) {
  const [ref, isVisible] = useInView()
  return (
    <div ref={ref} className={`text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      {badge && (
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-400 mb-6 font-medium">
          {badge}
        </div>
      )}
      <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-5 leading-tight">
        {titleGradient ? (
          <>{title} <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">{titleGradient}</span></>
        ) : title}
      </h2>
      {desc && <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">{desc}</p>}
    </div>
  )
}

export default function Landing() {
  const [rates, setRates] = useState(null)
  const [openFaq, setOpenFaq] = useState(null)
  const [scrollY, setScrollY] = useState(0)
  const [mobileMenu, setMobileMenu] = useState(false)

  useEffect(() => {
    api.get('/rates').then((res) => setRates(res.data)).catch(() => {})
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const services = [
    { icon: FiRepeat, title: 'Convert PayPal → IDR', desc: 'Tarik saldo PayPal ke rekening bank lokal dengan kurs kompetitif dan proses verifikasi cepat.', gradient: 'from-blue-500 to-cyan-500', delay: 0 },
    { icon: FiCreditCard, title: 'Jasa Pembayaran CC', desc: 'Bayar ke merchant luar negeri menggunakan credit card kami. Visa, Mastercard, Amex tersedia.', gradient: 'from-orange-500 to-red-500', delay: 100 },
    { icon: FiDollarSign, title: 'Top Up PayPal', desc: 'Isi saldo PayPal dari bank lokal, transfer bank, atau e-wallet Indonesia dengan mudah.', gradient: 'from-green-500 to-emerald-500', delay: 200 },
    { icon: FiShield, title: 'Aman & Terpercaya', desc: 'Setiap transaksi diverifikasi manual oleh tim admin untuk keamanan maksimal.', gradient: 'from-purple-500 to-pink-500', delay: 300 },
  ]

  const steps = [
    { num: '01', title: 'Daftar Akun', desc: 'Buat akun gratis dalam hitungan detik', icon: FiUsers },
    { num: '02', title: 'Pilih Layanan', desc: 'Convert, top up, atau jasa pembayaran CC', icon: FiGlobe },
    { num: '03', title: 'Submit & Bayar', desc: 'Isi form dan lakukan pembayaran', icon: FiArrowUpRight },
    { num: '04', title: 'Selesai', desc: 'Dana/proses langsung terkonfirmasi', icon: FiCheck },
  ]

  const faqs = [
    { q: 'Berapa lama proses convert PayPal ke IDR?', a: 'Proses verifikasi biasanya 15-30 menit. Dana langsung dikirim ke rekening bank setelah diverifikasi.' },
    { q: 'Bagaimana cara kerja jasa pembayaran CC?', a: 'Anda pilih layanan, masukkan detail pembayaran, lalu bayar ke akun kami. Kami akan proses pembayaran ke merchant menggunakan CC.' },
    { q: 'Bank apa saja yang didukung?', a: 'BCA, BRI, BNI, Mandiri, BSI, CIMB Niaga, Danamon, Permata, dan bank lokal lainnya.' },
    { q: 'Apakah ada batasan minimal transaksi?', a: 'Minimal convert $1 USD, minimal top up Rp 50.000, minimal jasa CC Rp 100.000.' },
    { q: 'Bagaimana jika transaksi gagal?', a: 'Hubungi CS via live chat. Dana akan dikembalikan penuh jika transaksi tidak berhasil diproses.' },
  ]

  const testimonials = [
    { name: 'Andi S.', role: 'Freelancer', text: 'Convert PayPal ke BCA cuma 20 menit. Kurs paling bagus dibanding platform lain!', rating: 5 },
    { name: 'Rina M.', role: 'Online Seller', text: 'Pakai jasa CC buat bayar supplier luar negeri, prosesnya cepat dan aman. Recommended!', rating: 5 },
    { name: 'Dimas P.', role: 'Developer', text: 'Udah 3 bulan pakai, gak pernah ada masalah. Top up dari OVO dan GoPay juga bisa.', rating: 5 },
    { name: 'Sari W.', role: 'Digital Nomad', text: 'Customer service-nya fast response banget. Setiap masalah langsung dibantu selesai.', rating: 5 },
  ]

  const features = [
    { icon: FiZap, title: 'Proses Cepat', desc: 'Verifikasi otomatis dalam hitungan menit' },
    { icon: FiLock, title: 'Enkripsi SSL', desc: 'Data terenkripsi standar industri' },
    { icon: FiTrendingUp, title: 'Kurs Real-time', desc: 'Kurs update langsung dari server' },
    { icon: FiSmartphone, title: 'Mobile Friendly', desc: 'Akses dari perangkat manapun' },
    { icon: FiMessageSquare, title: 'CS 24/7', desc: 'Tim support siap bantu kapan saja' },
    { icon: FiGlobe, title: 'Multi Bank', desc: 'Dukung semua bank Indonesia' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrollY > 50 ? 'bg-[#0a0a0f]/90 backdrop-blur-2xl border-b border-white/5 shadow-2xl shadow-black/20' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <img src="/logo.svg" alt="Payswit" className="w-10 h-10 rounded-xl group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all duration-300" />
              <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl opacity-0 group-hover:opacity-20 blur transition-all duration-300" />
            </div>
            <span className="font-black text-xl tracking-tight">Payswit</span>
          </Link>

          <div className="hidden lg:flex items-center gap-10">
            {[
              { label: 'Layanan', href: '#services' },
              { label: 'Cara Kerja', href: '#how' },
              { label: 'Kurs', href: '#rates' },
              { label: 'FAQ', href: '#faq' },
            ].map((item) => (
              <a key={item.label} href={item.href} className="text-sm text-gray-400 hover:text-white transition-colors relative group font-medium">
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:w-full transition-all duration-300 rounded-full" />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden sm:block px-5 py-2.5 text-sm font-semibold text-gray-300 hover:text-white transition-colors">
              Masuk
            </Link>
            <Link to="/register" className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-bold rounded-xl hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105">
              Daftar Gratis
            </Link>
            <button onClick={() => setMobileMenu(!mobileMenu)} className="lg:hidden p-2 text-gray-400 hover:text-white">
              {mobileMenu ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenu && (
          <div className="lg:hidden bg-[#0a0a0f]/95 backdrop-blur-2xl border-t border-white/5 px-6 py-6 space-y-4">
            {[
              { label: 'Layanan', href: '#services' },
              { label: 'Cara Kerja', href: '#how' },
              { label: 'Kurs', href: '#rates' },
              { label: 'FAQ', href: '#faq' },
            ].map((item) => (
              <a key={item.label} href={item.href} onClick={() => setMobileMenu(false)} className="block text-gray-400 hover:text-white transition-colors font-medium py-2">
                {item.label}
              </a>
            ))}
            <Link to="/login" className="block text-center py-3 text-gray-300 hover:text-white font-medium" onClick={() => setMobileMenu(false)}>Masuk</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        <ParticleField />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[150px]" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/[0.03] border border-white/10 rounded-full text-sm mb-10 backdrop-blur-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
            <span className="text-gray-300 font-medium">Live Kurs: 1 USD = Rp {rates?.usdToIdr?.toLocaleString('id-ID') || '16.000'}</span>
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black leading-[0.9] mb-8 tracking-tight">
            <span className="block text-white/90">Platform</span>
            <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">Pembayaran</span>
            <span className="block text-white/60 text-5xl md:text-7xl lg:text-8xl font-bold mt-3">Digital Terpercaya</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
            Convert PayPal ke Rupiah, top up PayPal, dan jasa pembayaran credit card — semua dalam satu platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-16">
            <Link
              to="/register"
              className="group px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-2xl hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 flex items-center gap-3 text-lg hover:scale-105"
            >
              Mulai Sekarang
              <FiArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#services" className="px-10 py-5 bg-white/[0.03] border border-white/10 text-white font-semibold rounded-2xl hover:bg-white/[0.06] transition-all duration-300 text-lg backdrop-blur-sm">
              Lihat Layanan
            </a>
          </div>

          <div className="grid grid-cols-3 gap-8 max-w-xl mx-auto">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-black text-white"><AnimatedCounter end={5000} suffix="+" /></p>
              <p className="text-xs text-gray-500 mt-2 font-medium uppercase tracking-wider">User Aktif</p>
            </div>
            <div className="text-center border-x border-white/10">
              <p className="text-3xl md:text-4xl font-black text-white"><AnimatedCounter end={50000} suffix="+" /></p>
              <p className="text-xs text-gray-500 mt-2 font-medium uppercase tracking-wider">Transaksi</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-black text-white"><AnimatedCounter end={15} suffix=" mnt" /></p>
              <p className="text-xs text-gray-500 mt-2 font-medium uppercase tracking-wider">Rata-rata Proses</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center">
            <div className="w-1.5 h-3 bg-white/40 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-8 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {['BCA', 'BRI', 'BNI', 'Mandiri', 'Visa', 'Mastercard', 'PayPal', 'OVO'].map((brand) => (
            <span key={brand} className="text-gray-600 font-bold text-lg tracking-wider uppercase">{brand}</span>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-28 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.05),transparent_60%)]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <SectionHeader
            badge="Layanan Kami"
            title="Semua Kebutuhan"
            titleGradient="Pembayaran Digital"
            desc="Dari convert PayPal hingga jasa pembayaran credit card — kami siap membantu."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
            {services.map((f, i) => {
              const [ref, isVisible] = useInView()
              const Icon = f.icon
              return (
                <div
                  key={i}
                  ref={ref}
                  className={`group relative bg-white/[0.02] border border-white/[0.06] rounded-3xl p-8 md:p-10 hover:bg-white/[0.04] transition-all duration-500 hover:border-white/10 hover:shadow-2xl hover:shadow-blue-500/5 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${f.delay}ms` }}
                >
                  <div className="flex items-start gap-6">
                    <div className={`w-16 h-16 bg-gradient-to-br ${f.gradient} rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                      <Icon size={28} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                      <p className="text-gray-400 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i} className="text-center group">
                  <div className="w-12 h-12 bg-white/[0.03] border border-white/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-all duration-300">
                    <Icon size={22} className="text-gray-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">{f.title}</h4>
                  <p className="text-xs text-gray-500">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-28 px-6 relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <SectionHeader
            badge="Mudah & Cepat"
            title="Hanya 4 Langkah"
            titleGradient="Sederhana"
            desc="Proses transaksi yang simpel dan transparan."
          />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-16">
            {steps.map((s, i) => {
              const [ref, isVisible] = useInView()
              const Icon = s.icon
              return (
                <div
                  key={i}
                  ref={ref}
                  className={`relative text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${i * 150}ms` }}
                >
                  {i < 3 && (
                    <div className="hidden md:block absolute top-14 left-[calc(50%+3.5rem)] w-[calc(100%-7rem)]">
                      <div className="h-px bg-gradient-to-r from-blue-500/30 to-transparent" />
                    </div>
                  )}
                  <div className="relative inline-block mb-6">
                    <div className="w-28 h-28 bg-gradient-to-br from-blue-600/10 to-cyan-600/10 rounded-3xl flex items-center justify-center border border-blue-500/10 group-hover:border-blue-500/30 transition-colors">
                      <Icon size={40} className="text-blue-400" />
                    </div>
                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-xl shadow-blue-500/30">
                      {s.num}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-400">{s.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Rates */}
      <section id="rates" className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 via-cyan-600/5 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[200px]" />

        <div className="max-w-5xl mx-auto relative z-10">
          <SectionHeader
            badge="Update Real-time"
            title="Kurs & Biaya"
            titleGradient="Transparan"
            desc="Tanpa biaya tersembunyi. Semua tertera jelas."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            {[
              { label: 'USD → IDR', value: `Rp ${rates?.usdToIdr?.toLocaleString('id-ID') || '16.000'}`, sub: 'per 1 Dollar AS', gradient: 'from-blue-500 to-cyan-500' },
              { label: 'Biaya Admin Top Up', value: `${rates?.fee ? (rates.fee * 100) : '2'}%`, sub: 'per transaksi', gradient: 'from-purple-500 to-pink-500' },
              { label: 'Biaya Jasa CC', value: '3-5%', sub: 'tergantung nominal', gradient: 'from-orange-500 to-red-500' },
            ].map((item, i) => {
              const [ref, isVisible] = useInView()
              return (
                <div
                  key={i}
                  ref={ref}
                  className={`group bg-white/[0.02] border border-white/[0.06] rounded-3xl p-10 text-center hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                  style={{ transitionDelay: `${i * 150}ms` }}
                >
                  <p className="text-sm text-gray-500 mb-4 font-medium uppercase tracking-wider">{item.label}</p>
                  <p className={`text-4xl md:text-5xl font-black mb-3 bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>
                    {item.value}
                  </p>
                  <p className="text-xs text-gray-600">{item.sub}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-28 px-6 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            badge="Testimoni"
            title="Apa Kata"
            titleGradient="Mereka?"
            desc="Ribuan user sudah mempercayai Payswit untuk transaksi harian."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            {testimonials.map((t, i) => {
              const [ref, isVisible] = useInView()
              return (
                <div
                  key={i}
                  ref={ref}
                  className={`bg-white/[0.02] border border-white/[0.06] rounded-3xl p-8 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div className="flex items-center gap-1 mb-5">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <FiStar key={j} size={14} className="text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-6 leading-relaxed text-sm">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-sm font-bold">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-28 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(59,130,246,0.03),transparent_60%)]" />
        <div className="max-w-3xl mx-auto relative z-10">
          <SectionHeader badge="FAQ" title="Pertanyaan" titleGradient="Umum" />
          <div className="space-y-3 mt-16">
            {faqs.map((faq, i) => {
              const [ref, isVisible] = useInView()
              return (
                <div
                  key={i}
                  ref={ref}
                  className={`bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-8 py-6 text-left group"
                  >
                    <span className="font-semibold text-white group-hover:text-blue-400 transition-colors pr-4">{faq.q}</span>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${openFaq === i ? 'bg-blue-500 rotate-180' : 'bg-white/5'}`}>
                      <FiChevronDown size={16} className="text-white" />
                    </div>
                  </button>
                  <div className={`transition-all duration-300 overflow-hidden ${openFaq === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-8 pb-6">
                      <p className="text-gray-400 leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[200px]" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-[2.5rem] p-12 md:p-20 text-center backdrop-blur-sm">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
              Siap Mulai<br /><span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Transaksi?</span>
            </h2>
            <p className="text-xl text-gray-400 mb-10 max-w-lg mx-auto leading-relaxed">
              Daftar sekarang dan nikmati kemudahan transaksi digital dengan kurs terbaik.
            </p>
            <Link
              to="/register"
              className="group inline-flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-2xl hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 text-xl hover:scale-105"
            >
              Buat Akun Gratis
              <FiArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-16 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <img src="/logo.svg" alt="Payswit" className="w-9 h-9 rounded-lg" />
                <span className="font-black text-lg">Payswit</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Platform terpercaya untuk convert PayPal, top up, dan jasa pembayaran credit card.
              </p>
            </div>
            {[
              { title: 'Layanan', links: ['Convert PayPal → IDR', 'Top Up PayPal', 'Jasa Pembayaran CC', 'Chat Customer Service'] },
              { title: 'Perusahaan', links: ['Tentang Kami', 'Syarat & Ketentuan', 'Kebijakan Privasi', 'Karir'] },
              { title: 'Dukungan', links: ['FAQ', 'Hubungi Kami', 'Panduan', 'Status Server'] },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map((link, j) => (
                    <li key={j}><a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600">&copy; 2026 Payswit. All rights reserved.</p>
            <div className="flex items-center gap-6">
              {['Twitter', 'Instagram', 'Telegram', 'Discord'].map((s) => (
                <a key={s} href="#" className="text-sm text-gray-600 hover:text-white transition-colors">{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
