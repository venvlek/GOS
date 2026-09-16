import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Send, ChevronDown } from 'lucide-react';
import { C } from '../../lib/theme';
import { storageGet, storageSet, uid, todayStr, lessonWeekKey } from '../../lib/storage';
import { getWeekStart } from '../../lib/dates';
import Card from '../ui/Card';
import Field from '../ui/Field';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import SavedTick from '../ui/SavedTick';
import WeekNav from '../ui/WeekNav';
import ModeToggle from '../shared/ModeToggle';
import DocUpload from '../shared/DocUpload';
import { TextInput, TextArea, inputStyle } from '../ui/Inputs';

const BLANK_ENTRY = { topic: '', objectives: '', content: '', resources: '', evaluation: '' };
const BLANK_RECORD = { mode: 'manual', doc: null, entries: [] };
const MODE_OPTIONS = [{ value: 'manual', label: 'Type manually' }, { value: 'upload', label: 'Upload document' }];
const norm = (r) => JSON.stringify({ mode: r.mode, doc: r.doc, entries: r.entries });

// assignments = [{ id, subject, classId, className }].
// One note is written to every SELECTED class teaching that subject at once —
// no more submitting the same lesson separately for each class.
export default function LessonNotesTab({ assignments, teacherName }) {
  const subjects = useMemo(() => Array.from(new Set(assignments.map((a) => a.subject))).sort(), [assignments]);
  const [subject, setSubject] = useState(subjects[0] || '');
  const maxWeek = getWeekStart(todayStr());
  const [weekStart, setWeekStart] = useState(maxWeek);

  const classesForSubject = useMemo(
    () => assignments.filter((a) => a.subject === subject).map((a) => ({ classId: a.classId, className: a.className })),
    [assignments, subject]
  );

  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [record, setRecord] = useState(BLANK_RECORD);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(BLANK_ENTRY);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    if (!subject) { setLoading(false); return; }
    const classes = assignments.filter((a) => a.subject === subject).map((a) => a.classId);
    setSelectedClassIds(classes);
    let cancelled = false;
    setLoading(true);
    (async () => {
      const out = {};
      for (const classId of classes) {
        out[classId] = await storageGet(lessonWeekKey(classId, subject, weekStart), true);
      }
      if (cancelled) return;
      setStatuses(out);
      const recs = classes.map((id) => out[id]).filter(Boolean);
      if (classes.length > 0 && recs.length === classes.length && recs.every((r) => norm(r) === norm(recs[0]))) {
        setRecord({ mode: recs[0].mode, doc: recs[0].doc, entries: recs[0].entries });
      } else {
        setRecord(BLANK_RECORD);
      }
      setForm(BLANK_ENTRY);
      setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, weekStart]);

  if (assignments.length === 0) {
    return <EmptyState title="No subjects assigned yet" body="Ask the principal to assign you subjects and classes under Teachers." />;
  }

  const toggleClass = (id) => setSelectedClassIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const addEntry = () => {
    if (!form.topic.trim()) return;
    setRecord((r) => ({ ...r, entries: [...r.entries, { id: uid(), ...form }] }));
    setForm(BLANK_ENTRY);
  };
  const removeEntry = (id) => setRecord((r) => ({ ...r, entries: r.entries.filter((e) => e.id !== id) }));

  const submit = async () => {
    if (selectedClassIds.length === 0) return;
    const payload = { mode: record.mode, doc: record.doc, entries: record.entries, submitted: true, submittedBy: teacherName, submittedAt: new Date().toISOString() };
    const nextStatuses = { ...statuses };
    for (const classId of selectedClassIds) {
      await storageSet(lessonWeekKey(classId, subject, weekStart), payload, true);
      nextStatuses[classId] = payload;
    }
    setStatuses(nextStatuses);
    setSavedAt(Date.now());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="relative" style={{ maxWidth: 240 }}>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} style={{ ...inputStyle, appearance: 'none' }} className="goss-sans">
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: 11, color: C.inkSoft, pointerEvents: 'none' }} />
        </div>
        <WeekNav weekStart={weekStart} onChange={setWeekStart} maxWeekStart={maxWeek} />
      </div>

      <Field label="Applies to (untick any class that needs different content)">
        <div className="flex flex-wrap gap-2">
          {classesForSubject.map((c) => {
            const checked = selectedClassIds.includes(c.classId);
            const rec = statuses[c.classId];
            return (
              <label
                key={c.classId}
                className="inline-flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer"
                style={{ background: checked ? C.sageSoft : '#F1EFE6', color: checked ? C.green : C.inkSoft }}
              >
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
          <div className="flex items-center justify-between flex-wrap gap-2">
            <ModeToggle mode={record.mode} onChange={(mode) => setRecord((r) => ({ ...r, mode }))} options={MODE_OPTIONS} />
            <SavedTick savedAt={savedAt} />
          </div>

          {record.mode === 'upload' ? (
            <Card style={{ padding: 18 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>This week's lesson note</div>
              <DocUpload value={record.doc} onChange={(doc) => setRecord((r) => ({ ...r, doc }))} />
            </Card>
          ) : (
            <>
              <Card style={{ padding: 18 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Add a lesson for this week</div>
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
            </>
          )}

          <Button icon={Send} onClick={submit} disabled={selectedClassIds.length === 0}>
            Submit to {selectedClassIds.length} class{selectedClassIds.length === 1 ? '' : 'es'}
          </Button>
        </>
      )}
    </div>
  );
}
