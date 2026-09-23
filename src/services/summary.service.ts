import "server-only";
import { db } from "@/lib/db";
import { todayBounds } from "@/lib/day";

/**
 * Phase 10 — daily summary, computed (never stored).
 *
 * Rules:
 * - "Today" is defined in the caller's timezone (?tz=, default UTC).
 * - totalTrackedSeconds = SUM(duration) of stopped sessions started today.
 *   Running timers have no duration yet and are excluded from the total.
 * - tasksWorkedOn = distinct tasks with any session started today
 *   (running sessions count — that work happened today).
 * - Status counts cover all of the user's current tasks.
 */
export async function getTodaySummary(userId: string, tz: string) {
  const { start, end, date } = todayBounds(tz);

  const [agg, worked, groups] = await Promise.all([
    db.timeLog.aggregate({
      where: { userId, startedAt: { gte: start, lt: end }, duration: { not: null } },
      _sum: { duration: true },
    }),
    db.timeLog.findMany({
      where: { userId, startedAt: { gte: start, lt: end } },
      select: { taskId: true },
      distinct: ["taskId"],
    }),
    db.task.groupBy({
      by: ["status"],
      where: { userId },
      _count: { status: true },
    }),
  ]);

  const counts: Record<string, number> = { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0 };
  for (const g of groups) counts[g.status] = g._count.status;

  return {
    date,
    totalTrackedSeconds: agg._sum.duration ?? 0,
    tasksWorkedOn: worked.length,
    completedTasks: counts.COMPLETED,
    pendingTasks: counts.PENDING,
    inProgressTasks: counts.IN_PROGRESS,
  };
}
