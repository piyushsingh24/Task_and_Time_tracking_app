import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { created, fail } from "@/lib/api-response";
import { normalizeEmail, registerSchema } from "@/lib/validators/auth";

/**
 * POST /api/auth/register — public.
 * Validates input, normalizes email, rejects duplicates (409),
 * stores bcrypt hash (never plaintext), returns safe user payload.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("INVALID_JSON", "Request body must be valid JSON.", 400);
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input.";
    return fail("VALIDATION_ERROR", message, 400);
  }

  const email = normalizeEmail(parsed.data.email);
  const passwordHash = await hash(parsed.data.password, 10);

  try {
    const user = await db.user.create({
      data: { email, name: parsed.data.name, passwordHash },
      select: { id: true, email: true, name: true },
    });
    return created({ user });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return fail("EMAIL_TAKEN", "An account with this email already exists.", 409);
    }
    console.error("register error", err);
    return fail("INTERNAL_ERROR", "Unable to create account.", 500);
  }
}
