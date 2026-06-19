import api from './api'

export async function uploadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = async () => {
      try {
        const base64 = reader.result.split(',')[1]
        const res = await api.post('/upload', { image: base64 })
        resolve(res.data.url)
      } catch (err) {
        reject(new Error('Gagal upload'))
      }
    }

    reader.onerror = () => reject(new Error('Gagal baca file'))
    reader.readAsDataURL(file)
  })
}
