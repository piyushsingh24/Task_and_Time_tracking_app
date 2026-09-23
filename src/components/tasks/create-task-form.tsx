"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TaskListItem } from "@/components/tasks/task-manager";

export function CreateTaskForm({ onCreated }: { onCreated: (task: TaskListItem) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function handleImprove() {
    setAiError(null);
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/task-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: title }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { suggestion: { title: string; description: string } };
        error?: { message?: string };
      };
      if (!res.ok || !json.success || !json.data) {
        setAiError(json.error?.message ?? "Unable to improve task.");
        return;
      }
      // Suggestion stays editable — nothing is saved until Create Task.
      setTitle(json.data.suggestion.title);
      setDescription(json.data.suggestion.description);
    } catch {
      setAiError("Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          dueDate: dueDate || undefined,
        }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { task: TaskListItem };
        error?: { message?: string };
      };
      if (!res.ok || !json.success || !json.data) {
        setError(json.error?.message ?? "Unable to create task.");
        return;
      }
      setTitle("");
      setDescription("");
      setDueDate("");
      onCreated(json.data.task);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create task</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-title">What do you need to do?</Label>
            <Input
              id="task-title"
              placeholder="follow up with designer"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={pending}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={generating || pending || title.trim().length < 3}
              onClick={() => void handleImprove()}
            >
              <Sparkles />
              {generating ? "Generating..." : "Improve with AI"}
            </Button>
            {aiError ? (
              <p role="alert" className="text-sm text-destructive">
                {aiError}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-description">Description (optional)</Label>
            <Input
              id="task-description"
              placeholder="Confirm wireframe delivery status"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-due">Due date (optional)</Label>
            <Input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={pending}
            />
          </div>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={pending || title.trim().length === 0}>
            {pending ? "Saving..." : "Create Task"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
