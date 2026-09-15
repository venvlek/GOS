import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Send, ChevronDown } from 'lucide-react';
import { C } from '../../lib/theme';
import { storageGet, storageSet, uid, TERMS_KEY, diaryKey } from '../../lib/storage';
import Card from '../ui/Card';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import SavedTick from '../ui/SavedTick';
import ModeToggle from '../shared/ModeToggle';
import DocUpload from '../shared/DocUpload';
import { TextInput, inputStyle } from '../ui/Inputs';

const MODE_OPTIONS = [{ value: 'manual', label: 'Type manually' }, { value: 'upload', label: 'Upload document' }];

// The diary = the TERM's scheme of work per subject: a week-by-week topic
// table for the whole term, submitted once (and re-submittable) per term.
// `assignments` = [{ id, subject, classId, className }].
export default function DiaryTab({ assignments, teacherName }) {
  const [assignmentId, setAssignmentId] = useState(assignments[0]?.id || '');
  const [terms, setTerms] = useState(null);
  const [termId, setTermId] = useState('');
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState({ week: '', topic: '' });
  const [savedAt, setSavedAt] = useState(null);

  const assignment = assignments.find((a) => a.id === assignmentId);

  useEffect(() => {
    storageGet(TERMS_KEY, true).then((t) => {
      const arr = t || [];
      setTerms(arr);
      setTermId(arr[arr.length - 1]?.id || '');
    });
  }, []);

  useEffect(() => {
    if (!assignment || !termId) { setRecord(null); return; }
    let cancelled = false;
    setLoading(true);
    storageGet(diaryKey(assignment.classId, assignment.subject, termId), true).then((r) => {
      if (cancelled) return;
      setRecord(r || { mode: 'manual', doc: null, rows: [], submitted: false, submittedBy: null, submittedAt: null });
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [assignment?.classId, assignment?.subject, termId]);

  if (assignments.length === 0) {
    return <EmptyState title="No subjects assigned yet" body="Ask the principal to assign you subjects and classes under Teachers." />;
  }
  if (terms !== null && terms.length === 0) {
    return <EmptyState title="No term set up yet" body="Ask the principal to add the current term's dates under Calendar before submitting a term scheme." />;
  }

  const persist = async (next) => {
    setRecord(next);
    await storageSet(diaryKey(assignment.classId, assignment.subject, termId), next, true);
    setSavedAt(Date.now());
  };

  const setMode = (mode) => persist({ ...record, mode });
  const setDoc = (doc) => persist({ ...record, doc });
  const addRow = () => {
    if (!row.topic.trim()) return;
    const week = row.week.trim() || `Week ${(record.rows.length || 0) + 1}`;
    persist({ ...record, rows: [...record.rows, { id: uid(), week, topic: row.topic.trim() }] });
    setRow({ week: '', topic: '' });
  };
  const removeRow = (id) => persist({ ...record, rows: record.rows.filter((r) => r.id !== id) });
  const submitTerm = () => persist({ ...record, submitted: true, submittedBy: teacherName, submittedAt: new Date().toISOString() });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="relative" style={{ maxWidth: 280 }}>
          <select value={assignmentId} onChange={(e) => setAssignmentId(e.target.value)} style={{ ...inputStyle, appearance: 'none' }} className="goss-sans">
            {assignments.map((a) => <option key={a.id} value={a.id}>{a.subject} — {a.className}</option>)}
          </select>
          <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: 11, color: C.inkSoft, pointerEvents: 'none' }} />
        </div>
        <div className="relative" style={{ maxWidth: 220 }}>
          <select value={termId} onChange={(e) => setTermId(e.target.value)} style={{ ...inputStyle, appearance: 'none' }} className="goss-sans">
            {(terms || []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: 11, color: C.inkSoft, pointerEvents: 'none' }} />
        </div>
      </div>

      {loading || !record ? (
        <div style={{ fontSize: 13, color: C.inkSoft }}>Loading…</div>
      ) : (
        <>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <ModeToggle mode={record.mode} onChange={setMode} options={MODE_OPTIONS} />
            {record.submitted ? (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: C.sageSoft, color: C.green }}>
                Submitted by {record.submittedBy} · {new Date(record.submittedAt).toLocaleDateString()}
              </span>
            ) : (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: C.roseSoft, color: C.rose }}>Not submitted yet</span>
            )}
          </div>

          {record.mode === 'upload' ? (
            <Card style={{ padding: 18 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Term scheme of work <SavedTick savedAt={savedAt} /></div>
              <DocUpload value={record.doc} onChange={setDoc} />
            </Card>
          ) : (
            <Card style={{ padding: 18 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Term scheme of work <SavedTick savedAt={savedAt} /></div>
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

          <Button icon={Send} onClick={submitTerm} variant={record.submitted ? 'outline' : 'primary'}>
            {record.submitted ? 'Re-submit term scheme' : 'Submit term scheme to principal'}
          </Button>
        </>
      )}
    </div>
  );
}
