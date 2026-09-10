import { prisma } from "@/backend/lib/prisma";
import type { CurrentUser } from "@/backend/lib/currentUser";

// Домашние задания: староста — только своей группе; преподаватель — группам,
// которые он ведёт по данному предмету (см. TeacherSubject).
export async function canEditHomework(user: CurrentUser, groupId: string, subjectId: string): Promise<boolean> {
  if (user.role === "STAROSTA") {
    return user.groupId === groupId;
  }
  if (user.role === "TEACHER") {
    const link = await prisma.teacherSubject.findUnique({
      where: { teacherId_subjectId_groupId: { teacherId: user.id, subjectId, groupId } },
    });
    return Boolean(link);
  }
  return false;
}

// Оценки: только преподаватель, и только по предметам/группам, закреплённым за ним.
export async function canGrade(user: CurrentUser, groupId: string, subjectId: string): Promise<boolean> {
  if (user.role !== "TEACHER") return false;
  const link = await prisma.teacherSubject.findUnique({
    where: { teacherId_subjectId_groupId: { teacherId: user.id, subjectId, groupId } },
  });
  return Boolean(link);
}
