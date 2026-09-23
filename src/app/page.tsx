import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth";
import { Navbar } from "@/components/navbar";

export default async function Home() {
  const user = await getSessionUser();

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Navbar email={user?.email ?? null} />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            AI-Powered Task &amp; Time Tracking
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Manage tasks, track work sessions in real time with one active
            timer, and review daily summaries. Groq AI turns rough notes into
            clear tasks.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Dashboard", desc: "Today's time, tasks, and activity", href: "/dashboard" },
            { title: "Today", desc: "Current-day summary and sessions", href: "/today" },
            { title: "Tasks", desc: "Create, track, and complete work", href: "/tasks" },
            { title: "Time Logs", desc: "History of every session", href: "/time-logs" },
            { title: "Analytics", desc: "Weekly trends and totals", href: "/analytics" },
          ].map((item) => (
            <Link key={item.title} href={item.href}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-sm underline underline-offset-4">Open →</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          {user ? (
            <Link href="/dashboard" className={buttonVariants()}>
              Open Dashboard
            </Link>
          ) : (
            <Link href="/register" className={buttonVariants()}>
              Get started
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
