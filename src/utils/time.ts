/** UK-friendly time helpers. All wall-clock in local timezone. */

export function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseHHMM(hhmm: string): { hours: number; minutes: number } {
  const [h, m] = hhmm.split(':').map(Number);
  return { hours: h || 0, minutes: m || 0 };
}

export function minutesSinceMidnight(d = new Date()): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function hhmmToMinutes(hhmm: string): number {
  const { hours, minutes } = parseHHMM(hhmm);
  return hours * 60 + minutes;
}

export function minutesToHHMM(total: number): string {
  const clamped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

export function formatWallClock(d = new Date()): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${h}:${pad2(mm)}:${pad2(rem)}`;
  }
  return `${m}:${pad2(rem)}`;
}

export function formatElapsedFriendly(ms: number): string {
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 minute ago';
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hours === 1 && rem === 0) return '1 hour ago';
  if (rem === 0) return `${hours} hours ago`;
  if (hours === 1) return `1 hour ${rem} min ago`;
  return `${hours} hours ${rem} min ago`;
}

export function formatUntil(ms: number): string {
  if (ms <= 0) return 'now';
  const mins = Math.ceil(ms / 60000);
  if (mins === 1) return 'in 1 minute';
  if (mins < 60) return `in ${mins} minutes`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  if (rem === 0) return hours === 1 ? 'in 1 hour' : `in ${hours} hours`;
  return `in ${hours}h ${rem}m`;
}

export function endTimeFromNow(durationMinutes: number, from = new Date()): string {
  const end = new Date(from.getTime() + durationMinutes * 60000);
  return formatWallClock(end);
}

export function dateAtHHMM(hhmm: string, base = new Date()): Date {
  const { hours, minutes } = parseHHMM(hhmm);
  const d = new Date(base);
  d.setHours(hours, minutes, 0, 0);
  return d;
}
