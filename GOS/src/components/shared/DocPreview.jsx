import React, { useState } from 'react';
import { FileText, Maximize2, Download } from 'lucide-react';
import { C } from '../../lib/theme';
import DocViewerModal from './DocViewerModal';

// Read-only rendering of an uploaded doc, for the principal's views.
// If the raw file made it to Supabase Storage, "View full document" opens
// it rendered by Word itself (via DocViewerModal); otherwise falls back to
// the smaller local HTML preview (older submissions, or upload hiccups).
export default function DocPreview({ doc }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileText size={14} color={C.green} />
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>{doc.fileName}</span>
          <span style={{ fontSize: 11.5, color: C.inkSoft }}>· {new Date(doc.uploadedAt).toLocaleDateString()}</span>
        </div>
        {doc.fileUrl && (
          <div className="flex items-center gap-4">
            <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: C.green }}>
              <Maximize2 size={12} /> View full document
            </button>
            <a href={doc.fileUrl} download className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: C.green }}>
              <Download size={12} /> Download
            </a>
          </div>
        )}
      </div>

      {!doc.fileUrl && (
        <div
          className="rounded-xl p-4"
          style={{ border: `1px solid ${C.line}`, fontSize: 13.5, lineHeight: 1.5, maxHeight: 320, overflow: 'auto' }}
          dangerouslySetInnerHTML={{ __html: doc.html }}
        />
      )}

      {open && doc.fileUrl && <DocViewerModal fileUrl={doc.fileUrl} fileName={doc.fileName} onClose={() => setOpen(false)} />}
    </div>
  );
}
