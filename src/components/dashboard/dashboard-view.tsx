"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  ListTodo,
  LoaderCircle,
  Play,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActiveTimerCard, type ActiveTimer } from "@/components/timer/active-timer-card";
import { DUE_LABEL, formatDueDay, formatDurationShort, getDueState } from "@/lib/time";

type Summary = {
  date: string;
  totalTrackedSeconds: number;
  tasksWorkedOn: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
};

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  dueDate: string | null;
};

type LogRow = {
  id: string;
  taskId: string;
  startedAt: string;
  endedAt: string | null;
  duration: number | null;
};

function greeting(hour: number): string {
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Good night";
}

const STAT_META = {
  "Time tracked": {
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
  "In progress": {
    Icon: LoaderCircle,
    accent: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
  },
} as const;

const STAT_LABELS = ["Time tracked", "Worked on", "Completed", "In progress"] as const;

const STATUS_BADGE: Record<TaskRow["status"], { label: string; className: string }> = {
  PENDING: {
    label: "Pending",
    className: "border-muted-foreground/30 bg-muted/50 text-muted-foreground",
  },
  IN_PROGRESS: {
    label: "In progress",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  COMPLETED: {
    label: "Completed",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
};

export function DashboardView() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stopping, setStopping] = useState(false);

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
    async function fetchDashboard() {
      try {
        const [sRes, tRes, tasksRes, logsRes] = await Promise.all([
          fetch(`/api/summary/today?tz=${encodeURIComponent(tz)}`),
          fetch("/api/timer/active"),
          fetch("/api/tasks"),
          fetch("/api/time-logs?limit=100"),
        ]);
        const sJson = (await sRes.json()) as { success: boolean; data?: Summary; error?: { message?: string } };
        if (ignore) return;
        if (!sRes.ok || !sJson.success || !sJson.data) {
          setError(sJson.error?.message ?? "Unable to load dashboard.");
          return;
        }
        setSummary(sJson.data);
        setError(null);
        const tJson = (await tRes.json()) as { success: boolean; data?: { timer: ActiveTimer | null } };
        if (tRes.ok && tJson.success && tJson.data) setActiveTimer(tJson.data.timer);
        const tasksJson = (await tasksRes.json()) as { success: boolean; data?: { tasks: TaskRow[] } };
        if (tasksRes.ok && tasksJson.success && tasksJson.data) setTasks(tasksJson.data.tasks);
        const logsJson = (await logsRes.json()) as { success: boolean; data?: { timeLogs: LogRow[] } };
        if (logsRes.ok && logsJson.success && logsJson.data) setLogs(logsJson.data.timeLogs);
      } catch {
        if (!ignore) setError("Something went wrong. Please try again.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void fetchDashboard();
    return () => {
      ignore = true;
    };
  }, [tz, refreshKey]);

  async function stopTimer() {
    if (!activeTimer) return;
    setStopping(true);
    try {
      const res = await fetch(`/api/tasks/${activeTimer.taskId}/timer/stop`, { method: "POST" });
      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        setError(json.error?.message ?? "Unable to stop timer.");
        return;
      }
      setActiveTimer(null);
      setRefreshKey((k) => k + 1);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setStopping(false);
    }
  }

  const now = new Date();
  const todayKey = now.toDateString();
  const hourly = (() => {
    const minutes = new Array<number>(24).fill(0);
    for (const log of logs) {
      if (log.duration === null) continue;
      const d = new Date(log.startedAt);
      if (d.toDateString() !== todayKey) continue;
      minutes[d.getHours()] += log.duration / 60;
    }
    return minutes.map((m, h) => ({ hour: h, label: `${h}`, minutes: Math.round(m) }));
  })();

  const hasActivity = hourly.some((h) => h.minutes > 0);
  const peakMinutes = Math.max(...hourly.map((h) => h.minutes), 0);

  if (loading) {
    return (
      <div className="flex flex-col gap-6" aria-label="Loading dashboard">
        <div className="space-y-2">
          <div className="h-9 w-56 animate-pulse rounded bg-muted" aria-hidden="true" />
          <div className="h-4 w-72 animate-pulse rounded bg-muted" aria-hidden="true" />
        </div>
        <div className="h-72 animate-pulse rounded-2xl bg-muted/60" aria-hidden="true" />
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
          <div className="h-40 animate-pulse rounded-xl bg-muted/60" aria-hidden="true" />
          <div className="h-40 animate-pulse rounded-xl bg-muted/60" aria-hidden="true" />
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-3 py-6">
          <p role="alert" className="text-sm text-destructive">
            {error ?? "Unable to load dashboard."}
          </p>
          <Button variant="outline" size="sm" onClick={reload}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const stats: Array<{ label: (typeof STAT_LABELS)[number]; value: string }> = [
    { label: "Time tracked", value: formatDurationShort(summary.totalTrackedSeconds) },
    { label: "Worked on", value: String(summary.tasksWorkedOn) },
    { label: "Completed", value: String(summary.completedTasks) },
    { label: "In progress", value: String(summary.inProgressTasks) },
  ];

  const attention = tasks
    .map((t) => ({ task: t, state: getDueState(t.dueDate, t.status) }))
    .filter((a): a is { task: TaskRow; state: NonNullable<ReturnType<typeof getDueState>> } => a.state !== null)
    .sort((a, b) => {
      const order = { overdue: 0, "due-today": 1, "due-tomorrow": 2, "due-soon": 3 };
      if (order[a.state] !== order[b.state]) return order[a.state] - order[b.state];
      return (a.task.dueDate ?? "").localeCompare(b.task.dueDate ?? "");
    });

  const overdueCount = attention.filter((a) => a.state === "overdue").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS");
  const pendingTasks = tasks.filter((t) => t.status === "PENDING");
  const upcomingTasks = [...inProgressTasks, ...pendingTasks].slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      {/* ---------- Header ---------- */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">
            {greeting(now.getHours())}
          </h2>
          <p className="text-muted-foreground">
            {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <Link href="/tasks" className={buttonVariants({ size: "sm" })}>
          <ListTodo className="size-4" />
          Go to tasks
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {/* ---------- HERO: Focus zone ---------- */}
      <section className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/15 via-primary/5 to-transparent blur-3xl"
        />

        <div className="overflow-hidden rounded-2xl border bg-card/70 shadow-sm backdrop-blur-sm">
          {/* Hero header strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Target className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold tracking-tight">Focus zone</h3>
                <p className="text-xs text-muted-foreground">
                  Your timer and active tasks
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {overdueCount > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                  <AlertTriangle className="size-3.5" />
                  {overdueCount} overdue
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-5">
            {/* Active timer — 2 cols */}
            <div className="lg:col-span-2">
              {activeTimer ? (
                <div className="relative h-full">
                  <span
                    aria-hidden="true"
                    className="absolute -inset-1.5 -z-10 animate-pulse rounded-2xl bg-primary/25 blur-lg"
                  />
                  <ActiveTimerCard
                    timer={activeTimer}
                    stopping={stopping}
                    onStop={() => void stopTimer()}
                  />
                </div>
              ) : (
                <Card className="flex h-full flex-col border-dashed bg-gradient-to-br from-primary/5 to-transparent">
                  <CardContent className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
                    <span className="inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
                      <Timer className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-medium">No timer running</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Start one to track your focus time
                      </p>
                    </div>
                    <Link href="/tasks" className={buttonVariants({ size: "sm" })}>
                      <Play className="size-3.5" />
                      Start tracking
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Up next tasks — 3 cols */}
            <div className="lg:col-span-3">
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">Up next</CardTitle>
                    {upcomingTasks.length > 0 ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {upcomingTasks.length}
                      </span>
                    ) : null}
                  </div>
                  <Link
                    href="/tasks"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    View all
                    <ArrowRight className="size-3" />
                  </Link>
                </CardHeader>
                <CardContent className="pt-0">
                  {upcomingTasks.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-8 text-center">
                      <span className="inline-flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Sparkles className="size-5" />
                      </span>
                      <p className="text-sm font-medium">All clear!</p>
                      <p className="text-xs text-muted-foreground">
                        No pending or in-progress tasks.
                      </p>
                    </div>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {upcomingTasks.map((t) => {
                        const badge = STATUS_BADGE[t.status];
                        const isActive = activeTimer?.taskId === t.id;
                        const state = getDueState(t.dueDate, t.status);
                        return (
                          <li key={t.id}>
                            <div
                              className={`group relative flex items-center gap-3 overflow-hidden rounded-lg border bg-card px-3 py-2.5 transition-all duration-200 hover:border-muted-foreground/30 hover:bg-muted/40 hover:shadow-sm ${
                                isActive ? "border-primary/50 bg-primary/5" : ""
                              }`}
                            >
                              <span
                                aria-hidden="true"
                                className={`absolute inset-y-0 left-0 w-0.5 ${
                                  isActive
                                    ? "bg-primary"
                                    : t.status === "IN_PROGRESS"
                                      ? "bg-amber-500"
                                      : "bg-muted-foreground/20"
                                }`}
                              />
                              <span
                                className={`inline-flex size-7 shrink-0 items-center justify-center rounded-md ${
                                  isActive
                                    ? "bg-primary/15 text-primary"
                                    : t.status === "IN_PROGRESS"
                                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                      : "bg-muted text-muted-foreground"
                                }`}
                                aria-hidden="true"
                              >
                                {isActive ? (
                                  <Timer className="size-3.5" />
                                ) : t.status === "IN_PROGRESS" ? (
                                  <Flame className="size-3.5" />
                                ) : (
                                  <Circle className="size-3.5" />
                                )}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{t.title}</p>
                                {state ? (
                                  <p
                                    className={`truncate text-xs ${
                                      state === "overdue"
                                        ? "text-destructive"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    {DUE_LABEL[state]}
                                    {t.dueDate ? ` · ${formatDueDay(t.dueDate)}` : ""}
                                  </p>
                                ) : t.description ? (
                                  <p className="truncate text-xs text-muted-foreground">
                                    {t.description}
                                  </p>
                                ) : null}
                              </div>
                              {isActive ? (
                                <span className="relative flex size-2 shrink-0" aria-hidden="true">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                                  <span className="relative inline-flex size-2 rounded-full bg-primary" />
                                </span>
                              ) : (
                                <span
                                  className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${badge.className}`}
                                >
                                  {badge.label}
                                </span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Stats ---------- */}
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

      {/* ---------- Needs attention ---------- */}
      {attention.length > 0 ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-sm font-medium">
              <CalendarClock className="size-4 text-muted-foreground" />
              Needs attention
            </h3>
            <Link
              href="/tasks"
              className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Manage tasks
            </Link>
          </div>
          <ul className="flex flex-col gap-2">
            {attention.slice(0, 5).map(({ task, state }) => {
              const isOverdue = state === "overdue";
              return (
                <li key={task.id}>
                  <Card
                    className={`group relative overflow-hidden transition-all duration-200 hover:shadow-sm ${
                      isOverdue ? "border-destructive/40" : ""
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute inset-y-0 left-0 w-1 ${
                        isOverdue
                          ? "bg-destructive"
                          : state === "due-today"
                            ? "bg-amber-500"
                            : "bg-muted-foreground/20"
                      }`}
                    />
                    <CardContent className="flex items-center justify-between gap-3 py-3 pl-4">
                      <p className="truncate text-sm font-medium">{task.title}</p>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
                          isOverdue
                            ? "border-destructive/40 bg-destructive/10 text-destructive"
                            : state === "due-today"
                              ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "border-border bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        {DUE_LABEL[state]}
                        {task.dueDate ? ` · ${formatDueDay(task.dueDate)}` : ""}
                      </span>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {/* ---------- Activity chart ---------- */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-medium">
            <Activity className="size-4 text-muted-foreground" />
            Today&apos;s activity
          </h3>
          {hasActivity ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="size-3.5" />
              Peak {peakMinutes} min
            </span>
          ) : null}
        </div>
        <Card>
          <CardContent className="py-4">
            {hasActivity ? (
              <div className="h-50 w-full text-primary">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourly} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      interval={3}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                      width={40}
                    />
                    <Tooltip
                      cursor={{ fill: "currentColor", fillOpacity: 0.05 }}
                      formatter={(v) => [`${v} min`, "Tracked"]}
                      labelFormatter={(h) => `${h}:00`}
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--popover))",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="minutes" fill="currentColor" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-muted">
                  <Activity className="size-5 text-muted-foreground" />
                </span>
                <p className="text-sm text-muted-foreground">
                  No tracked time today yet.
                </p>
                <p className="text-xs text-muted-foreground">
                  Start a timer to see your activity here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}