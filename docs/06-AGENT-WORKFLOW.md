# TaskFlow — OpenCode Agent Workflow

This document defines how the project should be developed using an agentic coding tool.

---

# Golden Rule

Never ask the agent:

```text
Build the entire application.
```

Instead:

```text
One phase
→ inspect
→ implement
→ test
→ review
→ commit
```

---

# Agent Rules

Every task given to OpenCode should include:

1. Inspect repository first.
2. Understand current architecture.
3. Implement only requested scope.
4. Preserve existing features.
5. Use existing utilities before creating duplicates.
6. Validate all external input.
7. Keep secrets server-side.
8. Enforce authorization server-side.
9. Run tests/checks after implementation.
10. Explain changes.

---

# Phase 1 Prompt

```text
Inspect the repository first.

Implement the project foundation only.

Requirements:
- Next.js App Router
- TypeScript
- Tailwind
- shadcn/ui
- Prisma
- Neon PostgreSQL configuration
- Environment configuration
- Clean project structure

Do not implement authentication, tasks, timers, or AI.

Run lint, TypeScript/build checks, and Prisma validation.
Fix errors introduced by your changes.
```

---

# Phase 2 Prompt

```text
Implement the database layer only.

Create:
- User
- Task
- TimeLog

Requirements:
- Correct relations
- Status enum
- Timestamps
- Duration in seconds
- Useful indexes
- PostgreSQL/Neon compatibility

Generate Prisma migration.

Do not implement UI or API functionality yet.

Run Prisma validation and relevant checks.
```

---

# Phase 3 Prompt

```text
Implement secure authentication.

Requirements:
- Registration
- Login
- Logout
- Password hashing
- Auth.js session
- Protected routes

Create a reusable requireAuth helper.

Do not implement task CRUD yet.

Test unauthenticated and authenticated flows.
```

---

# Phase 4 Prompt

```text
Implement authorization infrastructure.

Every protected resource must be scoped to the authenticated user's ID.

Create reusable authorization patterns.

Verify:
- user can only access own tasks
- user can only modify own tasks
- user can only access own time logs

Do not implement new product features.
Focus on secure reusable infrastructure.
```

---

# Phase 5 Prompt

```text
Implement Task CRUD.

Endpoints:
POST /api/tasks
GET /api/tasks
GET /api/tasks/:id
PATCH /api/tasks/:id
DELETE /api/tasks/:id

Use:
- Zod
- authentication
- ownership checks
- service layer
- consistent responses

Build the required task UI.

Do not implement AI or timers.
```

---

# Phase 6 Prompt

```text
Implement Groq AI task enhancement.

Endpoint:
POST /api/ai/task-suggest

Input:
{
  "input": "follow up with designer"
}

Return:
{
  "title": "...",
  "description": "..."
}

Keep the API key server-side.
Validate the AI response.
Handle API failures.
Integrate into task creation.
```

---

# Phase 7 Prompt

```text
Implement time tracking.

Endpoints:
POST /api/tasks/:id/timer/start
POST /api/tasks/:id/timer/stop
GET /api/tasks/:id/timer
GET /api/time-logs

Requirements:
- Ownership verification
- One active timer per user
- Server-side duration calculation
- Refresh-safe timer
- Historical time logs

Account for concurrent start requests.
```

---

# Phase 8 Prompt

```text
Implement the dashboard.

Include:
- today's total tracked time
- tasks worked on
- completed tasks
- pending tasks
- in-progress tasks
- active timer
- today's tasks

Create:
GET /api/summary/today

Keep business logic in services.
```

---

# Phase 9 Prompt

```text
Implement optional weekly analytics.

Include:
- time tracked by day
- completed tasks by day
- time per task

Use Recharts.

Do not modify existing authentication or timer logic unnecessarily.
```

---

# Phase 10 Prompt

```text
Perform a production readiness review.

Do not add new features.

Inspect:
- auth
- authorization
- data isolation
- input validation
- timer correctness
- concurrency
- error handling
- secrets
- responsive UI
- build
- lint
- Prisma

Fix genuine issues.

Report:
- issues found
- fixes made
- remaining risks
```

---

# Agent Output Requirement

After every phase, ask the agent to report:

```text
## Implemented

...

## Files Changed

...

## Checks Run

...

## Security Review

...

## Remaining Issues

...
```

---

# Human Review Checklist

The developer should manually inspect:

```text
[ ] Database queries
[ ] Authorization logic
[ ] Timer logic
[ ] AI API usage
[ ] Environment variables
[ ] UI behavior
[ ] Error states
[ ] Git diff
```

Do not blindly accept agent-generated code.
