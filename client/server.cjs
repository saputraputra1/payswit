const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = process.env.PORT || 8080
const DIST = path.join(__dirname, 'dist')

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
}

http.createServer((req, res) => {
  let url = req.url === '/' ? '/index.html' : req.url
  const filePath = path.join(DIST, url)

  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(DIST, 'index.html'), (err2, data2) => {
        if (err2) {
          res.writeHead(500)
          return res.end('Error')
        }
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(data2)
      })
      return
    }
    const ext = path.extname(filePath)
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' })
    res.end(data)
  })
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Client running on port ${PORT}`)
})
