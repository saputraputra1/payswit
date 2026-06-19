# Payswit

Platform convert PayPal ↔ Rupiah, top up PayPal via bank Indonesia, dan pembayaran credit card.

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Express.js + Firebase Admin SDK
- **Database:** Firebase Firestore
- **Auth:** Firebase Authentication
- **Storage:** Firebase Storage

## Setup

### 1. Install Dependencies

```bash
# Client
cd client && npm install

# Server
cd server && npm install
```

### 2. Environment Variables

**client/.env**
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_API_URL=http://localhost:5000/api
```

**server/.env**
```
PORT=5000
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

### 3. Run

```bash
# Client (port 5173)
cd client && npm run dev

# Server (port 5000)
cd server && npm start
```

## Fitur

- Convert PayPal → IDR (manual verifikasi admin)
- Top up PayPal dari bank Indonesia (manual)
- Chat customer service real-time
- Panel admin (statistik, verifikasi transaksi, kelola user, atur kurs)
