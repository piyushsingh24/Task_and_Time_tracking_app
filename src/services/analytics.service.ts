import "server-only";
import { db } from "@/lib/db";
import { localDate, weekBounds } from "@/lib/day";

/**
 * Phase 12 — weekly analytics, computed (never stored).
 * Window: last 7 days including today, defined in ?tz= (default UTC).
 * - days: per-day tracked seconds (stopped sessions by startedAt)
 *   + tasks completed that day (by completedAt).
 * - tasks: tracked seconds per task over the window (stopped only).
 */
export async function getWeeklyAnalytics(userId: string, tz: string) {
  const days = weekBounds(tz);
  const rangeStart = days[0].start;
  const rangeEnd = days[6].end;
  const byDate = new Map(days.map((d) => [d.date, { date: d.date, totalSeconds: 0, completedTasks: 0 }]));

  const [logs, completed, perTask, tasks] = await Promise.all([
    db.timeLog.findMany({
      where: { userId, startedAt: { gte: rangeStart, lt: rangeEnd }, duration: { not: null } },
      select: { startedAt: true, duration: true },
    }),
    db.task.findMany({
      where: { userId, completedAt: { gte: rangeStart, lt: rangeEnd } },
      select: { completedAt: true },
    }),
    db.timeLog.groupBy({
      by: ["taskId"],
      where: { userId, startedAt: { gte: rangeStart, lt: rangeEnd }, duration: { not: null } },
      _sum: { duration: true },
    }),
    db.task.findMany({ where: { userId }, select: { id: true, title: true } }),
  ]);

  for (const log of logs) {
    const slot = byDate.get(localDate(tz, log.startedAt));
    if (slot) slot.totalSeconds += log.duration ?? 0;
  }
  for (const task of completed) {
    if (!task.completedAt) continue;
    const slot = byDate.get(localDate(tz, task.completedAt));
    if (slot) slot.completedTasks += 1;
  }

  const titles = new Map(tasks.map((t) => [t.id, t.title]));
  const perTaskRows = perTask
    .map((g) => ({
      taskId: g.taskId,
      title: titles.get(g.taskId) ?? "Deleted task",
      totalSeconds: g._sum.duration ?? 0,
    }))
    .sort((a, b) => b.totalSeconds - a.totalSeconds);

  return { days: [...byDate.values()], tasks: perTaskRows };
}
