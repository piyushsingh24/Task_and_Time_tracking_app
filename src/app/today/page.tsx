import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { TodayView } from "@/components/today/today-view";

export default async function TodayPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Navbar email={user.email} />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
        <TodayView />
      </main>
    </div>
  );
}
