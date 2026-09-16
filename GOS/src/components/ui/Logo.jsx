import React from 'react';
import { C } from '../../lib/theme';
import logoUrl from '../../assets/logo.png';

export default function Logo({ size = 22 }) {
  const badgeSize = size + 14;

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center justify-center rounded-full overflow-hidden shrink-0"
        style={{ width: badgeSize, height: badgeSize, background: C.green }}
      >
        <img
          src={logoUrl}
          alt="Garden of Success logo"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
      <div className="leading-tight min-w-0">
        <div className="goss-serif truncate" style={{ fontSize: 14, fontWeight: 600, color: C.green }}>
          Garden of Success
        </div>
        <div className="hidden sm:block" style={{ fontSize: 11, color: C.inkSoft, letterSpacing: 0.2 }}>Register &amp; Diary</div>
      </div>
    </div>
  );
}
