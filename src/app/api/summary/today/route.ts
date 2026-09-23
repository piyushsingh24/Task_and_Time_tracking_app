import { requireUserId } from "@/lib/auth";
import { apiError, fail, ok } from "@/lib/api-response";
import { summaryQuerySchema } from "@/lib/validators/summary";
import { getTodaySummary } from "@/services/summary.service";

/**
 * GET /api/summary/today — computed daily summary. Supports ?tz= (IANA).
 */
export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const url = new URL(req.url);
    const parsed = summaryQuerySchema.safeParse({
      tz: url.searchParams.get("tz") ?? undefined,
    });
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid query.", 400);
    }
    const summary = await getTodaySummary(userId, parsed.data.tz);
    return ok(summary);
  } catch (err) {
    return apiError(err);
  }
}
