import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { Role } from "@prisma/client";

interface OnboardingBody {
  role: Role;
  groupId?: string; // required for STUDENT / STAROSTA
  teaching?: { subjectId: string; groupId: string }[]; // required for TEACHER, at least one
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as OnboardingBody;

  if (!["STUDENT", "STAROSTA", "TEACHER"].includes(body.role)) {
    return NextResponse.json({ error: "invalid_role" }, { status: 400 });
  }

  if (body.role !== "TEACHER") {
    if (!body.groupId) {
      return NextResponse.json({ error: "group_required" }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: session.userId },
      data: { role: body.role, groupId: body.groupId },
    });
  } else {
    if (!body.teaching || body.teaching.length === 0) {
      return NextResponse.json({ error: "teaching_required" }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: session.userId },
      data: { role: "TEACHER" },
    });
    await prisma.teacherSubject.createMany({
      data: body.teaching.map((t) => ({ teacherId: session.userId, subjectId: t.subjectId, groupId: t.groupId })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({ ok: true });
}
