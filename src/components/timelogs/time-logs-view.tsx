"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime, formatDurationShort } from "@/lib/time";

type TimeLog = {
  id: string;
  taskId: string;
  startedAt: string;
  endedAt: string | null;
  duration: number | null;
  task: { id: string; title: string };
};

type TaskOption = { id: string; title: string };

export function TimeLogsView() {
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [tasks, setTasks] = useState<TaskOption[]>([]);
  const [taskId, setTaskId] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function fetchLogs() {
      const params = new URLSearchParams();
      if (taskId) params.set("taskId", taskId);
      try {
        const [logsRes, tasksRes] = await Promise.all([
          fetch(`/api/time-logs?${params.toString()}`),
          fetch("/api/tasks"),
        ]);
        const json = (await logsRes.json()) as {
          success: boolean;
          data?: { timeLogs: TimeLog[] };
          error?: { message?: string };
        };
        const tasksJson = (await tasksRes.json()) as {
          success: boolean;
          data?: { tasks: TaskOption[] };
        };
        if (ignore) return;
        if (!logsRes.ok || !json.success || !json.data) {
          setError(json.error?.message ?? "Unable to load time logs.");
          return;
        }
        setLogs(json.data.timeLogs);
        setError(null);
        if (tasksRes.ok && tasksJson.success && tasksJson.data) {
          setTasks(tasksJson.data.tasks);
        }
      } catch {
        if (!ignore) setError("Something went wrong. Please try again.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void fetchLogs();
    return () => {
      ignore = true;
    };
  }, [taskId, refreshKey]);

  function reload() {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label htmlFor="log-task-filter" className="text-sm font-medium">
          Filter by task
        </label>
        <select
          id="log-task-filter"
          value={taskId}
          onChange={(e) => {
            setLoading(true);
            setTaskId(e.target.value);
          }}
          className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm sm:max-w-xs"
        >
          <option value="">All tasks</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3" aria-label="Loading time logs">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="animate-pulse py-5">
                <div className="h-4 w-2/3 rounded bg-muted" />
                <div className="mt-2 h-3 w-1/3 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 py-6">
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
            <Button variant="outline" size="sm" onClick={reload}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 py-6">
            <p className="font-medium">No time tracked yet</p>
            <p className="text-sm text-muted-foreground">
              Start a timer on a task and your sessions will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th scope="col" className="px-4 py-3 font-medium">Task</th>
                  <th scope="col" className="px-4 py-3 font-medium">Started</th>
                  <th scope="col" className="px-4 py-3 font-medium">Ended</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Duration</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0">
                    <td className="max-w-55 truncate px-4 py-3 font-medium">{log.task.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(log.startedAt)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {log.endedAt ? formatDateTime(log.endedAt) : "In progress"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {formatDurationShort(log.duration)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="flex flex-col gap-3 md:hidden">
            {logs.map((log) => (
              <li key={log.id}>
                <Card>
                  <CardContent className="flex flex-col gap-1 py-4">
                    <p className="truncate font-medium">{log.task.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(log.startedAt)} →{" "}
                      {log.endedAt ? formatDateTime(log.endedAt) : "In progress"}
                    </p>
                    <p className="text-sm font-semibold tabular-nums">
                      {formatDurationShort(log.duration)}
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
