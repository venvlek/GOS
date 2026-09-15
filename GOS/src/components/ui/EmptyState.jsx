import React from 'react';
import { C } from '../../lib/theme';

export default function EmptyState({ title, body }) {
  return (
    <div className="text-center py-10 px-6">
      <div className="goss-serif" style={{ fontSize: 17, color: C.green, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13.5, color: C.inkSoft, maxWidth: 340, margin: '0 auto' }}>{body}</div>
    </div>
  );
}
