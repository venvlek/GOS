import React from 'react';
import { C } from '../../lib/theme';

export default function ModeToggle({ mode, onChange, options }) {
  return (
    <div className="flex rounded-full p-1 w-fit" style={{ background: C.sageSoft }}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className="px-3.5 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: mode === o.value ? C.green : 'transparent', color: mode === o.value ? '#fff' : C.green }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
