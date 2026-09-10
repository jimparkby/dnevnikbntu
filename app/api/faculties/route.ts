import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const faculties = await prisma.faculty.findMany({
    orderBy: { shortName: "asc" },
    include: { groups: { orderBy: { name: "asc" } } },
  });
  const subjects = await prisma.subject.findMany({ orderBy: { name: "asc" } });

  return NextResponse.json({ faculties, subjects });
}
