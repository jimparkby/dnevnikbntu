import { PrismaClient, LessonType } from "@prisma/client";
import bntuGroups from "./data/bntu-groups.json";

const prisma = new PrismaClient();

// One-off / periodic import of real lesson timetables from the public
// BNTU schedule aggregator (supbntu.site, itself sourced from bntu.by).
// Not part of `prisma db seed` — it makes ~640 outbound HTTP requests and
// takes several minutes, so it's meant to be run manually when the
// semester timetable needs refreshing: `npm run import:schedule`.
//
// Known simplification: the source alternates some lessons by week parity
// (week: 1 | 2) or splits a slot by subgroup. We don't model that here —
// every lesson listed for a day/time slot becomes its own ScheduleEntry,
// so a student may see two lessons stacked in the same slot when in
// reality they alternate week to week.

const TYPE_MAP: Record<string, LessonType> = {
  "лекция": "LECTURE",
  "практика": "PRACTICE",
  "лабораторная": "LAB",
  "консультация": "PRACTICE",
  "физкультура": "PRACTICE",
  "занятие": "LECTURE",
};

interface SourceLesson {
  title: string;
  type: string;
  room?: string;
}
interface SourceSlot {
  time: string;
  endTime: string;
  lessons: SourceLesson[];
}
interface SourceSchedule {
  days?: Record<string, SourceSlot[]>;
}

const GROUPS_BY_FACULTY: Record<string, string[]> = bntuGroups;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchGroupSchedule(faculty: string, group: string): Promise<SourceSchedule | null> {
  const url = `https://supbntu.site/api/schedule/${encodeURIComponent(faculty)}/${group}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return (await res.json()) as SourceSchedule;
    } catch (err) {
      if (attempt === 3) {
        console.warn(`  failed ${faculty}/${group}: ${(err as Error).message}`);
        return null;
      }
      await sleep(500 * attempt);
    }
  }
  return null;
}

async function main() {
  const subjectIds = new Map<string, string>();
  async function getSubjectId(name: string): Promise<string> {
    const cached = subjectIds.get(name);
    if (cached) return cached;
    const subject = await prisma.subject.upsert({ where: { name }, update: {}, create: { name } });
    subjectIds.set(name, subject.id);
    return subject.id;
  }

  let groupsProcessed = 0;
  let groupsWithData = 0;
  let entriesCreated = 0;
  let fetchFailures = 0;

  for (const [facultyShortName, groupNames] of Object.entries(GROUPS_BY_FACULTY)) {
    const faculty = await prisma.faculty.findUnique({ where: { shortName: facultyShortName } });
    if (!faculty) continue;

    for (const groupName of groupNames) {
      groupsProcessed++;
      const group = await prisma.group.findUnique({ where: { name: groupName } });
      if (!group) continue;

      const schedule = await fetchGroupSchedule(facultyShortName, groupName);
      await sleep(150);

      if (!schedule?.days) {
        fetchFailures++;
        continue;
      }

      const rows: { groupId: string; subjectId: string; dayOfWeek: number; startTime: string; endTime: string; room: string | null; type: LessonType }[] = [];

      for (const [dayKey, slots] of Object.entries(schedule.days)) {
        const dayOfWeek = Number(dayKey);
        if (!Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 6) continue;

        for (const slot of slots) {
          for (const lesson of slot.lessons) {
            const title = lesson.title?.trim();
            if (!title) continue;
            const subjectId = await getSubjectId(title);
            rows.push({
              groupId: group.id,
              subjectId,
              dayOfWeek,
              startTime: slot.time,
              endTime: slot.endTime,
              room: lesson.room?.trim() || null,
              type: TYPE_MAP[lesson.type] ?? "LECTURE",
            });
          }
        }
      }

      if (rows.length === 0) continue;

      await prisma.scheduleEntry.deleteMany({ where: { groupId: group.id } });
      await prisma.scheduleEntry.createMany({ data: rows });
      entriesCreated += rows.length;
      groupsWithData++;

      if (groupsProcessed % 50 === 0) {
        console.log(`  ...${groupsProcessed} groups processed (${entriesCreated} lesson rows so far)`);
      }
    }
  }

  console.log(
    `Done. ${groupsProcessed} groups checked, ${groupsWithData} had a schedule (${entriesCreated} lesson rows), ${fetchFailures} fetch failures, ${subjectIds.size} distinct subjects.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
