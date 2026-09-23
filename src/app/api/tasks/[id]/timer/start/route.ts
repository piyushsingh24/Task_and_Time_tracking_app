import { requireUserId } from "@/lib/auth";
import { apiError, created, fail } from "@/lib/api-response";
import { taskIdSchema } from "@/lib/validators/task";
import { startTimer } from "@/services/timer.service";

/** POST /api/tasks/:id/timer/start — 201, or 409 if already tracking. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    const parsed = taskIdSchema.safeParse(id);
    if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid task id.", 400);
    const timeLog = await startTimer(userId, parsed.data);
    return created({ timeLog });
  } catch (err) {
    return apiError(err);
  }
}
