import { requireUserId } from "@/lib/auth";
import { apiError, fail, ok } from "@/lib/api-response";
import { taskIdSchema } from "@/lib/validators/task";
import { stopTimer } from "@/services/timer.service";

/** POST /api/tasks/:id/timer/stop — 200 with server-computed duration. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    const parsed = taskIdSchema.safeParse(id);
    if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid task id.", 400);
    const timeLog = await stopTimer(userId, parsed.data);
    return ok({ timeLog });
  } catch (err) {
    return apiError(err);
  }
}
