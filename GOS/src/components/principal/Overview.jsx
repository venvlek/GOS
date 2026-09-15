import React, { useEffect, useMemo, useState } from 'react';
import { C } from '../../lib/theme';
import { storageGet, todayStr, dayKey, studentsKey, HOLIDAYS_KEY } from '../../lib/storage';
import { fmtDate, isHoliday } from '../../lib/dates';
import Card from '../ui/Card';
import Field from '../ui/Field';
import EmptyState from '../ui/EmptyState';
import DateNav from '../ui/DateNav';
import HolidayBanner from '../shared/HolidayBanner';
import StatCard from './StatCard';

export default function Overview({ config }) {
  const [rows, setRows] = useState(null);
  const [date, setDate] = useState(todayStr());
  const [holidays, setHolidays] = useState([]);

  useEffect(() => { storageGet(HOLIDAYS_KEY, true).then((h) => setHolidays(h || [])); }, []);
  const holiday = isHoliday(date, holidays);

  useEffect(() => {
    if (holiday) { setRows([]); return; }
    let cancelled = false;
    async function run() {
      setRows(null);
      const out = [];
      for (const c of config.classes) {
        const students = (await storageGet(studentsKey(c.id), true)) || [];
        const day = await storageGet(dayKey(c.id, date), true);
        out.push({ cls: c, studentCount: students.length, day });
      }
      if (!cancelled) setRows(out);
    }
    run();
    return () => { cancelled = true; };
  }, [config.classes, date, holiday]);

  const totals = useMemo(() => {
    const totalStudents = rows ? rows.reduce((a, r) => a + r.studentCount, 0) : 0;
    let taken = 0, present = 0, marked = 0;
    (rows || []).forEach((r) => {
      if (r.day) {
        taken += 1;
        const vals = Object.values(r.day.attendance || {});
        marked += vals.length;
        present += vals.filter((v) => v === 'present' || v === 'late').length;
      }
    });
    return { totalStudents, taken, present, marked };
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="goss-serif" style={{ fontSize: 22, color: C.green }}>Good day, Principal</div>
          <div style={{ fontSize: 13.5, color: C.inkSoft }}>Here's how the school is doing on {fmtDate(date)}.</div>
        </div>
        <Field label="Date"><DateNav date={date} onChange={setDate} max={todayStr()} /></Field>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Classes" value={config.classes.length} />
        <StatCard label="Teachers" value={config.teachers.length} />
        <StatCard label="Students" value={rows ? totals.totalStudents : (holiday ? '—' : '…')} />
        <StatCard
          label="Attendance taken"
          value={holiday ? 'Holiday' : rows ? `${totals.taken}/${config.classes.length}` : '…'}
          accent={C.gold}
          hint={!holiday && totals.marked ? `${Math.round((totals.present / totals.marked) * 100)}% present so far` : undefined}
        />
      </div>

      {holiday ? (
        <HolidayBanner holiday={holiday} />
      ) : (
        <Card>
          <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${C.line}` }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Class-by-class status</div>
          </div>
          {config.classes.length === 0 ? (
            <EmptyState title="No classes yet" body="Add your first class under Classes & students to get started." />
          ) : (
            <div>
              {(rows || config.classes.map((c) => ({ cls: c, studentCount: 0, day: null }))).map((r, i) => (
                <div key={r.cls.id} className="flex items-center justify-between px-5 py-3" style={{ borderTop: i === 0 ? 'none' : `1px solid ${C.line}` }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{r.cls.name}</div>
                    <div style={{ fontSize: 12, color: C.inkSoft }}>{r.studentCount} student{r.studentCount === 1 ? '' : 's'}</div>
                  </div>
                  {r.day ? (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: C.sageSoft, color: C.green }}>
                      Taken by {r.day.teacherName || 'teacher'}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: C.roseSoft, color: C.rose }}>Not yet taken</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
