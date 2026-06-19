import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { updateProfile } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import toast from 'react-hot-toast'
import { FiUser, FiMail, FiPhone, FiSave } from 'react-icons/fi'

export default function Profile() {
  const { user, userData, fetchUserData } = useAuth()
  const [name, setName] = useState(userData?.name || '')
  const [phone, setPhone] = useState(userData?.phone || '')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await updateProfile(user, { displayName: name })
      await updateDoc(doc(db, 'users', user.uid), { name, phone })
      await fetchUserData(user.uid)
      toast.success('Profil diperbarui')
    } catch (err) { toast.error('Gagal memperbarui') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
              <FiUser size={20} className="text-white sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-white">Profil Saya</h1>
              <p className="text-gray-500 text-xs sm:text-sm">Kelola akun Anda</p>
            </div>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl sm:rounded-2xl p-4 sm:p-8 mb-4 sm:mb-6">
          <div className="flex items-center gap-4 sm:gap-5 mb-6 sm:mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-black shadow-lg shadow-blue-500/20 flex-shrink-0">
              {(userData?.name || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-white truncate">{userData?.name || 'User'}</h2>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{user?.email}</p>
              <span className={`inline-block mt-1.5 sm:mt-2 text-[10px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-full border ${
                userData?.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              }`}>
                {userData?.role === 'admin' ? 'Admin' : 'User'}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 sm:p-5">
              <p className="text-xs sm:text-sm text-gray-500 mb-1">Bergabung</p>
              <p className="text-lg sm:text-2xl font-black text-white">{userData?.createdAt?.toDate?.().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) || '-'}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/[0.02] border border-white/[0.06] rounded-xl sm:rounded-2xl p-4 sm:p-8 space-y-4 sm:space-y-6">
          <h3 className="font-bold text-white text-base sm:text-lg">Edit Profil</h3>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1.5 sm:mb-2">Nama</label>
            <div className="relative">
              <FiUser className="absolute left-4 sm:left-5 top-3.5 sm:top-4 text-gray-500 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full pl-11 sm:pl-12 pr-4 sm:pr-5 py-3 sm:py-4 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm sm:text-base" />
            </div>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1.5 sm:mb-2">Email</label>
            <div className="relative">
              <FiMail className="absolute left-4 sm:left-5 top-3.5 sm:top-4 text-gray-500 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              <input type="email" value={user?.email} disabled
                className="w-full pl-11 sm:pl-12 pr-4 sm:pr-5 py-3 sm:py-4 bg-white/[0.01] border border-white/5 rounded-xl text-gray-500 cursor-not-allowed text-sm sm:text-base" />
            </div>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1.5 sm:mb-2">No. Telepon</label>
            <div className="relative">
              <FiPhone className="absolute left-4 sm:left-5 top-3.5 sm:top-4 text-gray-500 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-11 sm:pl-12 pr-4 sm:pr-5 py-3 sm:py-4 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm sm:text-base"
                placeholder="08xxxxxxxxxx" />
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-50 text-sm sm:text-base flex items-center justify-center gap-2 active:scale-[0.98]">
            <FiSave size={16} className="sm:w-[18px] sm:h-[18px]" />
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </form>
      </div>
    </div>
  )
}
