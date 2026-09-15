import React from 'react';
import { C } from '../../lib/theme';

export default function TabBar({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 px-5 overflow-x-auto" style={{ borderBottom: `1px solid ${C.line}` }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className="flex items-center gap-1.5 px-3 py-3 text-sm whitespace-nowrap"
          style={{
            fontWeight: 600,
            color: active === t.id ? C.green : C.inkSoft,
            borderBottom: active === t.id ? `2px solid ${C.green}` : '2px solid transparent',
          }}
        >
          <t.icon size={15} />
          {t.label}
        </button>
      ))}
    </div>
  );
}
