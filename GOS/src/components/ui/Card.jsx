import React, { forwardRef } from 'react';
import { C } from '../../lib/theme';

const Card = forwardRef(function Card({ children, style, className = '' }, ref) {
  return (
    <div
      ref={ref}
      className={`rounded-2xl ${className}`}
      style={{ background: C.card, border: `1px solid ${C.line}`, ...style }}
    >
      {children}
    </div>
  );
});

export default Card;
