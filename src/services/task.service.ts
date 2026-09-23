import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { requireOwnedTask } from "@/lib/ownership";
import type {
  CreateTaskInput,
  TaskQuery,
  UpdateTaskInput,
} from "@/lib/validators/task";

/**
 * Phase 5 — task business logic.
 * All functions take the session-derived userId; ownership is enforced
 * inside the data filter (never from client input).
 */
export async function createTask(userId: string, input: CreateTaskInput) {
  return db.task.create({
    data: {
      userId,
      title: input.title,
      description: input.description,
      status: input.status,
      completedAt: input.status === "COMPLETED" ? new Date() : null,
      dueDate: input.dueDate ?? null,
    },
  });
}

export async function listTasks(userId: string, query: TaskQuery) {
  return db.task.findMany({
    where: {
      userId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" } },
              { description: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTask(userId: string, taskId: string) {
  return requireOwnedTask(userId, taskId);
}

export async function updateTask(
  userId: string,
  taskId: string,
  input: UpdateTaskInput,
) {
  const current = await requireOwnedTask(userId, taskId);

  // completedAt rule (docs/03-DATABASE.md): set on COMPLETED, clear otherwise.
  let completedAt: Date | null | undefined = undefined;
  if (input.status !== undefined) {
    if (input.status === "COMPLETED") {
      completedAt = current.completedAt ?? new Date();
    } else {
      completedAt = null;
    }
  }

  return db.task
    .update({
      where: { id: current.id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(completedAt !== undefined ? { completedAt } : {}),
        ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
      },
    })
    .catch((err) => {
      // Deleted between the ownership check and the write: still a 404.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        throw notFound("Task not found.");
      }
      throw err;
    });
}

export async function deleteTask(userId: string, taskId: string) {
  // Single atomic statement: no check-then-delete race, 404 when nothing matched.
  const deleted = await db.task.deleteMany({ where: { id: taskId, userId } });
  if (deleted.count === 0) throw notFound("Task not found.");
  // TimeLogs cascade at the database level (see schema + migration).
  return { id: taskId };
}
