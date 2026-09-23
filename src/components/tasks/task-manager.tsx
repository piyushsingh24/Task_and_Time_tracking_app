"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  ListChecks,
  LoaderCircle,
  Pencil,
  Play,
  Search,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CreateTaskForm } from "@/components/tasks/create-task-form";
import { ActiveTimerCard, type ActiveTimer } from "@/components/timer/active-timer-card";
import { useElapsedSeconds } from "@/components/timer/use-elapsed";
import { DUE_LABEL, formatDueDay, formatElapsed, getDueState } from "@/lib/time";

type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdAt: string;
  completedAt: string | null;
  dueDate: string | null;
};

export type TaskListItem = Task;

const STATUS_META: Record<
  TaskStatus,
  { label: string; Icon: typeof Circle; badgeClass: string; iconClass: string; tileClass: string }
> = {
  PENDING: {
    label: "Pending",
    Icon: Circle,
    badgeClass: "border-muted-foreground/30 bg-muted/50 text-muted-foreground",
    iconClass: "text-muted-foreground",
    tileClass: "bg-muted text-muted-foreground",
  },
  IN_PROGRESS: {
    label: "In progress",
    Icon: LoaderCircle,
    badgeClass: "border-primary/30 bg-primary/10 text-primary",
    iconClass: "text-primary",
    tileClass: "bg-primary/10 text-primary",
  },
  COMPLETED: {
    label: "Completed",
    Icon: CheckCircle2,
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    iconClass: "text-emerald-600 dark:text-emerald-400",
    tileClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
};

const FILTERS: Array<{ value: "" | TaskStatus; label: string }> = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Live elapsed readout for the row being tracked (ticks locally). */
function RowElapsed({ startedAt }: { startedAt: string }) {
  const elapsed = useElapsedSeconds(startedAt);
  return (
    <span className="font-semibold tabular-nums" aria-label="Elapsed time">
      {formatElapsed(elapsed)}
    </span>
  );
}

export function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<"" | TaskStatus>("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutating, setMutating] = useState<string | null>(null);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [timerBusy, setTimerBusy] = useState(false);

  // Debounce search input -> query (state updates in timeout callbacks only).
  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      setSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Fetch on filter/search/refresh change. No synchronous setState here:
  // state updates happen after the awaited fetches.
  useEffect(() => {
    let ignore = false;
    async function fetchTasks() {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (search) params.set("search", search);
      try {
        const [tasksRes, timerRes] = await Promise.all([
          fetch(`/api/tasks?${params.toString()}`),
          fetch("/api/timer/active"),
        ]);
        const json = (await tasksRes.json()) as {
          success: boolean;
          data?: { tasks: Task[] };
          error?: { message?: string };
        };
        const timerJson = (await timerRes.json()) as {
          success: boolean;
          data?: { timer: ActiveTimer | null };
        };
        if (ignore) return;
        if (!tasksRes.ok || !json.success || !json.data) {
          setError(json.error?.message ?? "Unable to load tasks.");
          return;
        }
        setTasks(json.data.tasks);
        setError(null);
        if (timerRes.ok && timerJson.success && timerJson.data) {
          setActiveTimer(timerJson.data.timer);
        }
      } catch {
        if (!ignore) setError("Something went wrong. Please try again.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void fetchTasks();
    return () => {
      ignore = true;
    };
  }, [status, search, refreshKey]);

  function reload() {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }

  /** Refresh only the active timer (no list flash). */
  async function refreshActive() {
    try {
      const res = await fetch("/api/timer/active");
      const json = (await res.json()) as {
        success: boolean;
        data?: { timer: ActiveTimer | null };
      };
      if (res.ok && json.success && json.data) setActiveTimer(json.data.timer);
    } catch {
      // Timer widget keeps its last state; list is unaffected.
    }
  }

  /** Patch a single row in place — the list never reloads/flashes. */
  function applyTaskUpdate(updated: Task) {
    setTasks((prev) => {
      if (status && updated.status !== status) {
        return prev.filter((t) => t.id !== updated.id);
      }
      return prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t));
    });
  }

  async function changeStatus(task: Task, next: TaskStatus) {
    if (next === task.status) return;
    setMutating(task.id);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { task: Task };
        error?: { message?: string };
      };
      if (!res.ok || !json.success || !json.data) {
        setError(json.error?.message ?? "Unable to update task.");
        return;
      }
      applyTaskUpdate(json.data.task);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setMutating(null);
    }
  }

  async function removeTask(task: Task) {
    if (!window.confirm(`Delete "${task.title}"? Time logs for it will also be removed.`)) return;
    setMutating(task.id);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        setError(json.error?.message ?? "Unable to delete task.");
        return;
      }
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      if (activeTimer?.taskId === task.id) setActiveTimer(null);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setMutating(null);
    }
  }

  async function startTimer(task: Task) {
    setTimerBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${task.id}/timer/start`, { method: "POST" });
      const json = (await res.json()) as {
        success: boolean;
        data?: { timeLog: ActiveTimer };
        error?: { code?: string; message?: string };
      };
      if (!res.ok || !json.success || !json.data) {
        if (json.error?.code === "TIMER_CONFLICT") {
          setError("You already have an active timer. Stop it before starting another.");
        } else {
          setError(json.error?.message ?? "Unable to start timer.");
        }
        await refreshActive();
        return;
      }
      setActiveTimer(json.data.timeLog);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setTimerBusy(false);
    }
  }

  async function stopTimer(taskId: string) {
    setTimerBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/timer/stop`, { method: "POST" });
      const json = (await res.json()) as {
        success: boolean;
        error?: { message?: string };
      };
      if (!res.ok || !json.success) {
        setError(json.error?.message ?? "Unable to stop timer.");
        await refreshActive();
        return;
      }
      setActiveTimer(null);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setTimerBusy(false);
    }
  }

  async function changeDueDate(task: Task, value: string | null) {
    setMutating(task.id);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate: value }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { task: Task };
        error?: { message?: string };
      };
      if (!res.ok || !json.success || !json.data) {
        setError(json.error?.message ?? "Unable to update due date.");
        return;
      }
      applyTaskUpdate(json.data.task);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setMutating(null);
    }
  }

  /** New task appears instantly; full reload only when a filter is on. */
  function handleCreated(created: Task) {
    setError(null);
    if (status || search) {
      reload();
      return;
    }
    setTasks((prev) => [created, ...prev]);
  }

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  function startEdit(task: Task) {
    setEditingId(task.id);
    setDraftTitle(task.title);
    setDraftDesc(task.description ?? "");
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  /** Save title/description inline — single row updates, list never reloads. */
  async function saveEdit(task: Task) {
    if (draftTitle.trim().length === 0) {
      setEditError("Title is required.");
      return;
    }
    setMutating(task.id);
    setEditError(null);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draftTitle.trim(),
          description: draftDesc.trim().length > 0 ? draftDesc.trim() : null,
        }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { task: Task };
        error?: { message?: string };
      };
      if (!res.ok || !json.success || !json.data) {
        setEditError(json.error?.message ?? "Unable to save changes.");
        return;
      }
      applyTaskUpdate(json.data.task);
      setEditingId(null);
    } catch {
      setEditError("Something went wrong. Please try again.");
    } finally {
      setMutating(null);
    }
  }

  const overdueCount = tasks.filter((t) => getDueState(t.dueDate, t.status) === "overdue").length;
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;

  return (
    <div className="flex flex-col gap-6">
      {activeTimer && !loading ? (
        <ActiveTimerCard
          timer={activeTimer}
          stopping={timerBusy}
          onStop={() => void stopTimer(activeTimer.taskId)}
        />
      ) : null}

      <CreateTaskForm onCreated={handleCreated} />

      {/* ---------- Toolbar ---------- */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card/50 p-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => {
            const isActive = status === f.value;
            return (
              <Button
                key={f.label}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setLoading(true);
                  setStatus(f.value);
                }}
                className={`h-8 rounded-full px-3 text-xs ${
                  isActive ? "" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </Button>
            );
          })}
        </div>
        <div className="relative sm:ml-auto sm:max-w-xs sm:flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Search tasks..."
            aria-label="Search tasks"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-8 pl-8 pr-8 text-sm"
          />
          {searchInput ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearchInput("")}
              className="absolute right-2 top-1/2 inline-flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3" aria-label="Loading tasks">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="animate-pulse py-5">
                <div className="h-4 w-2/3 rounded bg-muted" />
                <div className="mt-2 h-3 w-1/3 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {error ? (
            <Card className="border-destructive/50 bg-destructive/[0.03]">
              <CardContent className="flex flex-wrap items-center gap-3 py-4">
                <p role="alert" className="flex-1 text-sm text-destructive">
                  {error}
                </p>
                <Button variant="outline" size="sm" onClick={reload}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {tasks.length === 0 && !error ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                <span className="inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ListChecks className="size-5" />
                </span>
                <p className="text-sm font-medium">No tasks yet</p>
                <p className="text-xs text-muted-foreground">
                  Create your first task above and start tracking your work.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {!error && tasks.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
                  <span className="font-medium text-foreground">
                    {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
                  </span>
                  {inProgressCount > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                      <LoaderCircle className="size-3" />
                      {inProgressCount} in progress
                    </span>
                  ) : null}
                  {overdueCount > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">
                      <CalendarDays className="size-3" />
                      {overdueCount} overdue
                    </span>
                  ) : null}
                </div>
              ) : null}

              <ul className="flex flex-col gap-3">
                {[...tasks]
                  .sort(
                    (a, b) =>
                      (activeTimer?.taskId === a.id ? 0 : 1) -
                      (activeTimer?.taskId === b.id ? 0 : 1),
                  )
                  .map((task) => {
                    const meta = STATUS_META[task.status];
                    const busy = mutating === task.id;
                    const dueState = getDueState(task.dueDate, task.status);
                    const isActive = activeTimer?.taskId === task.id;
                    const isCompleted = task.status === "COMPLETED";

                    return (
                      <li key={task.id}>
                        <Card
                          className={`group relative overflow-hidden transition-all duration-200 hover:shadow-md ${
                            isActive
                              ? "border-primary/60 bg-primary/[0.04] shadow-sm ring-1 ring-primary/30"
                              : dueState === "overdue"
                                ? "border-destructive/40 bg-destructive/[0.03]"
                                : isCompleted
                                  ? "opacity-70 hover:opacity-100"
                                  : "hover:border-muted-foreground/30"
                          }`}
                        >
                          {/* Left accent bar */}
                          <span
                            aria-hidden="true"
                            className={`absolute inset-y-0 left-0 w-1 transition-colors ${
                              isActive
                                ? "bg-primary"
                                : task.status === "COMPLETED"
                                  ? "bg-emerald-500/60"
                                  : task.status === "IN_PROGRESS"
                                    ? "bg-primary/40"
                                    : "bg-muted-foreground/20"
                            }`}
                          />

                          <CardContent className="flex flex-col gap-3 py-4 pl-5">
                            {/* Header row: icon + title/description + actions */}
                            <div className="flex items-start justify-between gap-3">
                              {editingId === task.id ? (
                                <div className="flex min-w-0 flex-1 flex-col gap-2">
                                  <Input
                                    aria-label="Task title"
                                    value={draftTitle}
                                    maxLength={200}
                                    disabled={busy}
                                    onChange={(e) => setDraftTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") void saveEdit(task);
                                      if (e.key === "Escape") cancelEdit();
                                    }}
                                  />
                                  <textarea
                                    aria-label="Task description"
                                    value={draftDesc}
                                    rows={2}
                                    disabled={busy}
                                    onChange={(e) => setDraftDesc(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Escape") cancelEdit();
                                    }}
                                    placeholder="Description (optional)"
                                    className="min-h-9 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  />
                                  {editError ? (
                                    <p role="alert" className="text-xs text-destructive">
                                      {editError}
                                    </p>
                                  ) : null}
                                  <div className="flex gap-2">
                                    <Button size="sm" disabled={busy} onClick={() => void saveEdit(task)}>
                                      {busy ? "Saving..." : "Save"}
                                    </Button>
                                    <Button variant="outline" size="sm" disabled={busy} onClick={cancelEdit}>
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                              <div className="flex min-w-0 items-start gap-3">
                                <span
                                  className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg ${meta.tileClass}`}
                                  aria-hidden="true"
                                >
                                  <meta.Icon
                                    className={`size-4 ${
                                      task.status === "IN_PROGRESS" ? "animate-spin" : ""
                                    }`}
                                  />
                                </span>
                                <div className="min-w-0">
                                  <p
                                    className={`truncate text-[15px] font-semibold tracking-tight transition-colors ${
                                      isCompleted ? "text-muted-foreground line-through" : ""
                                    }`}
                                  >
                                    {task.title}
                                  </p>
                                  {task.description ? (
                                    <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                                      {task.description}
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                              )}
                              <div className="flex shrink-0 items-center gap-1">
                                {editingId === task.id ? null : (
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label={`Edit ${task.title}`}
                                    onClick={() => startEdit(task)}
                                    disabled={busy}
                                    className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
                                  >
                                    <Pencil />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Delete ${task.title}`}
                                  onClick={() => void removeTask(task)}
                                  disabled={busy}
                                  className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
                                >
                                  <Trash2 />
                                </Button>
                              </div>
                            </div>

                            {/* Meta row: badges + dates */}
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <span
                                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ${meta.badgeClass}`}
                              >
                                {meta.label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Created {formatDate(task.createdAt)}
                              </span>
                              {task.dueDate ? (
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                                    dueState === "overdue"
                                      ? "border-destructive/50 bg-destructive/10 text-destructive"
                                      : dueState
                                        ? "border-primary/30 bg-primary/10 text-primary"
                                        : "border-transparent text-muted-foreground"
                                  }`}
                                >
                                  <CalendarDays className="size-3" aria-hidden="true" />
                                  {formatDueDay(task.dueDate)}
                                  {dueState ? ` · ${DUE_LABEL[dueState]}` : ""}
                                </span>
                              ) : null}
                              {isActive ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                  <span className="relative flex size-2" aria-hidden="true">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                                    <span className="relative inline-flex size-2 rounded-full bg-primary" />
                                  </span>
                                  <RowElapsed startedAt={activeTimer.startedAt} />
                                </span>
                              ) : null}
                            </div>

                            {/* Actions row: due date, timer, status */}
                            <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
                              <div className="flex items-center gap-1.5">
                                <label
                                  htmlFor={`due-${task.id}`}
                                  className="text-xs font-medium text-muted-foreground"
                                >
                                  Due
                                </label>
                                <input
                                  id={`due-${task.id}`}
                                  type="date"
                                  aria-label={`Due date for ${task.title}`}
                                  value={task.dueDate ? task.dueDate.slice(0, 10) : ""}
                                  disabled={busy}
                                  onChange={(e) => void changeDueDate(task, e.target.value || null)}
                                  className="h-8 rounded-md border border-input bg-background px-2 text-xs transition-colors hover:border-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                                {task.dueDate ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    aria-label={`Clear due date for ${task.title}`}
                                    disabled={busy}
                                    onClick={() => void changeDueDate(task, null)}
                                    className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                                  >
                                    Clear
                                  </Button>
                                ) : null}
                              </div>

                              <div className="ml-auto flex flex-wrap items-center gap-2">
                                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  Status
                                  <select
                                    aria-label={`Status for ${task.title}`}
                                    value={task.status}
                                    disabled={busy}
                                    onChange={(e) => void changeStatus(task, e.target.value as TaskStatus)}
                                    className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground transition-colors hover:border-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  >
                                    <option value="PENDING">Pending</option>
                                    <option value="IN_PROGRESS">In progress</option>
                                    <option value="COMPLETED">Completed</option>
                                  </select>
                                </label>

                                {isActive ? (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={timerBusy}
                                    onClick={() => void stopTimer(task.id)}
                                    className="h-8"
                                  >
                                    <Square className="size-3.5" />
                                    {timerBusy ? "Stopping..." : "Stop"}
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={timerBusy || isCompleted}
                                    onClick={() => void startTimer(task)}
                                    className="h-8"
                                  >
                                    <Play className="size-3.5" />
                                    {timerBusy ? "Starting..." : "Start Timer"}
                                  </Button>
                                )}

                                {busy ? (
                                  <span
                                    className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                                    role="status"
                                  >
                                    <LoaderCircle className="size-3 animate-spin" />
                                    Saving…
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </li>
                    );
                  })}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}