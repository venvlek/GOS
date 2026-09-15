import React from 'react';
import { C } from '../../lib/theme';
import Card from '../ui/Card';

export default function StatCard({ label, value, hint, accent }) {
  return (
    <Card style={{ padding: 18 }}>
      <div style={{ fontSize: 12.5, color: C.inkSoft, fontWeight: 600 }}>{label}</div>
      <div className="goss-serif" style={{ fontSize: 32, color: accent || C.green, marginTop: 4 }}>{value}</div>
      {hint && <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 2 }}>{hint}</div>}
    </Card>
  );
}
