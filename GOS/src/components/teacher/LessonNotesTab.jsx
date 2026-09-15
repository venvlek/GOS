import React, { useEffect, useState } from 'react';
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

const BLANK = { topic: '', objectives: '', content: '', resources: '', evaluation: '' };
const MODE_OPTIONS = [{ value: 'manual', label: 'Type manually' }, { value: 'upload', label: 'Upload document' }];

// `assignments` = [{ id, subject, classId, className }] — this teacher's subject+class combos.
export default function LessonNotesTab({ assignments, teacherName }) {
  const [assignmentId, setAssignmentId] = useState(assignments[0]?.id || '');
  const maxWeek = getWeekStart(todayStr());
  const [weekStart, setWeekStart] = useState(maxWeek);
  const [week, setWeek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(BLANK);
  const [savedAt, setSavedAt] = useState(null);

  const assignment = assignments.find((a) => a.id === assignmentId);

  useEffect(() => {
    if (!assignment) return;
    let cancelled = false;
    setLoading(true);
    storageGet(lessonWeekKey(assignment.classId, assignment.subject, weekStart), true).then((w) => {
      if (cancelled) return;
      setWeek(w || { mode: 'manual', doc: null, entries: [], submitted: false, submittedBy: null, submittedAt: null });
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [assignment?.classId, assignment?.subject, weekStart]);

  if (assignments.length === 0) {
    return <EmptyState title="No subjects assigned yet" body="Ask the principal to assign you subjects and classes under Teachers." />;
  }

  const persist = async (next) => {
    setWeek(next);
    await storageSet(lessonWeekKey(assignment.classId, assignment.subject, weekStart), next, true);
    setSavedAt(Date.now());
  };

  const setMode = (mode) => persist({ ...week, mode });
  const setDoc = (doc) => persist({ ...week, doc });
  const addEntry = () => {
    if (!form.topic.trim()) return;
    persist({ ...week, entries: [...week.entries, { id: uid(), ...form }] });
    setForm(BLANK);
  };
  const removeEntry = (id) => persist({ ...week, entries: week.entries.filter((e) => e.id !== id) });
  const submitWeek = () => persist({ ...week, submitted: true, submittedBy: teacherName, submittedAt: new Date().toISOString() });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="relative" style={{ maxWidth: 280 }}>
          <select value={assignmentId} onChange={(e) => setAssignmentId(e.target.value)} style={{ ...inputStyle, appearance: 'none' }} className="goss-sans">
            {assignments.map((a) => <option key={a.id} value={a.id}>{a.subject} — {a.className}</option>)}
          </select>
          <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: 11, color: C.inkSoft, pointerEvents: 'none' }} />
        </div>
        <WeekNav weekStart={weekStart} onChange={setWeekStart} maxWeekStart={maxWeek} />
      </div>

      {loading || !week ? (
        <div style={{ fontSize: 13, color: C.inkSoft }}>Loading…</div>
      ) : (
        <>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <ModeToggle mode={week.mode} onChange={setMode} options={MODE_OPTIONS} />
            {week.submitted ? (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: C.sageSoft, color: C.green }}>
                Submitted by {week.submittedBy} · {new Date(week.submittedAt).toLocaleDateString()}
              </span>
            ) : (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: C.roseSoft, color: C.rose }}>Not submitted yet</span>
            )}
          </div>

          {week.mode === 'upload' ? (
            <Card style={{ padding: 18 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>This week's lesson note <SavedTick savedAt={savedAt} /></div>
              <DocUpload value={week.doc} onChange={setDoc} />
            </Card>
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

              {week.entries.length > 0 && (
                <Card style={{ padding: 18 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>This week's lessons</div>
                  <div className="space-y-4">
                    {week.entries.map((e) => (
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

          <Button icon={Send} onClick={submitWeek} variant={week.submitted ? 'outline' : 'primary'}>
            {week.submitted ? 'Re-submit week' : 'Submit week to principal'}
          </Button>
        </>
      )}
    </div>
  );
}
