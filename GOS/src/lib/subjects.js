// Seeded from the school's approved subject lists. Used as suggestions
// (via <datalist>) when a principal assigns subjects to a teacher —
// free text is still allowed for anything not on the list.

export const JUNIOR_SUBJECTS = [
  'Mathematics', 'English Language', 'Basic Science', 'Basic Technology',
  'Agricultural Science', 'Business Studies', 'Digital Technologies',
  'Social Studies', 'P.H.E.', 'French Language', 'Home Economics',
  'Civic Education', 'Cultural & Creative Art', 'Igbo Language', 'C.R.S.',
  'Literature-in-English', 'History', 'Computer Hardware and GSM Repairs',
];

export const SENIOR_SUBJECTS = [
  'Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology',
  'Commerce', 'Geography', 'Financial Accounting', 'Further Mathematics',
  'Government', 'Economics', 'Civic Education', 'Digital Technologies',
  'Igbo Language', 'C.R.S.', 'Literature-in-English', 'Food and Nutrition',
];

export const ALL_SUBJECTS = Array.from(new Set([...JUNIOR_SUBJECTS, ...SENIOR_SUBJECTS])).sort();
