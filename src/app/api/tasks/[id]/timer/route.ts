import { requireUserId } from "@/lib/auth";
import { apiError, fail, ok } from "@/lib/api-response";
import { taskIdSchema } from "@/lib/validators/task";
import { getTaskTimer } from "@/services/timer.service";

/** GET /api/tasks/:id/timer — active TimeLog or null (refresh-safe). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    const parsed = taskIdSchema.safeParse(id);
    if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid task id.", 400);
    const timer = await getTaskTimer(userId, parsed.data);
    return ok({ timer });
  } catch (err) {
    return apiError(err);
  }
}
