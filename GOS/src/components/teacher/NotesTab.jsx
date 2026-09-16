import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { C } from '../../lib/theme';
import { uid } from '../../lib/storage';
import { useDay } from '../../hooks/useDay';
import Card from '../ui/Card';
import Field from '../ui/Field';
import Button from '../ui/Button';
import SavedTick from '../ui/SavedTick';
import { TextInput, TextArea } from '../ui/Inputs';

export default function NotesTab({ classId, date, teacherName }) {
  const { day, loading, persist, savedAt } = useDay(classId, date, teacherName);
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');

  if (loading) return <div style={{ fontSize: 13, color: C.inkSoft }}>Loading…</div>;

  const add = () => {
    if (!subject.trim() || !notes.trim()) return;
    const entry = { id: uid(), subject: subject.trim(), topic: topic.trim(), notes: notes.trim(), time: new Date().toISOString() };
    persist({ ...day, lessonNotes: [...(day.lessonNotes || []), entry] });
    setSubject(''); setTopic(''); setNotes('');
  };

  const remove = (id) => {
    persist({ ...day, lessonNotes: (day.lessonNotes || []).filter((n) => n.id !== id) });
  };

  return (
    <div className="space-y-4">
      <Card style={{ padding: 18 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Add a lesson note <SavedTick savedAt={savedAt} /></div>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <Field label="Subject"><TextInput value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Mathematics" /></Field>
          <Field label="Topic (optional)"><TextInput value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Fractions" /></Field>
        </div>
        <Field label="Notes"><TextArea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What was covered, how it went, follow-ups…" /></Field>
        <div className="mt-3"><Button icon={Plus} onClick={add}>Add note</Button></div>
      </Card>

      {(day.lessonNotes || []).length > 0 && (
        <Card style={{ padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Today's notes</div>
          <div className="space-y-3">
            {day.lessonNotes.map((n) => (
              <div key={n.id} className="flex justify-between items-start" style={{ borderLeft: `2px solid ${C.gold}`, paddingLeft: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{n.subject}{n.topic ? ` — ${n.topic}` : ''}</div>
                  <div style={{ fontSize: 13, color: C.inkSoft, whiteSpace: 'pre-wrap' }}>{n.notes}</div>
                </div>
                <button onClick={() => remove(n.id)} className="opacity-50 hover:opacity-100 shrink-0 ml-2"><Trash2 size={13} color={C.rose} /></button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
