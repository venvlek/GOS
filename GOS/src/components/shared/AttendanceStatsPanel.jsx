import React, { useEffect, useMemo, useState } from 'react';
import { C } from '../../lib/theme';
import { storageGet, todayStr, TERMS_KEY } from '../../lib/storage';
import { getWeekRange, getMonthRange, getTermForDate, fmtShort } from '../../lib/dates';
import { computeAttendanceStats } from '../../lib/stats';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';

// Present-days-out-of-recorded-days per student, for week / month / term.
// Shared by both the teacher and principal statistics screens.
export default function AttendanceStatsPanel({ classId }) {
  const [period, setPeriod] = useState('week');
  const [terms, setTerms] = useState([]);
  const [data, setData] = useState(null);
  const today = todayStr();

  useEffect(() => { storageGet(TERMS_KEY, true).then((t) => setTerms(t || [])); }, []);

  const range = useMemo(() => {
    if (period === 'week') return { ...getWeekRange(today), name: null };
    if (period === 'month') return { ...getMonthRange(today), name: null };
    const term = getTermForDate(today, terms);
    return term ? { start: term.start, end: term.end, name: term.name } : null;
  }, [period, terms, today]);

  useEffect(() => {
    if (!classId || !range) { setData(null); return; }
    let cancelled = false;
    setData(null);
    computeAttendanceStats(classId, range.start, range.end).then((res) => {
      if (!cancelled) setData(res);
    });
    return () => { cancelled = true; };
  }, [classId, range]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex rounded-full p-1" style={{ background: C.sageSoft }}>
          {['week', 'month', 'term'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize"
              style={{ background: period === p ? C.green : 'transparent', color: period === p ? '#fff' : C.green }}
            >
              {p}
            </button>
          ))}
        </div>
        {range && (
          <div style={{ fontSize: 12.5, color: C.inkSoft }}>
            {range.name ? `${range.name}: ` : ''}{fmtShort(range.start)} – {fmtShort(range.end)}
          </div>
        )}
      </div>

      {!range ? (
        <EmptyState title="No term set up" body="Ask the principal to add the current term's dates under Calendar." />
      ) : data === null ? (
        <div style={{ fontSize: 13, color: C.inkSoft }}>Crunching the numbers…</div>
      ) : data.students.length === 0 ? (
        <EmptyState title="No students" body="Add students to this class first." />
      ) : (
        <Card>
          <div className="px-4 py-2.5 flex justify-between" style={{ borderBottom: `1px solid ${C.line}`, fontSize: 12, color: C.inkSoft, fontWeight: 600 }}>
            <span>Student</span>
            <span>{data.daysRecorded} day{data.daysRecorded === 1 ? '' : 's'} recorded</span>
          </div>
          {data.students.map((s, i) => {
            const pct = s.marked ? Math.round((s.present / s.marked) * 100) : null;
            return (
              <div key={s.id} className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: i === 0 ? 'none' : `1px solid ${C.line}` }}>
                <span style={{ fontSize: 13.5 }}>{s.name}</span>
                <span style={{ fontSize: 13, color: C.inkSoft }}>
                  {s.present}/{s.marked || 0} days{pct !== null ? ` · ${pct}%` : ''}
                </span>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
