# TaskFlow — Deployment Plan

## Deployment Stack

```text
GitHub
   ↓
Vercel
   ↓
Next.js Application
   ↓
Neon PostgreSQL

Next.js Server
   ↓
Groq API
```

---

# Neon Setup

Create a PostgreSQL database in Neon.

Obtain:

```env
DATABASE_URL=
```

Configure it in local development and Vercel.

Do not commit the actual value.

---

# Local Environment

Create:

```text
.env.local
```

Example:

```env
DATABASE_URL="..."
AUTH_SECRET="..."
GROQ_API_KEY="..."
```

Create:

```text
.env.example
```

with empty placeholders.

---

# Prisma

Local:

```bash
npx prisma generate
npx prisma migrate dev
```

Production:

```bash
npx prisma migrate deploy
```

The production database should use migrations rather than ad-hoc schema changes.

---

# Vercel

Connect the GitHub repository to Vercel.

Configure production environment variables:

```text
DATABASE_URL
AUTH_SECRET
GROQ_API_KEY
```

If Auth.js requires a production URL/configuration for the chosen setup, configure it according to the deployed domain and current Auth.js requirements.

---

# Build

Before deployment:

```bash
npm run lint
npm run build
```

Also:

```bash
npx prisma validate
```

---

# Deployment Smoke Test

After deployment:

```text
[ ] Website opens
[ ] Registration works
[ ] Login works
[ ] Logout works
[ ] Task CRUD works
[ ] AI works
[ ] Timer works
[ ] Time logs work
[ ] Summary works
[ ] Mobile UI works
```

---

# Production Security

Verify:

```text
[ ] No secrets in Git
[ ] No secrets in client bundle
[ ] HTTPS enabled
[ ] Auth secret configured
[ ] Database accessible from deployment
[ ] Groq key configured
[ ] Error responses sanitized
```

---

# README Deployment Section

README should contain:

```text
Live Demo:
<production-url>

GitHub:
<repository-url>

Test Credentials:
<optional>
```

If test credentials are provided, use a dedicated test account rather than personal credentials.
