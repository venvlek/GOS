import React from 'react';
import { C } from '../../lib/theme';

export default function Field({ label, children }) {
  return (
    <label className="block">
      <div style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: 5, fontWeight: 600 }}>{label}</div>
      {children}
    </label>
  );
}
