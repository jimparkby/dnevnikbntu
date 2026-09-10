import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/lib/prisma";
import { getCurrentUser } from "@/backend/lib/currentUser";
import { canGrade } from "@/backend/lib/permissions";
import type { GradeType } from "@prisma/client";

interface Body {
  studentId: string;
  groupId: string;
  subjectId: string;
  date: string; // yyyy-mm-dd
  value: number;
  type: GradeType;
  comment?: string;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as Body;
  if (!body.studentId || !body.groupId || !body.subjectId || !body.date || !body.value) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (body.value < 1 || body.value > 10) {
    return NextResponse.json({ error: "value_out_of_range" }, { status: 400 });
  }

  const allowed = await canGrade(user, body.groupId, body.subjectId);
  if (!allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const student = await prisma.user.findUnique({ where: { id: body.studentId } });
  if (!student || student.groupId !== body.groupId) {
    return NextResponse.json({ error: "student_not_in_group" }, { status: 400 });
  }

  const grade = await prisma.grade.create({
    data: {
      studentId: body.studentId,
      groupId: body.groupId,
      subjectId: body.subjectId,
      date: new Date(body.date),
      value: body.value,
      type: body.type ?? "CURRENT",
      comment: body.comment,
      teacherId: user.id,
    },
  });

  return NextResponse.json({ ok: true, grade });
}
