import { requireUserId } from "@/lib/auth";
import { apiError, fail, ok } from "@/lib/api-response";
import { suggestInputSchema } from "@/lib/validators/ai";
import { suggestTask } from "@/services/ai.service";

/**
 * POST /api/ai/task-suggest — authenticated.
 * { input } -> { suggestion: { title, description } }.
 * Key stays server-side; response is Zod-validated; failures are 502/503.
 */
export async function POST(req: Request) {
  try {
    await requireUserId();
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return fail("INVALID_JSON", "Request body must be valid JSON.", 400);
    }
    const parsed = suggestInputSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input.", 400);
    }
    const suggestion = await suggestTask(parsed.data.input);
    return ok({ suggestion });
  } catch (err) {
    return apiError(err);
  }
}
