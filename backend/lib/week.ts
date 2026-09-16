// Расписания БНТУ чередуются две недели: 1-я (нечётная) и 2-я (чётная).
// Номер недели считается по ISO-неделям календаря, как в офиц. календаре
// университета: нечётная ISO-неделя = 1-я учебная, чётная = 2-я.
export function getIsoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function weekParity(week: number): 1 | 2 {
  return week % 2 === 1 ? 1 : 2;
}

export function currentWeekParity(date: Date = new Date()): 1 | 2 {
  return weekParity(getIsoWeek(date));
}