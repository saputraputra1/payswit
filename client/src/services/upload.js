import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'

export async function uploadChatImage(file, userId) {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now()
    const filename = `${timestamp}_${file.name}`
    const storageRef = ref(storage, `chat/${userId}/${filename}`)

    const task = uploadBytesResumable(storageRef, file)

    task.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        console.log(`[Upload] ${progress.toFixed(0)}%`)
      },
      (error) => {
        console.error('[Upload] Error:', error)
        if (error.code === 'storage/unauthorized') {
          reject(new Error('Tidak punya akses upload'))
        } else if (error.code === 'storage/canceled') {
          reject(new Error('Upload dibatalkan'))
        } else {
          reject(new Error('Gagal upload gambar'))
        }
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(task.snapshot.ref)
          resolve(downloadUrl)
        } catch (err) {
          reject(new Error('Gagal dapatkan URL gambar'))
        }
      }
    )
  })
}

export async function uploadImage(file, path = 'uploads') {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now()
    const filename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
    const storageRef = ref(storage, `${path}/${filename}`)

    const metadata = {
      contentType: file.type,
    }

    const task = uploadBytesResumable(storageRef, file, metadata)

    task.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        console.log(`[Upload] ${progress.toFixed(0)}%`)
      },
      (error) => {
        console.error('[Upload] Error:', error.message)
        reject(error)
      },
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref)
          resolve(url)
        } catch (err) {
          reject(err)
        }
      }
    )
  })
}
