import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { C } from '../../lib/theme';
import EmptyState from '../ui/EmptyState';
import { inputStyle } from '../ui/Inputs';
import AttendanceStatsPanel from '../shared/AttendanceStatsPanel';

// `classes` = classes where this teacher is the class teacher.
export default function StatisticsTab({ classes }) {
  const [classId, setClassId] = useState(classes[0]?.id || '');

  if (classes.length === 0) {
    return <EmptyState title="No attendance data yet" body="Statistics are based on the class(es) you take attendance for as class teacher." />;
  }

  const activeClass = classes.find((c) => c.id === classId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="goss-serif" style={{ fontSize: 19, color: C.green }}>{activeClass?.name} — attendance statistics</div>
        {classes.length > 1 && (
          <div className="relative">
            <select value={classId} onChange={(e) => setClassId(e.target.value)} style={{ ...inputStyle, appearance: 'none', paddingRight: 28 }} className="goss-sans">
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: 9, top: 10, color: C.inkSoft, pointerEvents: 'none' }} />
          </div>
        )}
      </div>
      <AttendanceStatsPanel classId={classId} />
    </div>
  );
}
