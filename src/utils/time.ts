/** Local wall-clock helpers. */

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
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}

export function hhmmToMinutes(hhmm: string): number {
  const { hours, minutes } = parseHHMM(hhmm);
  return hours * 60 + minutes;
}

export function formatWallClock(d = new Date()): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function formatMmSs(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${pad2(s)}`;
}

export function newId(): string {
  return crypto.randomUUID();
}
