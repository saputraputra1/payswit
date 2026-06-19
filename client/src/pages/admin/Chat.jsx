import { useState, useEffect, useRef } from 'react'
import { db } from '../../services/firebase'
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, updateDoc, doc } from 'firebase/firestore'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiSend, FiUser, FiMessageSquare, FiChevronLeft, FiCpu, FiToggleLeft, FiToggleRight, FiX } from 'react-icons/fi'

export default function AdminChat() {
  const [conversations, setConversations] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [aiEnabled, setAiEnabled] = useState(true)
  const [viewImage, setViewImage] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    api.get('/ai/settings').then(res => {
      setAiEnabled(res.data.enabled !== false)
    }).catch(() => {})

    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snapshot) => {
      const allMsgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      const userMap = {}
      allMsgs.forEach(msg => {
        if (!userMap[msg.userId]) {
          userMap[msg.userId] = {
            userId: msg.userId,
            userName: msg.userName,
            lastMessage: msg.imageUrl ? '📷 [Gambar]' : msg.text,
            unread: msg.sender === 'user' && !msg.read ? 1 : 0,
            hasAI: msg.isAI || false,
          }
        } else if (msg.sender === 'user' && !msg.read) {
          userMap[msg.userId].unread++
        }
      })
      setConversations(Object.values(userMap))
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!selectedUser) return
    const q = query(collection(db, 'messages'), where('userId', '==', selectedUser.userId), orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
      snapshot.docs.forEach(d => {
        if (d.data().sender === 'user' && !d.data().read) {
          updateDoc(doc(db, 'messages', d.id), { read: true })
        }
      })
    })
    return unsub
  }, [selectedUser])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedUser) return
    setLoading(true)
    try {
      await addDoc(collection(db, 'messages'), {
        userId: selectedUser.userId,
        userName: selectedUser.userName,
        text: newMessage.trim(),
        sender: 'admin',
        createdAt: serverTimestamp(),
        read: true,
        isAI: false,
      })
      setNewMessage('')
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function toggleAI() {
    const newVal = !aiEnabled
    setAiEnabled(newVal)
    try {
      await api.put('/ai/settings', { enabled: newVal })
      toast.success(`AI ${newVal ? 'diaktifkan' : 'dinonaktifkan'}`)
    } catch (e) {
      setAiEnabled(!newVal)
      toast.error('Gagal mengubah pengaturan AI')
    }
  }

  return (
    <div className="p-4 sm:p-6">
      {viewImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setViewImage(null)}>
          <button onClick={() => setViewImage(null)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white z-10">
            <FiX size={28} />
          </button>
          <img src={viewImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg cursor-default" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={toggleAI}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              aiEnabled ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-white/[0.03] text-gray-500 border border-white/10'
            }`}>
            <FiCpu size={14} />
            AI {aiEnabled ? 'Aktif' : 'Nonaktif'}
            {aiEnabled ? <FiToggleRight size={16} /> : <FiToggleLeft size={16} />}
          </button>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden flex flex-col md:flex-row" style={{ height: 'calc(100vh - 200px)', minHeight: '400px' }}>
        <div className={`${showSidebar ? 'flex' : 'hidden'} md:flex w-full md:w-72 flex-shrink-0 border-b md:border-b-0 md:border-r border-white/[0.06] flex-col max-h-[40vh] md:max-h-none`}>
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Percakapan</h3>
              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-medium rounded border border-blue-500/20">{conversations.length}</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="px-4 py-6 text-center text-gray-500 text-xs">Belum ada pesan</p>
            ) : conversations.map(conv => (
              <button key={conv.userId} onClick={() => { setSelectedUser(conv); setShowSidebar(false) }}
                className={`w-full text-left px-4 py-3 border-b border-white/[0.03] transition-colors ${selectedUser?.userId === conv.userId ? 'bg-blue-500/10' : 'hover:bg-white/[0.02]'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiUser size={14} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-white text-xs truncate">{conv.userName}</p>
                      <div className="flex items-center gap-1">
                        {conv.hasAI && <FiCpu size={10} className="text-purple-400" />}
                        {conv.unread > 0 && (
                          <span className="w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">{conv.unread}</span>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 truncate">{conv.lastMessage}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className={`${!showSidebar ? 'flex' : 'hidden'} md:flex flex-1 flex-col`}>
          {!selectedUser ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="w-12 h-12 bg-white/[0.03] border border-white/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FiMessageSquare size={22} className="text-gray-600" />
                </div>
                <p className="text-sm font-medium">Pilih percakapan</p>
                <p className="text-xs text-gray-600 mt-1">AI akan membalas otomatis jika aktif</p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-3">
                <button onClick={() => { setShowSidebar(true); setSelectedUser(null) }} className="md:hidden p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
                  <FiChevronLeft size={18} />
                </button>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <FiUser size={14} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{selectedUser.userName}</p>
                  <p className="text-[10px] text-gray-500">User ID: {selectedUser.userId.substring(0, 8)}...</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%]`}>
                      {msg.sender !== 'user' && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${msg.isAI ? 'bg-purple-500/20' : 'bg-blue-500/20'}`}>
                            {msg.isAI ? <FiCpu size={8} className="text-purple-400" /> : <FiUser size={8} className="text-blue-400" />}
                          </div>
                          <span className="text-[9px] text-gray-500">{msg.isAI ? 'AI' : 'Admin'}</span>
                        </div>
                      )}
                      <div className={`px-3.5 py-2.5 rounded-2xl ${
                        msg.sender === 'admin'
                          ? msg.isAI
                            ? 'bg-purple-600/20 text-purple-200 border border-purple-500/20 rounded-br-md'
                            : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-br-md'
                          : 'bg-white/[0.05] text-gray-200 border border-white/10 rounded-bl-md'
                      }`}>
                        {msg.imageUrl && (
                          <div className="mb-2 cursor-pointer" onClick={() => setViewImage(msg.imageUrl)}>
                            <img src={msg.imageUrl} alt="Gambar" className="max-w-full rounded-lg max-h-40 object-cover hover:opacity-90 transition-opacity" />
                          </div>
                        )}
                        {msg.text && <p className="text-xs whitespace-pre-wrap">{msg.text}</p>}
                        {!msg.text && msg.imageUrl && <p className="text-[10px] text-gray-400">[Gambar]</p>}
                        <p className={`text-[10px] mt-1 ${msg.sender === 'admin' ? (msg.isAI ? 'text-purple-300' : 'text-blue-200') : 'text-gray-500'}`}>
                          {msg.createdAt?.toDate?.().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) || '...'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className="p-3 border-t border-white/[0.06]">
                <div className="flex gap-2">
                  <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-xs"
                    placeholder="Ketik balasan..." disabled={loading} />
                  <button type="submit" disabled={loading || !newMessage.trim()}
                    className="px-3 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl disabled:opacity-50 active:scale-[0.95]">
                    <FiSend size={16} />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
