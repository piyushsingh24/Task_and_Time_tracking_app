# TaskFlow — System Architecture

## Architecture Decision

TaskFlow will use a **modular monolith**.

Do not introduce microservices for this assignment.

Why:

- Easier development
- Easier deployment
- Lower infrastructure complexity
- Easier debugging
- Suitable for the assignment scale
- Still demonstrates strong backend architecture

---

# High-Level Architecture

```text
                         ┌───────────────┐
                         │    Browser    │
                         │ React / Next  │
                         └───────┬───────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │      Next.js Server    │
                    │                        │
                    │ Route Handlers         │
                    │ Auth.js                │
                    │ Validation             │
                    │ Services               │
                    └──────┬──────────┬──────┘
                           │          │
                           ▼          ▼
                  ┌────────────┐   ┌──────────┐
                  │   Prisma   │   │  Groq    │
                  └─────┬──────┘   └──────────┘
                        │
                        ▼
                ┌────────────────┐
                │ Neon PostgreSQL│
                └────────────────┘
```

---

# Application Layers

## 1. UI Layer

Responsible for:

- Rendering
- User interaction
- Client state
- Loading states
- Error states

Should not contain database logic.

---

## 2. API Layer

Responsible for:

- HTTP requests
- Authentication checks
- Input validation
- Calling services
- HTTP responses

Example:

```text
POST /api/tasks
        ↓
authenticate
        ↓
validate
        ↓
taskService.create()
        ↓
response
```

---

## 3. Service Layer

Responsible for business rules.

Examples:

```text
task.service.ts
timer.service.ts
time-log.service.ts
summary.service.ts
ai.service.ts
```

Services should not depend on React components.

---

## 4. Data Layer

Prisma handles:

- Database queries
- Transactions
- Relations
- Data persistence

---

# Recommended Request Flow

```text
Browser
   ↓
Route Handler
   ↓
requireAuth()
   ↓
Zod validation
   ↓
Service
   ↓
Prisma
   ↓
Neon PostgreSQL
   ↓
Service
   ↓
Route Handler
   ↓
Browser
```

---

# Authentication Flow

```text
Register
   ↓
Validate
   ↓
Hash password
   ↓
Create User
   ↓
Login
   ↓
Auth.js session
   ↓
Protected application
```

---

# Authorization Flow

Every protected request:

```text
Request
   ↓
Auth session
   ↓
Get authenticated user ID
   ↓
Query only resources owned by user
   ↓
Return resource
```

Never:

```text
Client userId
    ↓
Database
```

---

# AI Flow

```text
Natural language task
        ↓
Next.js API
        ↓
Zod validation
        ↓
AI service
        ↓
Groq API
        ↓
Validate structured response
        ↓
Return suggestion
```

The Groq key must never reach the browser.

---

# Timer Architecture

The timer has two responsibilities.

## Server

Source of truth:

```text
startedAt
endedAt
duration
```

## Client

Display:

```text
current time - startedAt
```

Flow:

```text
START
  ↓
Server creates TimeLog
  ↓
startedAt returned
  ↓
Client calculates live elapsed time
  ↓
STOP
  ↓
Server calculates final duration
```

---

# Concurrency Rule

A user can have at most one active timer.

Use a database-safe strategy to prevent duplicate active sessions.

The implementation should account for two simultaneous start requests, not just a frontend button disable.

---

# Daily Summary Architecture

Do not store the daily summary as duplicated data initially.

Calculate it from:

- Tasks
- TimeLogs

Example:

```text
Today's total time
=
SUM(TimeLog.duration)
where startedAt belongs to today
```

This prevents stale summary data.

---

# Scalability Direction

If the product grows later:

```text
Current:

Next.js
  │
  └── PostgreSQL

Future:

API Gateway
    │
    ├── Auth Service
    ├── Task Service
    ├── Timer Service
    ├── Analytics Service
    └── AI Service
```

Do not build the future architecture now.

---

# Security Boundaries

Secrets:

```text
GROQ_API_KEY
AUTH_SECRET
DATABASE_URL
```

must remain server-side.

Client receives only required application data.

---

# Architecture Definition of Done

- [ ] Clear UI/API/service/data separation
- [ ] Authentication centralized
- [ ] Authorization reusable
- [ ] Business logic in services
- [ ] Prisma isolated from UI
- [ ] AI isolated in service
- [ ] Timer source of truth is database
- [ ] No client-controlled ownership
