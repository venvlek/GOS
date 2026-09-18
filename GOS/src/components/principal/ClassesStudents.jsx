import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, ChevronDown, Sparkles, Pencil, Check, X } from 'lucide-react';
import { C } from '../../lib/theme';
import { storageGet, storageSet, uid, studentsKey } from '../../lib/storage';
import { PRIMARY_SEED } from '../../lib/primarySeed';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import Button from '../ui/Button';
import Field from '../ui/Field';
import { TextInput, TextArea, inputStyle } from '../ui/Inputs';

const BLANK_DETAILS = { dob: '', guardianName: '', guardianAddress: '', guardianReligion: '', guardianPhone: '' };

export default function ClassesStudents({ config, setConfig }) {
  const [selected, setSelected] = useState(config.classes[0]?.id || null);
  const [newClass, setNewClass] = useState('');
  const [newClassType, setNewClassType] = useState('secondary');
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [newStudent, setNewStudent] = useState('');
  const [bulk, setBulk] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editForm, setEditForm] = useState(BLANK_DETAILS);
  const editRef = useRef(null);

  useEffect(() => {
    if (!selected) { setStudents([]); return; }
    setLoadingStudents(true);
    setEditingStudentId(null);
    storageGet(studentsKey(selected), true).then((s) => {
      setStudents(s || []);
      setLoadingStudents(false);
    });
  }, [selected]);

  useEffect(() => {
    if (editingStudentId && editRef.current) {
      editRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [editingStudentId]);

  const primaryAlreadySeeded = PRIMARY_SEED.every((p) => config.classes.some((c) => c.name === p.name));

  const seedPrimarySchool = async () => {
    setSeeding(true);
    const newClasses = [];
    for (const p of PRIMARY_SEED) {
      if (config.classes.some((c) => c.name === p.name)) continue; // don't duplicate if already added
      const cls = { id: uid(), name: p.name, classTeacherId: null, classType: 'primary' };
      newClasses.push(cls);
      await storageSet(studentsKey(cls.id), p.students.map((name) => ({ id: uid(), name })), true);
    }
    if (newClasses.length > 0) {
      await setConfig({ ...config, classes: [...config.classes, ...newClasses] });
      setSelected(newClasses[0].id);
    }
    setSeeding(false);
  };

  const addClass = async () => {
    const name = newClass.trim();
    if (!name) return;
    const cls = { id: uid(), name, classTeacherId: null, classType: newClassType };
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
    if (editingStudentId === id) setEditingStudentId(null);
  };

  const startEditStudent = (s) => {
    setEditingStudentId(s.id);
    setEditForm({
      dob: s.dob || '',
      guardianName: s.guardianName || '',
      guardianAddress: s.guardianAddress || '',
      guardianReligion: s.guardianReligion || '',
      guardianPhone: s.guardianPhone || '',
    });
  };
  const cancelEditStudent = () => setEditingStudentId(null);
  const saveStudentEdit = async () => {
    await saveStudents(students.map((s) => (s.id === editingStudentId ? { ...s, ...editForm } : s)));
    setEditingStudentId(null);
  };

  const selectedClass = config.classes.find((c) => c.id === selected);

  return (
    <div className="space-y-4">
      {!primaryAlreadySeeded && (
        <Card style={{ padding: 16, background: C.sageSoft, border: 'none' }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: C.green }}>Add the primary school</div>
              <div style={{ fontSize: 12.5, color: C.inkSoft }}>
                Creates Preparatory through Basic 4 with their student rosters already filled in — one click, editable afterward.
              </div>
            </div>
            <Button icon={Sparkles} onClick={seedPrimarySchool} disabled={seeding}>
              {seeding ? 'Adding…' : 'Add primary classes & students'}
            </Button>
          </div>
        </Card>
      )}

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
                  {c.classType === 'primary' && <span style={{ fontSize: 10.5, color: C.inkSoft, marginLeft: 5 }}>primary</span>}
                </button>
                <button onClick={() => removeClass(c.id)} className="px-1.5 opacity-40 hover:opacity-100">
                  <Trash2 size={13} color={C.rose} />
                </button>
              </div>
            ))}
            {config.classes.length === 0 && <div style={{ fontSize: 13, color: C.inkSoft }}>No classes yet.</div>}
          </div>
          <div className="space-y-1.5">
            <TextInput
              placeholder="e.g. J.S.S 1"
              value={newClass}
              onChange={(e) => setNewClass(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addClass()}
            />
            <div className="flex gap-1.5">
              <select value={newClassType} onChange={(e) => setNewClassType(e.target.value)} className="goss-sans" style={{ ...inputStyle, flex: 1 }}>
                <option value="secondary">Secondary (subject teachers)</option>
                <option value="primary">Primary (one class teacher, all subjects)</option>
              </select>
              <Button size="sm" icon={Plus} onClick={addClass}>Add</Button>
            </div>
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

              <Field label={selectedClass.classType === 'primary' ? 'Class teacher (teaches all subjects & takes attendance)' : 'Class teacher (takes attendance for this class)'}>
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
                    <div key={s.id} style={{ borderTop: i === 0 ? 'none' : `1px solid ${C.line}` }}>
                      <div className="flex items-center justify-between py-2.5">
                        <div>
                          <div style={{ fontSize: 14 }}>{s.name}</div>
                          {(s.dob || s.guardianName) && editingStudentId !== s.id && (
                            <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 1 }}>
                              {s.dob && `DOB: ${s.dob}`}{s.dob && s.guardianName ? ' · ' : ''}{s.guardianName && `Guardian: ${s.guardianName}`}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => (editingStudentId === s.id ? cancelEditStudent() : startEditStudent(s))} className="opacity-50 hover:opacity-100">
                            <Pencil size={13} color={C.green} />
                          </button>
                          <button onClick={() => removeStudent(s.id)} className="opacity-40 hover:opacity-100">
                            <Trash2 size={14} color={C.rose} />
                          </button>
                        </div>
                      </div>

                      {editingStudentId === s.id && (
                        <div ref={editRef} className="pb-4 space-y-3" style={{ borderTop: `1px dashed ${C.line}`, paddingTop: 12 }}>
                          <div className="grid sm:grid-cols-2 gap-3">
                            <Field label="Date of birth">
                              <TextInput type="date" value={editForm.dob} onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })} />
                            </Field>
                            <Field label="Parent / guardian name">
                              <TextInput value={editForm.guardianName} onChange={(e) => setEditForm({ ...editForm, guardianName: e.target.value })} placeholder="e.g. Mrs. Ade Obi" />
                            </Field>
                          </div>
                          <Field label="Parent / guardian address">
                            <TextInput value={editForm.guardianAddress} onChange={(e) => setEditForm({ ...editForm, guardianAddress: e.target.value })} placeholder="Home address" />
                          </Field>
                          <div className="grid sm:grid-cols-2 gap-3">
                            <Field label="Parent / guardian religion">
                              <TextInput value={editForm.guardianReligion} onChange={(e) => setEditForm({ ...editForm, guardianReligion: e.target.value })} placeholder="e.g. Christianity" />
                            </Field>
                            <Field label="Parent / guardian phone number">
                              <TextInput value={editForm.guardianPhone} onChange={(e) => setEditForm({ ...editForm, guardianPhone: e.target.value })} placeholder="e.g. 0803…" />
                            </Field>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" icon={Check} onClick={saveStudentEdit}>Save</Button>
                            <Button size="sm" variant="ghost" icon={X} onClick={cancelEditStudent}>Cancel</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
