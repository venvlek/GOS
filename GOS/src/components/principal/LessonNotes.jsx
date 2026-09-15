import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { C } from '../../lib/theme';
import { storageGet, todayStr, lessonWeekKey } from '../../lib/storage';
import { getWeekStart, fmtWeekLabel } from '../../lib/dates';
import Card from '../ui/Card';
import Field from '../ui/Field';
import EmptyState from '../ui/EmptyState';
import WeekNav from '../ui/WeekNav';
import DocPreview from '../shared/DocPreview';
import { inputStyle } from '../ui/Inputs';

function subjectsForClass(config, classId) {
  const rows = [];
  config.teachers.forEach((t) => {
    (t.teachingAssignments || []).forEach((a) => {
      if (a.classId === classId) rows.push({ subject: a.subject, teacherName: t.name });
    });
  });
  return rows.sort((a, b) => a.subject.localeCompare(b.subject));
}

export default function LessonNotes({ config }) {
  const maxWeek = getWeekStart(todayStr());
  const [weekStart, setWeekStart] = useState(maxWeek);
  const [classId, setClassId] = useState(config.classes[0]?.id || '');
  const [rows, setRows] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const subjects = classId ? subjectsForClass(config, classId) : [];

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setRows(null);
      const out = [];
      for (const s of subjects) {
        const w = await storageGet(lessonWeekKey(classId, s.subject, weekStart), true);
        out.push({ ...s, week: w });
      }
      if (!cancelled) setRows(out);
    }
    if (classId) run(); else setRows([]);
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, weekStart, config.teachers]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="goss-serif" style={{ fontSize: 19, color: C.green }}>Lesson notes — {fmtWeekLabel(weekStart)}</div>
        <WeekNav weekStart={weekStart} onChange={setWeekStart} maxWeekStart={maxWeek} />
      </div>

      <Field label="Class">
        <div className="relative" style={{ maxWidth: 260 }}>
          <select value={classId} onChange={(e) => setClassId(e.target.value)} style={{ ...inputStyle, appearance: 'none' }} className="goss-sans">
            {config.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: 11, color: C.inkSoft, pointerEvents: 'none' }} />
        </div>
      </Field>

      {config.classes.length === 0 ? (
        <EmptyState title="No classes yet" body="Add classes under Classes & students first." />
      ) : subjects.length === 0 ? (
        <EmptyState title="No subjects assigned to this class" body="Assign subjects to teachers for this class under Teachers." />
      ) : rows === null ? (
        <div style={{ fontSize: 13, color: C.inkSoft }}>Loading…</div>
      ) : (
        <Card>
          {rows.map((r, i) => {
            const isOpen = expanded === r.subject;
            const submitted = r.week?.submitted;
            return (
              <div key={r.subject} style={{ borderTop: i === 0 ? 'none' : `1px solid ${C.line}` }}>
                <button onClick={() => setExpanded(isOpen ? null : r.subject)} className="w-full flex items-center justify-between px-5 py-3.5 text-left">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{r.subject}</div>
                    <div style={{ fontSize: 12, color: C.inkSoft }}>{r.teacherName}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {submitted ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: C.sageSoft, color: C.green }}>
                        Submitted {new Date(r.week.submittedAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: C.roseSoft, color: C.rose }}>Not submitted</span>
                    )}
                    {isOpen ? <ChevronUp size={15} color={C.inkSoft} /> : <ChevronDown size={15} color={C.inkSoft} />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-5 pb-4">
                    {!r.week ? (
                      <div style={{ fontSize: 13, color: C.inkSoft }}>Nothing added for this week yet.</div>
                    ) : r.week.mode === 'upload' && r.week.doc ? (
                      <DocPreview doc={r.week.doc} />
                    ) : (r.week.entries || []).length === 0 ? (
                      <div style={{ fontSize: 13, color: C.inkSoft }}>No lessons added for this week yet.</div>
                    ) : (
                      <div className="space-y-3">
                        {r.week.entries.map((e) => (
                          <div key={e.id} style={{ borderLeft: `2px solid ${C.gold}`, paddingLeft: 12 }}>
                            <div style={{ fontWeight: 600, fontSize: 13.5 }}>{e.topic}</div>
                            {e.objectives && <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}><strong>Objectives:</strong> {e.objectives}</div>}
                            {e.content && <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}><strong>Content:</strong> {e.content}</div>}
                            {e.resources && <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}><strong>Resources:</strong> {e.resources}</div>}
                            {e.evaluation && <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}><strong>Evaluation:</strong> {e.evaluation}</div>}
                          </div>
                        ))}
                      </div>
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
