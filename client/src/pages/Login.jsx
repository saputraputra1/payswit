import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import Robot from '../components/Robot'

const msgs = {
  idle: ['Halo, mau masuk ya?', 'Ketik email dan password!', 'Aku siap bantu kamu!'],
  error: ['Waduh, password salah!', 'Coba lagi ya, semangat!', 'Jangan menyerah!', 'Hmm, ada yang salah nih!'],
  success: ['Yeay, berhasil masuk!', 'Selamat datang kembali!', 'Siap bertransaksi!'],
  poke: ['Hehe geli!', 'Aku robot, bukan tombol!', 'Klik Masuk dong, bukan aku!', 'Awas rusak!'],
  focus_email: ['Emailnya diketik ya!'],
  focus_pass: ['Password jangan salah ya!'],
  typing: ['Aku tunggu ya...'],
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [robotStatus, setRobotStatus] = useState('hello')
  const [robotMsg, setRobotMsg] = useState('Halo! Selamat datang di Payswit!')
  const [robotSpeak, setRobotSpeak] = useState('Halo! Selamat datang di Payswit!')
  const [shakeForm, setShakeForm] = useState(false)
  const [pokeCount, setPokeCount] = useState(0)
  const { login } = useAuth()
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
    if (!email || !password) { toast.error('Isi email dan password'); return }

    setLoading(true)
    setRobotStatus('idle')
    setRobotMsg('Memproses...')
    setRobotSpeak('Memproses ya, tunggu sebentar!')

    try {
      await login(email, password)
      setRobotStatus('success')
      pickMsg('success')
      toast.success('Berhasil masuk!')
      setTimeout(() => navigate('/'), 1500)
    } catch (err) {
      setRobotStatus('error')
      pickMsg('error')
      setShakeForm(true)
      setTimeout(() => setShakeForm(false), 500)
      toast.error('Email atau password salah')
      setTimeout(() => {
        setRobotStatus('idle')
        pickMsg('idle')
      }, 3500)
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
    setTimeout(() => {
      setRobotStatus('idle')
      pickMsg('idle')
    }, 2000)
  }

  function handleEmailFocus() {
    setRobotStatus('idle')
    pickMsg('focus_email')
  }

  function handlePassFocus() {
    setRobotStatus('idle')
    pickMsg('focus_pass')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />

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
          className={`glass rounded-2xl p-8 space-y-5 transition-transform duration-300`}
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
            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={handleEmailFocus}
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
              onFocus={handlePassFocus}
              className="w-full px-5 py-3.5 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
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
            ) : 'Masuk'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Belum punya akun?{' '}
            <Link to="/register" className="text-blue-400 font-medium hover:text-blue-300 transition-colors">Daftar</Link>
          </p>
        </form>

        <p className="text-center text-xs text-gray-600 mt-4">Klik robot untuk interaksi 🤖</p>
      </div>
    </div>
  )
}
