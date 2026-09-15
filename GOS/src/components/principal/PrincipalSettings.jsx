import React, { useState } from 'react';
import { C } from '../../lib/theme';
import Card from '../ui/Card';
import Field from '../ui/Field';
import Button from '../ui/Button';
import { TextInput } from '../ui/Inputs';

export default function PrincipalSettings({ config, setConfig }) {
  const [pin, setPin] = useState(config.adminPin);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    if (!pin.trim()) return;
    await setConfig({ ...config, adminPin: pin.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="max-w-sm space-y-5">
      <div className="goss-serif" style={{ fontSize: 19, color: C.green }}>Settings</div>
      <Card style={{ padding: 20 }}>
        <Field label="Principal PIN">
          <TextInput value={pin} onChange={(e) => setPin(e.target.value)} />
        </Field>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={save}>Save PIN</Button>
          {saved && <span style={{ fontSize: 12.5, color: C.sage, fontWeight: 600 }}>Saved.</span>}
        </div>
      </Card>
      <div style={{ fontSize: 12, color: C.inkSoft }}>
        This is a lightweight PIN, not a secure password — enough to keep casual visitors out, not a determined intruder.
      </div>
    </div>
  );
}
