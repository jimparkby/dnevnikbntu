import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/backend/lib/currentUser";
import { prisma } from "@/backend/lib/prisma";
import BottomNav from "@/frontend/components/BottomNav";
import TeacherJournalTable from "@/frontend/components/TeacherJournalTable";
import TeacherHomeworkAction from "@/frontend/components/TeacherHomeworkAction";

export default async function JournalPage({ searchParams }: { searchParams: { groupId?: string; subjectId?: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "TEACHER") redirect("/diary");

  const links = await prisma.teacherSubject.findMany({
    where: { teacherId: user.id },
    include: { group: true, subject: true },
    orderBy: [{ subject: { name: "asc" } }, { group: { name: "asc" } }],
  });

  if (links.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-bg px-6 text-center">
        <p className="text-sm text-text-secondary">За вами пока не закреплены группы и предметы. Обратитесь к администратору деканата.</p>
      </div>
    );
  }

  const selected =
    links.find((l) => l.groupId === searchParams.groupId && l.subjectId === searchParams.subjectId) ?? links[0];

  const students = await prisma.user.findMany({
    where: { groupId: selected.groupId, role: { in: ["STUDENT", "STAROSTA"] } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const grades = await prisma.grade.findMany({
    where: { groupId: selected.groupId, subjectId: selected.subjectId },
    orderBy: { date: "asc" },
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const gradeDates = Array.from(new Set(grades.map((g) => g.date.toISOString().slice(0, 10))));
  const dates = Array.from(new Set([...gradeDates, todayStr])).sort().slice(-4);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg">
      <div className="flex-shrink-0 px-4 pb-2.5 pt-3.5">
        <h1 className="text-xl font-bold tracking-tight text-text">Журнал</h1>
        <p className="text-sm text-text-secondary">{selected.subject.name} · Преподаватель</p>
      </div>

      <div className="flex flex-shrink-0 gap-2 overflow-x-auto px-4 pb-3">
        {links.map((l) => {
          const active = l.id === selected.id;
          return (
            <Link
              key={l.id}
              href={`/journal?groupId=${l.groupId}&subjectId=${l.subjectId}`}
              className={`flex-shrink-0 rounded-[11px] px-3.5 py-2 text-[13.5px] ${
                active ? "bg-primary font-semibold text-white" : "border border-border bg-card text-text"
              }`}
            >
              {l.group.name}
            </Link>
          );
        })}
      </div>

      <TeacherHomeworkAction
        groupId={selected.groupId}
        groupName={selected.group.name}
        subjectId={selected.subjectId}
        subjectName={selected.subject.name}
      />

      <div className="flex-1 overflow-y-auto px-4 pb-2">
        {students.length > 0 ? (
          <TeacherJournalTable
            groupId={selected.groupId}
            subjectId={selected.subjectId}
            subjectName={selected.subject.name}
            students={students.map((s) => ({ id: s.id, name: `${s.lastName ?? ""} ${s.firstName}`.trim() }))}
            dates={dates}
            grades={grades.map((g) => ({ studentId: g.studentId, date: g.date.toISOString().slice(0, 10), value: g.value }))}
          />
        ) : (
          <p className="pt-10 text-center text-sm text-text-muted">В группе {selected.group.name} пока нет студентов в системе</p>
        )}
        <p className="pb-1 pt-2.5 text-center text-xs text-text-muted">Нажмите на пунктирную ячейку, чтобы выставить оценку</p>
      </div>

      <BottomNav role={user.role} />
    </div>
  );
}
