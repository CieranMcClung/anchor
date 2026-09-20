import type { MedPhase } from '../types';
import { hhmmToMinutes, minutesSinceMidnight } from './time';

/**
 * Estimate med phase from configured dose time and useful window.
 * Not medical advice — personal estimates only.
 *
 * Rising: 0–20% of window
 * Peak: 20–70%
 * Waning: 70–100%
 * Offline: after window
 * Before: before dose
 */
export function getMedPhase(
  doseTime: string,
  usefulWindowHours: number,
  now = new Date()
): MedPhase {
  const nowMins = minutesSinceMidnight(now);
  const doseMins = hhmmToMinutes(doseTime);
  const windowMins = Math.max(1, usefulWindowHours) * 60;

  if (nowMins < doseMins) return 'before';

  const elapsed = nowMins - doseMins;
  if (elapsed >= windowMins) return 'offline';

  const pct = elapsed / windowMins;
  if (pct < 0.2) return 'rising';
  if (pct < 0.7) return 'peak';
  return 'waning';
}

export function phaseProgress(
  doseTime: string,
  usefulWindowHours: number,
  now = new Date()
): number {
  const nowMins = minutesSinceMidnight(now);
  const doseMins = hhmmToMinutes(doseTime);
  const windowMins = Math.max(1, usefulWindowHours) * 60;

  if (nowMins < doseMins) {
    // progress toward dose within morning (from midnight)
    return Math.min(1, nowMins / Math.max(1, doseMins));
  }
  const elapsed = nowMins - doseMins;
  return Math.min(1, elapsed / windowMins);
}

export function phaseMatchesPreferred(
  current: MedPhase,
  preferred?: MedPhase
): boolean {
  if (!preferred) return true;
  return current === preferred;
}
