import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { C } from '../../lib/theme';
import { storageGet, storageSet, TERMS_KEY, diaryKey, diaryUploadKey, diaryAllKey } from '../../lib/storage';
import Card from '../ui/Card';
import Field from '../ui/Field';
import EmptyState from '../ui/EmptyState';
import DocPreview from '../shared/DocPreview';
import ReviewPanel from '../shared/ReviewPanel';
import { inputStyle } from '../ui/Inputs';

function subjectsForClass(config, classId) {
  const rows = [];
  config.teachers.forEach((t) => {
    (t.teachingAssignments || []).forEach((a) => {
      if (a.classId === classId) rows.push({ subject: a.subject, teacherId: t.id, teacherName: t.name });
    });
  });
  return rows.sort((a, b) => a.subject.localeCompare(b.subject));
}

async function resolveEntry({ classId, subject, teacherId, termId }) {
  if (subject) {
    const manual = await storageGet(diaryKey(classId, subject, termId));
    if (manual?.submitted) return { kind: 'manual', key: diaryKey(classId, subject, termId), record: manual };
  } else {
    const manual = await storageGet(diaryAllKey(classId, termId));
    if (manual?.submitted) return { kind: 'all', key: diaryAllKey(classId, termId), record: manual };
  }
  if (teacherId) {
    const upload = await storageGet(diaryUploadKey(teacherId, termId));
    if (upload?.submitted) return { kind: 'upload', key: diaryUploadKey(teacherId, termId), record: upload };
  }
  return { kind: subject ? 'manual' : 'all', key: subject ? diaryKey(classId, subject, termId) : diaryAllKey(classId, termId), record: null };
}

export default function Diary({ config }) {
  const [terms, setTerms] = useState(null);
  const [termId, setTermId] = useState('');
  const [classId, setClassId] = useState(config.classes[0]?.id || '');
  const [rows, setRows] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    storageGet(TERMS_KEY, true).then((t) => {
      const arr = t || [];
      setTerms(arr);
      setTermId(arr[arr.length - 1]?.id || '');
    });
  }, []);

  const cls = config.classes.find((c) => c.id === classId);
  const isPrimary = cls?.classType === 'primary';
  const subjects = !isPrimary && classId ? subjectsForClass(config, classId) : [];

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!classId || !termId) { setRows([]); return; }
      setRows(null);
      const out = [];
      if (isPrimary) {
        const resolved = await resolveEntry({ classId, teacherId: cls.classTeacherId, termId });
        out.push({ key: 'all', label: cls.name, teacherName: config.teachers.find((t) => t.id === cls.classTeacherId)?.name || '— no class teacher set —', ...resolved });
      } else {
        for (const s of subjects) {
          const resolved = await resolveEntry({ classId, subject: s.subject, teacherId: s.teacherId, termId });
          out.push({ key: s.subject, label: s.subject, teacherName: s.teacherName, ...resolved });
        }
      }
      if (!cancelled) setRows(out);
    }
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, termId, config.teachers]);

  const markSeen = async (row) => {
    const next = { ...row.record, seenByPrincipal: true, seenAt: new Date().toISOString() };
    await storageSet(row.key, next);
    setRows((cur) => cur.map((r) => (r.key === row.key ? { ...r, record: next } : r)));
  };
  const saveComment = async (row, comment) => {
    const next = { ...row.record, principalComment: comment, commentAt: new Date().toISOString() };
    await storageSet(row.key, next);
    setRows((cur) => cur.map((r) => (r.key === row.key ? { ...r, record: next } : r)));
  };

  if (terms !== null && terms.length === 0) {
    return <EmptyState title="No terms set up yet" body="Add the current term's dates under Calendar first." />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4">
        <Field label="Class">
          <div className="relative" style={{ minWidth: 200 }}>
            <select value={classId} onChange={(e) => setClassId(e.target.value)} style={{ ...inputStyle, appearance: 'none' }} className="goss-sans">
              {config.classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.classType === 'primary' ? ' (primary)' : ''}</option>)}
            </select>
            <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: 11, color: C.inkSoft, pointerEvents: 'none' }} />
          </div>
        </Field>
        <Field label="Term">
          <div className="relative" style={{ minWidth: 180 }}>
            <select value={termId} onChange={(e) => setTermId(e.target.value)} style={{ ...inputStyle, appearance: 'none' }} className="goss-sans">
              {(terms || []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: 11, color: C.inkSoft, pointerEvents: 'none' }} />
          </div>
        </Field>
      </div>

      {config.classes.length === 0 ? (
        <EmptyState title="No classes yet" body="Add classes under Classes & students first." />
      ) : !isPrimary && subjects.length === 0 ? (
        <EmptyState title="No subjects assigned to this class" body="Assign subjects to teachers for this class under Teachers." />
      ) : rows === null ? (
        <div style={{ fontSize: 13, color: C.inkSoft }}>Loading…</div>
      ) : (
        <Card>
          {rows.map((r, i) => {
            const isOpen = expanded === r.key;
            const submitted = r.record?.submitted;
            return (
              <div key={r.key} style={{ borderTop: i === 0 ? 'none' : `1px solid ${C.line}` }}>
                <button onClick={() => setExpanded(isOpen ? null : r.key)} className="w-full flex items-center justify-between px-5 py-3.5 text-left">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{r.label}</div>
                    <div style={{ fontSize: 12, color: C.inkSoft }}>{r.teacherName}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {submitted ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: C.sageSoft, color: C.green }}>
                        Submitted {new Date(r.record.submittedAt).toLocaleDateString()}{r.kind === 'upload' ? ' · covers all subjects' : ''}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: C.roseSoft, color: C.rose }}>Not submitted</span>
                    )}
                    {isOpen ? <ChevronUp size={15} color={C.inkSoft} /> : <ChevronDown size={15} color={C.inkSoft} />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-5 pb-4">
                    {!submitted ? (
                      <div style={{ fontSize: 13, color: C.inkSoft }}>Nothing submitted for this term yet.</div>
                    ) : (
                      <>
                        {r.record.doc ? (
                          <DocPreview doc={r.record.doc} />
                        ) : (r.record.rows || []).length === 0 ? (
                          <div style={{ fontSize: 13, color: C.inkSoft }}>No weeks added.</div>
                        ) : (
                          <div className="divide-y" style={{ borderColor: C.line }}>
                            {r.record.rows.map((row) => (
                              <div key={row.id} className="py-2" style={{ fontSize: 13.5 }}>
                                <strong>{row.week}{row.subject ? ` · ${row.subject}` : ''}:</strong> {row.topic}
                              </div>
                            ))}
                          </div>
                        )}
                        <ReviewPanel record={r.record} onMarkSeen={() => markSeen(r)} onSaveComment={(c) => saveComment(r, c)} />
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
