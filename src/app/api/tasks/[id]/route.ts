import { requireUserId } from "@/lib/auth";
import { apiError, fail, ok } from "@/lib/api-response";
import { taskIdSchema, updateTaskSchema } from "@/lib/validators/task";
import { deleteTask, getTask, updateTask } from "@/services/task.service";

function parseId(id: string) {
  const parsed = taskIdSchema.safeParse(id);
  return parsed.success ? parsed.data : null;
}

/** GET /api/tasks/:id — 404 unless owned (no existence leak). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    const taskId = parseId(id);
    if (!taskId) return fail("VALIDATION_ERROR", "Invalid task id.", 400);
    const task = await getTask(userId, taskId);
    return ok({ task });
  } catch (err) {
    return apiError(err);
  }
}

/** PATCH /api/tasks/:id — partial update, ownership enforced. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    const taskId = parseId(id);
    if (!taskId) return fail("VALIDATION_ERROR", "Invalid task id.", 400);
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return fail("INVALID_JSON", "Request body must be valid JSON.", 400);
    }
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input.", 400);
    }
    const task = await updateTask(userId, taskId, parsed.data);
    return ok({ task });
  } catch (err) {
    return apiError(err);
  }
}

/** DELETE /api/tasks/:id — ownership enforced, logs cascade. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    const taskId = parseId(id);
    if (!taskId) return fail("VALIDATION_ERROR", "Invalid task id.", 400);
    const result = await deleteTask(userId, taskId);
    return ok(result);
  } catch (err) {
    return apiError(err);
  }
}
