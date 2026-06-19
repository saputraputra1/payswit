import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../services/firebase'
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where } from 'firebase/firestore'
import api from '../services/api'
import { uploadChatImage } from '../services/upload'
import { FiSend, FiMessageSquare, FiCpu, FiUser, FiImage, FiX, FiDownload } from 'react-icons/fi'

export default function Chat() {
  const { user, userData } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiTyping, setAiTyping] = useState(false)
  const [chatHistory, setChatHistory] = useState([])
  const [selectedImage, setSelectedImage] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [viewImage, setViewImage] = useState(null)
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'messages'), where('userId', '==', user.uid), orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    }, (error) => {
      console.error('Chat error:', error)
    })
    return unsub
  }, [user?.uid])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, aiTyping])

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('Hanya file gambar yang diperbolehkan')
      return
    }

    setSelectedImage(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  function removeImage() {
    setSelectedImage(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSend(e) {
    e.preventDefault()
    if ((!newMessage.trim() && !selectedImage) || !user) return

    const userMsg = newMessage.trim()
    setNewMessage('')
    setLoading(true)

    try {
      let imageUrl = null
      if (selectedImage) {
        setUploading(true)
        imageUrl = await uploadChatImage(selectedImage, user.uid)
        setUploading(false)
        removeImage()
      }

      await addDoc(collection(db, 'messages'), {
        userId: user.uid,
        userName: userData?.name || user.email,
        text: userMsg || (imageUrl ? 'Mengirim gambar...' : ''),
        sender: 'user',
        createdAt: serverTimestamp(),
        read: false,
        imageUrl: imageUrl || null,
      })

      if (userMsg) {
        setChatHistory(prev => [...prev, { role: 'user', content: userMsg }])

        setAiTyping(true)
        api.post('/ai/chat', {
          message: userMsg,
          history: chatHistory.slice(-10),
        }).then(async (aiRes) => {
          if (aiRes?.data?.reply) {
            await addDoc(collection(db, 'messages'), {
              userId: user.uid,
              userName: 'Payswit AI',
              text: aiRes.data.reply,
              sender: 'admin',
              createdAt: serverTimestamp(),
              read: true,
              isAI: true,
            })
          }
        }).catch(() => {}).finally(() => {
          setAiTyping(false)
        })
      }
    } catch (err) {
      console.error('Send error:', err)
    }
    setLoading(false)
  }

  function openImage(url) {
    setViewImage(url)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      {viewImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setViewImage(null)}>
          <button onClick={() => setViewImage(null)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white z-10">
            <FiX size={28} />
          </button>
          <img src={viewImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg cursor-default" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-8 flex flex-col flex-1">
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
              <FiMessageSquare size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-white">Chat Customer Service</h1>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <p className="text-gray-500 text-xs sm:text-sm">Online - AI & Admin siap membantu</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl sm:rounded-2xl flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
            <div className="flex justify-center">
              <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-400 flex items-center gap-2">
                <FiCpu size={12} />
                AI Assistant aktif - Admin akan merespon jika tersedia
              </div>
            </div>

            {messages.length === 0 && (
              <div className="text-center py-8 sm:py-12">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/[0.03] border border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <FiMessageSquare size={24} className="text-gray-600" />
                </div>
                <p className="text-gray-500 font-medium text-sm sm:text-base mb-2">Mulai percakapan</p>
                <p className="text-xs text-gray-600 mb-4">Ketik pesan atau kirim gambar</p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] sm:max-w-[70%]`}>
                  {msg.sender !== 'user' && (
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${msg.isAI ? 'bg-purple-500/20' : 'bg-blue-500/20'}`}>
                        {msg.isAI ? <FiCpu size={10} className="text-purple-400" /> : <FiUser size={10} className="text-blue-400" />}
                      </div>
                      <span className="text-[10px] text-gray-500">{msg.isAI ? 'AI Assistant' : 'Admin'}</span>
                    </div>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-br-md'
                      : 'bg-white/[0.05] text-gray-200 border border-white/10 rounded-bl-md'
                  }`}>
                    {msg.imageUrl && (
                      <div className="mb-2 cursor-pointer" onClick={() => openImage(msg.imageUrl)}>
                        <img src={msg.imageUrl} alt="Gambar" className="max-w-full rounded-lg max-h-48 object-cover hover:opacity-90 transition-opacity" />
                      </div>
                    )}
                    {msg.text && <p className="text-xs sm:text-sm whitespace-pre-wrap">{msg.text}</p>}
                    <p className={`text-[10px] mt-1.5 ${msg.sender === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                      {msg.createdAt?.toDate?.().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) || '...'}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {aiTyping && (
              <div className="flex justify-start">
                <div className="max-w-[70%]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <FiCpu size={10} className="text-purple-400" />
                    </div>
                    <span className="text-[10px] text-gray-500">AI sedang mengetik</span>
                  </div>
                  <div className="px-4 py-3 bg-white/[0.05] border border-white/10 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {previewUrl && (
            <div className="px-3 sm:px-4 py-2 border-t border-white/[0.06]">
              <div className="relative inline-block">
                <img src={previewUrl} alt="Preview" className="h-20 w-20 object-cover rounded-lg" />
                <button onClick={removeImage} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600">
                  <FiX size={12} />
                </button>
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-white/[0.06]">
            <div className="flex gap-2 sm:gap-3">
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={loading || uploading}
                className="px-3 py-2.5 sm:py-3.5 text-gray-400 hover:text-white bg-white/[0.03] border border-white/10 rounded-xl hover:bg-white/[0.06] transition-all disabled:opacity-50">
                <FiImage size={18} />
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 px-4 sm:px-5 py-2.5 sm:py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-xs sm:text-sm"
                placeholder="Ketik pesan atau kirim gambar..."
                disabled={loading || uploading}
              />
              <button
                type="submit"
                disabled={loading || uploading || (!newMessage.trim() && !selectedImage)}
                className="px-3.5 sm:px-5 py-2.5 sm:py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 active:scale-[0.95]"
              >
                <FiSend size={18} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
