# AttendEase — Presence you can prove

Classroom attendance with **rotating QR tokens screenshots can't share**,
device-binding proxy detection, audited teacher overrides and analytics.

---

## Problem Statement

Roll-call eats class time, and proxy attendance via shared screenshots is
routine. Even QR systems fail if the code is static — forward it to a friend
and they're "present". AttendEase rotates the classroom code every minute,
binds one check-in per student per session, and flags shared devices.

## Target Users

- **Teachers** who want attendance in seconds, not minutes.
- **Students** who want a fair, transparent system with visible reasons.
- **Institutions** needing below-75% warnings and CSV records.

## Solution

The teacher's screen shows a code (HMAC of session + minute bucket) that
re-renders every 15s and rotates every 60s; the current and previous bucket
are accepted for clock drift. Students type it in — one record per (student,
session) enforced at the DB level; a second device for the same student is a
409, and the same device for two different students flags an anomaly the
teacher sees on the roster. Closing the session auto-marks everyone unmarked
as absent. Every manual override stores who/why.

## Key Features

- **Rotating tokens** — minute-bucket HMAC, ±1 drift window, 12-char codes.
- **Device binding** — best-effort fingerprint (UA + language hash): same
  device re-submit is idempotent, a different device 409s, a shared device
  across students flags both records.
- **Audited overrides** — absent/excused changes require a reason; students
  and the audit trail show it.
- **Auto-close** — session close bulk-marks unmarked students absent.
- **Analytics** — per-student percentage with below-75% warnings, session
  heatmap, CSV export.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS 4, React Router 6, Axios |
| Backend | Node.js, Express 4, Mongoose 8, Zod validation |
| Security | HMAC rotating session tokens (crypto), JWT, `teacher`/`student` roles, check-in rate limiting |
| Database | MongoDB (Atlas or local); `USE_MEMORY_DB=1` zero-config demo |
| Tests | `node:test` + `mongodb-memory-server` (22 checks incl. token-rotation tests) |
| Deployment | Render (backend `render.yaml`) + Vercel (frontend `vercel.json`) |

## Architecture

```text
React SPA (Vercel)
   │  axios + JWT (device fingerprint from request headers)
   ▼
Express API (Render)
   │   /api/courses                    CRUD, enroll by email, sessions
   │   /api/sessions/:id/qr            teacher: current rotating token
   │   /api/sessions/:id/checkin       student: verify bucket + enrollment
   │   │                                 idempotent per device; cross-device 409
   │   /api/sessions/:id/roster        live roster with anomaly flags
   │   /api/attendance/:id/override    reason-required, audited
   │   /api/sessions/:id/close         auto-absent the unmarked
   │   /api/courses/:id/analytics      percentages, heatmap, warnings
   │   /api/courses/:id/export.csv     per-session marks (teacher)
   ▼
utils/sessionToken.js — makeToken / verifyToken / deviceHash
   ▼
MongoDB: User (role) · Course (students[]) · Session · Attendance (unique session+student)
```

## Major Workflows

1. **Run a course** — create courses, enroll students by email, start timed
   sessions.
2. **Take attendance live** — the QR panel rotates; the roster ticks up in
   real submissions; anomalies (shared devices) flagged inline.
3. **Students check in** — type the on-screen code; idempotent re-submits;
   device-bound records.
4. **Override & close** — reasons are mandatory and visible; close marks the
   rest absent automatically.
5. **Analytics & export** — percentages, heatmap, below-75% warnings, CSV.

## Local Setup

```bash
# 1. Backend
cd backend
npm install
npm test                       # 22-check suite (no database needed)

# Zero-config demo:
USE_MEMORY_DB=1 npm start      # API on http://localhost:5112

# Or with a real MongoDB:
cp .env.example .env           # set MONGODB_URI + JWT_SECRET
npm run seed
npm start

# 2. Frontend
cd ../frontend
npm install
npm run dev                    # app on http://localhost:5312
```

**Demo credentials** (password `Demo@1234`): `prof@demo.com` (teacher, CS301
Databases + CS305 Networks), `aarav@demo.com`, `diya@demo.com` … 12 students.
Seed: 8 past sessions with varied attendance, two students below 75%, one
audited override, one shared-device anomaly pair.

## Environment Variables

### backend/.env

| Name | Purpose |
|---|---|
| `PORT` | API port (default 5112) |
| `MONGODB_URI` | MongoDB connection string (empty + `USE_MEMORY_DB=1` for demo mode) |
| `USE_MEMORY_DB` | `1` = ephemeral in-memory MongoDB, auto-seeded on boot |
| `JWT_SECRET` | Signs JWTs and derives per-session HMAC keys |
| `CLIENT_ORIGIN` | Frontend origin allowed by CORS (default http://localhost:5312) |

### frontend/.env

| Name | Purpose |
|---|---|
| `VITE_API_URL` | Backend API base URL (default http://localhost:5112/api) |

## API Overview

| Method & path | Purpose |
|---|---|
| `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me` | Auth (teacher/student) |
| `POST /api/courses` · `GET /api/courses` · `POST /api/courses/:id/enroll` | Courses |
| `POST /api/courses/:id/sessions` | Start a timed session |
| `GET /api/sessions/:id/qr` | Current rotating token (teacher) |
| `POST /api/sessions/:id/checkin` | Student check-in (rate-limited, device-bound) |
| `GET /api/sessions/:id/roster` | Live roster + anomalies |
| `PATCH /api/attendance/:id/override` | Reason-required status change |
| `POST /api/sessions/:id/close` | Auto-absent the unmarked |
| `GET /api/courses/:id/analytics` · `GET /api/courses/:id/export.csv` | Analytics + export |
| `GET /api/health` | Health probe |

## Deployment

- **Backend**: Render web service from `backend/render.yaml`; set `MONGODB_URI`,
  `JWT_SECRET`, `CLIENT_ORIGIN`; health check `/api/health`.
- **Frontend**: Vercel from `frontend/` (SPA rewrite); set `VITE_API_URL`.

Live links: backend — [add URL] · frontend — [add URL]

## Error Handling & Security

- Zod validation everywhere; inverted session windows rejected; closed
  sessions refuse check-ins and stop emitting tokens.
- Check-in rate-limited (10/min) against token brute-forcing; HMAC secrets are
  per-session derivatives of the server secret.
- Device fingerprints are a documented best-effort signal — the DB-level
  unique (session, student) index is the real boundary; anomalies are flags,
  never automatic punishments (the teacher decides).
- Teacher routes verify course ownership; students are enrollment-checked.
- bcrypt(12) hashing, no account enumeration, 7-day JWTs, 401 auto-logout.

- **Defaulter radar** — ranked sub-threshold students with risk levels (watch/high/critical) and how many classes they need to attend.
- **Student month calendar** — per-day attendance status for any month.

## Roadmap

- Real camera QR scanning of the rotating code.
- Geofenced check-ins for large halls.
- Institute-wide dashboards and parent digests.
- Timetable integration for automatic session scheduling.
