import {
  DEFAULT_PK_WINDOWS,
  PEAK_PLATEAU_START_HOURS,
  type PkWindows,
  type PkZone,
  type Settings,
} from '../types';
import { t } from '../copy/t';
import { hhmmToMinutes, minutesSinceMidnight, todayKey } from './time';
import type { DoseLog } from '../types';

export { DEFAULT_PK_WINDOWS, PEAK_PLATEAU_START_HOURS };

export const BANNED_LEGACY_PK_DEFAULTS = {
  onsetEndHours: 1,
  peakEndHours: 5,
  comedownEndHours: 8,
} as const;

export interface PkSnapshot {
  zone: PkZone;
  elapsedHours: number | null;
  playhead: number;
  isUnknown: boolean;
  approachingComedown: boolean;
  doseKey: string | null;
  windows: PkWindows;
  peakStartHours: number;
}

export function isBannedLegacyPkDefaults(windows: PkWindows): boolean {
  return (
    windows.onsetEndHours === BANNED_LEGACY_PK_DEFAULTS.onsetEndHours &&
    windows.peakEndHours === BANNED_LEGACY_PK_DEFAULTS.peakEndHours &&
    windows.comedownEndHours === BANNED_LEGACY_PK_DEFAULTS.comedownEndHours
  );
}

export function peakStartHours(windows: PkWindows): number {
  const start = PEAK_PLATEAU_START_HOURS;
  return Math.min(
    windows.peakEndHours,
    Math.max(windows.onsetEndHours, start)
  );
}

/** Clamp user edits: Onset < Peak, Comedown is after Peak (soft — never a hard 8h cutoff). */
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
  const peakFrom = peakStartHours(windows);
  if (elapsedHours < peakFrom) return 'onset';
  if (elapsedHours < windows.peakEndHours) return 'peak';
  return 'comedown';
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
      approachingComedown: false,
      doseKey: null,
      windows,
      peakStartHours: peakFrom,
    };
  }

  const elapsedHours =
    (minutesSinceMidnight(now) - hhmmToMinutes(logged)) / 60;
  const zone = zoneFromElapsed(elapsedHours, windows);
  const scale = Math.max(windows.comedownEndHours, windows.peakEndHours);
  const playhead =
    elapsedHours < 0 ? 0 : Math.min(1, elapsedHours / scale);

  const hoursUntilPeakEnd = windows.peakEndHours - elapsedHours;
  const approachingComedown =
    zone === 'peak' && hoursUntilPeakEnd > 0 && hoursUntilPeakEnd <= 0.75;

  return {
    zone,
    elapsedHours,
    playhead,
    isUnknown: false,
    approachingComedown,
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
