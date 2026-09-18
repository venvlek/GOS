import React from 'react';
import { X, Download } from 'lucide-react';
import { C } from '../../lib/theme';

// Full-screen, in-app view of an uploaded Word document — rendered by
// Microsoft's own Office Online viewer (the file has to be at a public
// URL for Microsoft's servers to fetch it, which is why it's uploaded to
// a public Supabase Storage bucket rather than kept only as local HTML).
export default function DocViewerModal({ fileUrl, fileName, onClose }) {
  const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;

  return (
    <div className="fixed inset-0 flex flex-col" style={{ zIndex: 1000, background: 'rgba(0,0,0,0.6)' }}>
      <div className="flex items-center justify-between px-4 py-3 gap-3" style={{ background: C.green }}>
        <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }} className="truncate">{fileName}</div>
        <div className="flex items-center gap-4 shrink-0">
          <a href={fileUrl} download className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#fff' }}>
            <Download size={14} /> Download
          </a>
          <button onClick={onClose} aria-label="Close">
            <X size={20} color="#fff" />
          </button>
        </div>
      </div>
      <iframe title={fileName} src={viewerUrl} className="flex-1 w-full" style={{ border: 'none', background: '#fff' }} />
    </div>
  );
}
