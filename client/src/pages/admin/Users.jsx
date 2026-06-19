import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiUsers, FiShield, FiShieldOff } from 'react-icons/fi'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    try { const res = await api.get('/admin/users'); setUsers(res.data) } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function handleBan(uid, status) {
    const newStatus = status === 'active' ? 'banned' : 'active'
    try {
      await api.put(`/admin/users/${uid}`, { status: newStatus })
      toast.success(`User ${newStatus === 'banned' ? 'diblokir' : 'diaktifkan'}`)
      fetchUsers()
    } catch (e) { toast.error('Gagal') }
  }

  async function handleRole(uid, role) {
    try {
      await api.put(`/admin/users/${uid}`, { role })
      toast.success('Role diubah')
      fetchUsers()
    } catch (e) { toast.error('Gagal') }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" /></div>

  return (
    <div className="p-4 sm:p-6 space-y-3">
      {users.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-6 py-12 text-center">
          <p className="text-gray-500 text-sm">Belum ada user</p>
        </div>
      ) : users.map(u => (
        <div key={u.uid} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0">
                {u.name?.[0] || 'U'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-white text-sm truncate">{u.name}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${u.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>{u.role}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${u.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{u.status}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{u.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select value={u.role} onChange={(e) => handleRole(u.uid, e.target.value)}
                className="bg-white/[0.03] border border-white/10 rounded-lg px-2 py-2 text-xs text-white outline-none">
                <option value="user" className="bg-[#0a0a0f]">User</option>
                <option value="admin" className="bg-[#0a0a0f]">Admin</option>
              </select>
              <button onClick={() => handleBan(u.uid, u.status)}
                className={`p-2 rounded-lg text-white transition-all active:scale-[0.95] ${u.status === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                {u.status === 'active' ? <FiShieldOff size={16} /> : <FiShield size={16} />}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
