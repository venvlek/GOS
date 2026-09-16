import React from 'react';
import { LogOut } from 'lucide-react';
import { C } from '../../lib/theme';
import Logo from './Logo';
import Button from './Button';

export default function TopBar({ role, subtitle, onLogout, right }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 sm:py-4" style={{ borderBottom: `1px solid ${C.line}` }}>
      <Logo size={18} />
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {right}
        <div className="hidden sm:block text-right">
          <div style={{ fontSize: 13, fontWeight: 600 }}>{role}</div>
          {subtitle && <div style={{ fontSize: 11.5, color: C.inkSoft }}>{subtitle}</div>}
        </div>
        <Button variant="ghost" size="sm" icon={LogOut} onClick={onLogout}>Sign out</Button>
      </div>
    </div>
  );
}
