import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Send, ChevronDown } from 'lucide-react';
import { C } from '../../lib/theme';
import { storageGet, storageSet, uid, todayStr, lessonWeekKey, lessonUploadKey, lessonAllKey } from '../../lib/storage';
import { getWeekStart } from '../../lib/dates';
import Card from '../ui/Card';
import Field from '../ui/Field';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import SavedTick from '../ui/SavedTick';
import WeekNav from '../ui/WeekNav';
import ModeToggle from '../shared/ModeToggle';
import DocUpload from '../shared/DocUpload';
import ReviewPanel from '../shared/ReviewPanel';
import { TextInput, TextArea, inputStyle } from '../ui/Inputs';

const BLANK_ENTRY = { subject: '', topic: '', objectives: '', content: '', resources: '', evaluation: '' };
const BLANK_SUBJECT_ENTRY = { topic: '', objectives: '', content: '', resources: '', evaluation: '' };
const norm = (r) => JSON.stringify({ mode: r.mode, doc: r.doc, entries: r.entries });

// allSubjectsClasses = [{ id, name }] — primary-style classes this teacher owns.
// assignments = [{ id, subject, classId, className }] — secondary-style teaching.
export default function LessonNotesTab({ allSubjectsClasses, assignments, teacherId, teacherName }) {
  const maxWeek = getWeekStart(todayStr());
  const [weekStart, setWeekStart] = useState(maxWeek);
  const [mode, setMode] = useState('manual');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <ModeToggle mode={mode} onChange={setMode} options={[{ value: 'manual', label: 'Type manually' }, { value: 'upload', label: 'Upload document' }]} />
        <WeekNav weekStart={weekStart} onChange={setWeekStart} maxWeekStart={maxWeek} />
      </div>

      {mode === 'upload' ? (
        <UploadSection weekStart={weekStart} teacherId={teacherId} teacherName={teacherName} allSubjectsClasses={allSubjectsClasses} assignments={assignments} />
      ) : (
        <div className="space-y-6">
          {allSubjectsClasses.length > 0 && (
            <AllSubjectsSection classes={allSubjectsClasses} weekStart={weekStart} teacherName={teacherName} />
          )}
          {assignments.length > 0 && (
            <SubjectSection assignments={assignments} weekStart={weekStart} teacherName={teacherName} />
          )}
          {allSubjectsClasses.length === 0 && assignments.length === 0 && (
            <EmptyState title="No classes or subjects assigned yet" body="Ask the principal to set you as a class teacher, or assign you subjects, under Classes & students / Teachers." />
          )}
        </div>
      )}
    </div>
  );
}

// ---- Upload: ONE document per teacher per week, covers everything. ----
function UploadSection({ weekStart, teacherId, teacherName, allSubjectsClasses, assignments }) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    storageGet(lessonUploadKey(teacherId, weekStart)).then((r) => {
      if (cancelled) return;
      setRecord(r || { doc: null, submitted: false, submittedBy: null, submittedAt: null, seenByPrincipal: false, seenAt: null, principalComment: '' });
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [teacherId, weekStart]);

  const persist = async (next) => {
    setRecord(next);
    await storageSet(lessonUploadKey(teacherId, weekStart), next);
    setSavedAt(Date.now());
  };

  // Uploading (or removing) the file IS the save — no separate submit step,
  // so there's no way to upload a replacement and forget to persist it.
  const handleDocChange = (doc) => persist({
    ...record,
    doc,
    submitted: !!doc,
    submittedBy: doc ? teacherName : null,
    submittedAt: doc ? new Date().toISOString() : null,
    seenByPrincipal: false,
    seenAt: null,
  });

  if (loading || !record) return <div style={{ fontSize: 13, color: C.inkSoft }}>Loading…</div>;

  return (
    <div className="space-y-4">
      <Card style={{ padding: 18 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>This week's lesson note <SavedTick savedAt={savedAt} /></div>
        <div style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: 12 }}>
          One upload covers everything below — no need to repeat it per class or subject. Saved automatically as soon as you upload.
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {allSubjectsClasses.map((c) => (
            <span key={c.id} className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: C.sageSoft, color: C.green }}>{c.name}</span>
          ))}
          {assignments.map((a) => (
            <span key={a.id} className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: C.sageSoft, color: C.green }}>{a.subject} — {a.className}</span>
          ))}
        </div>
        <DocUpload value={record.doc} onChange={handleDocChange} />
      </Card>

      {record.submitted && <ReviewPanel record={record} readOnly />}
    </div>
  );
}

// ---- Manual, primary-style: whole class, one entry per subject taught. ----
function AllSubjectsSection({ classes, weekStart, teacherName }) {
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(BLANK_ENTRY);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => { if (!classes.find((c) => c.id === classId)) setClassId(classes[0]?.id || ''); }, [classes]); // eslint-disable-line

  useEffect(() => {
    if (!classId) return;
    let cancelled = false;
    setLoading(true);
    storageGet(lessonAllKey(classId, weekStart)).then((r) => {
      if (cancelled) return;
      setRecord(r || { entries: [], submitted: false, submittedBy: null, submittedAt: null, seenByPrincipal: false, seenAt: null, principalComment: '' });
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [classId, weekStart]);

  const persist = async (next) => {
    setRecord(next);
    await storageSet(lessonAllKey(classId, weekStart), next);
    setSavedAt(Date.now());
  };

  const addEntry = () => {
    if (!form.subject.trim() || !form.topic.trim()) return;
    persist({ ...record, entries: [...record.entries, { id: uid(), ...form }] });
    setForm(BLANK_ENTRY);
  };
  const removeEntry = (id) => persist({ ...record, entries: record.entries.filter((e) => e.id !== id) });
  const submitWeek = () => persist({ ...record, submitted: true, submittedBy: teacherName, submittedAt: new Date().toISOString(), seenByPrincipal: false, seenAt: null });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div style={{ fontWeight: 600, fontSize: 14, color: C.green }}>Your class</div>
        {classes.length > 1 && (
          <div className="relative">
            <select value={classId} onChange={(e) => setClassId(e.target.value)} style={{ ...inputStyle, appearance: 'none', paddingRight: 28 }} className="goss-sans">
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: 9, top: 10, color: C.inkSoft, pointerEvents: 'none' }} />
          </div>
        )}
      </div>

      {loading || !record ? (
        <div style={{ fontSize: 13, color: C.inkSoft }}>Loading…</div>
      ) : (
        <>
          <Card style={{ padding: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Add a lesson <SavedTick savedAt={savedAt} /></div>
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Subject"><TextInput value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Mathematics" /></Field>
                <Field label="Topic"><TextInput value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g. Fractions" /></Field>
              </div>
              <Field label="Learning objectives"><TextArea rows={2} value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} placeholder="By the end of the lesson, pupils should be able to…" /></Field>
              <Field label="Content / activities"><TextArea rows={3} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="What will be taught, and how" /></Field>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Resources"><TextInput value={form.resources} onChange={(e) => setForm({ ...form, resources: e.target.value })} placeholder="Textbook, chart, etc." /></Field>
                <Field label="Evaluation"><TextInput value={form.evaluation} onChange={(e) => setForm({ ...form, evaluation: e.target.value })} placeholder="How pupils will be assessed" /></Field>
              </div>
            </div>
            <div className="mt-3"><Button icon={Plus} onClick={addEntry}>Add lesson</Button></div>
          </Card>

          {record.entries.length > 0 && (
            <Card style={{ padding: 18 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>This week's lessons</div>
              <div className="space-y-4">
                {record.entries.map((e) => (
                  <div key={e.id} className="flex justify-between items-start" style={{ borderLeft: `2px solid ${C.gold}`, paddingLeft: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{e.subject} — {e.topic}</div>
                      {e.objectives && <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}><strong>Objectives:</strong> {e.objectives}</div>}
                      {e.content && <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}><strong>Content:</strong> {e.content}</div>}
                      {e.resources && <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}><strong>Resources:</strong> {e.resources}</div>}
                      {e.evaluation && <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}><strong>Evaluation:</strong> {e.evaluation}</div>}
                    </div>
                    <button onClick={() => removeEntry(e.id)} className="opacity-50 hover:opacity-100 shrink-0 ml-2"><Trash2 size={13} color={C.rose} /></button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {record.submitted && <ReviewPanel record={record} readOnly />}

          <Button icon={Send} onClick={submitWeek} disabled={record.entries.length === 0} variant={record.submitted ? 'outline' : 'primary'}>
            {record.submitted ? 'Re-submit week' : 'Submit week to principal'}
          </Button>
        </>
      )}
    </div>
  );
}

// ---- Manual, secondary-style: one subject, applied to selected classes at once. ----
function SubjectSection({ assignments, weekStart, teacherName }) {
  const subjects = useMemo(() => Array.from(new Set(assignments.map((a) => a.subject))).sort(), [assignments]);
  const [subject, setSubject] = useState(subjects[0] || '');
  const classesForSubject = useMemo(
    () => assignments.filter((a) => a.subject === subject).map((a) => ({ classId: a.classId, className: a.className })),
    [assignments, subject]
  );
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [record, setRecord] = useState({ entries: [] });
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(BLANK_SUBJECT_ENTRY);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    if (!subject) { setLoading(false); return; }
    const classes = assignments.filter((a) => a.subject === subject).map((a) => a.classId);
    setSelectedClassIds(classes);
    let cancelled = false;
    setLoading(true);
    (async () => {
      const out = {};
      for (const classId of classes) out[classId] = await storageGet(lessonWeekKey(classId, subject, weekStart));
      if (cancelled) return;
      setStatuses(out);
      const recs = classes.map((id) => out[id]).filter(Boolean);
      if (classes.length > 0 && recs.length === classes.length && recs.every((r) => norm(r) === norm(recs[0]))) {
        setRecord({ entries: recs[0].entries });
      } else {
        setRecord({ entries: [] });
      }
      setForm(BLANK_SUBJECT_ENTRY);
      setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, weekStart]);

  const toggleClass = (id) => setSelectedClassIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const addEntry = () => {
    if (!form.topic.trim()) return;
    setRecord((r) => ({ entries: [...r.entries, { id: uid(), ...form }] }));
    setForm(BLANK_SUBJECT_ENTRY);
  };
  const removeEntry = (id) => setRecord((r) => ({ entries: r.entries.filter((e) => e.id !== id) }));

  const submit = async () => {
    if (selectedClassIds.length === 0) return;
    const payload = { entries: record.entries, submitted: true, submittedBy: teacherName, submittedAt: new Date().toISOString(), seenByPrincipal: false, seenAt: null, principalComment: statuses[selectedClassIds[0]]?.principalComment || '' };
    const nextStatuses = { ...statuses };
    for (const classId of selectedClassIds) {
      const merged = { ...payload, principalComment: statuses[classId]?.principalComment || '' };
      await storageSet(lessonWeekKey(classId, subject, weekStart), merged);
      nextStatuses[classId] = merged;
    }
    setStatuses(nextStatuses);
    setSavedAt(Date.now());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div style={{ fontWeight: 600, fontSize: 14, color: C.green }}>Subjects you teach</div>
        <div className="relative" style={{ maxWidth: 220 }}>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} style={{ ...inputStyle, appearance: 'none' }} className="goss-sans">
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: 11, color: C.inkSoft, pointerEvents: 'none' }} />
        </div>
      </div>

      <Field label="Applies to (untick any class that needs different content)">
        <div className="flex flex-wrap gap-2">
          {classesForSubject.map((c) => {
            const checked = selectedClassIds.includes(c.classId);
            const rec = statuses[c.classId];
            return (
              <label key={c.classId} className="inline-flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer" style={{ background: checked ? C.sageSoft : '#F1EFE6', color: checked ? C.green : C.inkSoft }}>
                <input type="checkbox" checked={checked} onChange={() => toggleClass(c.classId)} />
                {c.className}
                {rec?.submitted && <span style={{ color: C.gold }}>✓</span>}
              </label>
            );
          })}
        </div>
      </Field>

      {loading ? (
        <div style={{ fontSize: 13, color: C.inkSoft }}>Loading…</div>
      ) : (
        <>
          <Card style={{ padding: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Add a lesson for this week <SavedTick savedAt={savedAt} /></div>
            <div className="space-y-3">
              <Field label="Topic"><TextInput value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g. Fractions" /></Field>
              <Field label="Learning objectives"><TextArea rows={2} value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} placeholder="By the end of the lesson, pupils should be able to…" /></Field>
              <Field label="Content / activities"><TextArea rows={3} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="What will be taught, and how" /></Field>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Resources"><TextInput value={form.resources} onChange={(e) => setForm({ ...form, resources: e.target.value })} placeholder="Textbook, chart, etc." /></Field>
                <Field label="Evaluation"><TextInput value={form.evaluation} onChange={(e) => setForm({ ...form, evaluation: e.target.value })} placeholder="How pupils will be assessed" /></Field>
              </div>
            </div>
            <div className="mt-3"><Button icon={Plus} onClick={addEntry}>Add lesson</Button></div>
          </Card>

          {record.entries.length > 0 && (
            <Card style={{ padding: 18 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>This week's lessons</div>
              <div className="space-y-4">
                {record.entries.map((e) => (
                  <div key={e.id} className="flex justify-between items-start" style={{ borderLeft: `2px solid ${C.gold}`, paddingLeft: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{e.topic}</div>
                      {e.objectives && <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}><strong>Objectives:</strong> {e.objectives}</div>}
                      {e.content && <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}><strong>Content:</strong> {e.content}</div>}
                      {e.resources && <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}><strong>Resources:</strong> {e.resources}</div>}
                      {e.evaluation && <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}><strong>Evaluation:</strong> {e.evaluation}</div>}
                    </div>
                    <button onClick={() => removeEntry(e.id)} className="opacity-50 hover:opacity-100 shrink-0 ml-2"><Trash2 size={13} color={C.rose} /></button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {selectedClassIds.map((id) => statuses[id]).find((r) => r?.principalComment) && (
            <ReviewPanel record={selectedClassIds.map((id) => statuses[id]).find((r) => r?.principalComment)} readOnly />
          )}

          <Button icon={Send} onClick={submit} disabled={selectedClassIds.length === 0}>
            Submit to {selectedClassIds.length} class{selectedClassIds.length === 1 ? '' : 'es'}
          </Button>
        </>
      )}
    </div>
  );
}
