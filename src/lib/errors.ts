/**
 * Shared HTTP errors for route handlers.
 * Handlers map these to the { success: false, error } envelope
 * with the correct status code — never stack traces or internals.
 */

export type HttpError = Error & { status: number; code?: string };

export function httpError(status: number, message: string, code?: string): HttpError {
  return Object.assign(new Error(message), { status, code });
}

export function unauthorized(message = "Not authenticated."): HttpError {
  return httpError(401, message);
}

/**
 * Ownership miss → 404, not 403.
 * A user probing another user's id must not learn it exists (IDOR).
 */
export function notFound(message = "Not found."): HttpError {
  return httpError(404, message);
}

export function isHttpError(err: unknown): err is HttpError {
  return (
    err instanceof Error &&
    typeof (err as { status?: unknown }).status === "number"
  );
}
