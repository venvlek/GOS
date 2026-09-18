import React, { useState } from 'react';
import { School, Users, PenLine, ClipboardCheck, NotebookPen, BookOpen, BarChart3, CalendarDays, Settings2, Table2 } from 'lucide-react';
import Shell from '../ui/Shell';
import TopBar from '../ui/TopBar';
import TabBar from '../ui/TabBar';
import Overview from './Overview';
import ClassesStudents from './ClassesStudents';
import Teachers from './Teachers';
import RecordsViewer from './RecordsViewer';
import LessonNotes from './LessonNotes';
import Diary from './Diary';
import Statistics from './Statistics';
import Calendar from './Calendar';
import StudentsBroadsheet from './StudentsBroadsheet';
import PrincipalSettings from './PrincipalSettings';

const TABS = [
  { id: 'overview', label: 'Overview', icon: School },
  { id: 'classes', label: 'Classes & students', icon: Users },
  { id: 'students', label: 'Students', icon: Table2 },
  { id: 'teachers', label: 'Teachers', icon: PenLine },
  { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
  { id: 'lessonnotes', label: 'Lesson notes', icon: NotebookPen },
  { id: 'diary', label: 'Diary', icon: BookOpen },
  { id: 'stats', label: 'Statistics', icon: BarChart3 },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'settings', label: 'Settings', icon: Settings2 },
];

export default function PrincipalApp({ config, setConfig, onLogout }) {
  const [tab, setTab] = useState('overview');

  return (
    <Shell>
      <div className="min-h-screen">
        <TopBar role="Principal" subtitle="Garden of Success" onLogout={onLogout} />
        <TabBar tabs={TABS} active={tab} onChange={setTab} />
        <div className="p-5 max-w-5xl mx-auto">
          {tab === 'overview' && <Overview config={config} />}
          {tab === 'classes' && <ClassesStudents config={config} setConfig={setConfig} />}
          {tab === 'students' && <StudentsBroadsheet config={config} />}
          {tab === 'teachers' && <Teachers config={config} setConfig={setConfig} />}
          {tab === 'attendance' && <RecordsViewer config={config} />}
          {tab === 'lessonnotes' && <LessonNotes config={config} />}
          {tab === 'diary' && <Diary config={config} />}
          {tab === 'stats' && <Statistics config={config} />}
          {tab === 'calendar' && <Calendar />}
          {tab === 'settings' && <PrincipalSettings config={config} setConfig={setConfig} />}
        </div>
      </div>
    </Shell>
  );
}
