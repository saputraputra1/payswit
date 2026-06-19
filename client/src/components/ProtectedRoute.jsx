import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { FiLock, FiHome } from 'react-icons/fi'
import { Link } from 'react-router-dom'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, userData, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  if (adminOnly && !userData) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (adminOnly && userData?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FiLock size={36} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Akses Ditolak</h1>
          <p className="text-gray-400 mb-8">Halaman ini hanya untuk admin.</p>
          <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">
            <FiHome size={18} />
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (userData?.status === 'banned') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-2">Akun Diblokir</h1>
          <p className="text-gray-400">Hubungi customer service untuk info lebih lanjut.</p>
        </div>
      </div>
    )
  }

  return children
}
