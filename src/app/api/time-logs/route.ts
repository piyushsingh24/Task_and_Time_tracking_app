import { requireUserId } from "@/lib/auth";
import { apiError, fail, ok } from "@/lib/api-response";
import { timeLogsQuerySchema } from "@/lib/validators/timer";
import { listTimeLogs } from "@/services/timer.service";

/** GET /api/time-logs — current user's history. Supports ?taskId=&limit=. */
export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const url = new URL(req.url);
    const parsed = timeLogsQuerySchema.safeParse({
      taskId: url.searchParams.get("taskId") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid query.", 400);
    }
    const timeLogs = await listTimeLogs(userId, parsed.data);
    return ok({ timeLogs });
  } catch (err) {
    return apiError(err);
  }
}
