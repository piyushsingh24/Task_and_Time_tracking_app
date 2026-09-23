"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

/** Signs out and returns to the login page. */
export function LogoutButton() {
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    try {
      await signOut({ callbackUrl: "/login" });
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleLogout} disabled={pending}>
      {pending ? "Signing out..." : "Logout"}
    </Button>
  );
}
