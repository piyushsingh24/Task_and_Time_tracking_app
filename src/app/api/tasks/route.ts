import { requireUserId } from "@/lib/auth";
import { apiError, created, fail, ok } from "@/lib/api-response";
import { createTaskSchema, taskQuerySchema } from "@/lib/validators/task";
import { createTask, listTasks } from "@/services/task.service";

/** POST /api/tasks — 201. Auth + Zod + service. */
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return fail("INVALID_JSON", "Request body must be valid JSON.", 400);
    }
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input.", 400);
    }
    const task = await createTask(userId, parsed.data);
    return created({ task });
  } catch (err) {
    return apiError(err);
  }
}

/** GET /api/tasks — own tasks only. Supports ?status=&search=. */
export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const url = new URL(req.url);
    const parsed = taskQuerySchema.safeParse({
      status: url.searchParams.get("status") ?? undefined,
      search: url.searchParams.get("search") ?? undefined,
    });
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid query.", 400);
    }
    const tasks = await listTasks(userId, parsed.data);
    return ok({ tasks });
  } catch (err) {
    return apiError(err);
  }
}
