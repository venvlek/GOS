import React from 'react';
import { C } from '../../lib/theme';

// Loads the Fraunces / Public Sans font pairing once, and wraps every
// screen in the shared background + text color.
export function Fonts() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Public+Sans:wght@400;500;600;700&display=swap');
      .goss-serif { font-family: 'Fraunces', Georgia, serif; }
      .goss-sans { font-family: 'Public Sans', ui-sans-serif, system-ui, sans-serif; }
    `}</style>
  );
}

export default function Shell({ children }) {
  return (
    <div className="goss-sans min-h-full w-full" style={{ background: C.bg, color: C.ink }}>
      <Fonts />
      {children}
    </div>
  );
}
