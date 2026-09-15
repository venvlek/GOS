import React from 'react';
import { FileText } from 'lucide-react';
import { C } from '../../lib/theme';

// Read-only rendering of an uploaded doc, for the principal's views.
export default function DocPreview({ doc }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <FileText size={14} color={C.green} />
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{doc.fileName}</span>
        <span style={{ fontSize: 11.5, color: C.inkSoft }}>· {new Date(doc.uploadedAt).toLocaleDateString()}</span>
      </div>
      <div
        className="rounded-xl p-4"
        style={{ border: `1px solid ${C.line}`, fontSize: 13.5, lineHeight: 1.5, maxHeight: 320, overflow: 'auto' }}
        dangerouslySetInnerHTML={{ __html: doc.html }}
      />
    </div>
  );
}
