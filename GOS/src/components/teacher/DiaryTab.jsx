import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Send, ChevronDown } from 'lucide-react';
import { C } from '../../lib/theme';
import { storageGet, storageSet, uid, TERMS_KEY, diaryKey } from '../../lib/storage';
import Card from '../ui/Card';
import Field from '../ui/Field';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import SavedTick from '../ui/SavedTick';
import ModeToggle from '../shared/ModeToggle';
import DocUpload from '../shared/DocUpload';
import { TextInput, inputStyle } from '../ui/Inputs';

const BLANK_RECORD = { mode: 'manual', doc: null, rows: [] };
const MODE_OPTIONS = [{ value: 'manual', label: 'Type manually' }, { value: 'upload', label: 'Upload document' }];
const norm = (r) => JSON.stringify({ mode: r.mode, doc: r.doc, rows: r.rows });

// The diary = the TERM's scheme of work per subject. Same "apply to every
// class at once" pattern as Lesson Notes: pick a subject, tick the classes,
// submit once.
export default function DiaryTab({ assignments, teacherName }) {
  const subjects = useMemo(() => Array.from(new Set(assignments.map((a) => a.subject))).sort(), [assignments]);
  const [subject, setSubject] = useState(subjects[0] || '');
  const [terms, setTerms] = useState(null);
  const [termId, setTermId] = useState('');

  const classesForSubject = useMemo(
    () => assignments.filter((a) => a.subject === subject).map((a) => ({ classId: a.classId, className: a.className })),
    [assignments, subject]
  );

  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [record, setRecord] = useState(BLANK_RECORD);
  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState({ week: '', topic: '' });
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    storageGet(TERMS_KEY, true).then((t) => {
      const arr = t || [];
      setTerms(arr);
      setTermId(arr[arr.length - 1]?.id || '');
    });
  }, []);

  useEffect(() => {
    if (!subject || !termId) { setLoading(false); return; }
    const classes = assignments.filter((a) => a.subject === subject).map((a) => a.classId);
    setSelectedClassIds(classes);
    let cancelled = false;
    setLoading(true);
    (async () => {
      const out = {};
      for (const classId of classes) {
        out[classId] = await storageGet(diaryKey(classId, subject, termId), true);
      }
      if (cancelled) return;
      setStatuses(out);
      const recs = classes.map((id) => out[id]).filter(Boolean);
      if (classes.length > 0 && recs.length === classes.length && recs.every((r) => norm(r) === norm(recs[0]))) {
        setRecord({ mode: recs[0].mode, doc: recs[0].doc, rows: recs[0].rows });
      } else {
        setRecord(BLANK_RECORD);
      }
      setRow({ week: '', topic: '' });
      setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, termId]);

  if (assignments.length === 0) {
    return <EmptyState title="No subjects assigned yet" body="Ask the principal to assign you subjects and classes under Teachers." />;
  }
  if (terms !== null && terms.length === 0) {
    return <EmptyState title="No term set up yet" body="Ask the principal to add the current term's dates under Calendar before submitting a term scheme." />;
  }

  const toggleClass = (id) => setSelectedClassIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const addRow = () => {
    if (!row.topic.trim()) return;
    const week = row.week.trim() || `Week ${(record.rows.length || 0) + 1}`;
    setRecord((r) => ({ ...r, rows: [...r.rows, { id: uid(), week, topic: row.topic.trim() }] }));
    setRow({ week: '', topic: '' });
  };
  const removeRow = (id) => setRecord((r) => ({ ...r, rows: r.rows.filter((x) => x.id !== id) }));

  const submit = async () => {
    if (selectedClassIds.length === 0) return;
    const payload = { mode: record.mode, doc: record.doc, rows: record.rows, submitted: true, submittedBy: teacherName, submittedAt: new Date().toISOString() };
    const nextStatuses = { ...statuses };
    for (const classId of selectedClassIds) {
      await storageSet(diaryKey(classId, subject, termId), payload, true);
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
        <div className="relative" style={{ maxWidth: 200 }}>
          <select value={termId} onChange={(e) => setTermId(e.target.value)} style={{ ...inputStyle, appearance: 'none' }} className="goss-sans">
            {(terms || []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
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
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Term scheme of work</div>
              <DocUpload value={record.doc} onChange={(doc) => setRecord((r) => ({ ...r, doc }))} />
            </Card>
          ) : (
            <Card style={{ padding: 18 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Term scheme of work</div>
              <div className="flex gap-2 mb-4">
                <TextInput value={row.week} onChange={(e) => setRow({ ...row, week: e.target.value })} placeholder={`Week ${record.rows.length + 1}`} style={{ maxWidth: 110 }} />
                <TextInput value={row.topic} onChange={(e) => setRow({ ...row, topic: e.target.value })} placeholder="Topic for this week" />
                <Button size="sm" icon={Plus} onClick={addRow}>Add</Button>
              </div>
              {record.rows.length === 0 ? (
                <div style={{ fontSize: 13, color: C.inkSoft }}>No weeks added yet — add the topic for each week of the term.</div>
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
          )}

          <Button icon={Send} onClick={submit} disabled={selectedClassIds.length === 0}>
            Submit to {selectedClassIds.length} class{selectedClassIds.length === 1 ? '' : 'es'}
          </Button>
        </>
      )}
    </div>
  );
}
