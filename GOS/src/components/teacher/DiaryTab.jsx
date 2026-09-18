import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Send, ChevronDown } from 'lucide-react';
import { C } from '../../lib/theme';
import { storageGet, storageSet, uid, TERMS_KEY, diaryKey, diaryUploadKey, diaryAllKey } from '../../lib/storage';
import Card from '../ui/Card';
import Field from '../ui/Field';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import SavedTick from '../ui/SavedTick';
import ModeToggle from '../shared/ModeToggle';
import DocUpload from '../shared/DocUpload';
import ReviewPanel from '../shared/ReviewPanel';
import { TextInput, inputStyle } from '../ui/Inputs';

const norm = (r) => JSON.stringify({ mode: r.mode, doc: r.doc, rows: r.rows });

// The diary = the TERM's scheme of work. Same shape as Lesson Notes:
// one upload per teacher per term covers everything; manual mode splits
// into "your class" (primary, subject named per row) and "subjects you
// teach" (secondary, applied to selected classes at once).
export default function DiaryTab({ allSubjectsClasses, assignments, teacherId, teacherName }) {
  const [terms, setTerms] = useState(null);
  const [termId, setTermId] = useState('');
  const [mode, setMode] = useState('manual');

  useEffect(() => {
    storageGet(TERMS_KEY, true).then((t) => {
      const arr = t || [];
      setTerms(arr);
      setTermId(arr[arr.length - 1]?.id || '');
    });
  }, []);

  if (terms !== null && terms.length === 0) {
    return <EmptyState title="No term set up yet" body="Ask the principal to add the current term's dates under Calendar before submitting a term scheme." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <ModeToggle mode={mode} onChange={setMode} options={[{ value: 'manual', label: 'Type manually' }, { value: 'upload', label: 'Upload document' }]} />
        <div className="relative" style={{ maxWidth: 200 }}>
          <select value={termId} onChange={(e) => setTermId(e.target.value)} style={{ ...inputStyle, appearance: 'none' }} className="goss-sans">
            {(terms || []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: 11, color: C.inkSoft, pointerEvents: 'none' }} />
        </div>
      </div>

      {!termId ? (
        <div style={{ fontSize: 13, color: C.inkSoft }}>Loading…</div>
      ) : mode === 'upload' ? (
        <UploadSection termId={termId} teacherId={teacherId} teacherName={teacherName} allSubjectsClasses={allSubjectsClasses} assignments={assignments} />
      ) : (
        <div className="space-y-6">
          {allSubjectsClasses.length > 0 && <AllSubjectsSection classes={allSubjectsClasses} termId={termId} teacherName={teacherName} />}
          {assignments.length > 0 && <SubjectSection assignments={assignments} termId={termId} teacherName={teacherName} />}
          {allSubjectsClasses.length === 0 && assignments.length === 0 && (
            <EmptyState title="No classes or subjects assigned yet" body="Ask the principal to set you as a class teacher, or assign you subjects, under Classes & students / Teachers." />
          )}
        </div>
      )}
    </div>
  );
}

function UploadSection({ termId, teacherId, teacherName, allSubjectsClasses, assignments }) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    storageGet(diaryUploadKey(teacherId, termId)).then((r) => {
      if (cancelled) return;
      setRecord(r || { doc: null, submitted: false, submittedBy: null, submittedAt: null, seenByPrincipal: false, seenAt: null, principalComment: '' });
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [teacherId, termId]);

  const persist = async (next) => {
    setRecord(next);
    await storageSet(diaryUploadKey(teacherId, termId), next);
    setSavedAt(Date.now());
  };

  // Uploading (or removing) the file IS the save — no separate submit step.
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
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Term scheme of work <SavedTick savedAt={savedAt} /></div>
        <div style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: 12 }}>One upload covers everything below. Saved automatically as soon as you upload.</div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {allSubjectsClasses.map((c) => <span key={c.id} className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: C.sageSoft, color: C.green }}>{c.name}</span>)}
          {assignments.map((a) => <span key={a.id} className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: C.sageSoft, color: C.green }}>{a.subject} — {a.className}</span>)}
        </div>
        <DocUpload value={record.doc} onChange={handleDocChange} />
      </Card>
      {record.submitted && <ReviewPanel record={record} readOnly />}
    </div>
  );
}

function AllSubjectsSection({ classes, termId, teacherName }) {
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState({ week: '', subject: '', topic: '' });
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => { if (!classes.find((c) => c.id === classId)) setClassId(classes[0]?.id || ''); }, [classes]); // eslint-disable-line

  useEffect(() => {
    if (!classId) return;
    let cancelled = false;
    setLoading(true);
    storageGet(diaryAllKey(classId, termId)).then((r) => {
      if (cancelled) return;
      setRecord(r || { rows: [], submitted: false, submittedBy: null, submittedAt: null, seenByPrincipal: false, seenAt: null, principalComment: '' });
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [classId, termId]);

  const persist = async (next) => {
    setRecord(next);
    await storageSet(diaryAllKey(classId, termId), next);
    setSavedAt(Date.now());
  };
  const addRow = () => {
    if (!row.subject.trim() || !row.topic.trim()) return;
    const week = row.week.trim() || `Week ${(record.rows.length || 0) + 1}`;
    persist({ ...record, rows: [...record.rows, { id: uid(), week, subject: row.subject.trim(), topic: row.topic.trim() }] });
    setRow({ week: '', subject: '', topic: '' });
  };
  const removeRow = (id) => persist({ ...record, rows: record.rows.filter((x) => x.id !== id) });
  const submitTerm = () => persist({ ...record, submitted: true, submittedBy: teacherName, submittedAt: new Date().toISOString(), seenByPrincipal: false, seenAt: null });

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
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Term scheme of work <SavedTick savedAt={savedAt} /></div>
            <div className="flex flex-wrap gap-2 mb-4">
              <TextInput value={row.week} onChange={(e) => setRow({ ...row, week: e.target.value })} placeholder={`Week ${record.rows.length + 1}`} style={{ maxWidth: 100 }} />
              <TextInput value={row.subject} onChange={(e) => setRow({ ...row, subject: e.target.value })} placeholder="Subject" style={{ maxWidth: 160 }} />
              <TextInput value={row.topic} onChange={(e) => setRow({ ...row, topic: e.target.value })} placeholder="Topic for this week" />
              <Button size="sm" icon={Plus} onClick={addRow}>Add</Button>
            </div>
            {record.rows.length === 0 ? (
              <div style={{ fontSize: 13, color: C.inkSoft }}>No weeks added yet.</div>
            ) : (
              <div className="divide-y" style={{ borderColor: C.line }}>
                {record.rows.map((r, i) => (
                  <div key={r.id} className="flex items-center justify-between py-2" style={{ borderTop: i === 0 ? 'none' : `1px solid ${C.line}` }}>
                    <div style={{ fontSize: 13.5 }}><strong>{r.week} · {r.subject}:</strong> {r.topic}</div>
                    <button onClick={() => removeRow(r.id)} className="opacity-50 hover:opacity-100"><Trash2 size={13} color={C.rose} /></button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {record.submitted && <ReviewPanel record={record} readOnly />}

          <Button icon={Send} onClick={submitTerm} disabled={record.rows.length === 0} variant={record.submitted ? 'outline' : 'primary'}>
            {record.submitted ? 'Re-submit term scheme' : 'Submit term scheme to principal'}
          </Button>
        </>
      )}
    </div>
  );
}

function SubjectSection({ assignments, termId, teacherName }) {
  const subjects = useMemo(() => Array.from(new Set(assignments.map((a) => a.subject))).sort(), [assignments]);
  const [subject, setSubject] = useState(subjects[0] || '');
  const classesForSubject = useMemo(
    () => assignments.filter((a) => a.subject === subject).map((a) => ({ classId: a.classId, className: a.className })),
    [assignments, subject]
  );
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [record, setRecord] = useState({ rows: [] });
  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState({ week: '', topic: '' });
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    if (!subject) { setLoading(false); return; }
    const classes = assignments.filter((a) => a.subject === subject).map((a) => a.classId);
    setSelectedClassIds(classes);
    let cancelled = false;
    setLoading(true);
    (async () => {
      const out = {};
      for (const classId of classes) out[classId] = await storageGet(diaryKey(classId, subject, termId));
      if (cancelled) return;
      setStatuses(out);
      const recs = classes.map((id) => out[id]).filter(Boolean);
      if (classes.length > 0 && recs.length === classes.length && recs.every((r) => norm(r) === norm(recs[0]))) {
        setRecord({ rows: recs[0].rows });
      } else {
        setRecord({ rows: [] });
      }
      setRow({ week: '', topic: '' });
      setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, termId]);

  const toggleClass = (id) => setSelectedClassIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const addRow = () => {
    if (!row.topic.trim()) return;
    const week = row.week.trim() || `Week ${(record.rows.length || 0) + 1}`;
    setRecord((r) => ({ rows: [...r.rows, { id: uid(), week, topic: row.topic.trim() }] }));
    setRow({ week: '', topic: '' });
  };
  const removeRow = (id) => setRecord((r) => ({ rows: r.rows.filter((x) => x.id !== id) }));

  const submit = async () => {
    if (selectedClassIds.length === 0) return;
    const nextStatuses = { ...statuses };
    for (const classId of selectedClassIds) {
      const merged = { rows: record.rows, submitted: true, submittedBy: teacherName, submittedAt: new Date().toISOString(), seenByPrincipal: false, seenAt: null, principalComment: statuses[classId]?.principalComment || '' };
      await storageSet(diaryKey(classId, subject, termId), merged);
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
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Term scheme of work <SavedTick savedAt={savedAt} /></div>
            <div className="flex gap-2 mb-4">
              <TextInput value={row.week} onChange={(e) => setRow({ ...row, week: e.target.value })} placeholder={`Week ${record.rows.length + 1}`} style={{ maxWidth: 110 }} />
              <TextInput value={row.topic} onChange={(e) => setRow({ ...row, topic: e.target.value })} placeholder="Topic for this week" />
              <Button size="sm" icon={Plus} onClick={addRow}>Add</Button>
            </div>
            {record.rows.length === 0 ? (
              <div style={{ fontSize: 13, color: C.inkSoft }}>No weeks added yet.</div>
            ) : (
              <div className="divide-y" style={{ borderColor: C.line }}>
                {record.rows.map((r, i) => (
                  <div key={r.id} className="flex items-center justify-between py-2" style={{ borderTop: i === 0 ? 'none' : `1px solid ${C.line}` }}>
                    <div style={{ fontSize: 13.5 }}><strong>{r.week}:</strong> {r.topic}</div>
                    <button onClick={() => removeRow(r.id)} className="opacity-50 hover:opacity-100"><Trash2 size={13} color={C.rose} /></button>
                  </div>
                ))}
              </div>
            )}
          </Card>

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
