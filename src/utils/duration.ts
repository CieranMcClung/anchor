/**
 * Time estimates: raw × (1 + bufferPercent/100), nearest 5 minutes.
 * P0 shipped a fixed 40% (×1.4). P1 makes 30–50% a persisted setting.
 */

import {
  BUFFER_PERCENT_MAX,
  BUFFER_PERCENT_MIN,
  DEFAULT_BUFFER_PERCENT,
  DEFAULT_HYPERFOCUS_MINUTES,
  HYPERFOCUS_MAX_MINUTES,
  HYPERFOCUS_MIN_MINUTES,
} from '../types';

/** @deprecated Prefer bufferFactor(percent). Kept as the P0 default (40%). */
export const BUFFER_FACTOR = 1.4;

export function clampBufferPercent(n: unknown): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return DEFAULT_BUFFER_PERCENT;
  return Math.min(
    BUFFER_PERCENT_MAX,
    Math.max(BUFFER_PERCENT_MIN, Math.round(n))
  );
}

export function bufferFactor(percent = DEFAULT_BUFFER_PERCENT): number {
  return 1 + clampBufferPercent(percent) / 100;
}

export function bufferedMinutes(
  raw: number,
  percent = DEFAULT_BUFFER_PERCENT
): number {
  if (!Number.isFinite(raw) || raw <= 0) return 5;
  const scaled = raw * bufferFactor(percent);
  const rounded = Math.round(scaled / 5) * 5;
  return Math.max(5, rounded);
}

export function clampHyperfocusMinutes(n: unknown): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) {
    return DEFAULT_HYPERFOCUS_MINUTES;
  }
  return Math.min(
    HYPERFOCUS_MAX_MINUTES,
    Math.max(HYPERFOCUS_MIN_MINUTES, Math.round(n))
  );
}

export function shouldShowHyperfocus(
  elapsedMs: number,
  thresholdMinutes: number,
  dismissed: boolean,
  preview = false
): boolean {
  if (dismissed) return false;
  if (preview) return true;
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return false;
  return elapsedMs >= clampHyperfocusMinutes(thresholdMinutes) * 60 * 1000;
}
