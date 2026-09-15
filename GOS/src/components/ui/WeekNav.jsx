import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { C } from '../../lib/theme';
import { addDays, fmtWeekLabel } from '../../lib/dates';

// Prev/next-week arrows around a "Mon – Sun" label.
export default function WeekNav({ weekStart, onChange, maxWeekStart, minWeekStart }) {
  const atMax = maxWeekStart ? weekStart >= maxWeekStart : false;
  const atMin = minWeekStart ? weekStart <= minWeekStart : false;
  const btnStyle = { border: `1px solid ${C.line}`, borderRadius: 999, padding: 7 };
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onChange(addDays(weekStart, -7))} disabled={atMin} className="disabled:opacity-30" style={btnStyle}>
        <ChevronLeft size={15} color={C.green} />
      </button>
      <div style={{ fontSize: 13.5, fontWeight: 600, minWidth: 140, textAlign: 'center' }}>{fmtWeekLabel(weekStart)}</div>
      <button onClick={() => onChange(addDays(weekStart, 7))} disabled={atMax} className="disabled:opacity-30" style={btnStyle}>
        <ChevronRight size={15} color={C.green} />
      </button>
    </div>
  );
}
