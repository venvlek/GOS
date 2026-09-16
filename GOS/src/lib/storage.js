// Every piece of the app's data — classes, teachers, students, attendance,
// lesson notes, diary, holidays, terms — goes through these two functions
// and a single Postgres table (see supabase-setup.sql). That's what makes
// data genuinely shared: every device talking to the same project sees the
// same rows, unlike the earlier localStorage-only version.
import { supabase } from './supabaseClient';

// `shared` is kept as a no-op second argument so every existing call site
// (storageGet(key, true), storageSet(key, value, true)) keeps working
// unchanged — everything in this app is shared school-wide anyway.
export async function storageGet(key) {
  try {
    const { data, error } = await supabase.from('store').select('value').eq('key', key).maybeSingle();
    if (error) throw error;
    return data ? data.value : null;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`storageGet("${key}") failed:`, e.message || e);
    return null;
  }
}

export async function storageSet(key, value) {
  try {
    const { error } = await supabase.from('store').upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) throw error;
    return true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`storageSet("${key}") failed:`, e.message || e);
    return false;
  }
}

export const todayStr = () => new Date().toISOString().slice(0, 10);

export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const CONFIG_KEY = 'config';
export const HOLIDAYS_KEY = 'holidays';
export const TERMS_KEY = 'terms';

export const dayKey = (classId, date) => `day:${classId}:${date}`;
export const studentsKey = (classId) => `students:${classId}`;

export const slug = (s) =>
  (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'x';

export const lessonWeekKey = (classId, subject, weekStart) =>
  `lesson:${classId}:${slug(subject)}:${weekStart}`;

export const diaryKey = (classId, subject, termId) =>
  `diary:${classId}:${slug(subject)}:${termId}`;
