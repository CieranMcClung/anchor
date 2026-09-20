/**
 * MPH XR zone engine — product modelling only, not medical advice.
 *
 * Behavioral priors (architecture, not features):
 * - Monotropism: one active focus, interest-led capture, high interrupt cost, soft exits
 * - Transition friction: buffers, pause/Not This, capture-on-interrupt (FAB)
 * - Sensory fatigue: muted chrome, Rest is user-enter/exit only
 * - ADHD framing: delay-aversion / interest–motivation — never a dopamine tank or refill game
 *
 * Placeholders assume Concerta/OROS-class 18 mg. UK “XL” is not one curve.
 */

import {
  DEFAULT_PK_WINDOWS,
  TROUGH_NUDGE_LEAD_HOURS,
  type PkWindows,
  type PkZone,
  type Settings,
} from '../types';
import { t } from '../copy/t';
import { hhmmToMinutes, minutesSinceMidnight, todayKey } from './time';
import type { DoseLog } from '../types';

export { DEFAULT_PK_WINDOWS };

/** Live-site and earlier P0 placeholders to migrate off. */
export const SUPERSEDED_PK_PLACEHOLDERS: ReadonlyArray<PkWindows> = [
  { onsetEndHours: 1, peakEndHours: 5, comedownEndHours: 8 },
  { onsetEndHours: 2, peakEndHours: 10, comedownEndHours: 12 },
];

export interface PkSnapshot {
  zone: PkZone;
  elapsedHours: number | null;
  playhead: number;
  isUnknown: boolean;
  approachingTrough: boolean;
  doseKey: string | null;
  windows: PkWindows;
  peakStartHours: number;
}

export function windowsMatch(a: PkWindows, b: PkWindows): boolean {
  return (
    a.onsetEndHours === b.onsetEndHours &&
    a.peakEndHours === b.peakEndHours &&
    a.comedownEndHours === b.comedownEndHours
  );
}

export function isSupersededPkPlaceholder(windows: PkWindows): boolean {
  return SUPERSEDED_PK_PLACEHOLDERS.some((p) => windowsMatch(windows, p));
}

/** Peak starts when Onset ends (0–2h Onset, 2–6h Peak in the default model). */
export function peakStartHours(windows: PkWindows): number {
  return windows.onsetEndHours;
}

/** Clamp user edits: Onset < Peak ≤ Comedown. Comedown stays a soft window, not an 8h alarm. */
export function normalizePkWindows(raw: Partial<PkWindows>): PkWindows {
  const onset = finiteHours(raw.onsetEndHours, DEFAULT_PK_WINDOWS.onsetEndHours);
  const peak = Math.max(
    onset + 0.5,
    finiteHours(raw.peakEndHours, DEFAULT_PK_WINDOWS.peakEndHours)
  );
  const come = Math.max(
    peak,
    finiteHours(raw.comedownEndHours, Math.max(peak, DEFAULT_PK_WINDOWS.comedownEndHours))
  );
  return {
    onsetEndHours: roundTenths(onset),
    peakEndHours: roundTenths(peak),
    comedownEndHours: roundTenths(come),
  };
}

function finiteHours(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

function roundTenths(n: number): number {
  return Math.round(n * 10) / 10;
}

export function zoneFromElapsed(
  elapsedHours: number | null,
  windows: PkWindows
): PkZone {
  if (elapsedHours === null || !Number.isFinite(elapsedHours) || elapsedHours < 0) {
    return 'unknown';
  }
  if (elapsedHours < windows.onsetEndHours) return 'onset';
  if (elapsedHours < windows.peakEndHours) return 'peak';
  if (elapsedHours < windows.comedownEndHours) return 'comedown';
  return 'trough';
}

export function getPkSnapshot(
  dose: DoseLog,
  windows: PkWindows,
  now = new Date()
): PkSnapshot {
  const today = todayKey(now);
  const logged =
    dose.date === today && dose.timeHHMM && !dose.skipped ? dose.timeHHMM : null;
  const peakFrom = peakStartHours(windows);

  if (!logged) {
    return {
      zone: 'unknown',
      elapsedHours: null,
      playhead: 0,
      isUnknown: true,
      approachingTrough: false,
      doseKey: null,
      windows,
      peakStartHours: peakFrom,
    };
  }

  const elapsedHours =
    (minutesSinceMidnight(now) - hhmmToMinutes(logged)) / 60;
  const zone = zoneFromElapsed(elapsedHours, windows);
  const scale = Math.max(windows.comedownEndHours, windows.peakEndHours, 0.5);
  const playhead =
    elapsedHours < 0 ? 0 : Math.min(1, elapsedHours / scale);

  const hoursUntilTrough = windows.comedownEndHours - elapsedHours;
  const approachingTrough =
    zone === 'comedown' &&
    hoursUntilTrough > 0 &&
    hoursUntilTrough <= TROUGH_NUDGE_LEAD_HOURS;

  return {
    zone,
    elapsedHours,
    playhead,
    isUnknown: false,
    approachingTrough,
    doseKey: `${today}|${logged}`,
    windows,
    peakStartHours: peakFrom,
  };
}

export function zoneLabel(zone: PkZone): string {
  switch (zone) {
    case 'onset':
      return 'Onset';
    case 'peak':
      return 'Peak';
    case 'comedown':
      return 'Comedown';
    case 'trough':
      return t('efficacy.zone.settled');
    case 'unknown':
      return t('med.notLogged.title');
  }
}

export function zoneCue(zone: PkZone): string {
  switch (zone) {
    case 'onset':
      return t('efficacy.zone.rising');
    case 'peak':
      return t('efficacy.zone.peak');
    case 'comedown':
      return t('efficacy.zone.easing');
    case 'trough':
      return t('efficacy.zone.steady');
    case 'unknown':
      return t('med.notLogged.body');
  }
}

export function timelineSegments(windows: PkWindows) {
  const peakFrom = peakStartHours(windows);
  const end = Math.max(windows.comedownEndHours, windows.peakEndHours);
  return [
    { zone: 'onset' as const, token: 'onset' as const, from: 0, to: peakFrom },
    {
      zone: 'peak' as const,
      token: 'peak' as const,
      from: peakFrom,
      to: windows.peakEndHours,
    },
    {
      zone: 'comedown' as const,
      token: 'comedown' as const,
      from: windows.peakEndHours,
      to: end,
    },
  ];
}

export function windowsFromSettings(settings: Settings): PkWindows {
  return normalizePkWindows(settings);
}
