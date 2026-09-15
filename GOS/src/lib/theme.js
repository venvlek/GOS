import { CheckCircle2, XCircle, Clock3 } from 'lucide-react';

// Design tokens shared across the whole app.
export const C = {
  bg: '#F6F3EA',
  ink: '#211F1A',
  inkSoft: '#5B5648',
  green: '#20402C',
  greenDark: '#152A1D',
  sage: '#6E8F72',
  sageSoft: '#E7EEE4',
  gold: '#B8863B',
  goldSoft: '#F3E6CC',
  rose: '#9C4A3C',
  roseSoft: '#F3E1DC',
  card: '#FFFFFF',
  line: '#E4DDC9',
};

export const STATUS_META = {
  present: { label: 'Present', color: C.sage, bg: C.sageSoft, Icon: CheckCircle2 },
  late: { label: 'Late', color: C.gold, bg: C.goldSoft, Icon: Clock3 },
  absent: { label: 'Absent', color: C.rose, bg: C.roseSoft, Icon: XCircle },
};
