import { NextResponse } from "next/server";
import { isHttpError } from "@/lib/errors";

/**
 * Consistent API envelope per docs/04-API.md.
 * Success: { success: true, data }
 * Error:   { success: false, error: { code, message } }
 */

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function fail(code: string, message: string, status = 400) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status },
  );
}

/**
 * Maps thrown HttpError (401/404 from guards) to the error envelope.
 * Unknown errors become sanitized 500s — details stay server-side.
 */
export function apiError(err: unknown) {
  if (isHttpError(err)) {
    const code =
      err.code ??
      (err.status === 401 ? "UNAUTHORIZED" : err.status === 404 ? "NOT_FOUND" : "REQUEST_ERROR");
    return fail(code, err.message, err.status);
  }
  console.error("api error", err);
  return fail("INTERNAL_ERROR", "Something went wrong.", 500);
}
