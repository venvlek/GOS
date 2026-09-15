import { storageGet, dayKey, studentsKey, todayStr } from './storage';
import { dateRangeArray } from './dates';

// Tallies present/late-vs-marked days per student across a date range.
export async function computeAttendanceStats(classId, start, end) {
  const cappedEnd = end > todayStr() ? todayStr() : end;
  const students = (await storageGet(studentsKey(classId), true)) || [];
  const dates = dateRangeArray(start, cappedEnd);

  const tally = {};
  students.forEach((s) => { tally[s.id] = { name: s.name, present: 0, marked: 0 }; });

  let daysRecorded = 0;
  for (const date of dates) {
    const day = await storageGet(dayKey(classId, date), true);
    const entries = day ? Object.entries(day.attendance || {}) : [];
    if (entries.length === 0) continue;
    daysRecorded += 1;
    for (const [studentId, status] of entries) {
      if (!tally[studentId]) tally[studentId] = { name: '(removed student)', present: 0, marked: 0 };
      tally[studentId].marked += 1;
      if (status === 'present' || status === 'late') tally[studentId].present += 1;
    }
  }

  return {
    daysRecorded,
    students: Object.entries(tally).map(([id, v]) => ({ id, ...v })),
  };
}
