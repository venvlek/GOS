import React, { useState } from 'react';
import { Eye, MessageSquare, Check } from 'lucide-react';
import { C } from '../../lib/theme';
import Button from '../ui/Button';
import { TextArea } from '../ui/Inputs';

// Shows/handles the principal's "seen" mark and comment on a submission.
// readOnly=true (teacher side): just displays status + comment.
// readOnly=false (principal side): lets them mark seen and write a comment.
export default function ReviewPanel({ record, onMarkSeen, onSaveComment, readOnly }) {
  const [draft, setDraft] = useState(record?.principalComment || '');
  const [editing, setEditing] = useState(false);

  if (!record) return null;

  return (
    <div className="mt-3 pt-3 space-y-2" style={{ borderTop: `1px dashed ${C.line}` }}>
      <div className="flex items-center gap-3 flex-wrap">
        {record.seenByPrincipal ? (
          <span className="inline-flex items-center gap-1" style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>
            <Eye size={13} /> Seen by principal{record.seenAt ? ` · ${new Date(record.seenAt).toLocaleDateString()}` : ''}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: C.inkSoft }}>Not yet seen by principal</span>
        )}
        {!readOnly && !record.seenByPrincipal && (
          <Button size="sm" variant="outline" icon={Check} onClick={onMarkSeen}>Mark as seen</Button>
        )}
      </div>

      {readOnly ? (
        record.principalComment && (
          <div className="rounded-lg px-3 py-2" style={{ background: C.goldSoft }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: C.ink, marginBottom: 2 }}>Principal's note</div>
            <div style={{ fontSize: 13, color: C.ink }}>{record.principalComment}</div>
          </div>
        )
      ) : !editing && record.principalComment ? (
        <div className="rounded-lg px-3 py-2 flex justify-between items-start gap-2" style={{ background: C.goldSoft }}>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: C.ink, marginBottom: 2 }}>Your comment</div>
            <div style={{ fontSize: 13, color: C.ink }}>{record.principalComment}</div>
          </div>
          <button onClick={() => { setDraft(record.principalComment); setEditing(true); }} style={{ fontSize: 12, color: C.green, fontWeight: 600, flexShrink: 0 }}>Edit</button>
        </div>
      ) : (
        <div className="space-y-2">
          <TextArea rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Leave a note for the teacher…" />
          <Button size="sm" icon={MessageSquare} onClick={() => { onSaveComment(draft); setEditing(false); }}>Save comment</Button>
        </div>
      )}
    </div>
  );
}
