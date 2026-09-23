import "server-only";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { unauthorized } from "@/lib/errors";

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
};

/** Current session user, or null when unauthenticated. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id || !session?.user?.email) return null;
  return { id, email: session.user.email, name: session.user.name };
}

/**
 * Reusable guard for protected route handlers / server components.
 * Returns the authenticated user ID derived server-side from the session.
 * Throws when unauthenticated — handlers map it to 401 (never trust client userId).
 */
export async function requireUserId(): Promise<string> {
  const user = await getSessionUser();
  if (!user) throw unauthorized();
  return user.id;
}
