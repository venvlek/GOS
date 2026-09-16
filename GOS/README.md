# Garden of Success — Attendance, Lesson Notes & Diary

Matches the real allocation structure: a **class teacher** owns a class's
daily attendance register; teachers separately teach **subjects across
one or more classes** (a teacher can teach Mathematics in J1 and Physics
in S1–S3, say). Lesson notes and the diary are tied to a subject+class
pairing, not to "the class" as a whole.

## Folder layout

```
src/
  App.jsx                     Root: loads config, handles auth/session, routes by role

  lib/
    theme.js                  Color tokens (C) + attendance status meta (STATUS_META)
    storage.js                window.storage wrapper, id/slug helpers, key builders
    dates.js                  Date-string math: weeks, months, terms, holidays, formatting
    stats.js                  computeAttendanceStats(classId, start, end)
    subjects.js                Seeded junior/senior subject lists (autocomplete suggestions)
    docx.js                     mammoth wrapper: .docx File -> HTML

  hooks/
    useDay.js                 Loads/saves one class+date's attendance record

  components/
    ui/                        Reusable, no business logic (Button, Card, DateNav, WeekNav, …)
    shared/                    Used by BOTH roles
      HolidayBanner.jsx          Shown instead of attendance controls on a holiday
      AttendanceStatsPanel.jsx   Week/Month/Term toggle + per-student present-days table
      ModeToggle.jsx              "Type manually" / "Upload document" switch
      DocUpload.jsx               Upload a .docx, parsed client-side, shown inline
      DocPreview.jsx              Read-only rendering of an uploaded doc

    auth/
      LoginScreen.jsx           Principal PIN / Teacher name+PIN sign-in

    principal/
      PrincipalApp.jsx          9 tabs: Overview, Classes, Teachers, Attendance,
                                 Lesson notes, Diary, Statistics, Calendar, Settings
      Overview.jsx               Today's stats + per-class status
      ClassesStudents.jsx        Classes, students, and each class's CLASS TEACHER
      Teachers.jsx                Add teachers + their subject+class assignments
      RecordsViewer.jsx          Any class's daily attendance, any date
      LessonNotes.jsx             Per class: which subject/teacher submitted THIS WEEK
      Diary.jsx                    Per class: which subject/teacher submitted THIS TERM
      Statistics.jsx               Class picker wrapping AttendanceStatsPanel
      Calendar.jsx                 Manage holidays and terms
      PrincipalSettings.jsx      Change the principal PIN

    teacher/
      TeacherApp.jsx             4 tabs: Attendance, Lesson notes, Diary, Statistics
      AttendanceTab.jsx           Only for classes where this teacher IS the class teacher
      LessonNotesTab.jsx          Weekly, per subject+class: upload a .docx OR type
                                   topic/objectives/content/resources/evaluation; submit
      DiaryTab.jsx                 Termly, per subject+class: upload a .docx OR a
                                   week-by-week topic table; submit once per term
      StatisticsTab.jsx           Same as principal's, scoped to their own class(es)
```

## The two kinds of "class list" a teacher sees

- **`classTeacherClasses`** — classes where `class.classTeacherId === teacher.id`.
  Drives **Attendance** and **Statistics** (a teacher only registers/sees
  attendance for a class they're the class teacher of).
- **`assignments`** — `teacher.teachingAssignments`, each `{ subject, classId }`.
  Drives **Lesson notes** and **Diary** (a teacher works one subject+class
  combo at a time, picked from a dropdown like "Physics — S.S.S 1").

Both are computed in `TeacherApp.jsx` and passed down — nothing else
needs to know how a teacher's role is derived.

## How data flows

- `config` (shared) holds `classes` (`{ id, name, classTeacherId }`) and
  `teachers` (`{ id, name, pin, teachingAssignments: [{ id, subject, classId }] }`).
- `holidays` / `terms` (shared, top-level) are managed on Calendar.
- Attendance: `day:<classId>:<date>` — unchanged from before.
- **Lesson notes** (weekly): `lesson:<classId>:<subjectSlug>:<mondayDate>`
  → `{ mode: 'manual'|'upload', doc, entries, submitted, submittedBy, submittedAt }`.
- **Diary** (termly): `diary:<classId>:<subjectSlug>:<termId>`
  → `{ mode, doc, rows: [{ week, topic }], submitted, submittedBy, submittedAt }`.
- Subject names contain spaces/punctuation, which storage keys can't —
  `storage.js#slug()` normalizes them (`"C.R.S."` → `"c-r-s"`).
- The principal's Lesson Notes / Diary screens don't store anything new;
  they scan every teacher's `teachingAssignments` for the selected class
  to find which subjects apply, then read each one's record directly.

## Word document upload

`DocUpload.jsx` accepts a real `.docx` file, reads it with `file.arrayBuffer()`,
and hands it to `mammoth.convertToHtml()` (`lib/docx.js`) — this runs
entirely in the browser, no server involved. The resulting **HTML**, not
the original binary, is what gets saved:

- `window.storage` only holds text/JSON (5MB per key), not arbitrary
  binary files — so the raw `.docx` itself isn't stored.
- The extracted HTML is usually much smaller, and — importantly — lets
  the principal read the lesson note directly in the app without
  downloading anything.

If you need the original file preserved byte-for-byte (e.g. for
re-download), that requires real file storage (S3-style + a small API)
rather than this front-end-only setup.

## Setting up shared storage (Supabase) — do this first

This app now stores everything in a real hosted database instead of your
browser, so the principal and every teacher genuinely see the same data
from their own devices. One-time setup:

1. Go to [supabase.com](https://supabase.com), sign up free, and create a
   new project (any name/region/password — you won't need the DB password
   day-to-day).
2. In your project, open **SQL Editor -> New query**, paste in the contents
   of `supabase-setup.sql` (in this folder), and run it. This creates the
   one table the whole app uses.
3. Open **Project Settings -> API**. Copy the **Project URL** and the
   **anon public** key.
4. In this project folder, copy `.env.example` to a new file named `.env`,
   and paste those two values in:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
5. `npm install` (pulls in the Supabase client), then `npm run dev`.

That's it — `src/lib/storage.js` is the only place that talks to the
database, so nothing else in the app needed to change.

### Security note

There's no per-user login at the database level — only the app's own PIN
screens (principal PIN, teacher name+PIN), which are a UI convenience, not
real access control. The Supabase "anon" key is meant to be public (it
ships inside the built app), and the setup script's policies let anyone
holding that key read and write the whole table directly, bypassing the
app entirely. For a small internal school tool this is a common, acceptable
trade-off — just don't publish your `.env` values anywhere public, and know
that this isn't the same as having real per-user security. If that ever
needs to be tighter (e.g. outside people could plausibly get the URL/key),
the next step up is Supabase Auth with row-level policies scoped per user,
which is a bigger addition than today's change.

## Portability

`lib/storage.js` is a two-function wrapper (`storageGet`/`storageSet`)
around a single Supabase table. Every component only ever calls those two
functions — nothing else in the app knows or cares that Supabase is behind
them. If you ever wanted to swap the backend (a different database, a
custom API, etc.), this is the one file to change.
