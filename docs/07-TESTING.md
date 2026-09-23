# TaskFlow — Testing Strategy

Testing should happen continuously rather than only before deployment.

---

# Testing Layers

```text
Unit Tests
   ↓
Service Tests
   ↓
API Tests
   ↓
Integration Tests
   ↓
Manual UI Testing
   ↓
Production Smoke Test
```

---

# Authentication Tests

## Registration

- valid registration
- duplicate email
- invalid email
- weak/invalid input
- password hashing

## Login

- valid credentials
- wrong password
- unknown email
- empty fields

## Logout

- session invalidated
- protected page inaccessible afterward

---

# Authorization Tests

Create two users:

```text
User A
User B
```

Create:

```text
Task A → User A
Task B → User B
```

Test:

```text
A reads A → allowed
A reads B → denied
A updates A → allowed
A updates B → denied
A deletes A → allowed
A deletes B → denied
```

Repeat equivalent tests for TimeLogs.

---

# Task Tests

```text
[ ] Create
[ ] Read
[ ] Update title
[ ] Update description
[ ] Change status
[ ] Delete
[ ] Invalid input
[ ] Missing task
[ ] Unauthorized access
```

---

# Timer Tests

Critical tests:

```text
[ ] Start timer
[ ] Stop timer
[ ] Active timer returned
[ ] Refresh page
[ ] Timer continues
[ ] Duration accurate
[ ] Multiple sessions
[ ] Duplicate start rejected
[ ] Stop without active timer rejected
[ ] Wrong task rejected
```

---

# Timer Concurrency Test

Simulate two start requests close together.

Expected:

```text
Request 1 → creates active timer
Request 2 → rejected
```

There must never be two active timers for the same user.

---

# AI Tests

```text
[ ] Normal task input
[ ] Very short input
[ ] Empty input
[ ] Long input
[ ] Groq API failure
[ ] Invalid AI output
[ ] API key missing
```

---

# Daily Summary Tests

Verify:

```text
Today's logs included
Yesterday's logs excluded
Correct total seconds
Correct completed count
Correct pending count
Correct in-progress count
```

Test timezone behavior explicitly.

---

# UI Tests

Desktop:

```text
[ ] Dashboard
[ ] Tasks
[ ] Timer
[ ] Modal
[ ] Charts
```

Mobile:

```text
[ ] Navigation
[ ] Task cards
[ ] Timer
[ ] Forms
[ ] Charts
```

---

# Production Smoke Test

After deployment:

```text
Register
→ Login
→ Create task
→ AI enhance
→ Start timer
→ Wait
→ Stop
→ View logs
→ View summary
→ Logout
```

Repeat with a second account to verify data isolation.
