import "server-only";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { loginSchema, normalizeEmail } from "@/lib/validators/auth";

/**
 * NextAuth (Auth.js) options — Credentials + JWT sessions.
 *
 * Decision: next-auth v4 stable (npm `latest`) with
 * `secret: AUTH_SECRET ?? NEXTAUTH_SECRET` so the documented
 * AUTH_SECRET stays canonical. JWT strategy needs no extra
 * Account/Session tables (Phase 2 scoped schema to User/Task/TimeLog).
 *
 * The secret must be stable across restarts: rotating it invalidates
 * every issued JWT cookie (clients just re-login — no data is lost).
 * Local dev also requires NEXTAUTH_URL="http://localhost:3000"
 * (http, not https — Secure cookies are never sent over plain http
 * and every request would look logged-out).
 */
const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
if (!authSecret) {
  throw new Error(
    "Missing AUTH_SECRET (or NEXTAUTH_SECRET). Set it in .env — see .env.example.",
  );
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: authSecret,
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const email = normalizeEmail(parsed.data.email);
        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;
        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;
        return { id: user.id, name: user.name ?? undefined, email: user.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
};
