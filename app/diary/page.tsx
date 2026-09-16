import { redirect } from "next/navigation";
import { getCurrentUser } from "@/backend/lib/currentUser";
import { currentWeekParity } from "@/backend/lib/week";
import { prisma } from "@/backend/lib/prisma";
import { canEditHomework } from "@/backend/lib/permissions";
import BottomNav from "@/frontend/components/BottomNav";
import LessonCard from "@/frontend/components/LessonCard";

const WEEKDAYS = ["", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

export default async function DiaryPage() {
  const user = await getCurrentUser();
  if (!user || !user.role) redirect("/onboarding");
  if (user.role === "TEACHER") redirect("/journal");
  if (!user.groupId || !user.group) redirect("/onboarding");

  const today = new Date();
  const jsDay = today.getDay(); // 0 = Sunday
  const dayOfWeek = jsDay === 0 ? 7 : jsDay;
  const currentWeek = currentWeekParity(today);
  const todayStr = today.toISOString().slice(0, 10);

  const lessons = await prisma.scheduleEntry.findMany({
    where: { groupId: user.groupId, dayOfWeek, OR: [{ week: null }, { week: currentWeek }] },
    include: {
      subject: true,
      homework: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { startTime: "asc" },
  });

  const todaysGrades = await prisma.grade.findMany({
    where: {
      studentId: user.id,
      date: { gte: new Date(`${todayStr}T00:00:00`), lt: new Date(`${todayStr}T23:59:59`) },
    },
  });

  const lessonCards = await Promise.all(
    lessons.map(async (lesson) => {
      const homework = lesson.homework[0] ?? null;
      const grade = todaysGrades.find((g) => g.subjectId === lesson.subjectId)?.value ?? null;
      const editable = user.role === "STAROSTA" ? await canEditHomework(user, user.groupId!, lesson.subjectId) : false;

      return (
        <LessonCard
          key={lesson.id}
          scheduleEntryId={lesson.id}
          startTime={lesson.startTime}
          endTime={lesson.endTime}
          type={lesson.type}
          subjectId={lesson.subjectId}
          subjectName={lesson.subject.name}
          room={lesson.room}
          groupId={user.groupId!}
          groupName={user.group!.name}
          homeworkText={homework?.text ?? null}
          homeworkDeadline={homework ? homework.deadline.toISOString().slice(0, 10) : null}
          grade={grade}
          canEditHomework={editable}
        />
      );
    })
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg pt-[var(--tg-safe-top)]">
      <div className="flex-shrink-0 px-4 pb-2.5 pt-3.5">
        <h1 className="text-xl font-bold tracking-tight text-text">Дневник</h1>
        <p className="text-sm text-text-secondary">
          {WEEKDAYS[dayOfWeek] ?? ""}, {today.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} · Группа {user.group.name}
        </p>
      </div>

      {user.role === "STAROSTA" && (
        <div className="mx-4 mb-2.5 flex items-center gap-2 rounded-xl bg-primary-light px-3 py-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B4F91" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M22 11h-6" />
          </svg>
          <p className="text-[12.5px] font-semibold text-primary">Вы староста группы — можно добавлять домашние задания</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {lessonCards.length > 0 ? (
          <div className="flex flex-col gap-2.5">{lessonCards}</div>
        ) : (
          <p className="pt-10 text-center text-sm text-text-muted">Сегодня занятий нет</p>
        )}
        <p className="pb-1 pt-3 text-center text-xs text-text-muted">
          {user.role === "STUDENT" ? "Только просмотр — изменения доступны старосте и преподавателю" : "Оценки выставляет только преподаватель"}
        </p>
      </div>

      <BottomNav role={user.role} />
    </div>
  );
}
