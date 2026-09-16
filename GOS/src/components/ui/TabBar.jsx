import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { C } from '../../lib/theme';

export default function TabBar({ tabs, active, onChange }) {
  const [open, setOpen] = useState(false);
  const activeTab = tabs.find((t) => t.id === active);

  const select = (id) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div style={{ borderBottom: `1px solid ${C.line}` }}>
      {/* Phone: hamburger trigger + dropdown list */}
      <div className="sm:hidden">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-2 px-5 py-3.5"
        >
          {open ? <X size={17} color={C.green} /> : <Menu size={17} color={C.green} />}
          {activeTab && <activeTab.icon size={15} color={C.green} />}
          <span style={{ fontSize: 14, fontWeight: 600, color: C.green }}>
            {activeTab ? activeTab.label : 'Menu'}
          </span>
        </button>
        {open && (
          <div style={{ borderTop: `1px solid ${C.line}` }}>
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => select(t.id)}
                className="w-full flex items-center gap-2.5 px-5 py-3 text-left"
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: active === t.id ? C.green : C.inkSoft,
                  background: active === t.id ? C.sageSoft : 'transparent',
                }}
              >
                <t.icon size={16} />
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop / tablet: horizontal tabs */}
      <div className="hidden sm:flex gap-1 px-5 overflow-x-auto">
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
    </div>
  );
}
