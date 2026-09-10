import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";

export default async function RootPage() {
  const user = await getCurrentUser();

  if (!user) {
    // No session cookie yet — TelegramInit (in the layout) is exchanging
    // initData for one and will refresh this page once it lands.
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-sm text-text-secondary">Входим через Telegram…</p>
      </div>
    );
  }

  const needsOnboarding = !user.role || (user.role !== "TEACHER" && !user.groupId);
  if (needsOnboarding) {
    redirect("/onboarding");
  }

  redirect(user.role === "TEACHER" ? "/journal" : "/diary");
}
