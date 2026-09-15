// Date helpers: everything works with plain 'YYYY-MM-DD' strings.

const pad = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = (s) => new Date(s + 'T00:00:00');

export function addDays(dateStr, n) {
  const d = parseISO(dateStr);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

// Monday of the week containing dateStr.
export function getWeekStart(dateStr) {
  const d = parseISO(dateStr);
  const day = d.getDay(); // 0 = Sun ... 6 = Sat
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return toISO(d);
}

export function getWeekRange(dateStr) {
  const start = getWeekStart(dateStr);
  return { start, end: addDays(start, 6) };
}

export function getMonthRange(dateStr) {
  const d = parseISO(dateStr);
  const start = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const end = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(lastDay)}`;
  return { start, end };
}

export function getTermForDate(dateStr, terms) {
  return (terms || []).find((t) => dateStr >= t.start && dateStr <= t.end) || null;
}

export function isHoliday(dateStr, holidays) {
  return (holidays || []).find((h) => dateStr >= h.start && dateStr <= h.end) || null;
}

// Inclusive list of date strings between start and end (capped for safety).
export function dateRangeArray(start, end) {
  const out = [];
  let cur = start;
  let guard = 0;
  while (cur <= end && guard < 370) {
    out.push(cur);
    cur = addDays(cur, 1);
    guard++;
  }
  return out;
}

export function fmtDate(dateStr) {
  return parseISO(dateStr).toLocaleDateString(undefined, {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function fmtShort(dateStr) {
  return parseISO(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function fmtWeekLabel(weekStart) {
  return `${fmtShort(weekStart)} – ${fmtShort(addDays(weekStart, 6))}`;
}
