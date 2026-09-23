# TaskFlow — API Specification

## API Conventions

Base path:

```text
/api
```

Authentication:

```text
Session-based authentication
```

All protected endpoints derive the user from the authenticated session.

---

# Response Format

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

---

# Authentication

Authentication routes are managed through Auth.js.

Application routes:

```text
/register
/login
/logout
```

---

# Tasks

## Create Task

```text
POST /api/tasks
```

Request:

```json
{
  "title": "Follow up with designer",
  "description": "Confirm wireframe delivery status",
  "status": "PENDING"
}
```

Response:

```text
201 Created
```

---

## Get Tasks

```text
GET /api/tasks
```

Only return tasks owned by authenticated user.

Optional future query parameters:

```text
?status=PENDING
?search=designer
?sort=createdAt
```

---

## Get Task

```text
GET /api/tasks/:id
```

If task does not belong to current user:

```text
404 Not Found
```

Do not leak whether another user's resource exists.

---

## Update Task

```text
PATCH /api/tasks/:id
```

Possible fields:

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "COMPLETED"
}
```

---

## Delete Task

```text
DELETE /api/tasks/:id
```

Must verify ownership.

---

# Timer

## Start

```text
POST /api/tasks/:id/timer/start
```

Rules:

- authenticated
- task belongs to user
- user has no active timer

Success:

```text
201 Created
```

Conflict:

```text
409 Conflict
```

---

## Stop

```text
POST /api/tasks/:id/timer/stop
```

Rules:

- authenticated
- task belongs to user
- active timer exists

Calculate duration on the server.

---

## Get Active Timer

```text
GET /api/tasks/:id/timer
```

Return active TimeLog if one exists.

---

# Time Logs

## All Logs

```text
GET /api/time-logs
```

Only return current user's logs.

---

## Task Logs

```text
GET /api/tasks/:id/time-logs
```

Verify task ownership first.

---

# Daily Summary

```text
GET /api/summary/today
```

Return:

```json
{
  "date": "2026-09-22",
  "totalTrackedSeconds": 14400,
  "tasksWorkedOn": 4,
  "completedTasks": 2,
  "pendingTasks": 1,
  "inProgressTasks": 1
}
```

---

# AI Task Suggestion

```text
POST /api/ai/task-suggest
```

Request:

```json
{
  "input": "follow up with designer"
}
```

Response:

```json
{
  "title": "Follow Up with UI Designer",
  "description": "Contact the UI designer to confirm wireframe delivery status."
}
```

---

# HTTP Codes

```text
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity (when appropriate)
500 Internal Server Error
```

---

# API Security Checklist

Every protected endpoint:

```text
[ ] Session checked
[ ] User ID derived server-side
[ ] Input validated
[ ] Ownership verified
[ ] Business rules verified
[ ] Errors sanitized
[ ] Correct HTTP status
```
