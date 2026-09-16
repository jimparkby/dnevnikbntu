import { PrismaClient, LessonType } from "@prisma/client";
import bntuGroups from "./data/bntu-groups.json";

// Railway's proxy doesn't actually allow ~29 pooled connections — the pool
// exhausts and prisma throws P2024. Cap the client pool to a sane number.
const dbUrl = new URL(process.env.DATABASE_URL ?? "");
dbUrl.searchParams.set("connection_limit", "5");
const prisma = new PrismaClient({ datasources: { db: { url: dbUrl.toString() } } });

// One-off / periodic import of real lesson timetables from the public
// BNTU schedule aggregator (supbntu.site, itself sourced from bntu.by).
// Not part of `prisma db seed` — it makes ~640 outbound HTTP requests and
// takes several minutes, so it's meant to be run manually when the
// semester timetable needs refreshing: `npm run import:schedule`.
//
// Known simplifications: the source splits some slots by subgroup
// (subgroup: 1 | 2) or offers alternatives ("variants"). We don't model
// that — every lesson listed for a day/time slot becomes its own
// ScheduleEntry (with its week when it alternates 1|2), so a student in a
// split/variants slot may see two lessons stacked for the same time. Weekly
// alternation (week: 1/2) IS recorded, so the app can show the right half.

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
  week?: number; // 1 | 2, present only for lessons that alternate weekly
}
interface SourceSlot {
  time: string;
  endTime: string;
  lessons: SourceLesson[];
  mode?: string; // "single" | "weeks" | "split" | "variants"
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
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) return null;
      clearTimeout(timer);
      return (await res.json()) as SourceSchedule;
    } catch (err) {
      if (attempt === 2) {
        console.warn(`  failed ${faculty}/${group}: ${(err as Error).message}`);
        return null;
      }
      await sleep(400 * attempt);
    }
  }
  clearTimeout(timer);
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
  let skipped = 0;
  let entriesCreated = 0;
  let fetchFailures = 0;

  for (const [facultyShortName, groupNames] of Object.entries(GROUPS_BY_FACULTY)) {
    const faculty = await prisma.faculty.findUnique({ where: { shortName: facultyShortName } });
    if (!faculty) continue;

    for (const groupName of groupNames) {
      groupsProcessed++;
      const group = await prisma.group.findUnique({ where: { name: groupName } });
      if (!group) continue;

      // Resume support: groups already rewritten with week-aware rows are skipped.
      const alreadyImported = await prisma.scheduleEntry.count({
        where: { groupId: group.id, week: { not: null } },
      });
      if (alreadyImported > 0) {
        skipped++;
        continue;
      }

      const schedule = await fetchGroupSchedule(facultyShortName, groupName);
      await sleep(150);

      if (!schedule?.days) {
        fetchFailures++;
        continue;
      }

      const rows: { groupId: string; subjectId: string; dayOfWeek: number; week: number | null; startTime: string; endTime: string; room: string | null; type: LessonType }[] = [];

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
              week: lesson.week ?? null,
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

      if (groupsProcessed % 25 === 0) {
        console.log(`  ...${groupsProcessed} groups checked (${entriesCreated} lesson rows so far, ${skipped} skipped resumable)`);
      }
    }
  }

  console.log(
    `Done. ${groupsProcessed} groups checked, ${skipped} already imported, ${groupsWithData} got fresh data (${entriesCreated} lesson rows), ${fetchFailures} fetch failures, ${subjectIds.size} distinct subjects.`
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
