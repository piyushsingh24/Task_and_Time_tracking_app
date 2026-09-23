import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { TimeLogsView } from "@/components/timelogs/time-logs-view";

export default async function TimeLogsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Navbar email={user.email} />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Time Logs</h1>
        </div>
        <TimeLogsView />
      </main>
    </div>
  );
}
