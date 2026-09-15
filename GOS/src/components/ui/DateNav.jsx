import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { C } from '../../lib/theme';
import { addDays } from '../../lib/dates';
import { TextInput } from './Inputs';

// Prev/next-day arrows either side of a native date input.
export default function DateNav({ date, onChange, max, min }) {
  const atMax = max ? date >= max : false;
  const atMin = min ? date <= min : false;
  const btnStyle = { border: `1px solid ${C.line}`, borderRadius: 999, padding: 7 };
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={() => onChange(addDays(date, -1))} disabled={atMin} className="disabled:opacity-30" style={btnStyle}>
        <ChevronLeft size={15} color={C.green} />
      </button>
      <TextInput type="date" value={date} max={max} min={min} onChange={(e) => onChange(e.target.value)} style={{ width: 165 }} />
      <button onClick={() => onChange(addDays(date, 1))} disabled={atMax} className="disabled:opacity-30" style={btnStyle}>
        <ChevronRight size={15} color={C.green} />
      </button>
    </div>
  );
}
