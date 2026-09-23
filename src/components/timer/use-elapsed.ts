"use client";

import { useEffect, useState } from "react";

/**
 * Live elapsed seconds since a server-provided startedAt.
 * The database is the source of truth; this only renders
 * `now - startedAt` and ticks locally. Survives refresh because
 * startedAt is re-fetched from GET .../timer on mount.
 */
export function useElapsedSeconds(startedAt: string): number {
  const start = new Date(startedAt).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  return Math.max(0, Math.floor((now - start) / 1000));
}
