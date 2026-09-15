import React from 'react';
import { C } from '../../lib/theme';

export default function Card({ children, style, className = '' }) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{ background: C.card, border: `1px solid ${C.line}`, ...style }}
    >
      {children}
    </div>
  );
}
