import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { C, STATUS_META } from '../../lib/theme';
import { useDay } from '../../hooks/useDay';
import { storageGet, todayStr, HOLIDAYS_KEY } from '../../lib/storage';
import { isHoliday } from '../../lib/dates';
import Card from '../ui/Card';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import SavedTick from '../ui/SavedTick';
import DateNav from '../ui/DateNav';
import HolidayBanner from '../shared/HolidayBanner';
import { inputStyle } from '../ui/Inputs';

// `classes` = classes where this teacher is the CLASS TEACHER (owns the register).
export default function AttendanceTab({ classes, teacherName }) {
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [date, setDate] = useState(todayStr());
  const [holidays, setHolidays] = useState([]);

  useEffect(() => { storageGet(HOLIDAYS_KEY, true).then((h) => setHolidays(h || [])); }, []);
  const holiday = isHoliday(date, holidays);

  const { students, day, loading, persist, savedAt } = useDay(classId, date, teacherName);

  if (classes.length === 0) {
    return <EmptyState title="You're not a class teacher yet" body="Ask the principal to set you as the class teacher of a class, under Classes & students." />;
  }

  const activeClass = classes.find((c) => c.id === classId);

  const setStatus = (studentId, status) => {
    const attendance = { ...(day?.attendance || {}) };
    attendance[studentId] = attendance[studentId] === status ? undefined : status;
    if (attendance[studentId] === undefined) delete attendance[studentId];
    persist({ ...day, attendance });
  };

  const markAll = (status) => {
    const attendance = {};
    students.forEach((s) => { attendance[s.id] = status; });
    persist({ ...day, attendance });
  };

  const marked = Object.keys(day?.attendance || {}).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="goss-serif" style={{ fontSize: 19, color: C.green }}>{activeClass?.name}</div>
        {classes.length > 1 && (
          <div className="relative">
            <select value={classId} onChange={(e) => setClassId(e.target.value)} style={{ ...inputStyle, appearance: 'none', paddingRight: 28 }} className="goss-sans">
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: 9, top: 10, color: C.inkSoft, pointerEvents: 'none' }} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <DateNav date={date} onChange={setDate} max={todayStr()} />
        {!holiday && !loading && (
          <div style={{ fontSize: 12.5, color: C.inkSoft }}>{marked}/{students.length} marked <SavedTick savedAt={savedAt} /></div>
        )}
      </div>

      {holiday ? (
        <HolidayBanner holiday={holiday} />
      ) : loading ? (
        <div style={{ fontSize: 13, color: C.inkSoft }}>Loading…</div>
      ) : students.length === 0 ? (
        <EmptyState title="No students in this class" body="Ask the principal to add students under Classes & students." />
      ) : (
        <>
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={() => markAll('present')}>Mark all present</Button>
          </div>
          <Card>
            {students.map((s, i) => {
              const current = day.attendance?.[s.id];
              return (
                <div key={s.id} className="flex items-center justify-between px-4 py-3" style={{ borderTop: i === 0 ? 'none' : `1px solid ${C.line}` }}>
                  <span style={{ fontSize: 14 }}>{s.name}</span>
                  <div className="flex gap-1.5">
                    {Object.entries(STATUS_META).map(([key, meta]) => (
                      <button
                        key={key}
                        onClick={() => setStatus(s.id, key)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ background: current === key ? meta.color : meta.bg, color: current === key ? '#fff' : meta.color }}
                      >
                        <meta.Icon size={12} />{meta.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </Card>
        </>
      )}
    </div>
  );
}
