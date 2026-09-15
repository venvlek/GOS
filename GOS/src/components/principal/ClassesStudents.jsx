import React, { useEffect, useState } from 'react';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import { C } from '../../lib/theme';
import { storageGet, storageSet, uid, studentsKey } from '../../lib/storage';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import Button from '../ui/Button';
import Field from '../ui/Field';
import { TextInput, TextArea, inputStyle } from '../ui/Inputs';

export default function ClassesStudents({ config, setConfig }) {
  const [selected, setSelected] = useState(config.classes[0]?.id || null);
  const [newClass, setNewClass] = useState('');
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [newStudent, setNewStudent] = useState('');
  const [bulk, setBulk] = useState('');
  const [showBulk, setShowBulk] = useState(false);

  useEffect(() => {
    if (!selected) { setStudents([]); return; }
    setLoadingStudents(true);
    storageGet(studentsKey(selected), true).then((s) => {
      setStudents(s || []);
      setLoadingStudents(false);
    });
  }, [selected]);

  const addClass = async () => {
    const name = newClass.trim();
    if (!name) return;
    const cls = { id: uid(), name, classTeacherId: null };
    const next = { ...config, classes: [...config.classes, cls] };
    await setConfig(next);
    setNewClass('');
    setSelected(cls.id);
  };

  const removeClass = async (id) => {
    const next = {
      ...config,
      classes: config.classes.filter((c) => c.id !== id),
      teachers: config.teachers.map((t) => ({
        ...t,
        teachingAssignments: (t.teachingAssignments || []).filter((a) => a.classId !== id),
      })),
    };
    await setConfig(next);
    if (selected === id) setSelected(next.classes[0]?.id || null);
  };

  const setClassTeacher = async (classId, teacherId) => {
    const next = { ...config, classes: config.classes.map((c) => (c.id === classId ? { ...c, classTeacherId: teacherId || null } : c)) };
    await setConfig(next);
  };

  const saveStudents = async (arr) => {
    setStudents(arr);
    await storageSet(studentsKey(selected), arr, true);
  };

  const addStudent = async () => {
    const name = newStudent.trim();
    if (!name || !selected) return;
    await saveStudents([...students, { id: uid(), name }]);
    setNewStudent('');
  };

  const addBulk = async () => {
    const names = bulk.split('\n').map((n) => n.trim()).filter(Boolean);
    if (!names.length || !selected) return;
    await saveStudents([...students, ...names.map((name) => ({ id: uid(), name }))]);
    setBulk('');
    setShowBulk(false);
  };

  const removeStudent = async (id) => {
    await saveStudents(students.filter((s) => s.id !== id));
  };

  const selectedClass = config.classes.find((c) => c.id === selected);

  return (
    <div className="grid md:grid-cols-[240px_1fr] gap-5">
      <Card style={{ padding: 14, height: 'fit-content' }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: C.inkSoft, marginBottom: 10 }}>Classes</div>
        <div className="space-y-1 mb-3">
          {config.classes.map((c) => (
            <div key={c.id} className="flex items-center group">
              <button
                onClick={() => setSelected(c.id)}
                className="flex-1 text-left px-3 py-2 rounded-lg text-sm"
                style={{
                  background: selected === c.id ? C.sageSoft : 'transparent',
                  color: selected === c.id ? C.green : C.ink,
                  fontWeight: selected === c.id ? 600 : 500,
                }}
              >
                {c.name}
              </button>
              <button onClick={() => removeClass(c.id)} className="px-1.5 opacity-40 hover:opacity-100">
                <Trash2 size={13} color={C.rose} />
              </button>
            </div>
          ))}
          {config.classes.length === 0 && <div style={{ fontSize: 13, color: C.inkSoft }}>No classes yet.</div>}
        </div>
        <div className="flex gap-1.5">
          <TextInput
            placeholder="e.g. J.S.S 1"
            value={newClass}
            onChange={(e) => setNewClass(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addClass()}
          />
          <Button size="sm" icon={Plus} onClick={addClass}>Add</Button>
        </div>
      </Card>

      <Card style={{ padding: 20 }}>
        {!selectedClass ? (
          <EmptyState title="Choose a class" body="Select a class on the left, or create one to start adding students." />
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="goss-serif" style={{ fontSize: 19, color: C.green }}>{selectedClass.name}</div>
              <span style={{ fontSize: 12.5, color: C.inkSoft }}>{students.length} student{students.length === 1 ? '' : 's'}</span>
            </div>

            <Field label="Class teacher (takes attendance for this class)">
              <div className="relative mb-5" style={{ maxWidth: 280 }}>
                <select
                  value={selectedClass.classTeacherId || ''}
                  onChange={(e) => setClassTeacher(selectedClass.id, e.target.value)}
                  style={{ ...inputStyle, appearance: 'none' }}
                  className="goss-sans"
                >
                  <option value="">— none assigned —</option>
                  {config.teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: 11, color: C.inkSoft, pointerEvents: 'none' }} />
              </div>
            </Field>

            <div className="flex gap-1.5 mb-3">
              <TextInput
                placeholder="Student full name"
                value={newStudent}
                onChange={(e) => setNewStudent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addStudent()}
              />
              <Button size="sm" icon={Plus} onClick={addStudent}>Add</Button>
              <Button size="sm" variant="outline" onClick={() => setShowBulk((s) => !s)}>Bulk add</Button>
            </div>

            {showBulk && (
              <div className="mb-4 space-y-2">
                <TextArea
                  rows={4}
                  placeholder={'Paste one name per line, e.g.\nAda Obi\nChinedu Eze\nFunke Ade'}
                  value={bulk}
                  onChange={(e) => setBulk(e.target.value)}
                />
                <Button size="sm" onClick={addBulk}>Add all names</Button>
              </div>
            )}

            {loadingStudents ? (
              <div style={{ fontSize: 13, color: C.inkSoft }}>Loading students…</div>
            ) : students.length === 0 ? (
              <EmptyState title="No students yet" body="Add students one at a time, or paste a whole class list at once with Bulk add." />
            ) : (
              <div className="divide-y" style={{ borderColor: C.line }}>
                {students.map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between py-2.5" style={{ borderTop: i === 0 ? 'none' : `1px solid ${C.line}` }}>
                    <div style={{ fontSize: 14 }}>{s.name}</div>
                    <button onClick={() => removeStudent(s.id)} className="opacity-40 hover:opacity-100">
                      <Trash2 size={14} color={C.rose} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
