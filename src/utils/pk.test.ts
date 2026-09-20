import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PK_WINDOWS,
  DEFAULT_SETTINGS,
} from '../types';
import {
  BANNED_LEGACY_PK_DEFAULTS,
  isBannedLegacyPkDefaults,
  normalizePkWindows,
  peakStartHours,
  zoneFromElapsed,
} from './pk';
import { bufferedMinutes } from './duration';

describe('locked PK defaults', () => {
  it('ships Research-locked windows, not the banned 1/5/8 live defaults', () => {
    expect(DEFAULT_PK_WINDOWS.onsetEndHours).toBe(2);
    expect(DEFAULT_PK_WINDOWS.peakEndHours).toBe(10);
    expect(DEFAULT_PK_WINDOWS.comedownEndHours).toBeGreaterThan(
      DEFAULT_PK_WINDOWS.peakEndHours
    );
    expect(DEFAULT_PK_WINDOWS.comedownEndHours).not.toBe(8);
    expect(DEFAULT_SETTINGS).toEqual(DEFAULT_PK_WINDOWS);
    expect(isBannedLegacyPkDefaults(DEFAULT_PK_WINDOWS)).toBe(false);
    expect(isBannedLegacyPkDefaults(BANNED_LEGACY_PK_DEFAULTS)).toBe(true);
  });

  it('applies Peak chip from ~6h through peakEndHours; 0–6h stays Onset', () => {
    const w = DEFAULT_PK_WINDOWS;
    expect(peakStartHours(w)).toBe(6);
    expect(zoneFromElapsed(0.5, w)).toBe('onset');
    expect(zoneFromElapsed(1.9, w)).toBe('onset');
    expect(zoneFromElapsed(2.5, w)).toBe('onset');
    expect(zoneFromElapsed(5.9, w)).toBe('onset');
    expect(zoneFromElapsed(6, w)).toBe('peak');
    expect(zoneFromElapsed(9.9, w)).toBe('peak');
    expect(zoneFromElapsed(10, w)).toBe('comedown');
    expect(zoneFromElapsed(14, w)).toBe('comedown');
  });

  it('keeps Comedown as a soft cue after Peak, not a hard 8h cutoff', () => {
    const w = DEFAULT_PK_WINDOWS;
    expect(zoneFromElapsed(8, w)).toBe('peak');
    expect(zoneFromElapsed(11, w)).toBe('comedown');
    const custom = normalizePkWindows({
      onsetEndHours: 2,
      peakEndHours: 10,
      comedownEndHours: 8,
    });
    expect(custom.comedownEndHours).toBeGreaterThanOrEqual(custom.peakEndHours);
  });
});

describe('duration buffer', () => {
  it('multiplies by 1.4 and rounds to nearest 5 minutes', () => {
    expect(bufferedMinutes(10)).toBe(15);
    expect(bufferedMinutes(25)).toBe(35);
    expect(bufferedMinutes(45)).toBe(65);
  });
});
