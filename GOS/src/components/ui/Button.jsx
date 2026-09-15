import React from 'react';
import { C } from '../../lib/theme';

export default function Button({
  children, onClick, variant = 'primary', icon: Icon,
  type = 'button', disabled, size = 'md',
}) {
  const pad = size === 'sm' ? '6px 12px' : '9px 16px';
  const fontSize = size === 'sm' ? 13 : 14;
  const styles = {
    primary: { background: C.green, color: '#fff', border: `1px solid ${C.green}` },
    gold: { background: C.gold, color: '#fff', border: `1px solid ${C.gold}` },
    outline: { background: 'transparent', color: C.green, border: `1px solid ${C.green}` },
    ghost: { background: 'transparent', color: C.inkSoft, border: '1px solid transparent' },
    danger: { background: 'transparent', color: C.rose, border: `1px solid ${C.roseSoft}` },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-full transition-opacity hover:opacity-85 disabled:opacity-40"
      style={{ ...styles[variant], padding: pad, fontSize, fontWeight: 600 }}
    >
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
}
