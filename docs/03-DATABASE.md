# TaskFlow — Database Design

## Database

PostgreSQL hosted on Neon.

ORM:

Prisma

---

# Entity Relationship Diagram

```text
┌──────────────────┐
│      User        │
├──────────────────┤
│ id PK            │
│ name             │
│ email UNIQUE     │
│ passwordHash     │
│ createdAt        │
│ updatedAt        │
└────────┬─────────┘
         │
         │ 1:N
         ▼
┌──────────────────┐
│      Task        │
├──────────────────┤
│ id PK            │
│ userId FK        │
│ title            │
│ description      │
│ status           │
│ createdAt        │
│ updatedAt        │
│ completedAt      │
└────────┬─────────┘
         │
         │ 1:N
         ▼
┌──────────────────┐
│     TimeLog      │
├──────────────────┤
│ id PK            │
│ userId FK        │
│ taskId FK        │
│ startedAt        │
│ endedAt          │
│ duration         │
│ createdAt        │
└──────────────────┘
```

---

# User

Fields:

```text
id
name
email
passwordHash
createdAt
updatedAt
```

Rules:

- `id` primary key
- `email` unique
- email normalized before storage
- password never stored in plaintext

---

# Task

Fields:

```text
id
userId
title
description
status
createdAt
updatedAt
completedAt
```

Status enum:

```text
PENDING
IN_PROGRESS
COMPLETED
```

Rules:

- Every task belongs to one user.
- User deletion should define an explicit cascade strategy.
- `completedAt` should be populated when task becomes completed.
- `completedAt` should be cleared if task moves away from completed.

---

# TimeLog

Fields:

```text
id
userId
taskId
startedAt
endedAt
duration
createdAt
```

Rules:

- Every TimeLog belongs to a user.
- Every TimeLog belongs to a task.
- `endedAt = null` means active.
- `duration` is calculated server-side.
- A stopped session should not be modified through ordinary client APIs.

---

# Data Ownership

Every query must enforce:

```text
resource.userId === authenticatedUser.id
```

Prefer database filters that enforce ownership directly.

---

# Indexes

Recommended indexes:

```text
Task:
  userId
  userId + status

TimeLog:
  userId
  taskId
  userId + startedAt
  userId + endedAt
```

The exact indexes should be validated against actual query patterns.

---

# Time Storage

Store timestamps as PostgreSQL timestamps with timezone support where appropriate.

Do not store formatted strings such as:

```text
"10:30 AM"
```

Store machine-readable timestamps.

Formatting belongs to the UI.

---

# Duration

Store duration as an integer number of seconds.

Example:

```text
45 minutes = 2700
1 hour = 3600
```

This makes aggregation simple.

---

# Daily Queries

When calculating "today", define the user's timezone explicitly.

Do not blindly use server UTC date boundaries if the product is intended to represent the user's local day.

---

# Database Rules

- Use Prisma migrations.
- Never manually modify production schema without migration.
- Never commit production secrets.
- Use transactions for multi-step operations where consistency matters.
- Keep database access inside service/data boundaries.
