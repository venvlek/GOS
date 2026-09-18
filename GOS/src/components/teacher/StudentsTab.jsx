import React from 'react';
import { C } from '../../lib/theme';
import StudentBroadsheet from '../shared/StudentBroadsheet';

// `classes` = classes this teacher is the class teacher of. Name stays
// locked — that's the principal's roster to manage; teachers fill in
// everything else (DOB, guardian details).
export default function StudentsTab({ classes }) {
  return (
    <div className="space-y-4">
      <div className="goss-serif" style={{ fontSize: 19, color: C.green }}>Students</div>
      <StudentBroadsheet
        classes={classes}
        allowEditName={false}
        emptyTitle="You're not a class teacher yet"
        emptyBody="Ask the principal to set you as the class teacher of a class, under Classes & students."
      />
    </div>
  );
}
