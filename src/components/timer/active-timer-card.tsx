"use client";

import { Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatElapsed } from "@/lib/time";
import { useElapsedSeconds } from "@/components/timer/use-elapsed";

export type ActiveTimer = {
  id: string;
  taskId: string;
  startedAt: string;
  task: { id: string; title: string; status: string };
};

/** Prominent active-timer widget with live elapsed time. */
export function ActiveTimerCard({
  timer,
  stopping,
  onStop,
}: {
  timer: ActiveTimer;
  stopping: boolean;
  onStop: () => void;
}) {
  const elapsed = useElapsedSeconds(timer.startedAt);

  return (
    <Card className="border-2 border-primary" role="status" aria-label="Active timer">
      <CardContent className="flex flex-col gap-3 py-5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="relative flex size-2.5" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
          </span>
          Tracking
        </div>
        <p className="truncate text-sm text-muted-foreground">{timer.task.title}</p>
        <p className="text-4xl font-semibold tabular-nums tracking-tight" aria-live="off">
          {formatElapsed(elapsed)}
        </p>
        <Button onClick={onStop} disabled={stopping} className="w-full sm:w-auto">
          <Square />
          {stopping ? "Stopping..." : "Stop"}
        </Button>
      </CardContent>
    </Card>
  );
}
