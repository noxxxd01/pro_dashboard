// Deterministic color coding for badges whose values come from an
// admin-managed, open-ended list (Option records), so every distinct value
// always renders the same color without needing to hardcode the full set.
const BADGE_COLOR_PALETTE = [
  'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900',
  'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-900',
  'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900',
  'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900',
  'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900',
  'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-900',
  'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-900',
  'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-900',
  'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-900',
  'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-900',
];

export function getBadgeColor(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return BADGE_COLOR_PALETTE[Math.abs(hash) % BADGE_COLOR_PALETTE.length];
}

const GREEN_STATUS =
  'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900';
const BLUE_STATUS =
  'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900';
const AMBER_STATUS =
  'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900';
const RED_STATUS =
  'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900';

const STATUS_COLOR_OVERRIDES: Record<string, string> = {
  completed: GREEN_STATUS,
  done: GREEN_STATUS,
  ongoing: BLUE_STATUS,
  'in progress': BLUE_STATUS,
  pending: AMBER_STATUS,
  scheduled: AMBER_STATUS,
  upcoming: AMBER_STATUS,
  'for signature': AMBER_STATUS,
  cancelled: RED_STATUS,
  canceled: RED_STATUS,
  postponed: RED_STATUS,
};

export function getStatusBadgeColor(value: string): string {
  return (
    STATUS_COLOR_OVERRIDES[value.toLowerCase().trim()] ?? getBadgeColor(value)
  );
}
