"use client";

import { SessionProvider } from "next-auth/react";

/** Exposes the Auth.js session to client components (login/logout/forms). */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
