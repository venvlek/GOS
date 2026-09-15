import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { C, STATUS_META } from '../../lib/theme';
import { storageGet, todayStr, dayKey, studentsKey, HOLIDAYS_KEY } from '../../lib/storage';
import { isHoliday } from '../../lib/dates';
import Card from '../ui/Card';
import Field from '../ui/Field';
import EmptyState from '../ui/EmptyState';
import DateNav from '../ui/DateNav';
import HolidayBanner from '../shared/HolidayBanner';
import { inputStyle } from '../ui/Inputs';

export default function RecordsViewer({ config }) {
  const [classId, setClassId] = useState(config.classes[0]?.id || '');
  const [date, setDate] = useState(todayStr());
  const [students, setStudents] = useState([]);
  const [day, setDay] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { storageGet(HOLIDAYS_KEY, true).then((h) => setHolidays(h || [])); }, []);
  const holiday = isHoliday(date, holidays);

  useEffect(() => {
    if (!classId || holiday) return;
    setLoading(true);
    Promise.all([storageGet(studentsKey(classId), true), storageGet(dayKey(classId, date), true)]).then(([s, d]) => {
      setStudents(s || []);
      setDay(d);
      setLoading(false);
    });
  }, [classId, date, holiday]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4">
        <Field label="Class">
          <div className="relative">
            <select value={classId} onChange={(e) => setClassId(e.target.value)} style={{ ...inputStyle, minWidth: 200, appearance: 'none' }} className="goss-sans">
              {config.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: 11, color: C.inkSoft, pointerEvents: 'none' }} />
          </div>
        </Field>
        <Field label="Date"><DateNav date={date} onChange={setDate} max={todayStr()} /></Field>
      </div>

      {config.classes.length === 0 ? (
        <EmptyState title="No classes yet" body="Create a class first under Classes & students." />
      ) : holiday ? (
        <HolidayBanner holiday={holiday} />
      ) : loading ? (
        <div style={{ fontSize: 13, color: C.inkSoft }}>Loading…</div>
      ) : !day ? (
        <EmptyState title="Nothing recorded" body="No attendance was submitted for this class on this date." />
      ) : (
        <Card style={{ padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>Attendance</div>
          <div style={{ fontSize: 12, color: C.inkSoft, marginBottom: 12 }}>Taken by {day.teacherName || 'a teacher'}</div>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
            {students.map((s) => {
              const st = day.attendance?.[s.id];
              const meta = STATUS_META[st];
              return (
                <div key={s.id} className="flex items-center justify-between py-1">
                  <span style={{ fontSize: 13.5 }}>{s.name}</span>
                  {meta ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: meta.bg, color: meta.color }}>
                      <meta.Icon size={12} />{meta.label}
                    </span>
                  ) : <span style={{ fontSize: 12, color: C.inkSoft }}>—</span>}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
