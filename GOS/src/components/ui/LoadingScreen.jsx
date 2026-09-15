import React from 'react';
import { Sprout } from 'lucide-react';
import { C } from '../../lib/theme';
import Shell from './Shell';

export default function LoadingScreen() {
  return (
    <Shell>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Sprout className="animate-pulse mx-auto mb-2" size={28} color={C.green} />
          <div style={{ color: C.inkSoft, fontSize: 13 }}>Loading Garden of Success…</div>
        </div>
      </div>
    </Shell>
  );
}
