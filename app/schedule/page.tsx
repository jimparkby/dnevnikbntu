import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import BottomNav from "@/components/BottomNav";

const TYPE_LABELS = { LECTURE: "Лекция", PRACTICE: "Практика", LAB: "Лабораторная" } as const;
const WEEKDAYS = ["", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

export default async function SchedulePage() {
  const user = await getCurrentUser();
  if (!user || !user.role) redirect("/onboarding");
  if (user.role === "TEACHER") {
    const links = await prisma.teacherSubject.findMany({ where: { teacherId: user.id }, include: { group: true, subject: true } });
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-bg">
        <div className="flex-shrink-0 px-4 pb-2.5 pt-3.5">
          <h1 className="text-xl font-bold tracking-tight text-text">Расписание</h1>
          <p className="text-sm text-text-secondary">Ваши пары по группам</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <p className="pt-10 text-center text-sm text-text-muted">Расписание преподавателя появится здесь после привязки к учебному плану.</p>
        </div>
        <BottomNav role={user.role} />
      </div>
    );
  }

  if (!user.groupId) redirect("/onboarding");

  const lessons = await prisma.scheduleEntry.findMany({
    where: { groupId: user.groupId },
    include: { subject: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  const byDay = new Map<number, typeof lessons>();
  for (const lesson of lessons) {
    byDay.set(lesson.dayOfWeek, [...(byDay.get(lesson.dayOfWeek) ?? []), lesson]);
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg">
      <div className="flex-shrink-0 px-4 pb-2.5 pt-3.5">
        <h1 className="text-xl font-bold tracking-tight text-text">Расписание</h1>
        <p className="text-sm text-text-secondary">Группа {user.group?.name} · на неделю</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {lessons.length === 0 && <p className="pt-10 text-center text-sm text-text-muted">Расписание ещё не заполнено</p>}
        {[1, 2, 3, 4, 5, 6].map((day) => {
          const dayLessons = byDay.get(day);
          if (!dayLessons?.length) return null;
          return (
            <div key={day} className="mb-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">{WEEKDAYS[day]}</div>
              <div className="flex flex-col gap-2">
                {dayLessons.map((l) => (
                  <div key={l.id} className="rounded-card border border-[#EEF0F2] bg-card p-3">
                    <div className="text-xs font-semibold text-primary">
                      {l.startTime}–{l.endTime} · {TYPE_LABELS[l.type]}
                    </div>
                    <div className="text-[15px] font-semibold text-text">{l.subject.name}</div>
                    {l.room && <div className="text-[13px] text-text-muted">{l.room}</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <BottomNav role={user.role} />
    </div>
  );
}
