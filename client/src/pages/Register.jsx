import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import Robot from '../components/Robot'

const msgs = {
  idle: ['Yuk daftar dulu!', 'Isi formnya ya!', 'Gratis kok, gampang!'],
  error: ['Ups, ada yang salah!', 'Coba cek lagi ya!', 'Email mungkin sudah dipakai!'],
  success: ['Yeay, berhasil daftar!', 'Selamat bergabung!', 'Siap bertransaksi!'],
  poke: ['Hehe geli!', 'Sabar ya, lagi daftar!', 'Jangan diganggu!'],
  focus_name: ['Namanya siapa?'],
  focus_email: ['Emailnya apa?'],
  focus_pass: ['Password minimal 6 karakter ya!'],
  focus_confirm: ['Ulangi passwordnya!'],
  typing: ['Aku tunggu ya...'],
}

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [robotStatus, setRobotStatus] = useState('hello')
  const [robotMsg, setRobotMsg] = useState('Halo! Yuk buat akun baru!')
  const [robotSpeak, setRobotSpeak] = useState('Halo! Yuk buat akun baru!')
  const [shakeForm, setShakeForm] = useState(false)
  const [pokeCount, setPokeCount] = useState(0)
  const { register } = useAuth()
  const navigate = useNavigate()
  const timer = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setRobotStatus('idle')
      pickMsg('idle')
    }, 2500)
    return () => clearTimeout(t)
  }, [])

  function pickMsg(key) {
    const pool = msgs[key] || msgs.idle
    const msg = pool[Math.floor(Math.random() * pool.length)]
    setRobotMsg(msg)
    setRobotSpeak(msg)
    if (timer.current) clearTimeout(timer.current)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setRobotStatus('error')
      setRobotMsg('Password tidak cocok!')
      setRobotSpeak('Password tidak cocok, cek lagi ya!')
      toast.error('Password tidak cocok')
      setShakeForm(true)
      setTimeout(() => { setShakeForm(false); setRobotStatus('idle'); pickMsg('idle') }, 3000)
      return
    }
    if (password.length < 6) {
      setRobotStatus('error')
      setRobotMsg('Password minimal 6 karakter!')
      setRobotSpeak('Password minimal 6 karakter ya!')
      toast.error('Password minimal 6 karakter')
      setShakeForm(true)
      setTimeout(() => { setShakeForm(false); setRobotStatus('idle'); pickMsg('idle') }, 3000)
      return
    }

    setLoading(true)
    setRobotStatus('idle')
    setRobotMsg('Mendaftarkan...')
    setRobotSpeak('Tunggu sebentar, aku daftarkan ya!')

    try {
      await register(email, password, name)
      setRobotStatus('success')
      pickMsg('success')
      toast.success('Berhasil daftar!')
      setTimeout(() => navigate('/'), 1500)
    } catch (err) {
      setRobotStatus('error')
      pickMsg('error')
      setShakeForm(true)
      setTimeout(() => setShakeForm(false), 500)
      toast.error(err.message || 'Gagal mendaftar')
      setTimeout(() => { setRobotStatus('idle'); pickMsg('idle') }, 3500)
    }
    setLoading(false)
  }

  function handlePoke() {
    setPokeCount(prev => prev + 1)
    setRobotStatus('poke')
    if (pokeCount > 5) {
      setRobotMsg('Berhenti dong! Aku pusing!')
      setRobotSpeak('Berhenti dong! Aku pusing!')
    } else {
      pickMsg('poke')
    }
    setTimeout(() => { setRobotStatus('idle'); pickMsg('idle') }, 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-3 mb-4">
            <img src="/logo.svg" alt="Payswit" className="w-12 h-12 rounded-xl" />
            <span className="font-bold text-2xl text-white">Payswit</span>
          </Link>

          <Robot status={robotStatus} onPoke={handlePoke} speak={robotSpeak} />

          <div className={`mt-3 px-4 py-2.5 rounded-xl inline-block max-w-[280px] transition-all duration-300 ${
            robotStatus === 'error' ? 'bg-red-500/10 border border-red-500/20' :
            robotStatus === 'success' ? 'bg-green-500/10 border border-green-500/20' :
            'bg-blue-500/10 border border-blue-500/20'
          }`}>
            <p className={`text-sm font-medium ${
              robotStatus === 'error' ? 'text-red-400' :
              robotStatus === 'success' ? 'text-green-400' :
              'text-blue-400'
            }`}>
              {robotMsg}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass rounded-2xl p-8 space-y-5"
          style={shakeForm ? { animation: 'shake 0.5s ease-in-out' } : {}}
        >
          <style>{`
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              20% { transform: translateX(-8px); }
              40% { transform: translateX(8px); }
              60% { transform: translateX(-5px); }
              80% { transform: translateX(5px); }
            }
          `}</style>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Nama Lengkap</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => { setRobotStatus('idle'); pickMsg('focus_name') }}
              className="w-full px-5 py-3.5 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => { setRobotStatus('idle'); pickMsg('focus_email') }}
              className="w-full px-5 py-3.5 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="email@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => { setRobotStatus('idle'); pickMsg('focus_pass') }}
              className="w-full px-5 py-3.5 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Minimal 6 karakter"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Konfirmasi Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => { setRobotStatus('idle'); pickMsg('focus_confirm') }}
              className="w-full px-5 py-3.5 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Ulangi password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-50 hover:scale-[1.02]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Memproses...
              </span>
            ) : 'Daftar'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-blue-400 font-medium hover:text-blue-300 transition-colors">Masuk</Link>
          </p>
        </form>

        <p className="text-center text-xs text-gray-600 mt-4">Klik robot untuk interaksi 🤖</p>
      </div>
    </div>
  )
}
