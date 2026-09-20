/**
 * MPH XR zone engine — focus-energy scaffolding, not medical advice.
 *
 * Behavioral priors (architecture, not features):
 * - Monotropism: one active focus, interest-led capture, high interrupt cost, soft exits
 * - Transition friction: buffers, pause/Not This, capture-on-interrupt (FAB)
 * - Sensory fatigue: muted chrome, Rest is user-enter/exit only
 * - ADHD framing: delay-aversion / interest–motivation — never a dopamine tank or refill game
 *
 * Internal four-bin map (Concerta/OROS-class placeholders, not a plasma curve):
 *   Rising 0–2h · Climb 2–6h · Peak 6–10h · Taper 10–12h+
 * Visible chips: Onset (rising + climb) | Peak | Comedown.
 * Do not present 2–6h as Peak or as OROS Tmax. UK “XL” is not one curve.
 */

import {
  COMEDOWN_NUDGE_LEAD_HOURS,
  DEFAULT_PK_WINDOWS,
  PEAK_PLATEAU_START_HOURS,
  type PkScaffoldBin,
  type PkWindows,
  type PkZone,
  type Settings,
} from '../types';
import { t } from '../copy/t';
import { hhmmToMinutes, minutesSinceMidnight, todayKey } from './time';
import type { DoseLog } from '../types';

export { DEFAULT_PK_WINDOWS, PEAK_PLATEAU_START_HOURS };

/** Live-site 1/5/8 and the incorrect Peak-as-2–6 placeholder. */
export const SUPERSEDED_PK_PLACEHOLDERS: ReadonlyArray<PkWindows> = [
  { onsetEndHours: 1, peakEndHours: 5, comedownEndHours: 8 },
  { onsetEndHours: 2, peakEndHours: 6, comedownEndHours: 10 },
];

export interface PkSnapshot {
  zone: PkZone;
  bin: PkScaffoldBin;
  elapsedHours: number | null;
  playhead: number;
  isUnknown: boolean;
  approachingComedown: boolean;
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

/** Plateau start: default 6h. Climb before this stays Onset. */
export function peakStartHours(windows: PkWindows): number {
  return Math.min(
    windows.peakEndHours,
    Math.max(windows.onsetEndHours, PEAK_PLATEAU_START_HOURS)
  );
}

/** Clamp user edits: Onset < Peak ≤ Comedown. Comedown is a soft window, not an 8h alarm. */
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

export function scaffoldBin(
  elapsedHours: number | null,
  windows: PkWindows
): PkScaffoldBin {
  if (elapsedHours === null || !Number.isFinite(elapsedHours) || elapsedHours < 0) {
    return 'unknown';
  }
  const peakFrom = peakStartHours(windows);
  if (elapsedHours < windows.onsetEndHours) return 'rising';
  if (elapsedHours < peakFrom) return 'climb';
  if (elapsedHours < windows.peakEndHours) return 'peak';
  return 'taper';
}

export function zoneFromElapsed(
  elapsedHours: number | null,
  windows: PkWindows
): PkZone {
  switch (scaffoldBin(elapsedHours, windows)) {
    case 'rising':
    case 'climb':
      return 'onset';
    case 'peak':
      return 'peak';
    case 'taper':
      return 'comedown';
    case 'unknown':
      return 'unknown';
  }
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
      bin: 'unknown',
      elapsedHours: null,
      playhead: 0,
      isUnknown: true,
      approachingComedown: false,
      doseKey: null,
      windows,
      peakStartHours: peakFrom,
    };
  }

  const elapsedHours =
    (minutesSinceMidnight(now) - hhmmToMinutes(logged)) / 60;
  const bin = scaffoldBin(elapsedHours, windows);
  const zone = zoneFromElapsed(elapsedHours, windows);
  const scale = Math.max(windows.comedownEndHours, windows.peakEndHours, 0.5);
  const playhead =
    elapsedHours < 0 ? 0 : Math.min(1, elapsedHours / scale);

  const hoursUntilComedown = windows.peakEndHours - elapsedHours;
  const approachingComedown =
    zone === 'peak' &&
    hoursUntilComedown > 0 &&
    hoursUntilComedown <= COMEDOWN_NUDGE_LEAD_HOURS;

  return {
    zone,
    bin,
    elapsedHours,
    playhead,
    isUnknown: false,
    approachingComedown,
    doseKey: `${today}|${logged}`,
    windows,
    peakStartHours: peakFrom,
  };
}

export function visiblePkZone(zone: PkZone): PkZone {
  return zone;
}

export function zoneLabel(zone: PkZone): string {
  switch (zone) {
    case 'onset':
      return t('efficacy.zone.onset');
    case 'peak':
      return t('efficacy.zone.peak');
    case 'comedown':
      return t('efficacy.zone.comedown');
    case 'unknown':
      return t('med.notLogged.title');
  }
}

export function timelineSegments(windows: PkWindows) {
  const peakFrom = peakStartHours(windows);
  const end = Math.max(windows.comedownEndHours, windows.peakEndHours);
  return [
    {
      zone: 'onset' as const,
      token: 'onset' as const,
      from: 0,
      to: windows.onsetEndHours,
    },
    {
      zone: 'onset' as const,
      token: 'climb' as const,
      from: windows.onsetEndHours,
      to: peakFrom,
    },
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
