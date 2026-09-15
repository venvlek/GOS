import React, { useEffect, useState } from 'react';
import { C } from '../../lib/theme';

// Small "Saved" flash shown briefly after a successful write.
export default function SavedTick({ savedAt }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!savedAt) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 1500);
    return () => clearTimeout(t);
  }, [savedAt]);
  if (!show) return null;
  return <span style={{ fontSize: 12, color: C.sage, fontWeight: 600 }}>Saved</span>;
}
