// Thin wrapper around window.storage (Claude Artifact persistent storage,
// shimmed with localStorage outside the Artifact — see storageShim.js).

export async function storageGet(key, shared) {
  try {
    const res = await window.storage.get(key, shared);
    return res ? JSON.parse(res.value) : null;
  } catch {
    return null;
  }
}

export async function storageSet(key, value, shared) {
  try {
    await window.storage.set(key, JSON.stringify(value), shared);
    return true;
  } catch {
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

// Storage keys can't contain spaces/punctuation, so subject names get slugged.
export const slug = (s) =>
  (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'x';

// Weekly lesson note for one class + subject.
export const lessonWeekKey = (classId, subject, weekStart) =>
  `lesson:${classId}:${slug(subject)}:${weekStart}`;

// Termly diary / scheme of work for one class + subject.
export const diaryKey = (classId, subject, termId) =>
  `diary:${classId}:${slug(subject)}:${termId}`;
