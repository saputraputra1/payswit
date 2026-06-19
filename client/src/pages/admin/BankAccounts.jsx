import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiCreditCard, FiPlus, FiTrash2, FiEdit, FiCheck, FiX } from 'react-icons/fi'
import { BankLogo } from '../../components/Icons'

export default function AdminBankAccounts() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ bankName: '', accountNumber: '', accountHolder: '' })
  const [editId, setEditId] = useState(null)

  useEffect(() => { fetchAccounts() }, [])

  async function fetchAccounts() {
    try {
      const res = await api.get('/bank-accounts')
      setAccounts(res.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (editId) {
        await api.put(`/bank-accounts/${editId}`, form)
        toast.success('Rekening diperbarui')
      } else {
        await api.post('/bank-accounts', form)
        toast.success('Rekening ditambahkan')
      }
      setForm({ bankName: '', accountNumber: '', accountHolder: '' })
      setShowForm(false)
      setEditId(null)
      fetchAccounts()
    } catch (e) { toast.error('Gagal') }
  }

  async function handleDelete(id) {
    if (!confirm('Yakin hapus rekening ini?')) return
    try {
      await api.delete(`/bank-accounts/${id}`)
      toast.success('Rekening dihapus')
      fetchAccounts()
    } catch (e) { toast.error('Gagal') }
  }

  function handleEdit(acc) {
    setForm({ bankName: acc.bankName, accountNumber: acc.accountNumber, accountHolder: acc.accountHolder })
    setEditId(acc.id)
    setShowForm(true)
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" /></div>

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Rekening Admin</h2>
          <p className="text-xs text-gray-500">Kelola rekening untuk menerima pembayaran</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ bankName: '', accountNumber: '', accountHolder: '' }) }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
          <FiPlus size={16} />
          {showForm ? 'Tutup' : 'Tambah'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6 space-y-4">
          <h3 className="font-bold text-white text-sm">{editId ? 'Edit Rekening' : 'Tambah Rekening'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Nama Bank</label>
              <input type="text" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                placeholder="BCA" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Nomor Rekening</label>
              <input type="text" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                placeholder="1234567890" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Nama Pemilik</label>
              <input type="text" value={form.accountHolder} onChange={(e) => setForm({ ...form, accountHolder: e.target.value })}
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                placeholder="Payswit Official" required />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors">
              <FiCheck size={14} /> {editId ? 'Update' : 'Simpan'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null) }}
              className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/[0.06] transition-colors">
              <FiX size={14} /> Batal
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {accounts.length === 0 ? (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-6 py-12 text-center">
            <div className="w-12 h-12 bg-white/[0.03] border border-white/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <FiCreditCard size={22} className="text-gray-600" />
            </div>
            <p className="text-gray-500 text-sm">Belum ada rekening</p>
          </div>
        ) : accounts.map((acc) => (
          <div key={acc.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <BankLogo bankName={acc.bankName} size="lg" />
                <div className="min-w-0">
                  <p className="font-bold text-white text-sm">{acc.bankName}</p>
                  <p className="font-mono text-gray-400 text-sm">{acc.accountNumber}</p>
                  <p className="text-xs text-gray-500">a.n {acc.accountHolder}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEdit(acc)}
                  className="p-2 text-gray-400 hover:text-blue-400 rounded-lg hover:bg-blue-500/10 transition-colors">
                  <FiEdit size={16} />
                </button>
                <button onClick={() => handleDelete(acc.id)}
                  className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
