import { withAuth } from "next-auth/middleware";

/**
 * Route protection (next-auth v4).
 * App screens (/dashboard, /today, /tasks, /time-logs, /analytics) require a
 * session; /login + /register stay public. API product routes enforce
 * requireUserId() individually (Phase 4) — middleware is a second layer
 * for pages, not the authorization boundary.
 */
export default withAuth({
  pages: { signIn: "/login" },
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/today/:path*", "/tasks/:path*", "/time-logs/:path*", "/analytics/:path*"],
};
