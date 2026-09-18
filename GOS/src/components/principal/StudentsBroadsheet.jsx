import React from 'react';
import StudentBroadsheet from '../shared/StudentBroadsheet';

export default function StudentsBroadsheet({ config }) {
  return (
    <StudentBroadsheet
      classes={config.classes}
      allowEditName
      emptyTitle="No classes yet"
      emptyBody="Add classes under Classes & students first."
    />
  );
}
