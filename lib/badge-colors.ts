// Deterministic color coding for badges whose values come from an
// admin-managed, open-ended list (Option records), so every distinct value
// always renders the same color without needing to hardcode the full set.
const BADGE_COLOR_PALETTE = [
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-purple-100 text-purple-800 border-purple-200',
  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-rose-100 text-rose-800 border-rose-200',
  'bg-cyan-100 text-cyan-800 border-cyan-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-orange-100 text-orange-800 border-orange-200',
  'bg-teal-100 text-teal-800 border-teal-200',
  'bg-pink-100 text-pink-800 border-pink-200',
];

export function getBadgeColor(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return BADGE_COLOR_PALETTE[Math.abs(hash) % BADGE_COLOR_PALETTE.length];
}

const STATUS_COLOR_OVERRIDES: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  done: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  ongoing: 'bg-blue-100 text-blue-800 border-blue-200',
  'in progress': 'bg-blue-100 text-blue-800 border-blue-200',
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  scheduled: 'bg-amber-100 text-amber-800 border-amber-200',
  upcoming: 'bg-amber-100 text-amber-800 border-amber-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  canceled: 'bg-red-100 text-red-800 border-red-200',
  postponed: 'bg-red-100 text-red-800 border-red-200',
};

export function getStatusBadgeColor(value: string): string {
  return (
    STATUS_COLOR_OVERRIDES[value.toLowerCase().trim()] ?? getBadgeColor(value)
  );
}
