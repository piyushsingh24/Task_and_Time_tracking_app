"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Coffee,
  Flame,
  ListTodo,
  LoaderCircle,
  Sparkles,
  Timer,
  TrendingUp,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, formatDurationShort } from "@/lib/time";

type Summary = {
  date: string;
  totalTrackedSeconds: number;
  tasksWorkedOn: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
};

type LogRow = {
  id: string;
  taskId: string;
  startedAt: string;
  endedAt: string | null;
  duration: number | null;
  task: { id: string; title: string };
};

type TaskRow = {
  id: string;
  title: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  completedAt: string | null;
};

const STAT_LABELS = ["Total time", "Worked on", "Completed", "Still open"] as const;

const STAT_META = {
  "Total time": {
    Icon: Clock,
    accent: "text-primary",
    bg: "bg-primary/10",
  },
  "Worked on": {
    Icon: ListTodo,
    accent: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
  },
  Completed: {
    Icon: CheckCircle2,
    accent: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  "Still open": {
    Icon: Flame,
    accent: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
  },
} as const;

/** Dedicated current-day view: totals, sessions, completions, open work. */
export function TodayView() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const tz = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
    [],
  );

  function reload() {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }

  useEffect(() => {
    let ignore = false;
    async function fetchToday() {
      try {
        const [sRes, logsRes, tasksRes] = await Promise.all([
          fetch(`/api/summary/today?tz=${encodeURIComponent(tz)}`),
          fetch("/api/time-logs?limit=100"),
          fetch("/api/tasks"),
        ]);
        const sJson = (await sRes.json()) as {
          success: boolean;
          data?: Summary;
          error?: { message?: string };
        };
        if (ignore) return;
        if (!sRes.ok || !sJson.success || !sJson.data) {
          setError(sJson.error?.message ?? "Unable to load today's summary.");
          return;
        }
        setSummary(sJson.data);
        setError(null);
        const logsJson = (await logsRes.json()) as {
          success: boolean;
          data?: { timeLogs: LogRow[] };
        };
        if (logsRes.ok && logsJson.success && logsJson.data) {
          const todayKey = new Date().toDateString();
          setLogs(
            logsJson.data.timeLogs.filter(
              (l) => new Date(l.startedAt).toDateString() === todayKey,
            ),
          );
        }
        const tasksJson = (await tasksRes.json()) as {
          success: boolean;
          data?: { tasks: TaskRow[] };
        };
        if (tasksRes.ok && tasksJson.success && tasksJson.data) {
          setTasks(tasksJson.data.tasks);
        }
      } catch {
        if (!ignore) setError("Something went wrong. Please try again.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void fetchToday();
    return () => {
      ignore = true;
    };
  }, [tz, refreshKey]);

  const now = new Date();
  const completedToday = tasks.filter(
    (t) =>
      t.status === "COMPLETED" &&
      t.completedAt &&
      new Date(t.completedAt).toDateString() === now.toDateString(),
  );
  const openTasks = tasks.filter((t) => t.status !== "COMPLETED");

  if (loading) {
    return (
      <div className="flex flex-col gap-6" aria-label="Loading today's summary">
        <div className="space-y-2">
          <div className="h-9 w-40 animate-pulse rounded bg-muted" aria-hidden="true" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" aria-hidden="true" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STAT_LABELS.map((label) => (
            <Card key={label}>
              <CardContent className="py-6">
                <div className="h-7 w-1/2 animate-pulse rounded bg-muted" aria-hidden="true" />
                <p className="mt-2 text-sm text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-48 animate-pulse rounded-xl bg-muted/60" aria-hidden="true" />
          <div className="h-48 animate-pulse rounded-xl bg-muted/60" aria-hidden="true" />
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-3 py-6">
          <p role="alert" className="text-sm text-destructive">
            {error ?? "Unable to load today's summary."}
          </p>
          <Button variant="outline" size="sm" onClick={reload}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const stillOpen = summary.pendingTasks + summary.inProgressTasks;
  const stats: Array<{ label: (typeof STAT_LABELS)[number]; value: string; sub?: string }> = [
    { label: "Total time", value: formatDurationShort(summary.totalTrackedSeconds) },
    {
      label: "Worked on",
      value: `${summary.tasksWorkedOn}`,
      sub: summary.tasksWorkedOn === 1 ? "task" : "tasks",
    },
    { label: "Completed", value: String(summary.completedTasks) },
    {
      label: "Still open",
      value: String(stillOpen),
      sub: `${summary.pendingTasks} pending · ${summary.inProgressTasks} in progress`,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* ---------- Header ---------- */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Today</h2>
          <p className="text-muted-foreground">
            {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <Link href="/tasks" className={buttonVariants({ variant: "outline", size: "sm" })}>
          <ListTodo className="size-4" />
          Manage tasks
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {/* ---------- Stat cards ---------- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const meta = STAT_META[s.label];
          return (
            <Card
              key={s.label}
              className="group relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardContent className="flex items-start justify-between gap-3 py-5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                  <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight">
                    {s.value}
                  </p>
                  {s.sub ? (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{s.sub}</p>
                  ) : null}
                </div>
                <span
                  className={`inline-flex size-9 shrink-0 items-center justify-center rounded-lg ${meta.bg}`}
                  aria-hidden="true"
                >
                  <meta.Icon className={`size-4.5 ${meta.accent}`} />
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ---------- Sessions + Completed ---------- */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Sessions */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-sm font-medium">
              <Timer className="size-4 text-muted-foreground" />
              Today&apos;s sessions
            </h3>
            {logs.length > 0 ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {logs.length}
              </span>
            ) : null}
          </div>

          {logs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-muted">
                  <Coffee className="size-5 text-muted-foreground" />
                </span>
                <p className="text-sm font-medium">No sessions yet</p>
                <p className="text-xs text-muted-foreground">
                  Start a timer to log your focus time.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ul className="flex flex-col gap-2">
              {logs.map((l) => (
                <li key={l.id}>
                  <Card className="group relative overflow-hidden transition-all duration-200 hover:border-muted-foreground/30 hover:shadow-sm">
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 w-0.5 bg-primary/40 transition-colors group-hover:bg-primary"
                    />
                    <CardContent className="flex items-center justify-between gap-3 py-3 pl-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
                          aria-hidden="true"
                        >
                          <Clock className="size-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{l.task.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {formatDateTime(l.startedAt)}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-semibold tabular-nums text-primary">
                        {formatDurationShort(l.duration)}
                      </span>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Completed today */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-sm font-medium">
              <CalendarCheck className="size-4 text-muted-foreground" />
              Completed today
            </h3>
            {completedToday.length > 0 ? (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                {completedToday.length} done
              </span>
            ) : null}
          </div>

          {completedToday.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-muted">
                  <Sparkles className="size-5 text-muted-foreground" />
                </span>
                <p className="text-sm font-medium">Nothing completed yet</p>
                <p className="text-xs text-muted-foreground">
                  Check off a task to see it here.
                </p>
                <Link href="/tasks" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  View tasks
                </Link>
              </CardContent>
            </Card>
          ) : (
            <ul className="flex flex-col gap-2">
              {completedToday.map((t) => (
                <li key={t.id}>
                  <Card className="group relative overflow-hidden transition-all duration-200 hover:border-emerald-500/30 hover:shadow-sm">
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 w-0.5 bg-emerald-500/60 transition-colors group-hover:bg-emerald-500"
                    />
                    <CardContent className="flex items-center justify-between gap-3 py-3 pl-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          aria-hidden="true"
                        >
                          <CheckCircle2 className="size-4" />
                        </span>
                        <p className="truncate text-sm font-medium text-muted-foreground line-through">
                          {t.title}
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-3" />
                        Done
                      </span>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}

          {openTasks.length > 0 ? (
            <Card className="border-dashed bg-gradient-to-br from-amber-500/5 to-transparent">
              <CardContent className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-2 text-sm">
                  <span
                    className="inline-flex size-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    aria-hidden="true"
                  >
                    <Flame className="size-3.5" />
                  </span>
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{openTasks.length}</span>{" "}
                    {openTasks.length === 1 ? "task" : "tasks"} still open
                  </span>
                </div>
                <Link
                  href="/tasks"
                  className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 transition-colors hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                >
                  Keep going
                  <ArrowRight className="size-3" />
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent">
              <CardContent className="flex items-center gap-3 py-3">
                <span
                  className="inline-flex size-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                >
                  <Sparkles className="size-3.5" />
                </span>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">All done!</span> Nothing left open
                  today.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}