import { useCallback, useEffect, useState } from 'react';
import { storageGet, storageSet, dayKey, studentsKey } from '../lib/storage';

// Loads (and re-saves) the attendance/notes/diary record for one class + date.
export function useDay(classId, date, teacherName) {
  const [students, setStudents] = useState([]);
  const [day, setDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([storageGet(studentsKey(classId), true), storageGet(dayKey(classId, date), true)]).then(([s, d]) => {
      if (cancelled) return;
      setStudents(s || []);
      setDay(d || { attendance: {}, lessonNotes: [], diary: [], teacherName, updatedAt: null });
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [classId, date]);

  const persist = useCallback(async (next) => {
    const withMeta = { ...next, teacherName, updatedAt: new Date().toISOString() };
    setDay(withMeta);
    await storageSet(dayKey(classId, date), withMeta, true);
    setSavedAt(Date.now());
  }, [classId, date, teacherName]);

  return { students, day, loading, persist, savedAt };
}
