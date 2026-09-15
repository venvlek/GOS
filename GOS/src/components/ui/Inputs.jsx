import React from 'react';
import { C } from '../../lib/theme';

export const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 10,
  border: `1px solid ${C.line}`,
  background: '#FCFBF7',
  fontSize: 14,
  outline: 'none',
  color: C.ink,
};

export function TextInput(props) {
  return <input {...props} className="goss-sans" style={{ ...inputStyle, ...(props.style || {}) }} />;
}

export function TextArea(props) {
  return <textarea {...props} className="goss-sans" style={{ ...inputStyle, resize: 'vertical', ...(props.style || {}) }} />;
}
