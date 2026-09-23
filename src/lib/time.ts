/** Seconds -> "01:42:35" (or "42:35" under an hour). Client display only. */
export function formatElapsed(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Seconds -> "45m", "1h 20m", "2h", "30s". Null (running) -> "In progress". */
export function formatDurationShort(totalSeconds: number | null | undefined): string {
  if (totalSeconds === null || totalSeconds === undefined) return "In progress";
  const s = Math.max(0, Math.floor(totalSeconds));
  if (s < 60) return `${s}s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** ISO timestamp -> "Sep 22, 10:00 AM". Formatting belongs to the UI. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Due instant -> "Sep 25". Rendered in UTC: the stored day never shifts. */
export function formatDueDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  });
}

export type DueState = "overdue" | "due-today" | "due-tomorrow" | "due-soon";

/**
 * Criticality of a task's due day vs today (UTC calendar days).
 * Completed tasks and tasks without a due date never flag.
 * "due-soon" covers 2 days out; anything later is upcoming (no badge).
 */
export function getDueState(
  dueISO: string | null | undefined,
  status: string,
  now: Date = new Date(),
): DueState | null {
  if (!dueISO || status === "COMPLETED") return null;
  const dayMs = 86400000;
  const diff = Math.round(
    (Date.parse(dueISO.slice(0, 10)) - Date.parse(now.toISOString().slice(0, 10))) / dayMs,
  );
  if (diff < 0) return "overdue";
  if (diff === 0) return "due-today";
  if (diff === 1) return "due-tomorrow";
  if (diff === 2) return "due-soon";
  return null;
}

export const DUE_LABEL: Record<DueState, string> = {
  overdue: "Overdue",
  "due-today": "Due today",
  "due-tomorrow": "Due tomorrow",
  "due-soon": "Due soon",
};
