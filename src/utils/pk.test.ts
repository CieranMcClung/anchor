import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PK_WINDOWS,
  DEFAULT_SETTINGS,
} from '../types';
import {
  SUPERSEDED_PK_PLACEHOLDERS,
  isSupersededPkPlaceholder,
  normalizePkWindows,
  peakStartHours,
  visiblePkZone,
  zoneFromElapsed,
  zoneLabel,
} from './pk';
import { bufferedMinutes } from './duration';

describe('Research Phase 1 PK placeholders', () => {
  it('ships Concerta/OROS-class windows: Onset 0–2, Peak 2–6, Comedown 6–10', () => {
    expect(DEFAULT_PK_WINDOWS.onsetEndHours).toBe(2);
    expect(DEFAULT_PK_WINDOWS.peakEndHours).toBe(6);
    expect(DEFAULT_PK_WINDOWS.comedownEndHours).toBe(10);
    expect(DEFAULT_SETTINGS).toEqual(DEFAULT_PK_WINDOWS);
    expect(isSupersededPkPlaceholder(DEFAULT_PK_WINDOWS)).toBe(false);
    for (const old of SUPERSEDED_PK_PLACEHOLDERS) {
      expect(isSupersededPkPlaceholder(old)).toBe(true);
    }
  });

  it('maps elapsed hours onto product zones', () => {
    const w = DEFAULT_PK_WINDOWS;
    expect(peakStartHours(w)).toBe(2);
    expect(zoneFromElapsed(0.5, w)).toBe('onset');
    expect(zoneFromElapsed(1.9, w)).toBe('onset');
    expect(zoneFromElapsed(2, w)).toBe('peak');
    expect(zoneFromElapsed(5.9, w)).toBe('peak');
    expect(zoneFromElapsed(6, w)).toBe('comedown');
    expect(zoneFromElapsed(9.9, w)).toBe('comedown');
    expect(zoneFromElapsed(10, w)).toBe('trough');
    expect(zoneFromElapsed(14, w)).toBe('trough');
    expect(visiblePkZone('trough')).toBe('comedown');
    expect(zoneLabel('onset')).toBe('Onset');
    expect(zoneLabel('peak')).toBe('Peak');
    expect(zoneLabel('comedown')).toBe('Comedown');
    expect(zoneLabel('trough')).toBe('Comedown');
  });

  it('does not treat 8h as a hard comedown cutoff, and clamps comedown after peak', () => {
    const w = DEFAULT_PK_WINDOWS;
    expect(zoneFromElapsed(8, w)).toBe('comedown');
    const custom = normalizePkWindows({
      onsetEndHours: 2,
      peakEndHours: 6,
      comedownEndHours: 5,
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
