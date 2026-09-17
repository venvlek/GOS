import React, { useState } from 'react';
import { ClipboardCheck, NotebookPen, BookOpen, BarChart3 } from 'lucide-react';
import Shell from '../ui/Shell';
import TopBar from '../ui/TopBar';
import TabBar from '../ui/TabBar';
import AttendanceTab from './AttendanceTab';
import LessonNotesTab from './LessonNotesTab';
import DiaryTab from './DiaryTab';
import StatisticsTab from './StatisticsTab';

const TABS = [
  { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
  { id: 'lessonnotes', label: 'Lesson notes', icon: NotebookPen },
  { id: 'diary', label: 'Diary', icon: BookOpen },
  { id: 'stats', label: 'Statistics', icon: BarChart3 },
];

export default function TeacherApp({ config, teacher, onLogout }) {
  const [tab, setTab] = useState('attendance');

  // Classes this teacher takes the register for (Attendance / Statistics).
  const classTeacherClasses = config.classes.filter((c) => c.classTeacherId === teacher.id);

  // Of those, the "primary style" ones where this teacher covers every
  // subject themselves (Lesson notes / Diary work at the CLASS level here).
  const allSubjectsClasses = classTeacherClasses
    .filter((c) => c.classType === 'primary')
    .map((c) => ({ id: c.id, name: c.name }));

  // Subject+class combos for secondary-style teaching (Lesson notes / Diary
  // work per SUBJECT here).
  const assignments = (teacher.teachingAssignments || []).map((a) => ({
    ...a,
    className: config.classes.find((c) => c.id === a.classId)?.name || '—',
  }));

  return (
    <Shell>
      <div className="min-h-screen">
        <TopBar role={teacher.name} subtitle="Teacher" onLogout={onLogout} />
        <TabBar tabs={TABS} active={tab} onChange={setTab} />
        <div className="p-5 max-w-3xl mx-auto">
          {tab === 'attendance' && <AttendanceTab classes={classTeacherClasses} teacherName={teacher.name} />}
          {tab === 'lessonnotes' && (
            <LessonNotesTab
              allSubjectsClasses={allSubjectsClasses}
              assignments={assignments}
              teacherId={teacher.id}
              teacherName={teacher.name}
            />
          )}
          {tab === 'diary' && (
            <DiaryTab
              allSubjectsClasses={allSubjectsClasses}
              assignments={assignments}
              teacherId={teacher.id}
              teacherName={teacher.name}
            />
          )}
          {tab === 'stats' && <StatisticsTab classes={classTeacherClasses} />}
        </div>
      </div>
    </Shell>
  );
}
