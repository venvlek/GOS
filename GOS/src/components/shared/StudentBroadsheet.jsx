import React, { useEffect, useMemo, useState } from 'react';
import { Search, Pencil, Check, X, ChevronDown } from 'lucide-react';
import { C } from '../../lib/theme';
import { storageGet, storageSet, studentsKey } from '../../lib/storage';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import Button from '../ui/Button';
import { TextInput, inputStyle } from '../ui/Inputs';

const COLUMNS = [
  { key: 'dob', label: 'Date of birth', type: 'date' },
  { key: 'guardianName', label: 'Parent / guardian name' },
  { key: 'guardianPhone', label: 'Guardian phone' },
  { key: 'guardianAddress', label: 'Guardian address' },
  { key: 'guardianReligion', label: 'Guardian religion' },
];

const BLANK = { dob: '', guardianName: '', guardianAddress: '', guardianReligion: '', guardianPhone: '' };

// A filterable, editable broadsheet of students across one or more classes.
// `allowEditName` controls whether the Name cell itself can be edited —
// teachers get everything except that (roster/naming stays with the
// principal), while the principal's use of this can allow it.
export default function StudentBroadsheet({ classes, allowEditName = false, emptyTitle, emptyBody }) {
  const [rawByClass, setRawByClass] = useState({});
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(BLANK);

  const classIdsKey = classes.map((c) => c.id).sort().join(',');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const out = {};
      for (const c of classes) {
        out[c.id] = (await storageGet(studentsKey(c.id), true)) || [];
      }
      if (!cancelled) { setRawByClass(out); setLoading(false); }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classIdsKey]);

  const rows = useMemo(() => {
    const out = [];
    for (const c of classes) {
      (rawByClass[c.id] || []).forEach((s) => out.push({ ...s, classId: c.id, className: c.name }));
    }
    return out;
  }, [rawByClass, classes]);

  const filtered = rows.filter((r) => {
    if (classFilter !== 'all' && r.classId !== classFilter) return false;
    if (search.trim() && !r.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditForm({
      name: row.name,
      dob: row.dob || '',
      guardianName: row.guardianName || '',
      guardianAddress: row.guardianAddress || '',
      guardianReligion: row.guardianReligion || '',
      guardianPhone: row.guardianPhone || '',
    });
  };
  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (row) => {
    const patch = { ...editForm };
    if (!allowEditName) delete patch.name; // never let this path change the name unless explicitly allowed
    const nextForClass = (rawByClass[row.classId] || []).map((s) => (s.id === row.id ? { ...s, ...patch } : s));
    setRawByClass((prev) => ({ ...prev, [row.classId]: nextForClass }));
    await storageSet(studentsKey(row.classId), nextForClass, true);
    setEditingId(null);
  };

  if (classes.length === 0) {
    return <EmptyState title={emptyTitle || 'No classes yet'} body={emptyBody || 'Nothing to show yet.'} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative" style={{ flex: '1 1 220px', maxWidth: 320 }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: 11, color: C.inkSoft }} />
          <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name…" style={{ paddingLeft: 32 }} />
        </div>
        {classes.length > 1 && (
          <div className="relative" style={{ minWidth: 160 }}>
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} style={{ ...inputStyle, appearance: 'none' }} className="goss-sans">
              <option value="all">All classes</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: 11, color: C.inkSoft, pointerEvents: 'none' }} />
          </div>
        )}
        <span style={{ fontSize: 12.5, color: C.inkSoft }}>{filtered.length} student{filtered.length === 1 ? '' : 's'}</span>
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: C.inkSoft }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No students found" body="Try a different search or class filter." />
      ) : (
        <Card style={{ overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.sageSoft }}>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 600, color: C.green, whiteSpace: 'nowrap' }}>Name</th>
                  {classes.length > 1 && <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 600, color: C.green, whiteSpace: 'nowrap' }}>Class</th>}
                  {COLUMNS.map((col) => (
                    <th key={col.key} style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 600, color: C.green, whiteSpace: 'nowrap' }}>{col.label}</th>
                  ))}
                  <th style={{ padding: '10px 14px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => {
                  const isEditing = editingId === row.id;
                  return (
                    <tr key={row.id} style={{ borderTop: i === 0 ? 'none' : `1px solid ${C.line}` }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {isEditing && allowEditName ? (
                          <TextInput value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={{ minWidth: 140 }} />
                        ) : row.name}
                      </td>
                      {classes.length > 1 && <td style={{ padding: '10px 14px', color: C.inkSoft, whiteSpace: 'nowrap' }}>{row.className}</td>}
                      {COLUMNS.map((col) => (
                        <td key={col.key} style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          {isEditing ? (
                            <TextInput
                              type={col.type || 'text'}
                              value={editForm[col.key]}
                              onChange={(e) => setEditForm({ ...editForm, [col.key]: e.target.value })}
                              style={{ minWidth: col.type === 'date' ? 140 : 150 }}
                            />
                          ) : (
                            row[col.key] || <span style={{ color: C.inkSoft }}>—</span>
                          )}
                        </td>
                      ))}
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => saveEdit(row)} title="Save"><Check size={15} color={C.green} /></button>
                            <button onClick={cancelEdit} title="Cancel"><X size={15} color={C.rose} /></button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit(row)} className="opacity-60 hover:opacity-100" title="Edit"><Pencil size={14} color={C.green} /></button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
