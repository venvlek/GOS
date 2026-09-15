import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { C } from '../../lib/theme';
import { uid } from '../../lib/storage';
import { ALL_SUBJECTS } from '../../lib/subjects';
import Card from '../ui/Card';
import Field from '../ui/Field';
import EmptyState from '../ui/EmptyState';
import Button from '../ui/Button';
import { TextInput } from '../ui/Inputs';

const rowInput = { flex: '1 1 180px', padding: '9px 12px', borderRadius: 10, border: `1px solid ${C.line}`, background: '#FCFBF7', fontSize: 14 };

export default function Teachers({ config, setConfig }) {
  const [editing, setEditing] = useState(null); // teacher id or 'new'
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [newSubject, setNewSubject] = useState('');
  const [newClassId, setNewClassId] = useState(config.classes[0]?.id || '');

  const startNew = () => {
    setEditing('new'); setName(''); setPin(''); setAssignments([]);
    setNewSubject(''); setNewClassId(config.classes[0]?.id || '');
  };
  const startEdit = (t) => {
    setEditing(t.id); setName(t.name); setPin(t.pin);
    setAssignments(t.teachingAssignments || []);
    setNewSubject(''); setNewClassId(config.classes[0]?.id || '');
  };
  const cancel = () => setEditing(null);

  const addAssignment = () => {
    if (!newSubject.trim() || !newClassId) return;
    setAssignments((a) => [...a, { id: uid(), subject: newSubject.trim(), classId: newClassId }]);
    setNewSubject('');
  };
  const removeAssignment = (id) => setAssignments((a) => a.filter((x) => x.id !== id));

  const save = async () => {
    if (!name.trim() || !pin.trim()) return;
    let teachers;
    if (editing === 'new') {
      teachers = [...config.teachers, { id: uid(), name: name.trim(), pin: pin.trim(), teachingAssignments: assignments }];
    } else {
      teachers = config.teachers.map((t) => (t.id === editing ? { ...t, name: name.trim(), pin: pin.trim(), teachingAssignments: assignments } : t));
    }
    await setConfig({ ...config, teachers });
    setEditing(null);
  };

  const remove = async (id) => {
    await setConfig({
      ...config,
      teachers: config.teachers.filter((t) => t.id !== id),
      classes: config.classes.map((c) => (c.classTeacherId === id ? { ...c, classTeacherId: null } : c)),
    });
  };

  const className = (id) => config.classes.find((c) => c.id === id)?.name || '—';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="goss-serif" style={{ fontSize: 19, color: C.green }}>Teachers</div>
        <Button icon={Plus} onClick={startNew}>Add teacher</Button>
      </div>

      {editing && (
        <Card style={{ padding: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>{editing === 'new' ? 'New teacher' : 'Edit teacher'}</div>
          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <Field label="Full name"><TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mr. Abel" /></Field>
            <Field label="PIN"><TextInput value={pin} onChange={(e) => setPin(e.target.value)} placeholder="e.g. 2468" /></Field>
          </div>

          <Field label="Subjects taught">
            <div className="flex flex-wrap gap-2 mb-2">
              <input
                list="goss-subjects"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Subject, e.g. Mathematics"
                className="goss-sans"
                style={rowInput}
              />
              <datalist id="goss-subjects">{ALL_SUBJECTS.map((s) => <option key={s} value={s} />)}</datalist>
              <select value={newClassId} onChange={(e) => setNewClassId(e.target.value)} className="goss-sans" style={{ ...rowInput, flex: '0 0 140px' }}>
                {config.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <Button size="sm" icon={Plus} onClick={addAssignment}>Add</Button>
            </div>
            {assignments.length === 0 ? (
              <div style={{ fontSize: 13, color: C.inkSoft }}>No subjects added yet — add each subject + class this teacher takes.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {assignments.map((a) => (
                  <span key={a.id} className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-xs font-semibold" style={{ background: C.sageSoft, color: C.green }}>
                    {a.subject} — {className(a.classId)}
                    <button onClick={() => removeAssignment(a.id)}><X size={12} /></button>
                  </span>
                ))}
              </div>
            )}
          </Field>

          <div className="flex gap-2 mt-5">
            <Button icon={Check} onClick={save}>Save</Button>
            <Button variant="ghost" icon={X} onClick={cancel}>Cancel</Button>
          </div>
        </Card>
      )}

      <Card>
        {config.teachers.length === 0 ? (
          <EmptyState title="No teachers yet" body="Add teachers here, along with the subjects and classes they teach." />
        ) : (
          config.teachers.map((t, i) => (
            <div key={t.id} className="flex items-center justify-between px-5 py-3.5" style={{ borderTop: i === 0 ? 'none' : `1px solid ${C.line}` }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: C.inkSoft }}>
                  {(t.teachingAssignments || []).length === 0
                    ? 'No subjects assigned'
                    : t.teachingAssignments.map((a) => `${a.subject} (${className(a.classId)})`).join(', ')}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => startEdit(t)} className="opacity-60 hover:opacity-100"><Pencil size={14} color={C.green} /></button>
                <button onClick={() => remove(t.id)} className="opacity-60 hover:opacity-100"><Trash2 size={14} color={C.rose} /></button>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
