import React, { useRef, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { C } from '../../lib/theme';
import { readDocxFile } from '../../lib/docx';

// Lets a teacher upload a .docx; it's parsed client-side with mammoth into
// HTML and that's what gets stored (see lib/docx.js for why).
export default function DocUpload({ value, onChange }) {
  const inputRef = useRef();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      const { html } = await readDocxFile(file);
      onChange({ fileName: file.name, html, uploadedAt: new Date().toISOString() });
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
        <div
          className="rounded-xl p-4"
          style={{ border: `1px solid ${C.line}`, maxHeight: 280, overflow: 'auto', fontSize: 13.5, lineHeight: 1.5 }}
          dangerouslySetInnerHTML={{ __html: value.html }}
        />
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
        <span style={{ fontSize: 13, fontWeight: 600, color: C.green }}>{busy ? 'Reading document…' : 'Upload Word document (.docx)'}</span>
        <span style={{ fontSize: 11.5 }}>Click to choose a file</span>
      </button>
      <input ref={inputRef} type="file" accept=".docx" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      {error && <div style={{ fontSize: 12, color: C.rose, marginTop: 6 }}>{error}</div>}
    </div>
  );
}
