import { redirect } from "next/navigation";
import { getCurrentUser } from "@/backend/lib/currentUser";
import { prisma } from "@/backend/lib/prisma";
import BottomNav from "@/frontend/components/BottomNav";
import GradeChip from "@/frontend/components/GradeChip";

export default async function GradesPage() {
  const user = await getCurrentUser();
  if (!user || !user.role) redirect("/onboarding");
  if (user.role === "TEACHER") redirect("/journal");

  const grades = await prisma.grade.findMany({
    where: { studentId: user.id },
    include: { subject: true },
    orderBy: { date: "desc" },
  });

  const bySubject = new Map<string, { name: string; grades: typeof grades }>();
  for (const g of grades) {
    const entry = bySubject.get(g.subjectId) ?? { name: g.subject.name, grades: [] };
    entry.grades.push(g);
    bySubject.set(g.subjectId, entry);
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg">
      <div className="flex-shrink-0 px-4 pb-2.5 pt-3.5">
        <h1 className="text-xl font-bold tracking-tight text-text">Оценки</h1>
        <p className="text-sm text-text-secondary">Группа {user.group?.name}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {bySubject.size === 0 && <p className="pt-10 text-center text-sm text-text-muted">Оценок пока нет</p>}
        {[...bySubject.entries()].map(([subjectId, { name, grades: subjectGrades }]) => {
          const avg = Math.round((subjectGrades.reduce((a, g) => a + g.value, 0) / subjectGrades.length) * 10) / 10;
          return (
            <div key={subjectId} className="mb-3 rounded-card border border-[#EEF0F2] bg-card p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[15px] font-semibold text-text">{name}</div>
                <div className="text-[13px] font-semibold text-text-secondary">Ср. {avg}</div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {subjectGrades.map((g) => (
                  <div key={g.id} className="flex flex-col items-center gap-1">
                    <GradeChip value={g.value} size="sm" />
                    <span className="text-[10px] text-text-muted">
                      {g.date.toLocaleDateString("ru-RU", { day: "numeric", month: "numeric" })}
                    </span>
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
