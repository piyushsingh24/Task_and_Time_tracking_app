import "next-auth";

/**
 * next-auth v4: expose the user id on session + JWT.
 * The id is derived server-side from the session (never client input).
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string;
  }
}
