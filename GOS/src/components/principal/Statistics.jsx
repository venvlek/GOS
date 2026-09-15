import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { C } from '../../lib/theme';
import Field from '../ui/Field';
import EmptyState from '../ui/EmptyState';
import { inputStyle } from '../ui/Inputs';
import AttendanceStatsPanel from '../shared/AttendanceStatsPanel';

export default function Statistics({ config }) {
  const [classId, setClassId] = useState(config.classes[0]?.id || '');

  if (config.classes.length === 0) {
    return <EmptyState title="No classes yet" body="Add a class under Classes & students first." />;
  }

  return (
    <div className="space-y-5">
      <Field label="Class">
        <div className="relative" style={{ maxWidth: 260 }}>
          <select value={classId} onChange={(e) => setClassId(e.target.value)} style={{ ...inputStyle, appearance: 'none' }} className="goss-sans">
            {config.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: 11, color: C.inkSoft, pointerEvents: 'none' }} />
        </div>
      </Field>
      <AttendanceStatsPanel classId={classId} />
    </div>
  );
}
