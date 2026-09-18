import { supabase } from './supabaseClient';

const BUCKET = 'lesson-docs';

// Uploads the raw .docx to Supabase Storage so it can later be opened
// exactly as Word renders it (via Office's online viewer) or downloaded to
// open in desktop Word. Returns a public URL, or null if the bucket isn't
// set up yet / the upload fails — callers degrade gracefully in that case
// (the mammoth-generated HTML preview still works either way).
export async function uploadDocFile(file, keyHint) {
  try {
    const ext = (file.name.split('.').pop() || 'docx').toLowerCase();
    const path = `${keyHint}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      upsert: true,
      contentType: file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    if (error) throw error;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data?.publicUrl || null;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('uploadDocFile failed:', e.message || e);
    return null;
  }
}
