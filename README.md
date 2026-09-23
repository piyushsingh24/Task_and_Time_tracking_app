# TaskFlow — AI-Powered Task & Time Tracking

TaskFlow is a full-stack task and time tracking application. Users manage tasks, track work sessions in real time with one active timer, and review daily summaries plus weekly analytics. Groq AI turns natural-language notes into clear task titles and descriptions.

✅ **Live demo:** <https://your-app.vercel.app> <!-- TODO: replace with the Vercel URL after Phase 14 deploy -->

✅ **Working auth:** email + password (Auth.js credentials, bcrypt hashing, JWT sessions). Register at `/register`, log in at `/login`.

> **Test credentials (for reviewers):** use this dedicated demo account — or register your own in seconds.
>
> - Email: `demo@taskflow.example`
> - Password: `DemoPass123!`
>
> <!-- TODO: create this account after deploy (register once on the live site), or replace with real demo credentials. Never use personal credentials. -->

## Features

- Secure authentication (register / login / logout)
- User-specific task management (create, read, update, delete, search, status filter, due dates)
- Natural-language task creation with Groq AI enhancement
- Real-time task timer (one active timer per user, refresh-safe, server-side duration)
- Historical time logs (table on desktop, cards on mobile, per-task filter)
- Daily productivity summary (timezone-aware)
- Weekly analytics (time by day, completions by day, time per task)
- Responsive, accessible UI with loading / empty / error states, due-date alerts on the dashboard
- Production deployment (Vercel + Neon PostgreSQL)

## Tech Stack

Frontend: Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, Recharts

Backend: Next.js Route Handlers, Prisma, Zod, Auth.js (next-auth)

Database: PostgreSQL (Neon)

AI: Groq (`openai/gpt-oss-20b`, overridable via `GROQ_MODEL`)

Deployment: Vercel

## Architecture

```text
Next.js
  ↓
Route Handlers (requireAuth → Zod → service → response)
  ↓
Services (task / timer / summary / analytics / ai)
  ↓
Prisma
  ↓
Neon PostgreSQL
```

AI:

```text
Next.js server
  ↓
Groq API (key stays server-side, response Zod-validated)
```

Key invariants: user ID always derived server-side from the session (never client input); cross-user access returns 404; timer durations computed server-side; one active timer per user enforced by a Postgres partial unique index plus service checks.

## Local Setup

```bash
git clone <repository-url>
cd taskflow
npm install
```

Create `.env` (see `.env.example`):

```env
DATABASE_URL=
AUTH_SECRET=
GROQ_API_KEY=
```

Then:

```bash
npx prisma migrate dev
npm run dev
```

Checks:

```bash
npm run lint
npx tsc --noEmit
npm run build
npx prisma validate
```

## API

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| POST | `/api/auth/register` | No | Register (201, 409 on duplicate) |
| GET | `/api/auth/session` | — | Current session user (401 anon) |
| POST | `/api/tasks` | Yes | Create task (201, optional `dueDate: YYYY-MM-DD`) |
| GET | `/api/tasks?status=&search=` | Yes | Own tasks |
| GET | `/api/tasks/:id` | Yes | One task (404 unless owned) |
| PATCH | `/api/tasks/:id` | Yes | Update title/description/status/due date (`dueDate: null` clears) |
| DELETE | `/api/tasks/:id` | Yes | Delete (logs cascade) |
| POST | `/api/tasks/:id/timer/start` | Yes | Start (201, 409 if active) |
| POST | `/api/tasks/:id/timer/stop` | Yes | Stop, server duration |
| GET | `/api/tasks/:id/timer` | Yes | Active log for task (or null) |
| GET | `/api/timer/active` | Yes | Global active log (or null) |
| GET | `/api/time-logs?taskId=&limit=` | Yes | History (own only) |
| GET | `/api/tasks/:id/time-logs` | Yes | Per-task history |
| GET | `/api/summary/today?tz=` | Yes | Daily summary (timezone-aware) |
| GET | `/api/analytics/weekly?tz=` | Yes | Last-7-days analytics |
| POST | `/api/ai/task-suggest` | Yes | `{input}` → `{title, description}` |

All responses use `{ success: true, data }` / `{ success: false, error: { code, message } }`. Full spec: [`docs/04-API.md`](docs/04-API.md).

## Engineering Highlights

- Server-side authorization on every protected route (`requireUserId` + ownership-scoped queries)
- IDOR-safe 404s (no existence leak across users)
- Server-side timer durations; DB partial unique index guarantees one active timer under concurrency
- Zod validation on all external input; sanitized error envelope
- Modular service layer; Prisma isolated from components
- Groq key server-only; AI output schema-validated with graceful 502/503s
- Timezone-explicit day boundaries (UTC default, `?tz=` override)
- 100+ automated checks across phases (auth, CRUD, timer incl. race test, summary, analytics, regression)

## Screenshots

<!-- TODO: add after deploy: login, dashboard, create task + AI, active timer, time logs, analytics -->

## Future Improvements

- Reminders and daily goals
- AI task breakdown and productivity insights
- Team workspaces and shared tasks
- Notifications
- Rate limiting (Upstash / Vercel WAF)
