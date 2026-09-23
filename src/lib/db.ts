import { PrismaClient } from "@prisma/client";

/**
 * Prisma singleton for Next.js (dev hot-reload safe).
 * Models: User, Task, TimeLog (see prisma/schema.prisma).
 * Database access must stay in services, never in React components.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
