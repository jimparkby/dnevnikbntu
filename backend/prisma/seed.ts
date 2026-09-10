import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Source: priem.bntu.by, abiturient.by (2026 admission year)
const FACULTIES: { shortName: string; name: string }[] = [
  { shortName: "АТФ", name: "Автотракторный факультет" },
  { shortName: "АФ", name: "Архитектурный факультет" },
  { shortName: "ВТФ", name: "Военно-технический факультет" },
  { shortName: "ИПФ", name: "Инженерно-педагогический факультет" },
  { shortName: "МСФ", name: "Машиностроительный факультет" },
  { shortName: "МИДО", name: "Международный институт дистанционного образования" },
  { shortName: "МТФ", name: "Механико-технологический факультет" },
  { shortName: "ПСФ", name: "Приборостроительный факультет" },
  { shortName: "СТФ", name: "Спортивно-технический факультет" },
  { shortName: "СФ", name: "Строительный факультет" },
  { shortName: "ФГДЭ", name: "Факультет горного дела и инженерной экологии" },
  { shortName: "ФИТР", name: "Факультет информационных технологий и робототехники" },
  { shortName: "ФММП", name: "Факультет маркетинга, менеджмента, предпринимательства" },
  { shortName: "ФТУГ", name: "Факультет технологий управления и гуманитаризации" },
  { shortName: "ФТК", name: "Факультет транспортных коммуникаций" },
  { shortName: "ФЭС", name: "Факультет энергетического строительства" },
  { shortName: "ЭФ", name: "Энергетический факультет" },
];

async function main() {
  for (const f of FACULTIES) {
    await prisma.faculty.upsert({
      where: { shortName: f.shortName },
      update: { name: f.name },
      create: f,
    });
  }

  const fitr = await prisma.faculty.findUniqueOrThrow({ where: { shortName: "ФИТР" } });

  const group = await prisma.group.upsert({
    where: { name: "10702219" },
    update: {},
    create: { name: "10702219", facultyId: fitr.id },
  });

  const subjects = await Promise.all(
    ["Математический анализ", "Программирование", "Физика"].map((name) =>
      prisma.subject.upsert({ where: { name }, update: {}, create: { name } })
    )
  );

  const schedule: { subject: string; dayOfWeek: number; startTime: string; endTime: string; room: string; type: "LECTURE" | "PRACTICE" | "LAB" }[] = [
    { subject: "Математический анализ", dayOfWeek: 1, startTime: "09:00", endTime: "10:30", room: "305, гл. корпус", type: "LECTURE" },
    { subject: "Программирование", dayOfWeek: 1, startTime: "10:45", endTime: "12:15", room: "213, корп. 12", type: "PRACTICE" },
    { subject: "Физика", dayOfWeek: 1, startTime: "13:00", endTime: "14:30", room: "101, гл. корпус", type: "LECTURE" },
  ];

  for (const entry of schedule) {
    const subject = subjects.find((s) => s.name === entry.subject)!;
    const existing = await prisma.scheduleEntry.findFirst({
      where: { groupId: group.id, subjectId: subject.id, dayOfWeek: entry.dayOfWeek, startTime: entry.startTime },
    });
    if (!existing) {
      await prisma.scheduleEntry.create({
        data: {
          groupId: group.id,
          subjectId: subject.id,
          dayOfWeek: entry.dayOfWeek,
          startTime: entry.startTime,
          endTime: entry.endTime,
          room: entry.room,
          type: entry.type,
        },
      });
    }
  }

  console.log(`Seeded ${FACULTIES.length} faculties, 1 demo group (${group.name}), ${subjects.length} subjects.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
