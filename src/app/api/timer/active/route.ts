import { requireUserId } from "@/lib/auth";
import { apiError, ok } from "@/lib/api-response";
import { getActiveTimer } from "@/services/timer.service";

/**
 * GET /api/timer/active — current user's active TimeLog or null.
 * Added in Phase 8: per-task GET .../timer can't restore the timer
 * globally after refresh/navigation, so the client needs one
 * user-scoped lookup. Auth + ownership identical to other timer reads.
 */
export async function GET() {
  try {
    const userId = await requireUserId();
    const timer = await getActiveTimer(userId);
    return ok({ timer });
  } catch (err) {
    return apiError(err);
  }
}
