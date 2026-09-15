import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { C } from '../../lib/theme';
import { storageGet, storageSet, uid, HOLIDAYS_KEY, TERMS_KEY } from '../../lib/storage';
import { fmtDate } from '../../lib/dates';
import Card from '../ui/Card';
import Field from '../ui/Field';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import { TextInput } from '../ui/Inputs';

export default function Calendar() {
  const [holidays, setHolidays] = useState(null);
  const [terms, setTerms] = useState(null);
  const [hForm, setHForm] = useState({ start: '', end: '', label: '' });
  const [tForm, setTForm] = useState({ name: '', start: '', end: '' });

  useEffect(() => {
    storageGet(HOLIDAYS_KEY, true).then((h) => setHolidays(h || []));
    storageGet(TERMS_KEY, true).then((t) => setTerms(t || []));
  }, []);

  const saveHolidays = async (arr) => { setHolidays(arr); await storageSet(HOLIDAYS_KEY, arr, true); };
  const saveTerms = async (arr) => { setTerms(arr); await storageSet(TERMS_KEY, arr, true); };

  const addHoliday = () => {
    if (!hForm.start || !hForm.label.trim()) return;
    saveHolidays([...(holidays || []), { id: uid(), start: hForm.start, end: hForm.end || hForm.start, label: hForm.label.trim() }]);
    setHForm({ start: '', end: '', label: '' });
  };
  const removeHoliday = (id) => saveHolidays((holidays || []).filter((h) => h.id !== id));

  const addTerm = () => {
    if (!tForm.name.trim() || !tForm.start || !tForm.end) return;
    saveTerms([...(terms || []), { id: uid(), name: tForm.name.trim(), start: tForm.start, end: tForm.end }]);
    setTForm({ name: '', start: '', end: '' });
  };
  const removeTerm = (id) => saveTerms((terms || []).filter((t) => t.id !== id));

  return (
    <div className="space-y-8">
      <div>
        <div className="goss-serif" style={{ fontSize: 19, color: C.green, marginBottom: 4 }}>Holidays</div>
        <div style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: 12 }}>Dates marked here disable attendance for every class and show teachers a heads-up.</div>
        <Card style={{ padding: 18, marginBottom: 14 }}>
          <div className="grid sm:grid-cols-4 gap-3 items-end">
            <Field label="Start date"><TextInput type="date" value={hForm.start} onChange={(e) => setHForm({ ...hForm, start: e.target.value })} /></Field>
            <Field label="End date (optional)"><TextInput type="date" value={hForm.end} onChange={(e) => setHForm({ ...hForm, end: e.target.value })} /></Field>
            <Field label="Label"><TextInput value={hForm.label} onChange={(e) => setHForm({ ...hForm, label: e.target.value })} placeholder="e.g. Mid-term break" /></Field>
            <Button icon={Plus} onClick={addHoliday}>Add</Button>
          </div>
        </Card>
        <Card>
          {!holidays ? (
            <div style={{ fontSize: 13, color: C.inkSoft, padding: 16 }}>Loading…</div>
          ) : holidays.length === 0 ? (
            <EmptyState title="No holidays yet" body="Add school breaks or public holidays above." />
          ) : (
            holidays.slice().sort((a, b) => a.start.localeCompare(b.start)).map((h, i) => (
              <div key={h.id} className="flex items-center justify-between px-5 py-3" style={{ borderTop: i === 0 ? 'none' : `1px solid ${C.line}` }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{h.label}</div>
                  <div style={{ fontSize: 12, color: C.inkSoft }}>{fmtDate(h.start)}{h.end !== h.start ? ` – ${fmtDate(h.end)}` : ''}</div>
                </div>
                <button onClick={() => removeHoliday(h.id)}><Trash2 size={14} color={C.rose} /></button>
              </div>
            ))
          )}
        </Card>
      </div>

      <div>
        <div className="goss-serif" style={{ fontSize: 19, color: C.green, marginBottom: 4 }}>Terms</div>
        <div style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: 12 }}>Used to calculate "this term" in the Statistics screens.</div>
        <Card style={{ padding: 18, marginBottom: 14 }}>
          <div className="grid sm:grid-cols-4 gap-3 items-end">
            <Field label="Term name"><TextInput value={tForm.name} onChange={(e) => setTForm({ ...tForm, name: e.target.value })} placeholder="e.g. First Term" /></Field>
            <Field label="Start date"><TextInput type="date" value={tForm.start} onChange={(e) => setTForm({ ...tForm, start: e.target.value })} /></Field>
            <Field label="End date"><TextInput type="date" value={tForm.end} onChange={(e) => setTForm({ ...tForm, end: e.target.value })} /></Field>
            <Button icon={Plus} onClick={addTerm}>Add</Button>
          </div>
        </Card>
        <Card>
          {!terms ? (
            <div style={{ fontSize: 13, color: C.inkSoft, padding: 16 }}>Loading…</div>
          ) : terms.length === 0 ? (
            <EmptyState title="No terms yet" body="Add the current term's start and end date so statistics can be calculated." />
          ) : (
            terms.slice().sort((a, b) => a.start.localeCompare(b.start)).map((t, i) => (
              <div key={t.id} className="flex items-center justify-between px-5 py-3" style={{ borderTop: i === 0 ? 'none' : `1px solid ${C.line}` }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: C.inkSoft }}>{fmtDate(t.start)} – {fmtDate(t.end)}</div>
                </div>
                <button onClick={() => removeTerm(t.id)}><Trash2 size={14} color={C.rose} /></button>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
