# 🏥 Smart Clinic Queue v2.0

A complete, production-ready **Smart Clinic Queue** platform — MERN + React Native monorepo.

> **Patient PWA + Doctor Dashboard + Android App** sharing a single Node.js + Socket.IO backend.

---

## 📸 Preview

| Welcome | Patient Home | Doctor Dashboard |
|---|---|---|
| Dark gradient welcome | Live queue + stats | Call-next, analytics |

---

## 🛠 Tech Stack

| Layer | Tech |
|---|---|
| Backend | Node.js · Express · MongoDB · Mongoose · Socket.IO · JWT |
| Web App | React 18 · Vite · Tailwind CSS · Zustand · Framer Motion |
| Push Notifications | FCM (Android) · Web Push API |
| Realtime | Socket.IO (WebSocket + polling) |
| Cron | node-cron (midnight reset) |
| SMS OTP | Twilio (stubbed in dev) |

---

## 📁 Project Structure

```
smart-clinic-queue/
├── server/               # Node.js Express backend
│   ├── config/           # DB + Firebase init
│   ├── models/           # Mongoose schemas
│   ├── controllers/      # Business logic
│   ├── routes/           # REST API routes
│   ├── middleware/        # Auth, roles, rate limiter
│   ├── services/         # FCM, SMS, queue logic
│   ├── socket/           # Socket.IO manager
│   ├── cron/             # Midnight reset job
│   ├── uploads/          # Clinic logos
│   ├── seed.js           # Demo data seeder
│   └── server.js         # Entry point
│
├── web/                  # React + Vite PWA
│   ├── src/
│   │   ├── api/          # Axios instance
│   │   ├── components/   # Patient + Doctor screens
│   │   ├── hooks/        # useSocket, useQueue, useAuth
│   │   ├── store/        # Zustand stores
│   │   └── utils/        # Helpers
│   └── package.json
│
└── mobile/               # React Native (Expo) — Phase 3
```

---

## 🚀 Quick Start

### Prerequisites

- [Node.js v18+](https://nodejs.org)
- [MongoDB Community](https://www.mongodb.com/try/download/community) running on port 27017
- Git

---

### 1. Backend Setup

```bash
cd server
copy .env.example .env    # Windows
# Fill in JWT_SECRET at minimum — rest can be left as-is for dev
npm install
```

**Configure `server/.env`:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart-clinic-queue
JWT_SECRET=a_strong_random_secret_at_least_32_chars_here
NODE_ENV=development
```

**Start MongoDB** (install if needed):
```bash
# Start MongoDB service on Windows
net start MongoDB

# OR run mongod directly
mongod --dbpath C:\data\db
```

**Seed the demo database:**
```bash
node seed.js
```

You'll see output like:
```
Clinic ID: 68abc123def456...   ← copy this!

Demo Credentials:
  Doctor  → 9000000001 / doctor123
  Patient → 9876543210 (OTP will print in console)
```

**Start the server:**
```bash
npm run dev    # nodemon, auto-restarts
```
Server runs on: `http://localhost:5000`

---

### 2. Web App Setup

```bash
cd web
copy .env.example .env    # Windows
```

**Configure `web/.env`:**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_CLINIC_ID=<paste Clinic ID from seed output>
```

**Install and run:**
```bash
npm install
npm run dev
```
Web app runs on: `http://localhost:5173`

---

## 🔐 Demo Credentials

| Role | Phone | Password / OTP |
|---|---|---|
| Doctor | 9000000001 | doctor123 |
| Patient | 9876543210 | Printed in server console |
| Patient | 9876543211 | Printed in server console |

**Doctor Dashboard:** Visit `http://localhost:5173/doctor/login`  
**Patient App:** Visit `http://localhost:5173/`

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/send-otp` | — | Send OTP to patient |
| POST | `/api/auth/verify-otp` | — | Verify OTP, get JWT |
| POST | `/api/auth/doctor-login` | — | Doctor login |
| GET | `/api/queue/session/live?clinicId=` | Optional | Live queue state |
| POST | `/api/queue/call-next` | Doctor | Call next patient |
| POST | `/api/queue/skip` | Doctor | Skip patient |
| POST | `/api/queue/toggle-accepting` | Doctor | Pause/resume bookings |
| POST | `/api/token/book` | Patient | Book a token |
| GET | `/api/token/my-active` | Patient | My active token |
| GET | `/api/analytics/summary` | Doctor | Today + weekly stats |
| GET | `/api/health` | — | Health check |

---

## 🔌 Socket Events

| Direction | Event | Payload |
|---|---|---|
| Client → | `JOIN_CLINIC` | `{ clinicId }` |
| Server → | `QUEUE_UPDATED` | Full queue payload |
| Server → | `PATIENT_CALLED` | `{ tokenNumber, displayToken, message }` |
| Server → | `HEADS_UP` | `{ tokenNumber, ahead, message }` |
| Server → | `SESSION_CLOSED` | `{ clinicId, message }` |

---

## 🏗 Features Implemented

- ✅ OTP phone login (4-digit, 5 min expiry, bcrypt hashed, rate-limited)
- ✅ Doctor login with bcrypt password
- ✅ Real-time queue via Socket.IO
- ✅ Token booking with duplicate check + working hours guard
- ✅ Call-next with FCM + socket notifications
- ✅ Heads-up notification 2 patients before turn
- ✅ Skip / complete / cancel tokens
- ✅ Queue close + midnight auto-reset cron
- ✅ Doctor analytics dashboard (bar + hourly charts)
- ✅ Patient QR code token
- ✅ Name privacy masking ("Rahul D.")
- ✅ Offline banner (PWA)
- ✅ FCM graceful stub when Firebase unconfigured
- ✅ JWT role-based access control
- ✅ Framer Motion screen transitions
- ✅ React Hot Toast notifications
- ✅ PWA installable (vite-plugin-pwa)

---

## 🔥 Firebase (Optional — for Android Push)

1. Create a Firebase project
2. Download `serviceAccountKey.json`
3. Add to `server/.env`:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@xxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Without these, the server runs in stub mode (logs to console only).

---

## 📱 Phase 3 — Mobile App (React Native)

The mobile app will be built in the `mobile/` directory using Expo SDK 51.

Features planned:
- Biometric lock (Expo Local Authentication)
- Native FCM push (Expo Notifications)
- Deep linking
- Pull-to-refresh
- Haptic feedback

---

## 🏗 Build for Production

```bash
# Web
cd web
npm run build   # outputs to web/dist/

# Server — set NODE_ENV=production in .env
```

---

## 📄 License

MIT — Free to use for academic and personal projects.
