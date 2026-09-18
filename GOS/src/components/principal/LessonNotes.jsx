import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { C } from '../../lib/theme';
import { storageGet, storageSet, todayStr, lessonWeekKey, lessonUploadKey, lessonAllKey } from '../../lib/storage';
import { getWeekStart, fmtWeekLabel } from '../../lib/dates';
import Card from '../ui/Card';
import Field from '../ui/Field';
import EmptyState from '../ui/EmptyState';
import WeekNav from '../ui/WeekNav';
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

// Entry content, wherever it came from: a manual submission for this exact
// subject/class, or falling back to that teacher's single weekly upload
// (which covers everything they teach at once).
async function resolveEntry({ classId, subject, teacherId, weekStart }) {
  if (subject) {
    const manual = await storageGet(lessonWeekKey(classId, subject, weekStart));
    if (manual?.submitted) return { kind: 'manual', key: lessonWeekKey(classId, subject, weekStart), record: manual };
  } else {
    const manual = await storageGet(lessonAllKey(classId, weekStart));
    if (manual?.submitted) return { kind: 'all', key: lessonAllKey(classId, weekStart), record: manual };
  }
  if (teacherId) {
    const upload = await storageGet(lessonUploadKey(teacherId, weekStart));
    if (upload?.submitted) return { kind: 'upload', key: lessonUploadKey(teacherId, weekStart), record: upload };
  }
  return { kind: subject ? 'manual' : 'all', key: subject ? lessonWeekKey(classId, subject, weekStart) : lessonAllKey(classId, weekStart), record: null };
}

export default function LessonNotes({ config }) {
  const maxWeek = getWeekStart(todayStr());
  const [weekStart, setWeekStart] = useState(maxWeek);
  const [classId, setClassId] = useState(config.classes[0]?.id || '');
  const [rows, setRows] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const cls = config.classes.find((c) => c.id === classId);
  const isPrimary = cls?.classType === 'primary';
  const subjects = !isPrimary && classId ? subjectsForClass(config, classId) : [];

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!classId) { setRows([]); return; }
      setRows(null);
      const out = [];
      if (isPrimary) {
        const resolved = await resolveEntry({ classId, teacherId: cls.classTeacherId, weekStart });
        out.push({ key: 'all', label: cls.name, teacherName: config.teachers.find((t) => t.id === cls.classTeacherId)?.name || '— no class teacher set —', ...resolved });
      } else {
        for (const s of subjects) {
          const resolved = await resolveEntry({ classId, subject: s.subject, teacherId: s.teacherId, weekStart });
          out.push({ key: s.subject, label: s.subject, teacherName: s.teacherName, ...resolved });
        }
      }
      if (!cancelled) setRows(out);
    }
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, weekStart, config.teachers]);

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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="goss-serif" style={{ fontSize: 19, color: C.green }}>Lesson notes — {fmtWeekLabel(weekStart)}</div>
        <WeekNav weekStart={weekStart} onChange={setWeekStart} maxWeekStart={maxWeek} />
      </div>

      <Field label="Class">
        <div className="relative" style={{ maxWidth: 260 }}>
          <select value={classId} onChange={(e) => setClassId(e.target.value)} style={{ ...inputStyle, appearance: 'none' }} className="goss-sans">
            {config.classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.classType === 'primary' ? ' (primary)' : ''}</option>)}
          </select>
          <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: 11, color: C.inkSoft, pointerEvents: 'none' }} />
        </div>
      </Field>

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
                      <div style={{ fontSize: 13, color: C.inkSoft }}>Nothing submitted for this week yet.</div>
                    ) : (
                      <>
                        {r.record.doc ? (
                          <DocPreview doc={r.record.doc} />
                        ) : (r.record.entries || []).length === 0 ? (
                          <div style={{ fontSize: 13, color: C.inkSoft }}>No lessons added.</div>
                        ) : (
                          <div className="space-y-3">
                            {r.record.entries.map((e) => (
                              <div key={e.id} style={{ borderLeft: `2px solid ${C.gold}`, paddingLeft: 12 }}>
                                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{e.subject ? `${e.subject} — ` : ''}{e.topic}</div>
                                {e.objectives && <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}><strong>Objectives:</strong> {e.objectives}</div>}
                                {e.content && <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}><strong>Content:</strong> {e.content}</div>}
                                {e.resources && <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}><strong>Resources:</strong> {e.resources}</div>}
                                {e.evaluation && <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}><strong>Evaluation:</strong> {e.evaluation}</div>}
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
