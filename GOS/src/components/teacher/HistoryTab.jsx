import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { C } from '../../lib/theme';
import { storageGet, fmtDate, dayKey, studentsKey } from '../../lib/storage';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import { inputStyle } from '../ui/Inputs';

export default function HistoryTab({ classId, className }) {
  const [days, setDays] = useState(14);
  const [rows, setRows] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setRows(null);
      const dates = [];
      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().slice(0, 10));
      }
      const students = (await storageGet(studentsKey(classId), true)) || [];
      const out = [];
      for (const date of dates) {
        const day = await storageGet(dayKey(classId, date), true);
        if (day) out.push({ date, day, total: students.length });
      }
      if (!cancelled) setRows(out);
    }
    run();
    return () => { cancelled = true; };
  }, [classId, days]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="goss-serif" style={{ fontSize: 19, color: C.green }}>{className} — history</div>
        <div className="relative">
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ ...inputStyle, appearance: 'none', paddingRight: 28 }} className="goss-sans">
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: 9, top: 10, color: C.inkSoft, pointerEvents: 'none' }} />
        </div>
      </div>

      {rows === null ? (
        <div style={{ fontSize: 13, color: C.inkSoft }}>Loading…</div>
      ) : rows.length === 0 ? (
        <EmptyState title="No records yet" body="Once attendance is taken for this class, it will show up here." />
      ) : (
        <Card>
          {rows.map((r, i) => {
            const vals = Object.values(r.day.attendance || {});
            const present = vals.filter((v) => v === 'present' || v === 'late').length;
            const pct = vals.length ? Math.round((present / vals.length) * 100) : 0;
            return (
              <div key={r.date} className="flex items-center justify-between px-5 py-3" style={{ borderTop: i === 0 ? 'none' : `1px solid ${C.line}` }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{fmtDate(r.date)}</div>
                  <div style={{ fontSize: 12, color: C.inkSoft }}>
                    {(r.day.lessonNotes || []).length} lesson note{(r.day.lessonNotes || []).length === 1 ? '' : 's'} · {(r.day.diary || []).length} diary entr{(r.day.diary || []).length === 1 ? 'y' : 'ies'}
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: C.sageSoft, color: C.green }}>{pct}% present</span>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
