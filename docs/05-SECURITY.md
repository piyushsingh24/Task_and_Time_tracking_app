# TaskFlow — Security Requirements

Security is a first-class requirement.

---

# Authentication

Requirements:

- Hash passwords securely.
- Never store plaintext passwords.
- Use secure sessions.
- Protect authenticated pages.
- Do not expose password hashes in API responses.

---

# Authorization

The most important rule:

> A user can only access resources belonging to that user.

Bad:

```text
GET /api/tasks/123
```

and blindly return task 123.

Correct:

```text
Find task where:
id = 123
AND userId = authenticatedUserId
```

---

# IDOR Prevention

Prevent insecure direct object references.

Test:

```text
User A
  ↓
tries to access
  ↓
User B task ID
```

Expected:

```text
404 Not Found
```

or another deliberately safe response.

Never return User B's task.

---

# Client Trust

Never trust:

```json
{
  "userId": "..."
}
```

for ownership.

The server determines ownership from the session.

---

# AI Security

The Groq API key:

```text
GROQ_API_KEY
```

must be server-side only.

Never:

```text
NEXT_PUBLIC_GROQ_API_KEY
```

Never send the secret to React.

---

# Input Validation

Validate all:

- request bodies
- query parameters
- route parameters
- authentication fields
- AI inputs

Use Zod.

---

# Error Handling

Do not return:

```text
Prisma stack trace
database credentials
internal file paths
API keys
```

to users.

Return safe error messages.

Log detailed errors server-side when appropriate.

---

# Rate Limiting

For the assignment, rate limiting is optional.

If implemented, prioritize:

```text
AI endpoint
Login
Registration
```

because these can be abused.

---

# Timer Security

The server calculates:

```text
startedAt
endedAt
duration
```

The client cannot submit an arbitrary duration and claim it was tracked.

---

# Environment Variables

Example:

```env
DATABASE_URL=
AUTH_SECRET=
GROQ_API_KEY=
```

Never commit actual values.

Provide:

```text
.env.example
```

instead.

---

# Security Testing

Before deployment:

```text
[ ] User isolation
[ ] Protected API
[ ] Protected pages
[ ] No client secrets
[ ] No plaintext passwords
[ ] Input validation
[ ] Safe errors
[ ] Timer ownership
[ ] AI key protection
```
