# Osteopathy site

## Environments and Variables

Frontend (.env at project root)

- `VITE_API_URL` — backend base URL (e.g. `http://localhost:4000` or Railway backend URL)
- `VITE_BASENAME` — optional, base path for router (not needed for Railway; for GitHub Pages use `/osteopathy`)

Backend (`server/.env`)

- `PORT` — default `4000`
- `MONGODB_URI` — Mongo connection string
- `JWT_SECRET` — strong random secret
- `ADMIN_USERNAME` — admin login
- `ADMIN_PASSWORD_HASH` — bcrypt hash (`cd server && npm run hash -- yourPassword`)
- `CORS_ORIGIN` — frontend URL(s), comma-separated, without trailing slash
- `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` — public rate limit window/max
- `LOGIN_RATE_LIMIT_WINDOW_MS` / `LOGIN_RATE_LIMIT_MAX` — login rate limit

## Local Development

1. Backend
   - `cd server`
   - Create `server/.env` (use `server/ENV.example`)
   - `npm install`
   - `npm run dev`
   - Health: `http://localhost:4000/health`

2. Frontend
   - Create `.env` at repo root (optional):
     ```
     VITE_API_URL=http://localhost:4000
     ```
   - `npm install`
   - `npm run dev`
   - Open dev URL from Vite

## Deploy to Railway (one repo → 3 services)

1) Create Project → Deploy from GitHub

2) Add Database → MongoDB
   - Copy connection string from DB service variables (e.g. `MONGODB_URL`)

3) Add Backend (Node.js)
   - Root Directory: `server`
   - Build: `npm ci --omit=dev`
   - Start: `npm run start`
   - Variables: set
     - `MONGODB_URI` — from DB service
     - `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`
     - `CORS_ORIGIN` — later set to frontend public URL (no trailing slash)
   - Expose service → Generate domain → test `/health`

4) Add Frontend (Static Site)
   - Root Directory: project root
   - Build: `npm ci && npm run build`
   - Output: `dist`
   - Variables: set
     - `VITE_API_URL` — backend public URL
   - Deploy → copy frontend URL

5) Finalize CORS
   - Backend → `CORS_ORIGIN` = frontend URL (no trailing slash)
   - Redeploy backend

## Admin

- Admin page: `/admin`
- Login: `ADMIN_USERNAME` + password used to generate `ADMIN_PASSWORD_HASH`
- Manage appointments and schedule
