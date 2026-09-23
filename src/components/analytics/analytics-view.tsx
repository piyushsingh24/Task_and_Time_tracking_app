"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DayRow = { date: string; totalSeconds: number; completedTasks: number };
type TaskRow = { taskId: string; title: string; totalSeconds: number };

function dayLabel(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
  });
}

function ChartShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <Card>
        <CardContent className="py-4">{children}</CardContent>
      </Card>
    </div>
  );
}

export function AnalyticsView() {
  const [days, setDays] = useState<DayRow[]>([]);
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
    async function fetchAnalytics() {
      try {
        const res = await fetch(`/api/analytics/weekly?tz=${encodeURIComponent(tz)}`);
        const json = (await res.json()) as {
          success: boolean;
          data?: { days: DayRow[]; tasks: TaskRow[] };
          error?: { message?: string };
        };
        if (ignore) return;
        if (!res.ok || !json.success || !json.data) {
          setError(json.error?.message ?? "Unable to load analytics.");
          return;
        }
        setDays(json.data.days);
        setTasks(json.data.tasks);
        setError(null);
      } catch {
        if (!ignore) setError("Something went wrong. Please try again.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void fetchAnalytics();
    return () => {
      ignore = true;
    };
  }, [tz, refreshKey]);

  const timeByDay = days.map((d) => ({
    ...d,
    label: dayLabel(d.date),
    minutes: Math.round(d.totalSeconds / 60),
  }));
  const hasTime = timeByDay.some((d) => d.minutes > 0);
  const hasCompleted = days.some((d) => d.completedTasks > 0);

  if (loading) {
    return (
      <div className="flex flex-col gap-6" aria-label="Loading analytics">
        {["Time by day", "Completed by day", "Time per task"].map((t) => (
          <div key={t} className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">{t}</h3>
            <Card>
              <CardContent className="py-6">
                <div className="h-32 animate-pulse rounded bg-muted" aria-hidden="true" />
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-3 py-6">
          <p role="alert" className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={reload}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!hasTime && !hasCompleted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Last 7 days</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            No tracked time in the last 7 days. Start a timer to build your history.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">Last 7 days</p>

      <ChartShell title="Time by day">
        {hasTime ? (
          <div className="h-55 w-full text-primary">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeByDay} margin={{ top: 4, right: 4, bottom: 0, left: -14 }}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={44} />
                <Tooltip formatter={(v) => [`${v} min`, "Tracked"]} labelFormatter={(_, p) => p?.[0]?.payload?.date ?? ""} />
                <Bar dataKey="minutes" fill="currentColor" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-2 text-sm text-muted-foreground">No tracked time this week.</p>
        )}
      </ChartShell>

      <ChartShell title="Completed by day">
        {hasCompleted ? (
          <div className="h-55 w-full text-primary">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeByDay} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={36} allowDecimals={false} />
                <Tooltip formatter={(v) => [`${v}`, "Completed"]} labelFormatter={(_, p) => p?.[0]?.payload?.date ?? ""} />
                <Bar dataKey="completedTasks" fill="currentColor" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-2 text-sm text-muted-foreground">No completions this week.</p>
        )}
      </ChartShell>

      <ChartShell title="Time per task">
        {tasks.length > 0 ? (
          <div className="h-60 w-full text-primary">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={tasks.slice(0, 8).map((t) => ({
                  ...t,
                  label: t.title.length > 18 ? `${t.title.slice(0, 18)}…` : t.title,
                  minutes: Math.round(t.totalSeconds / 60),
                }))}
                layout="vertical"
                margin={{ top: 0, right: 8, bottom: 0, left: 8 }}
              >
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={110} />
                <Tooltip formatter={(v) => [`${v} min`, "Tracked"]} />
                <Bar dataKey="minutes" fill="currentColor" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-2 text-sm text-muted-foreground">No tracked time this week.</p>
        )}
      </ChartShell>
    </div>
  );
}
