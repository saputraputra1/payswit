# Deploy Payswit ke Railway

## Prerequisites
1. Akun Railway (https://railway.app)
2. GitHub repository
3. Firebase project sudah aktif

## Langkah 1: Push ke GitHub

```bash
cd payswit
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/payswit.git
git push -u origin main
```

## Langkah 2: Deploy Server

1. Buka https://railway.app
2. Klik **"New Project"**
3. Pilih **"Deploy from GitHub repo"**
4. Pilih repository `payswit`
5. Pilih folder `server/`
6. Railway akan auto-detect Dockerfile

### Set Environment Variables Server:

| Variable | Value |
|----------|-------|
| `PORT` | `5000` |
| `NODE_ENV` | `production` |
| `FIREBASE_PROJECT_ID` | `hallo-88de1` |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-fbsvc@hallo-88de1.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | (paste full private key) |
| `CLIENT_URL` | `https://payswit.up.railway.app` |

7. Klik **"Deploy"**
8. Tunggu sampai deploy selesai
9. Copy URL server (contoh: `https://payswit-server.up.railway.app`)

## Langkah 3: Deploy Client

1. Klik **"New Project"** lagi
2. Pilih **"Deploy from GitHub repo"**
3. Pilih repository `payswit`
4. Pilih folder `client/`
5. Railway akan auto-detect Dockerfile

### Set Environment Variables Client:

| Variable | Value |
|----------|-------|
| `VITE_FIREBASE_API_KEY` | `AIzaSyAcNTgthf-5EScESrq8nQz9jgn1m3k3d3Y` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `hallo-88de1.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `hallo-88de1` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `hallo-88de1.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `645516637787` |
| `VITE_FIREBASE_APP_ID` | `1:645516637787:web:ac6ae83f8bb74455a0717e` |
| `VITE_API_URL` | `https://payswit-server.up.railway.app/api` |

6. Klik **"Deploy"**
7. Tunggu sampai deploy selesai
8. Copy URL client (contoh: `https://payswit.up.railway.app`)

## Langkah 4: Update CORS Server

Setelah dapat URL client, update environment variable server:
- `CLIENT_URL` = `https://payswit.up.railway.app`

## Langkah 5: Custom Domain (Opsional)

1. Klik tab **"Settings"** di Railway
2. Klik **"Custom Domain"**
3. Masukkan domain Anda
4. Update DNS records sesuai instruksi Railway

## Troubleshooting

### Server error "private key invalid"
- Pastikan `FIREBASE_PRIVATE_KEY` menggunakan `\n` untuk newline
- Format: `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`

### Client tidak bisa akses API
- Pastikan `VITE_API_URL` sesuai dengan URL server Railway
- Cek CORS di server sudah mengizinkan domain client

### Build gagal
- Cek log di Railway dashboard
- Pastikan semua dependencies ada di `package.json`

## Monitoring

- Railway Dashboard: https://railway.app/dashboard
- Logs: Klik service → tab "Logs"
- Metrics: Klik service → tab "Metrics"
