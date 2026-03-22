import { format, isToday, isYesterday } from 'date-fns';

/** Format dates nicely for display */
export const formatDate = (date) => {
  const d = new Date(date);
  if (isToday(d)) return `Today, ${format(d, 'dd MMM yyyy')}`;
  if (isYesterday(d)) return `Yesterday, ${format(d, 'dd MMM yyyy')}`;
  return format(d, 'dd MMM yyyy');
};

export const formatTime = (date) => format(new Date(date), 'hh:mm aa');

export const formatDateTime = (date) => {
  const d = new Date(date);
  return `${formatDate(d)} · ${formatTime(d)}`;
};

/** Time-based greeting */
export const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

/** Mask patient name for privacy: "Rahul Deshmukh" → "Rahul D." */
export const maskName = (name) => {
  if (!name) return 'Patient';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
};

/** Get avatar initials from name: "Rahul Deshmukh" → "RD" */
export const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

/** Position-to-message */
export const positionMessage = (pos, wait) => {
  if (pos === 0) return "🎉 It's your turn! Head to the cabin now.";
  if (pos === 1) return '📍 You\'re next! Get ready.';
  if (pos === 2) return '📡 2 patients ahead. Almost there!';
  return `${pos} patients ahead. ~${wait} min wait.`;
};

/** Estimated wait display */
export const waitDisplay = (minutes) => {
  if (!minutes || minutes <= 0) return '< 1 min';
  if (minutes < 60) return `~${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `~${h}h ${m}m`;
};

/** Status badge classes */
export const statusClass = (status) => {
  const map = {
    waiting: 'badge-waiting',
    next: 'badge-next',
    serving: 'badge-serving',
    done: 'badge-done',
    skipped: 'badge-skipped',
    cancelled: 'badge-cancelled',
  };
  return map[status] || 'badge-cancelled';
};

/** Status label */
export const statusLabel = (status) => {
  const map = {
    waiting: 'Waiting',
    next: 'Next Up',
    serving: 'Serving',
    done: 'Done',
    skipped: 'Skipped',
    cancelled: 'Cancelled',
  };
  return map[status] || status;
};

/** Progress percentage */
export const calcProgress = (doneCount, queueLength) => {
  const total = doneCount + queueLength;
  if (total === 0) return 0;
  return Math.round((doneCount / total) * 100);
};
