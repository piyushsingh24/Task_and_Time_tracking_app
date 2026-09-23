import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { httpError } from "@/lib/errors";
import { requireOwnedTask } from "@/lib/ownership";
import type { TimeLogsQuery } from "@/lib/validators/timer";

/**
 * Phase 7 — time tracking business logic.
 *
 * Invariants (docs/02-ARCHITECTURE.md, docs/03-DATABASE.md):
 * - DB is the source of truth: startedAt/endedAt/duration live in TimeLog.
 * - endedAt = null means active. duration is null until stopped.
 * - Max one active timer per user, enforced twice:
 *   1. Service pre-check -> friendly 409 with the active timer.
 *   2. Postgres partial unique index (TimeLog_userId_active_unique)
 *      -> concurrent duplicate starts fail with P2002, mapped to 409.
 * - Duration is computed server-side on stop; clients never submit it.
 */

const activeInclude = { task: { select: { id: true, title: true, status: true } } };

export async function getActiveTimer(userId: string) {
  return db.timeLog.findFirst({
    where: { userId, endedAt: null },
    include: activeInclude,
  });
}

export async function getTaskTimer(userId: string, taskId: string) {
  await requireOwnedTask(userId, taskId);
  return db.timeLog.findFirst({
    where: { userId, taskId, endedAt: null },
    include: activeInclude,
  });
}

export async function startTimer(userId: string, taskId: string) {
  await requireOwnedTask(userId, taskId);

  const existing = await getActiveTimer(userId);
  if (existing) {
    throw httpError(409, "You already have an active timer.", "TIMER_CONFLICT");
  }

  try {
    return await db.timeLog.create({
      data: { userId, taskId },
      include: activeInclude,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // Lost a concurrent start race: the partial unique index held.
      throw httpError(409, "You already have an active timer.", "TIMER_CONFLICT");
    }
    throw err;
  }
}

export async function stopTimer(userId: string, taskId: string) {
  await requireOwnedTask(userId, taskId);

  const active = await db.timeLog.findFirst({
    where: { userId, taskId, endedAt: null },
  });
  if (!active) {
    const elsewhere = await getActiveTimer(userId);
    if (elsewhere) {
      throw httpError(
        409,
        "Your active timer is on a different task.",
        "TIMER_ELSEWHERE",
      );
    }
    throw httpError(404, "No active timer for this task.", "TIMER_NOT_FOUND");
  }

  const endedAt = new Date();
  const duration = Math.max(0, Math.floor((endedAt.getTime() - active.startedAt.getTime()) / 1000));

  return db.timeLog
    .update({
      where: { id: active.id },
      data: { endedAt, duration },
      include: activeInclude,
    })
    .catch((err) => {
      // Timer vanished between read and write (task deleted concurrently).
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        throw httpError(404, "No active timer for this task.", "TIMER_NOT_FOUND");
      }
      throw err;
    });
}

export async function listTimeLogs(userId: string, query: TimeLogsQuery) {
  if (query.taskId) await requireOwnedTask(userId, query.taskId);
  return db.timeLog.findMany({
    where: {
      userId,
      ...(query.taskId ? { taskId: query.taskId } : {}),
    },
    include: { task: { select: { id: true, title: true } } },
    orderBy: { startedAt: "desc" },
    take: query.limit,
  });
}
