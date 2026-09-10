import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import BottomNav from "@/components/BottomNav";

export default async function GroupsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "TEACHER") redirect("/diary");

  const links = await prisma.teacherSubject.findMany({
    where: { teacherId: user.id },
    include: { group: { include: { faculty: true } }, subject: true },
    orderBy: [{ group: { name: "asc" } }],
  });

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg">
      <div className="flex-shrink-0 px-4 pb-2.5 pt-3.5">
        <h1 className="text-xl font-bold tracking-tight text-text">Мои группы</h1>
        <p className="text-sm text-text-secondary">{links.length} закреплённых связок предмет/группа</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {links.length === 0 && <p className="pt-10 text-center text-sm text-text-muted">За вами пока не закреплены группы</p>}
        <div className="flex flex-col gap-2.5">
          {links.map((l) => (
            <Link
              key={l.id}
              href={`/journal?groupId=${l.groupId}&subjectId=${l.subjectId}`}
              className="flex items-center justify-between rounded-card border border-[#EEF0F2] bg-card p-3.5"
            >
              <div>
                <div className="text-[15px] font-semibold text-text">Группа {l.group.name}</div>
                <div className="text-[13px] text-text-muted">{l.subject.name} · {l.group.faculty.shortName}</div>
              </div>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9AA5B1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 6 6 6-6 6" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      <BottomNav role={user.role} />
    </div>
  );
}
