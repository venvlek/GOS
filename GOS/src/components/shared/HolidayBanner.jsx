import React from 'react';
import { CalendarOff } from 'lucide-react';
import { C } from '../../lib/theme';
import { fmtDate } from '../../lib/dates';

export default function HolidayBanner({ holiday }) {
  return (
    <div className="rounded-2xl px-4 py-3.5 flex items-start gap-3" style={{ background: C.goldSoft }}>
      <CalendarOff size={18} color={C.gold} className="mt-0.5 shrink-0" />
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{holiday.label}</div>
        <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}>
          {holiday.start === holiday.end ? fmtDate(holiday.start) : `${fmtDate(holiday.start)} – ${fmtDate(holiday.end)}`}
          {' · '}Attendance is disabled for this date.
        </div>
      </div>
    </div>
  );
}
