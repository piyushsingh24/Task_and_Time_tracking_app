import { requireUserId } from "@/lib/auth";
import { apiError, fail, ok } from "@/lib/api-response";
import { taskIdSchema } from "@/lib/validators/task";
import { listTimeLogs } from "@/services/timer.service";

/** GET /api/tasks/:id/time-logs — history for one owned task. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    const parsed = taskIdSchema.safeParse(id);
    if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid task id.", 400);
    const timeLogs = await listTimeLogs(userId, { taskId: parsed.data, limit: 50 });
    return ok({ timeLogs });
  } catch (err) {
    return apiError(err);
  }
}
