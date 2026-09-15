import React, { useState } from 'react';
import { KeyRound, ChevronDown } from 'lucide-react';
import { C } from '../../lib/theme';
import Shell from '../ui/Shell';
import Logo from '../ui/Logo';
import Card from '../ui/Card';
import Field from '../ui/Field';
import Button from '../ui/Button';
import { TextInput, inputStyle } from '../ui/Inputs';

export default function LoginScreen({ config, onLogin }) {
  const [mode, setMode] = useState('teacher');
  const [pin, setPin] = useState('');
  const [teacherId, setTeacherId] = useState(config.teachers[0]?.id || '');
  const [err, setErr] = useState('');

  const submit = (e) => {
    e.preventDefault();
    setErr('');
    if (mode === 'principal') {
      if (pin === config.adminPin) onLogin({ role: 'principal' });
      else setErr('Incorrect PIN.');
    } else {
      const t = config.teachers.find((x) => x.id === teacherId);
      if (!t) { setErr('Choose your name first.'); return; }
      if (t.pin === pin) onLogin({ role: 'teacher', teacher: t });
      else setErr('Incorrect PIN.');
    }
  };

  return (
    <Shell>
      <div className="min-h-screen flex items-center justify-center p-5">
        <div className="w-full" style={{ maxWidth: 380 }}>
          <div className="flex justify-center mb-7"><Logo size={24} /></div>
          <Card style={{ padding: 26 }}>
            <div className="flex rounded-full p-1 mb-6" style={{ background: C.sageSoft }}>
              {['teacher', 'principal'].map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setErr(''); setPin(''); }}
                  className="flex-1 rounded-full py-1.5 text-sm font-semibold transition-colors"
                  style={{
                    background: mode === m ? C.green : 'transparent',
                    color: mode === m ? '#fff' : C.green,
                  }}
                >
                  {m === 'teacher' ? 'Teacher' : 'Principal'}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === 'teacher' && (
                <Field label="Your name">
                  {config.teachers.length === 0 ? (
                    <div style={{ fontSize: 13, color: C.inkSoft }}>
                      No teachers have been added yet. Ask the principal to add you.
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={teacherId}
                        onChange={(e) => setTeacherId(e.target.value)}
                        style={{ ...inputStyle, appearance: 'none' }}
                        className="goss-sans"
                      >
                        {config.teachers.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: 11, color: C.inkSoft, pointerEvents: 'none' }} />
                    </div>
                  )}
                </Field>
              )}
              <Field label="PIN">
                <TextInput
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  autoFocus
                />
              </Field>
              {err && <div style={{ color: C.rose, fontSize: 13 }}>{err}</div>}
              <Button type="submit" icon={KeyRound} disabled={mode === 'teacher' && config.teachers.length === 0}>
                Sign in
              </Button>
            </form>
          </Card>
          {mode === 'principal' && (
            <div className="text-center mt-4" style={{ fontSize: 12, color: C.inkSoft }}>
              Default principal PIN is <strong>1234</strong> — change it under Settings once inside.
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
