export async function uploadImage(file) {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('key', '15a5589618c85266bea80ce880176878')

    const xhr = new XMLHttpRequest()
    xhr.open('POST', 'https://api.imgbb.com/1/upload')

    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText)
        if (res.success) {
          resolve(res.data.url)
        } else {
          reject(new Error('Gagal upload'))
        }
      } catch (e) {
        reject(new Error('Gagal upload'))
      }
    }

    xhr.onerror = () => reject(new Error('Gagal upload'))
    xhr.ontimeout = () => reject(new Error('Timeout'))

    xhr.send(formData)
  })
}
