import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/lib/prisma";
import { getCurrentUser } from "@/backend/lib/currentUser";
import { canEditHomework } from "@/backend/lib/permissions";

interface Body {
  groupId: string;
  subjectId: string;
  scheduleEntryId?: string;
  text: string;
  deadline: string; // yyyy-mm-dd
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as Body;
  if (!body.groupId || !body.subjectId || !body.text?.trim() || !body.deadline) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const allowed = await canEditHomework(user, body.groupId, body.subjectId);
  if (!allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const existing = body.scheduleEntryId
    ? await prisma.homework.findFirst({ where: { scheduleEntryId: body.scheduleEntryId } })
    : null;

  const homework = existing
    ? await prisma.homework.update({
        where: { id: existing.id },
        data: { text: body.text, deadline: new Date(body.deadline) },
      })
    : await prisma.homework.create({
        data: {
          groupId: body.groupId,
          subjectId: body.subjectId,
          scheduleEntryId: body.scheduleEntryId,
          text: body.text,
          deadline: new Date(body.deadline),
          createdById: user.id,
        },
      });

  return NextResponse.json({ ok: true, homework });
}
