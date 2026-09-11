import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/backend/lib/currentUser";
import BottomNav from "@/frontend/components/BottomNav";

const ROLE_LABELS = { STUDENT: "Студент", STAROSTA: "Староста", TEACHER: "Преподаватель" } as const;

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user || !user.role) redirect("/onboarding");

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg pt-[var(--tg-safe-top)]">
      <div className="flex-shrink-0 px-4 pb-2.5 pt-3.5">
        <h1 className="text-xl font-bold tracking-tight text-text">Профиль</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="rounded-card border border-[#EEF0F2] bg-card p-4">
          <div className="text-lg font-semibold text-text">
            {user.firstName} {user.lastName ?? ""}
          </div>
          {user.username && <div className="text-sm text-text-muted">@{user.username}</div>}

          <div className="mt-4 flex flex-col gap-2.5 border-t border-[#F1F2F4] pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Роль</span>
              <span className="font-medium text-text">{ROLE_LABELS[user.role]}</span>
            </div>
            {user.group && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Факультет</span>
                  <span className="font-medium text-text">{user.group.faculty.shortName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Группа</span>
                  <span className="font-medium text-text">{user.group.name}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <Link
          href="/onboarding"
          className="mt-2.5 block rounded-card border border-[#EEF0F2] bg-card p-3.5 text-center text-sm font-semibold text-primary [touch-action:manipulation]"
        >
          {user.role === "TEACHER" ? "Изменить роль и предметы" : "Сменить роль или группу"}
        </Link>
      </div>

      <BottomNav role={user.role} />
    </div>
  );
}
