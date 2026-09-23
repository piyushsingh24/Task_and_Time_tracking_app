import "server-only";
import { db } from "@/lib/db";
import { notFound, type HttpError } from "@/lib/errors";

/**
 * Phase 4 — reusable ownership layer.
 *
 * Rule: every protected query scopes by BOTH id and session userId
 * in a single database filter:
 *   findFirst({ where: { id, userId } })
 * A miss returns null → callers respond 404 so cross-user probes
 * can't distinguish "doesn't exist" from "not yours" (IDOR-safe).
 * No handler may accept a client-provided userId for authorization.
 */

export async function getOwnedTask(userId: string, taskId: string) {
  return db.task.findFirst({ where: { id: taskId, userId } });
}

export async function requireOwnedTask(userId: string, taskId: string) {
  const task = await getOwnedTask(userId, taskId);
  if (!task) throw notFound("Task not found.") as HttpError;
  return task;
}

export async function getOwnedTimeLog(userId: string, timeLogId: string) {
  return db.timeLog.findFirst({ where: { id: timeLogId, userId } });
}

export async function requireOwnedTimeLog(userId: string, timeLogId: string) {
  const log = await getOwnedTimeLog(userId, timeLogId);
  if (!log) throw notFound("Time log not found.") as HttpError;
  return log;
}
