/** Every estimate is raw × 1.4, rounded to the nearest 5 minutes. */

export const BUFFER_FACTOR = 1.4;

export function bufferedMinutes(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 5;
  const scaled = raw * BUFFER_FACTOR;
  const rounded = Math.round(scaled / 5) * 5;
  return Math.max(5, rounded);
}
