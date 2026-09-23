import { getSessionUser } from "@/lib/auth";
import { fail, ok } from "@/lib/api-response";

/**
 * GET /api/auth/session — whoami for the client + auth-flow tests.
 * 200 with the session user, 401 when unauthenticated.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return fail("UNAUTHORIZED", "Not authenticated.", 401);
  return ok({ user });
}
