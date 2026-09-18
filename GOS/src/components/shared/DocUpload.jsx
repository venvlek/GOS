import React, { useRef, useState } from 'react';
import { Upload, FileText, X, Maximize2, Download } from 'lucide-react';
import { C } from '../../lib/theme';
import { readDocxFile } from '../../lib/docx';
import { uploadDocFile } from '../../lib/docStorage';
import { uid } from '../../lib/storage';
import DocViewerModal from './DocViewerModal';

// Lets a teacher upload a .docx. It's parsed client-side with mammoth for
// a quick preview, AND uploaded as-is to Supabase Storage so it can later
// be opened exactly as Word renders it (see DocViewerModal) or downloaded.
export default function DocUpload({ value, onChange }) {
  const inputRef = useRef();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      const { html } = await readDocxFile(file);
      const fileUrl = await uploadDocFile(file, uid());
      onChange({ fileName: file.name, html, uploadedAt: new Date().toISOString(), fileUrl });
      if (!fileUrl) {
        setError('Saved, but the full-document viewer link could not be created — the quick preview below still works.');
      }
    } catch {
      setError('Could not read that file. Make sure it is a .docx Word document.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  if (value) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ background: C.sageSoft }}>
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={15} color={C.green} className="shrink-0" />
            <div className="min-w-0">
              <div style={{ fontSize: 13, fontWeight: 600, color: C.green }} className="truncate">{value.fileName}</div>
              <div style={{ fontSize: 11, color: C.inkSoft }}>Uploaded {new Date(value.uploadedAt).toLocaleDateString()}</div>
            </div>
          </div>
          <button onClick={() => onChange(null)} className="shrink-0 opacity-60 hover:opacity-100"><X size={15} color={C.rose} /></button>
        </div>

        {value.fileUrl ? (
          <div className="flex items-center gap-4">
            <button onClick={() => setViewerOpen(true)} className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: C.green }}>
              <Maximize2 size={12} /> View full document
            </button>
            <a href={value.fileUrl} download className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: C.green }}>
              <Download size={12} /> Download
            </a>
          </div>
        ) : (
          <div
            className="rounded-xl p-4"
            style={{ border: `1px solid ${C.line}`, maxHeight: 280, overflow: 'auto', fontSize: 13.5, lineHeight: 1.5 }}
            dangerouslySetInnerHTML={{ __html: value.html }}
          />
        )}

        {viewerOpen && value.fileUrl && (
          <DocViewerModal fileUrl={value.fileUrl} fileName={value.fileName} onClose={() => setViewerOpen(false)} />
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="w-full flex flex-col items-center justify-center gap-1.5 rounded-xl py-6"
        style={{ border: `1.5px dashed ${C.line}`, color: C.inkSoft }}
      >
        <Upload size={18} color={C.green} />
        <span style={{ fontSize: 13, fontWeight: 600, color: C.green }}>{busy ? 'Uploading…' : 'Upload Word document (.docx)'}</span>
        <span style={{ fontSize: 11.5 }}>Click to choose a file</span>
      </button>
      <input ref={inputRef} type="file" accept=".docx" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      {error && <div style={{ fontSize: 12, color: C.rose, marginTop: 6 }}>{error}</div>}
    </div>
  );
}
