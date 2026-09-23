"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/today", label: "Today" },
  { href: "/tasks", label: "Tasks" },
  { href: "/time-logs", label: "Time Logs" },
  { href: "/analytics", label: "Analytics" },
];

function linkClass(active: boolean) {
  return cn(
    "rounded-lg px-3 py-1.5 text-sm transition-colors",
    active
      ? "bg-muted font-medium text-foreground"
      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
  );
}

/**
 * Themed app navbar: sticky, blurred, active-link highlight, mobile menu.
 * Session state comes from the server wrapper (no client session flash).
 */
export function Navbar({ email }: { email: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-2 px-4">
        <Link href="/" className="text-base font-semibold tracking-tight" aria-label="TaskFlow home">
          TaskFlow
        </Link>

        {email ? (
          <>
            <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} className={linkClass(isActive(l.href))} aria-current={isActive(l.href) ? "page" : undefined}>
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="hidden items-center gap-3 md:flex">
              <span className="max-w-45 truncate text-sm text-muted-foreground">{email}</span>
              <LogoutButton />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </>
        ) : (
          <nav className="flex items-center gap-2" aria-label="Primary">
            <Link href="/dashboard" className={cn(linkClass(false), "hidden sm:inline-flex")}>
              Dashboard
            </Link>
            <Link href="/login" className="text-sm font-medium underline underline-offset-4">
              Log in
            </Link>
          </nav>
        )}
      </div>

      {email && open ? (
        <nav className="border-t px-4 py-2 md:hidden" aria-label="Mobile">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn(linkClass(isActive(l.href)), "block")}
                aria-current={isActive(l.href) ? "page" : undefined}
              >
                {l.label}
              </Link>
            ))}
            <div className="flex items-center justify-between gap-2 py-2">
              <span className="truncate text-sm text-muted-foreground">{email}</span>
              <LogoutButton />
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
