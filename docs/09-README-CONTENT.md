# TaskFlow — README Content Blueprint

The final GitHub README should be concise but professional.

---

# Title

```text
TaskFlow — AI-Powered Task & Time Tracking
```

---

# Description

TaskFlow is a full-stack task and time tracking application that allows users to manage tasks, track work sessions in real time, and view daily productivity summaries. It also uses Groq AI to convert natural-language task input into clearer task titles and structured descriptions.

---

# Features

- Secure authentication
- User-specific task management
- Natural-language task creation
- AI task enhancement using Groq
- Real-time task timer
- Historical time logs
- Daily productivity summary
- Weekly analytics
- Responsive UI
- Production deployment

---

# Tech Stack

```text
Frontend:
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui

Backend:
Next.js Route Handlers
Prisma
Zod
Auth.js

Database:
PostgreSQL
Neon

AI:
Groq

Charts:
Recharts

Deployment:
Vercel
```

---

# Architecture

Briefly explain:

```text
Next.js
  ↓
Route Handlers
  ↓
Services
  ↓
Prisma
  ↓
Neon PostgreSQL
```

AI:

```text
Next.js server
  ↓
Groq API
```

---

# Local Setup

```bash
git clone <repository>
cd taskflow
npm install
```

Create `.env.local`:

```env
DATABASE_URL=
AUTH_SECRET=
GROQ_API_KEY=
```

Then:

```bash
npx prisma generate
npx prisma migrate dev
npm run dev
```

---

# Demo

Add:

```text
Live Demo: <URL>
GitHub: <URL>
```

Optional test account:

```text
Email:
Password:
```

Use a dedicated test account.

---

# Screenshots

Recommended screenshots:

1. Login
2. Dashboard
3. Create task + AI
4. Active timer
5. Time logs
6. Analytics

---

# API Documentation

Link to `04-API.md` or include a condensed endpoint table.

---

# Engineering Highlights

Mention:

- Server-side authorization
- User data isolation
- Server-side duration calculation
- Zod validation
- Modular service layer
- AI API kept server-side
- PostgreSQL relational design
- Production deployment

---

# Future Improvements

Possible future features:

- Reminders
- AI task breakdown
- AI productivity insights
- Daily goals
- Team workspaces
- Shared tasks
- Notifications
